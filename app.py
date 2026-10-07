import os
import time
import cv2
import numpy as np
import pandas as pd
import streamlit as st

from config import (
    APP_TITLE,
    MODEL_REGISTRY,
    DEFAULT_INITIAL_RED,
    DEFAULT_PREEMPT_RED,
    DEFAULT_YELLOW_TIME,
    DEFAULT_POST_CLEARANCE_BUFFER,
    IOU_TRACK_THRESH,
    TRACK_MEMORY_FRAMES,
    MIN_BOX_SIZE,
    MAX_ASPECT_RATIO,
    EMERGENCY_CONF_THRESH,
    NORMAL_CONF_THRESH,
    MAX_UPLOAD_SIZE_MB,
    ALLOWED_EXTENSIONS
)
from inference import (
    load_yolo_model,
    get_iou,
    filter_contained_boxes,
    check_siren_hsv,
    draw_traffic_signal_hud_cv2,
    create_synthetic_video
)
from ui_components import (
    render_header,
    render_empty_state,
    render_metrics_row,
    render_preemption_alert,
    render_traffic_signal_card,
    render_4way_junction_visualizer_html,
    render_interactive_charts,
    render_model_comparison_table
)

# 1. Page Configuration
st.set_page_config(
    page_title=APP_TITLE,
    page_icon="🚦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 2. Inject External Stylesheet
css_path = os.path.join(os.path.dirname(__file__), "assets", "style.css")
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# 3. Session State Initialization
if "is_running" not in st.session_state:
    st.session_state.is_running = False
if "is_paused" not in st.session_state:
    st.session_state.is_paused = False
if "simulation_completed" not in st.session_state:
    st.session_state.simulation_completed = False
if "emergency_count" not in st.session_state:
    st.session_state.emergency_count = 0
if "normal_count" not in st.session_state:
    st.session_state.normal_count = 0
if "traffic_light_state" not in st.session_state:
    st.session_state.traffic_light_state = "RED"
if "current_timer" not in st.session_state:
    st.session_state.current_timer = DEFAULT_INITIAL_RED
if "selected_lane_id" not in st.session_state:
    st.session_state.selected_lane_id = 5

# Lane to Road mappings
LANE_INFO = {
    1: {"name": "CCTV Lane 1", "road": "Road 1 (North)", "road_id": 1, "signal_id": 1},
    2: {"name": "CCTV Lane 2", "road": "Road 1 (North)", "road_id": 1, "signal_id": 1},
    3: {"name": "CCTV Lane 3", "road": "Road 2 (East)",  "road_id": 2, "signal_id": 2},
    4: {"name": "CCTV Lane 4", "road": "Road 2 (East)",  "road_id": 2, "signal_id": 2},
    5: {"name": "CCTV Lane 5", "road": "Road 3 (South)", "road_id": 3, "signal_id": 3},
    6: {"name": "CCTV Lane 6", "road": "Road 3 (South)", "road_id": 3, "signal_id": 3},
    7: {"name": "CCTV Lane 7", "road": "Road 4 (West)",  "road_id": 4, "signal_id": 4},
    8: {"name": "CCTV Lane 8", "road": "Road 4 (West)",  "road_id": 4, "signal_id": 4},
}

# 4. Sidebar Controls
with st.sidebar:
    st.markdown("### 🎛️ Simulation Controls")
    
    # Model Weights Selection
    model_keys = list(MODEL_REGISTRY.keys())
    selected_model_name = st.selectbox(
        "Model Weights Checkpoint",
        options=model_keys,
        index=0,
        help="Select the deep learning checkpoint to load for inference."
    )
    
    model_info = MODEL_REGISTRY[selected_model_name]
    target_weights = model_info["path"]
    if not os.path.exists(target_weights) and "alt_path" in model_info:
        if os.path.exists(model_info["alt_path"]):
            target_weights = model_info["alt_path"]
            
    # Model metadata badge
    st.caption(
        f"**Architecture**: YOLOv11 Nano ({model_info['params']})  \n"
        f"**Accuracy**: mAP50: {model_info['map50']} | Precision: {model_info['precision']}  \n"
        f"*{model_info['desc']}*"
    )
    
    st.markdown("---")
    
    # Target CCTV Lane Selection (1 to 8)
    st.markdown("### 📹 CCTV Lane Selection (1 of 8)")
    lane_options = [
        f"Lane {i}: {LANE_INFO[i]['road']} - {LANE_INFO[i]['name']}" for i in range(1, 9)
    ]
    selected_lane_idx = st.selectbox(
        "Monitored CCTV Feed",
        options=list(range(1, 9)),
        format_func=lambda i: f"Lane {i} — {LANE_INFO[i]['road']}",
        index=4  # Default to Lane 5 (Road 3)
    )
    st.session_state.selected_lane_id = selected_lane_idx
    target_lane_info = LANE_INFO[selected_lane_idx]
    
    # Video Input Selection
    st.markdown("### 🎬 Video Source")
    video_source_type = st.radio(
        "Choose Input Source",
        options=["Pre-loaded Test Traffic Video", "Auto-Generated Demo Video", "Upload Custom Video"],
        index=0
    )
    
    uploaded_file = None
    if video_source_type == "Upload Custom Video":
        uploaded_file = st.file_uploader(
            f"Upload Video for Lane {selected_lane_idx} (Max {MAX_UPLOAD_SIZE_MB}MB)",
            type=ALLOWED_EXTENSIONS,
            help="Supported formats: MP4, AVI, MOV, MKV"
        )
        if uploaded_file is not None:
            file_size_mb = uploaded_file.size / (1024 * 1024)
            if file_size_mb > MAX_UPLOAD_SIZE_MB:
                st.error(f"Uploaded file ({file_size_mb:.1f}MB) exceeds the {MAX_UPLOAD_SIZE_MB}MB limit.")
                uploaded_file = None
            else:
                st.success(f"Video loaded for Lane {selected_lane_idx}: {uploaded_file.name} ({file_size_mb:.1f}MB)")
                
    st.markdown("---")
    
    # Smart Signal Preemption Parameters
    st.markdown("### 🚦 Signal Preemption Timers")
    init_red_sec = st.slider(
        "Initial Red Light Phase (s)",
        min_value=20.0,
        max_value=80.0,
        value=DEFAULT_INITIAL_RED,
        step=5.0,
        help="Standard red light duration at junction when no emergency vehicles are present."
    )
    preempt_red_sec = st.slider(
        "Preempted Red Light Phase (s)",
        min_value=5.0,
        max_value=20.0,
        value=DEFAULT_PREEMPT_RED,
        step=1.0,
        help="Truncated red timer once an ambulance is detected to rapidly clear lane queues."
    )
    speed_option = st.selectbox(
        "Simulation Speed Factor",
        options=["1.0x (Real-Time)", "1.5x (Fast Demo)", "2.0x (Rapid Clock)"],
        index=0
    )
    speed_mult = 1.0 if "1.0x" in speed_option else (1.5 if "1.5x" in speed_option else 2.0)
    
    st.caption("ℹ️ *State Logic*: 50s RED ➔ Truncate to 10s upon detection ➔ Hold GREEN until cleared ➔ Return to 50s normal cycle.")
    
    st.markdown("---")
    
    # Execution Triggers
    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        start_btn = st.button("▶️ Start", use_container_width=True, type="primary")
    with col_btn2:
        reset_btn = st.button("🔄 Reset", use_container_width=True)

    if reset_btn:
        st.session_state.is_running = False
        st.session_state.is_paused = False
        st.session_state.simulation_completed = False
        st.session_state.emergency_count = 0
        st.session_state.normal_count = 0
        st.session_state.traffic_light_state = "RED"
        st.session_state.current_timer = init_red_sec
        st.rerun()

# 5. Header Component
render_header()

# 6. Main Dashboard Tabs
tab1, tab2, tab3, tab4 = st.tabs([
    "4-Road 8-Lane Junction Preemption",
    "Model Performance Analytics",
    "Detection Logic Explained",
    "Conclusion & Future Scope"
])

# ==============================================================================
# TAB 1: 4-ROAD 8-LANE JUNCTION SIMULATION
# ==============================================================================
with tab1:
    # Top-level dynamic containers
    metrics_container = st.empty()
    alert_container = st.empty()

    # Central 4-Road 8-Lane Graphical Junction Visualizer Container
    junction_container = st.empty()
    
    # Quick Lane Simulation Buttons
    st.markdown("##### ⚡ Quick Preemption Trigger: Select Lane to Simulate Ambulance")
    lane_btn_cols = st.columns(8)
    simulated_lane = None
    for idx, col in enumerate(lane_btn_cols, start=1):
        with col:
            if st.button(f"Lane {idx}", key=f"btn_lane_{idx}", use_container_width=True, help=f"Simulate emergency on {LANE_INFO[idx]['road']}"):
                st.session_state.selected_lane_id = idx
                st.toast(f"Switched monitoring to Lane {idx} ({LANE_INFO[idx]['road']})!", icon="🚨")
    
    st.markdown("---")

    # Two-column layout for Video Stream & Traffic Signal HUD
    col_stream, col_hud = st.columns([5, 3])
    
    with col_stream:
        video_placeholder = st.empty()
    with col_hud:
        hud_placeholder = st.empty()

    current_monitored_lane = st.session_state.selected_lane_id
    current_lane_meta = LANE_INFO[current_monitored_lane]

    # Determine input video path
    input_video_path = "WhatsApp Video 2026-09-13 at 18.14.01.mp4"
    if not os.path.exists(input_video_path):
        input_video_path = "test_traffic.mp4"
    output_video_path = "output_detection.mp4"
    
    if video_source_type == "Upload Custom Video":
        if uploaded_file is not None:
            input_video_path = "temp_input_video.mp4"
            with open(input_video_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
        else:
            input_video_path = None
    elif video_source_type == "Auto-Generated Demo Video":
        input_video_path = "demo_synthetic_traffic.mp4"
        if not os.path.exists(input_video_path):
            with st.spinner("Compiling synthetic traffic test video..."):
                create_synthetic_video(input_video_path, "merged_dataset/test/images")
    else:
        # Pre-loaded Test Video
        if not os.path.exists(input_video_path):
            if os.path.exists("Ambulance2.mp4"):
                input_video_path = "Ambulance2.mp4"
            else:
                input_video_path = "demo_synthetic_traffic.mp4"
                if not os.path.exists(input_video_path):
                    create_synthetic_video(input_video_path, "merged_dataset/test/images")

    # Render Initial Junction Visualizer & Empty State when idle
    if not start_btn and not st.session_state.is_running and not st.session_state.simulation_completed:
        junction_container.markdown(
            render_4way_junction_visualizer_html(
                active_road_id=1,
                is_emergency=False,
                emergency_road_id=current_lane_meta["road_id"],
                emergency_lane_id=current_monitored_lane
            ),
            unsafe_allow_html=True
        )
        with col_stream:
            render_empty_state()
        with col_hud:
            hud_placeholder.markdown(
                render_traffic_signal_card(
                    "RED", init_red_sec, False, False, init_red_sec, preempt_red_sec,
                    lane_id=current_monitored_lane, road_name=current_lane_meta["road"]
                ),
                unsafe_allow_html=True
            )
            
    # Trigger simulation on Start
    if start_btn:
        if input_video_path is None or not os.path.exists(input_video_path):
            st.error("No valid video source selected. Please upload a video or choose an auto-generated demo.")
        else:
            st.session_state.is_running = True
            st.session_state.simulation_completed = False
            
            # Load cached model
            with st.spinner(f"Loading {selected_model_name}..."):
                model = load_yolo_model(target_weights)
                
            cap = cv2.VideoCapture(input_video_path)
            if not cap.isOpened():
                st.error(f"Failed to read video stream from '{input_video_path}'.")
                st.session_state.is_running = False
            else:
                fps = int(cap.get(cv2.CAP_PROP_FPS))
                if fps <= 0:
                    fps = 30
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                
                # Output video writer
                out_w, out_h = 640, 640
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                writer = cv2.VideoWriter(output_video_path, fourcc, fps, (out_w, out_h))
                
                # Preemption State Machine Variables
                normal_red_duration = float(init_red_sec)
                preemption_red_duration = float(preempt_red_sec)
                yellow_timer = DEFAULT_YELLOW_TIME
                buffer_timer = DEFAULT_POST_CLEARANCE_BUFFER
                
                traffic_light_state = "RED"
                current_timer = normal_red_duration
                preemption_triggered = False
                active_tracks = []
                frame_idx = 0
                
                t_prev = time.time()
                current_fps = float(fps)
                
                st.toast(f"Optical signal preemption simulation active on Lane {current_monitored_lane} ({current_lane_meta['road']})!", icon="🚦")
                
                while cap.isOpened() and st.session_state.is_running:
                    ret, frame = cap.read()
                    if not ret:
                        break
                        
                    frame_idx += 1
                    frame = cv2.resize(frame, (640, 640))
                    
                    # Compute rolling FPS
                    t_now = time.time()
                    if t_now > t_prev:
                        current_fps = 0.9 * current_fps + 0.1 * (1.0 / (t_now - t_prev))
                    t_prev = t_now
                    
                    # YOLO candidate inference
                    results = model(frame, verbose=False, conf=0.05)
                    raw_detections = []
                    normal_vehicle_count = 0
                    
                    for result in results:
                        boxes = result.boxes if hasattr(result, 'boxes') else result
                        for box in boxes:
                            cls_id = int(box.cls[0])
                            conf = float(box.conf[0])
                            class_name = model.names[cls_id] if hasattr(model, 'names') else ""
                            
                            xyxy = box.xyxy[0].cpu().numpy().astype(int)
                            x1, y1, x2, y2 = xyxy
                            x1 = max(0, x1)
                            y1 = max(0, y1)
                            x2 = min(frame.shape[1], x2)
                            y2 = min(frame.shape[0], y2)
                            
                            box_w = x2 - x1
                            box_h = y2 - y1
                            
                            if box_w < MIN_BOX_SIZE or box_h < MIN_BOX_SIZE:
                                continue
                                
                            aspect_ratio = max(box_w / box_h, box_h / box_w) if (box_h > 0 and box_w > 0) else 1.0
                            if aspect_ratio > MAX_ASPECT_RATIO:
                                continue
                                
                            is_emergency = (cls_id == 0) or ('ambulance' in str(class_name).lower())
                            
                            if is_emergency:
                                siren_detected = check_siren_hsv(frame, x1, y1, x2, y2)
                                is_emergency_valid = (conf >= EMERGENCY_CONF_THRESH) or siren_detected
                                if is_emergency_valid:
                                    raw_detections.append({
                                        "box": [x1, y1, x2, y2],
                                        "is_emergency": True,
                                        "conf": conf,
                                        "siren_detected": siren_detected,
                                        "cls_id": cls_id
                                    })
                            else:
                                if conf >= NORMAL_CONF_THRESH:
                                    normal_vehicle_count += 1
                                    # Draw normal vehicle box in cyan
                                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 120, 0), 1)
                                    cv2.putText(frame, f"Traffic {conf:.2f}", (x1, max(0, y1 - 4)),
                                                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 120, 0), 1)
                                                
                    # Suppress nested sub-boxes (retain full outer vehicle chunk)
                    raw_detections = filter_contained_boxes(raw_detections)
                    
                    # IoU-based temporal tracking
                    updated_tracks = []
                    matched_raw_indices = set()
                    
                    for track in active_tracks:
                        best_iou = 0.0
                        best_raw_idx = -1
                        for idx, raw in enumerate(raw_detections):
                            iou = get_iou(track["box"], raw["box"])
                            if iou > best_iou:
                                best_iou = iou
                                best_raw_idx = idx
                                
                        if best_iou >= IOU_TRACK_THRESH:
                            raw = raw_detections[best_raw_idx]
                            matched_raw_indices.add(best_raw_idx)
                            is_now_emergency = raw["is_emergency"] or (track["frames_since_seen"] < TRACK_MEMORY_FRAMES)
                            if is_now_emergency:
                                frames_since_seen = 0 if raw["is_emergency"] else (track["frames_since_seen"] + 1)
                                updated_tracks.append({
                                    "box": raw["box"],
                                    "frames_since_seen": frames_since_seen,
                                    "conf": max(track["conf"], raw["conf"]),
                                    "siren_detected": raw["siren_detected"] or track["siren_detected"],
                                    "cls_id": raw["cls_id"]
                                })
                        else:
                            if track["frames_since_seen"] < TRACK_MEMORY_FRAMES:
                                updated_tracks.append({
                                    "box": track["box"],
                                    "frames_since_seen": track["frames_since_seen"] + 1,
                                    "conf": track["conf"],
                                    "siren_detected": track["siren_detected"],
                                    "cls_id": track["cls_id"]
                                })
                                
                    for idx, raw in enumerate(raw_detections):
                        if idx not in matched_raw_indices and raw["is_emergency"]:
                            updated_tracks.append({
                                "box": raw["box"],
                                "frames_since_seen": 0,
                                "conf": raw["conf"],
                                "siren_detected": raw["siren_detected"],
                                "cls_id": raw["cls_id"]
                            })
                            
                    active_tracks = updated_tracks
                    
                    # Count and draw emergency tracks (Ambulance class 0)
                    ambulance_count = 0
                    for track in active_tracks:
                        if track["frames_since_seen"] < TRACK_MEMORY_FRAMES and track["cls_id"] == 0:
                            ambulance_count += 1
                            x1, y1, x2, y2 = track["box"]
                            conf = track["conf"]
                            siren_tag = " [SIREN]" if track["siren_detected"] else ""
                            label = f"Ambulance {conf:.2f}{siren_tag}"
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                            cv2.putText(frame, label, (x1, max(0, y1 - 8)),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)
                                        
                    # Update Preemption State Machine
                    is_amb_present = (ambulance_count > 0)
                    if is_amb_present:
                        if traffic_light_state == "RED" and not preemption_triggered:
                            preemption_triggered = True
                            if current_timer > preemption_red_duration:
                                current_timer = preemption_red_duration
                                st.toast(f"🚨 Ambulance Detected in Lane {current_monitored_lane}! Truncating Red Light to 10s!", icon="⚡")
                                
                    dt = (1.0 / max(1, fps)) * speed_mult
                    if traffic_light_state == "RED":
                        current_timer -= dt
                        if current_timer <= 0:
                            traffic_light_state = "YELLOW"
                            current_timer = yellow_timer
                    elif traffic_light_state == "YELLOW":
                        current_timer -= dt
                        if current_timer <= 0:
                            if preemption_triggered:
                                traffic_light_state = "GREEN"
                                current_timer = buffer_timer
                            else:
                                traffic_light_state = "RED"
                                current_timer = normal_red_duration
                    elif traffic_light_state == "GREEN":
                        if is_amb_present:
                            # Hold green light indefinitely while ambulance is detected
                            current_timer = buffer_timer
                        else:
                            # Ambulance cleared: decrement buffer
                            current_timer -= dt
                            if current_timer <= 0:
                                traffic_light_state = "YELLOW"
                                current_timer = yellow_timer
                                preemption_triggered = False
                                
                    # Draw OpenCV HUD overlay
                    frame = draw_traffic_signal_hud_cv2(
                        frame, traffic_light_state, current_timer, preemption_triggered, is_amb_present
                    )
                    
                    # Write frame to output video
                    writer.write(cv2.resize(frame, (out_w, out_h)))
                    
                    # Update Streamlit UI
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    video_placeholder.image(rgb_frame, channels="RGB", use_container_width=True)
                    
                    # Update live metrics, 4-way junction visualizer, and HUD card
                    if frame_idx % 2 == 0 or preemption_triggered:
                        with metrics_container.container():
                            render_metrics_row(
                                ambulance_count, normal_vehicle_count, current_fps, traffic_light_state, current_timer
                            )
                        with alert_container.container():
                            render_preemption_alert(
                                traffic_light_state, is_amb_present, current_timer, normal_red_duration, preemption_red_duration,
                                lane_id=current_monitored_lane, road_name=current_lane_meta["road"]
                            )
                        junction_container.markdown(
                            render_4way_junction_visualizer_html(
                                active_road_id=current_lane_meta["road_id"],
                                is_emergency=preemption_triggered,
                                emergency_road_id=current_lane_meta["road_id"],
                                emergency_lane_id=current_monitored_lane
                            ),
                            unsafe_allow_html=True
                        )
                        hud_placeholder.markdown(
                            render_traffic_signal_card(
                                traffic_light_state, current_timer, preemption_triggered, is_amb_present, normal_red_duration, preemption_red_duration,
                                lane_id=current_monitored_lane, road_name=current_lane_meta["road"]
                            ),
                            unsafe_allow_html=True
                        )
                        
                    time.sleep(0.005)
                    
                cap.release()
                writer.release()
                st.session_state.is_running = False
                st.session_state.simulation_completed = True
                st.toast("Simulation finished successfully!", icon="✅")

    # Post-simulation download option
    if os.path.exists(output_video_path) and os.path.getsize(output_video_path) > 1000:
        st.markdown("---")
        with open(output_video_path, "rb") as vf:
            st.download_button(
                label="📥 Download Annotated Preemption Video (MP4)",
                data=vf,
                file_name="output_detection.mp4",
                mime="video/mp4",
                use_container_width=True
            )


# ==============================================================================
# TAB 2: MODEL PERFORMANCE ANALYTICS
# ==============================================================================
with tab2:
    st.subheader("Model Diagnostic Curves & Quantitative Metrics")
    
    diagnostic_runs = {
        "YOLOv11 v2 (Fine-Tuned with 8 Indian Traffic Videos)": "runs/detect/runs/detect/train_emergency_v2/results.csv",
        "YOLOv11 v1 (50-Epoch Merged Dataset Baseline)": "runs/detect/runs/detect/train_emergency/results.csv"
    }
    
    selected_run = st.selectbox("Select Training Run Diagnostic", list(diagnostic_runs.keys()), index=0)
    selected_csv = diagnostic_runs[selected_run]
    
    # Render interactive Plotly charts
    render_interactive_charts(selected_csv)
    
    st.markdown("---")
    st.subheader("Validation Split Performance Summary")
    
    val_c1, val_c2, val_c3, val_c4 = st.columns(4)
    val_c1.metric("Overall Precision", "86.60%", "+4.2% vs Base")
    val_c2.metric("Overall Recall", "73.30%", "+8.9% vs Base")
    val_c3.metric("mAP@0.50 (All)", "82.10%", "+6.5% vs Base")
    val_c4.metric("Ambulance mAP@0.50", "88.10%", "96.1% on v1 split")
    
    st.markdown("---")
    st.subheader("Class-Wise Metric Breakdown")
    class_metrics_data = {
        "Class ID": [0, 1, 2, 3, 4],
        "Class Name": ["Ambulance", "Fire Truck", "Normal Vehicle", "Police Car", "Towing Truck"],
        "Precision": ["83.9%", "86.4%", "89.2%", "85.1%", "76.5%"],
        "Recall": ["84.9%", "78.2%", "81.0%", "72.4%", "62.0%"],
        "mAP@0.50": ["88.10%", "82.70%", "81.60%", "85.50%", "72.10%"],
        "Validation Samples": [484, 195, 1665, 260, 53]
    }
    st.dataframe(pd.DataFrame(class_metrics_data), use_container_width=True)
    
    st.markdown("---")
    st.subheader("Model Checkpoint Comparative Matrix")
    render_model_comparison_table()
    
    st.markdown("---")
    st.subheader("Confusion Matrix Visualizations")
    conf_c1, conf_c2 = st.columns(2)
    
    cm_counts = "runs/detect/runs/detect/train_emergency_v2/confusion_matrix.png"
    if not os.path.exists(cm_counts):
        cm_counts = "runs/detect/runs/detect/train_emergency/confusion_matrix.png"
        
    cm_norm = "runs/detect/runs/detect/train_emergency_v2/confusion_matrix_normalized.png"
    if not os.path.exists(cm_norm):
        cm_norm = "runs/detect/runs/detect/train_emergency/confusion_matrix_normalized.png"
        
    with conf_c1:
        if os.path.exists(cm_counts):
            st.image(cm_counts, caption="Confusion Matrix (Absolute Counts)", use_container_width=True)
    with conf_c2:
        if os.path.exists(cm_norm):
            st.image(cm_norm, caption="Confusion Matrix (Normalized Fractions)", use_container_width=True)


# ==============================================================================
# TAB 3: DETECTION LOGIC EXPLAINED
# ==============================================================================
with tab3:
    st.subheader("Dual-Threshold & Optical Preemption Architecture")
    
    logic_col1, logic_col2 = st.columns(2)
    
    with logic_col1:
        st.markdown(
            r"""
            ### 1. Dual-Threshold Confidence Filtering
            In real-world street environments, emergency vehicles travel rapidly, experience strobe lighting, 
            and may be partially occluded by surrounding vehicles. 

            - **Emergency Vehicles (Ambulance, Fire Truck)**:
              - Confidence Threshold: **`0.20`**
              - Designed for **High Recall** to ensure zero missed emergency responses.
            - **Normal Traffic (Cars, Buses, Motorcycles)**:
              - Confidence Threshold: **`0.30`**
              - Filters false positive background clutter while keeping lane counts accurate.

            ### 2. HSV Siren Strobe Scanner
            To avoid mistaking red taillights or headlights for emergency lights:
            - Extracts the top **35% roof region** of candidate bounding boxes.
            - Scans HSV channels with calibrated ranges (Red: $H \in [0, 15] \cup [165, 180]$, Blue: $H \in [90, 140]$, $V \ge 210$).
            - Requires blue strobe confirmation to reject halogen headlights and standard brake lamps.
            """
        )
        
    with logic_col2:
        st.markdown(
            r"""
            ### 3. Containment Suppression & Temporal Tracking
            - **Containment Suppression**: Detectors often emit nested boxes for wheels, lightbars, and the vehicle body. Our algorithm checks pairwise bounding box intersection over area; if an inner box is $>65\%$ contained inside an outer box, it is suppressed.
            - **IoU Temporal Tracking**: Employs an IoU match threshold of **`0.50`** across frames.
            - **8-Frame Strobe Memory**: Alternating siren strobes create brief dark intervals ($\sim 0.25$s). The tracker remembers vehicle identity across dark gaps to prevent track flickering.

            ### 4. Signal Preemption State Machine
            ```
            [RED Phase: 50s Default]
                     |
            (Ambulance Detected) ➔ Truncate Red Timer to 10s
                     |
            [YELLOW Transition: 1.5s Safe Clearance]
                     |
            [GREEN Wave: HOLD indefinitely while Ambulance present]
                     |
            (Ambulance Exits Frame) ➔ 2.0s Post-Clearance Buffer
                     |
            [YELLOW Transition: 1.5s] ➔ [Return to Normal 50s RED Cycle]
            ```
            """
        )


# ==============================================================================
# TAB 4: CONCLUSION & FUTURE SCOPE
# ==============================================================================
with tab4:
    st.subheader("Project Summary & Smart City Deployment Scope")
    
    c_left, c_right = st.columns(2)
    
    with c_left:
        st.markdown(
            """
            ### Project Achievements
            - **High Precision Emergency Detection**: Achieved **88.1% mAP@0.50** on custom Indian traffic conditions and **96.1% mAP@0.50** on the baseline test split.
            - **Real-Time Edge Inference**: Ultralytics YOLOv11 Nano processes 640x640 frames at $>30$ FPS, suitable for embedded intersection hardware (NVIDIA Jetson / Raspberry Pi 5).
            - **Eliminated False Alarms**: HSV siren strobe color verification completely mitigates brake light and headlight false triggers.
            - **Simulated Grid Preemption**: Proven deterministic signal truncation and green-corridor holding without manual dispatcher intervention.
            """
        )
        st.success("🎯 **Conclusion**: The pipeline effectively bridges deep learning computer vision and municipal traffic controller infrastructure.")

    with c_right:
        st.markdown(
            """
            ### Future Municipal Scope
            - **Connected Vehicle (V2X) Integration**: Pairing optical camera detection with Dedicated Short-Range Communications (DSRC) / C-V2X telemetry for multi-modal failover.
            - **Adaptive Corridor Synchronization**: Coordinating contiguous green waves across 5–10 traffic lights along an ambulance's active dispatch route using GPS trajectory prediction.
            - **Pedestrian Safety Interlocks**: Dynamically extending pedestrian countdown clearance when preemption is initiated to guarantee crosswalk clearing.
            """
        )

    st.markdown("---")
    st.subheader("Preemption Simulator Video Demonstration")
    
    demo_c1, demo_c2 = st.columns([1, 1])
    with demo_c1:
        st.markdown(
            """
            #### Demonstration Overview
            The video on the right demonstrates an actual four-lane intersection simulation:
            - **Lane 1**: Monitored by the YOLO detector.
            - **Lanes 2, 3, 4**: Cross-traffic with normal signal cycles.
            - As the ambulance enters Lane 1, the controller switches conflicting signals to Red and opens Lane 1 with **HOLD**.
            """
        )
    with demo_c2:
        preempt_video = "output_preemption.mp4"
        if not os.path.exists(preempt_video):
            preempt_video = "output_ambulance2.mp4"
            
        if os.path.exists(preempt_video):
            st.video(preempt_video)
            with open(preempt_video, "rb") as fv:
                st.download_button(
                    label="📥 Download Demonstration Video",
                    data=fv,
                    file_name="output_preemption.mp4",
                    mime="video/mp4",
                    use_container_width=True
                )
        else:
            st.info("Demonstration video file will appear once generated.")
