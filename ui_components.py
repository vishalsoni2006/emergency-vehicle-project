import os
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

from config import (
    APP_TITLE,
    APP_SUBTITLE,
    MODEL_REGISTRY,
    COLOR_SIGNAL_RED,
    COLOR_SIGNAL_YELLOW,
    COLOR_SIGNAL_GREEN,
    COLOR_ACCENT_PINK,
    COLOR_ACCENT_CYAN
)


def render_header():
    """
    Renders the unified header banner with cyberpunk accent badge,
    title, subtitle, and live system status pills.
    """
    st.markdown(
        f"""
        <div style="margin-bottom: 1.2rem;">
            <div class="header-badge">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#FF007F; margin-right:4px;"></span>
                Autonomous Optical Signal Preemption System
            </div>
            <h1 style="margin: 0; font-size: 2.1rem; letter-spacing: -0.5px;">{APP_TITLE}</h1>
            <p style="margin: 0.35rem 0 1rem 0; color: #94A3B8; font-size: 0.98rem;">
                {APP_SUBTITLE}
            </p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <span style="background: rgba(188,0,221,0.15); border: 1px solid rgba(188,0,221,0.3); border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; color: #E2E8F0;">
                    Core Engine: <b>YOLOv11 Nano</b>
                </span>
                <span style="background: rgba(0,229,255,0.12); border: 1px solid rgba(0,229,255,0.3); border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; color: #00E5FF;">
                    Verification: <b>HSV Siren Strobe Scanner</b>
                </span>
                <span style="background: rgba(0,230,118,0.12); border: 1px solid rgba(0,230,118,0.3); border-radius: 20px; padding: 4px 12px; font-size: 0.8rem; color: #00E676;">
                    Preemption: <b>50s ➔ 10s Truncation + Green Wave Hold</b>
                </span>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_empty_state():
    """
    Renders an instructional placeholder when no video simulation is currently active.
    """
    st.markdown(
        """
        <div class="empty-state-box">
            <div class="empty-state-icon">🚦</div>
            <div class="empty-state-title">Video Stream Awaiting Execution</div>
            <p style="max-width: 520px; margin: 0 auto 18px auto; color: #94A3B8; font-size: 0.92rem;">
                Configure the optical preemption parameters in the control panel on the left,
                then trigger the real-time simulation below.
            </p>
            <div class="empty-state-steps">
                <div class="empty-step-item">
                    <span class="step-num">1</span>
                    <span>Select Model Weights</span>
                </div>
                <div class="empty-step-item">
                    <span class="step-num">2</span>
                    <span>Choose Input Video</span>
                </div>
                <div class="empty-step-item">
                    <span class="step-num">3</span>
                    <span>Click 'Start Simulation'</span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )


def render_metrics_row(emergency_count: int, normal_count: int, fps: float, signal_state: str, timer: float):
    """
    Renders a unified 5-column metric row above the video stream for real-time observability.
    """
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric(
            label="Ambulances Detected",
            value=f"{emergency_count}",
            delta="In Lane 1" if emergency_count > 0 else None,
            delta_color="inverse" if emergency_count > 0 else "off"
        )
    with col2:
        st.metric(
            label="Normal Traffic",
            value=f"{normal_count}",
            delta="Flowing"
        )
    with col3:
        st.metric(
            label="Inference FPS",
            value=f"{fps:.1f}",
            delta="Real-Time" if fps >= 20 else "Processing"
        )
    with col4:
        state_icon = "🔴" if signal_state == "RED" else ("🟡" if signal_state == "YELLOW" else "🟢")
        st.metric(
            label="Active Signal",
            value=f"{state_icon} {signal_state}"
        )
    with col5:
        if signal_state == "GREEN" and emergency_count > 0:
            timer_text = "HOLD"
        else:
            timer_text = f"{max(0.0, timer):.1f}s"
        st.metric(
            label="Phase Countdown",
            value=timer_text,
            delta="Preempted" if (signal_state == "RED" and timer <= 10.0 and emergency_count > 0) else None
        )


def render_preemption_alert(state: str, is_amb_present: bool, timer: float, initial_timer: float = 50.0, preempt_target: float = 10.0):
    """
    Renders an attention-grabbing status alert banner showing current preemption state machine phase.
    """
    if state == "RED" and is_amb_present:
        st.markdown(
            f"""
            <div style="background: rgba(255, 0, 127, 0.15); border: 1px solid #FF007F; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 700; color: #FF007F; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.2rem;">⚡</span> EMERGENCY PREEMPTION TRIGGERED
                    </div>
                    <div style="color: #F1F5F9; font-size: 0.85rem; margin-top: 3px;">
                        Ambulance spotted in Lane 1! Red cycle truncated from {int(initial_timer)}s to <b>{int(preempt_target)}s</b>.
                    </div>
                </div>
                <div style="background: #FF007F; color: #FFF; font-weight: 800; border-radius: 8px; padding: 4px 10px; font-size: 0.9rem;">
                    OVERRIDE ACTIVE
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
    elif state == "GREEN":
        if is_amb_present:
            st.markdown(
                """
                <div style="background: rgba(0, 230, 118, 0.15); border: 1px solid #00E676; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 700; color: #00E676; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2rem;">🟢</span> GREEN CORRIDOR WAVE HELD
                        </div>
                        <div style="color: #F1F5F9; font-size: 0.85rem; margin-top: 3px;">
                            Ambulance actively traversing junction. Green light locked on HOLD until vehicle exits frame.
                        </div>
                    </div>
                    <div style="background: #00E676; color: #070311; font-weight: 800; border-radius: 8px; padding: 4px 10px; font-size: 0.9rem;">
                        CROSS TRAFFIC STOPPED
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
        else:
            st.markdown(
                f"""
                <div style="background: rgba(0, 229, 255, 0.12); border: 1px solid #00E5FF; border-radius: 12px; padding: 12px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div style="font-weight: 700; color: #00E5FF; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2rem;">🛡️</span> POST-CLEARANCE BUFFER ACTIVE
                        </div>
                        <div style="color: #F1F5F9; font-size: 0.85rem; margin-top: 3px;">
                            Ambulance cleared intersection. Safe transition buffer expiring in {max(0.0, timer):.1f}s before yellow phase.
                        </div>
                    </div>
                    <div style="background: #00E5FF; color: #070311; font-weight: 800; border-radius: 8px; padding: 4px 10px; font-size: 0.9rem;">
                        CLEARING
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )


def render_traffic_signal_card(state: str, timer: float, preemption_active: bool, is_amb_detected: bool, initial_timer: float = 50.0, preempt_target: float = 10.0) -> str:
    """
    Renders an animated, high-contrast, cyberpunk glassmorphic traffic signal HUD card.
    """
    red_dim = "0.18"
    yel_dim = "0.18"
    grn_dim = "0.18"
    red_glow = ""
    yel_glow = ""
    grn_glow = ""
    
    if state == "RED":
        red_dim = "1.0"
        red_glow = "box-shadow: 0 0 25px #FF1744, 0 0 10px #FF1744;"
    elif state == "YELLOW":
        yel_dim = "1.0"
        yel_glow = "box-shadow: 0 0 25px #FFD600, 0 0 10px #FFD600;"
    elif state == "GREEN":
        grn_dim = "1.0"
        grn_glow = "box-shadow: 0 0 25px #00E676, 0 0 10px #00E676;"

    if preemption_active and state == "RED":
        status_title = "🚨 EMERGENCY PREEMPTION"
        status_sub = f"Red timer cut from <b>{int(initial_timer)}s ➔ {int(preempt_target)}s</b> to clear lane queue!"
        banner_border = "#FF007F"
        banner_bg = "rgba(255, 0, 127, 0.16)"
        timer_color = "#00E5FF"
        timer_display_text = f"{max(0.0, timer):4.1f}<span style='font-size: 16px; font-weight: 500;'>s</span>"
        cross_html = "<span style='color: #FF1744; font-weight: 700;'>🛑 ALL CROSS LANES: FORCED RED</span>"
    elif state == "GREEN":
        if is_amb_detected:
            status_title = "🟢 GREEN CORRIDOR HELD"
            status_sub = "Ambulance actively traversing junction. Green light locked on HOLD until cleared!"
            banner_border = "#00E676"
            banner_bg = "rgba(0, 230, 118, 0.16)"
            timer_color = "#00E676"
            timer_display_text = "HOLD 🟢"
            cross_html = "<span style='color: #FF1744; font-weight: 700;'>🛑 ALL CROSS LANES: LOCKED RED</span>"
        else:
            status_title = "🟢 CLEARING JUNCTION BUFFER"
            status_sub = "Ambulance cleared intersection. Returning to standard cycle shortly..."
            banner_border = "#00E676"
            banner_bg = "rgba(0, 230, 118, 0.16)"
            timer_color = "#00E676"
            timer_display_text = f"{max(0.0, timer):4.1f}<span style='font-size: 16px; font-weight: 500;'>s</span>"
            cross_html = "<span style='color: #FF1744; font-weight: 700;'>🛑 ALL CROSS LANES: LOCKED RED</span>"
    elif state == "YELLOW":
        status_title = "🟡 PHASE TRANSITION"
        status_sub = "Clearing junction queue safely before phase change."
        banner_border = "#FFD600"
        banner_bg = "rgba(255, 214, 0, 0.16)"
        timer_color = "#FFD600"
        timer_display_text = f"{max(0.0, timer):4.1f}<span style='font-size: 16px; font-weight: 500;'>s</span>"
        cross_html = "<span style='color: #FF9100; font-weight: 700;'>⚠️ CROSS LANES: HALTING</span>"
    else:
        status_title = "🔴 NORMAL RED CYCLE"
        status_sub = f"Standard {int(initial_timer)}s cycle loop. Monitoring camera stream for response vehicles."
        banner_border = "rgba(188, 0, 221, 0.25)"
        banner_bg = "rgba(18, 7, 38, 0.55)"
        timer_color = "#FF1744"
        timer_display_text = f"{max(0.0, timer):4.1f}<span style='font-size: 16px; font-weight: 500;'>s</span>"
        cross_html = "<span style='color: #00E676; font-weight: 700;'>🚗 CROSS LANES: GREEN (FLOWING)</span>"

    html = f"""
    <div style="background: rgba(18, 7, 38, 0.85); border: 1px solid {banner_border}; border-radius: 16px; padding: 18px; color: #FFF; font-family: 'Outfit', 'Inter', sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.5); backdrop-filter: blur(12px);">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.5px; color: #FFF;">SMART SIGNAL HUD</div>
            <div style="font-size: 11px; background: {banner_bg}; border: 1px solid {banner_border}; border-radius: 20px; padding: 3px 8px; color: #FFF; font-weight: 600;">LANE 1 CONTROLLER</div>
        </div>
        
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
            <!-- 3-Light Housing -->
            <div style="background: #06020C; border: 2px solid rgba(255,255,255,0.15); border-radius: 22px; padding: 10px 8px; display: flex; flex-direction: column; gap: 8px; align-items: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.8);">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #FF1744; opacity: {red_dim}; {red_glow}"></div>
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #FFD600; opacity: {yel_dim}; {yel_glow}"></div>
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #00E676; opacity: {grn_dim}; {grn_glow}"></div>
            </div>
            
            <!-- Digital Countdown Display -->
            <div style="flex: 1;">
                <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; letter-spacing: 1px; margin-bottom: 2px;">Lane Signal Timer</div>
                <div style="font-size: 32px; font-weight: 800; color: {timer_color}; font-family: 'Courier New', monospace; letter-spacing: -1px; line-height: 1;">
                    {timer_display_text}
                </div>
                <div style="margin-top: 5px; font-size: 12px; color: #E2E8F0; font-weight: 600;">
                    {status_title}
                </div>
            </div>
        </div>
        
        <!-- Status Box -->
        <div style="background: {banner_bg}; border-left: 4px solid {banner_border}; padding: 8px 10px; border-radius: 6px; margin-bottom: 10px; font-size: 12px; line-height: 1.4;">
            {status_sub}
        </div>
        
        <!-- Cross Traffic Interlock -->
        <div style="background: rgba(0,0,0,0.4); border-radius: 6px; padding: 6px 10px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #94A3B8;">Cross-Traffic Interlock:</span>
            {cross_html}
        </div>
    </div>
    """
    return html


def render_interactive_charts(csv_path: str):
    """
    Generates interactive Plotly figures for training losses and validation metrics,
    styled to match the dark cyberpunk UI theme with hover tooltips and range toggles.
    """
    if not os.path.exists(csv_path):
        st.info("Diagnostic results CSV file not found. Curves will render once a training run completes.")
        return

    try:
        df = pd.read_csv(csv_path)
        df.columns = df.columns.str.strip()
        
        # Loss Curves Figure
        fig_loss = go.Figure()
        if 'train/box_loss' in df.columns:
            fig_loss.add_trace(go.Scatter(
                x=df['epoch'], y=df['train/box_loss'],
                mode='lines+markers', name='Train Box Loss',
                line=dict(color='#FF007F', width=2),
                marker=dict(size=4)
            ))
        if 'val/box_loss' in df.columns:
            fig_loss.add_trace(go.Scatter(
                x=df['epoch'], y=df['val/box_loss'],
                mode='lines+markers', name='Val Box Loss',
                line=dict(color='#00E5FF', width=2, dash='dot'),
                marker=dict(size=4)
            ))
        if 'train/cls_loss' in df.columns:
            fig_loss.add_trace(go.Scatter(
                x=df['epoch'], y=df['train/cls_loss'],
                mode='lines', name='Train Cls Loss',
                line=dict(color='#BC00DD', width=1.5)
            ))
        if 'val/cls_loss' in df.columns:
            fig_loss.add_trace(go.Scatter(
                x=df['epoch'], y=df['val/cls_loss'],
                mode='lines', name='Val Cls Loss',
                line=dict(color='#FFD600', width=1.5, dash='dot')
            ))
            
        fig_loss.update_layout(
            title="Training & Validation Loss Curves",
            template="plotly_dark",
            paper_bgcolor="#0B051A",
            plot_bgcolor="#120726",
            font=dict(color="#F1F5F9", family="Inter"),
            xaxis=dict(title="Epoch", gridcolor="rgba(255,255,255,0.08)"),
            yaxis=dict(title="Loss Value", gridcolor="rgba(255,255,255,0.08)"),
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )

        # Accuracy & Precision Metrics Figure
        fig_metrics = go.Figure()
        if 'metrics/mAP50(B)' in df.columns:
            fig_metrics.add_trace(go.Scatter(
                x=df['epoch'], y=df['metrics/mAP50(B)'],
                mode='lines+markers', name='mAP@0.50 (B)',
                line=dict(color='#00E676', width=2.5),
                marker=dict(size=4)
            ))
        if 'metrics/mAP50-95(B)' in df.columns:
            fig_metrics.add_trace(go.Scatter(
                x=df['epoch'], y=df['metrics/mAP50-95(B)'],
                mode='lines+markers', name='mAP@0.50:0.95 (B)',
                line=dict(color='#00E5FF', width=2),
                marker=dict(size=4)
            ))
        if 'metrics/precision(B)' in df.columns:
            fig_metrics.add_trace(go.Scatter(
                x=df['epoch'], y=df['metrics/precision(B)'],
                mode='lines', name='Precision',
                line=dict(color='#FF007F', width=1.5, dash='dash')
            ))
        if 'metrics/recall(B)' in df.columns:
            fig_metrics.add_trace(go.Scatter(
                x=df['epoch'], y=df['metrics/recall(B)'],
                mode='lines', name='Recall',
                line=dict(color='#FFD600', width=1.5, dash='dash')
            ))

        fig_metrics.update_layout(
            title="Validation Accuracy & Detection Quality (mAP / P / R)",
            template="plotly_dark",
            paper_bgcolor="#0B051A",
            plot_bgcolor="#120726",
            font=dict(color="#F1F5F9", family="Inter"),
            xaxis=dict(title="Epoch", gridcolor="rgba(255,255,255,0.08)"),
            yaxis=dict(title="Metric Score (0 - 1.0)", gridcolor="rgba(255,255,255,0.08)"),
            hovermode="x unified",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
        )

        chart_c1, chart_c2 = st.columns(2)
        with chart_c1:
            st.plotly_chart(fig_loss, use_container_width=True)
        with chart_c2:
            st.plotly_chart(fig_metrics, use_container_width=True)

    except Exception as e:
        st.error(f"Error plotting interactive diagnostic curves: {e}")


def render_model_comparison_table():
    """
    Renders a comparative evaluation table across YOLO model checkpoints.
    """
    comparison_data = [
        {
            "Model Version": "YOLOv11 Base (COCO Pre-trained)",
            "Dataset": "COCO-80 Generic Dataset",
            "Epochs": "Pre-trained",
            "Ambulance mAP50": "Baseline (Generic)",
            "False Positive Rate": "High on Indian Road Clutter",
            "Hardware Target": "CPU / Cloud VPS"
        },
        {
            "Model Version": "YOLOv11 v1 (50-Epoch)",
            "Dataset": "Merged Emergency Dataset (~10,000 imgs)",
            "Epochs": "50 Epochs",
            "Ambulance mAP50": "96.1%",
            "False Positive Rate": "Moderate (Some car headlights trigger)",
            "Hardware Target": "Apple Silicon M4 / GPU"
        },
        {
            "Model Version": "YOLOv11 v2 (Fine-Tuned)",
            "Dataset": "Merged Dataset + 8 WhatsApp Indian Traffic Videos",
            "Epochs": "25 Epochs (Early Stopping p=8)",
            "Ambulance mAP50": "88.1% (Generalizing to dense traffic)",
            "False Positive Rate": "Low (Calibrated HSV Siren Scanner)",
            "Hardware Target": "Apple Silicon M4 / GPU (Production)"
        }
    ]
    df_comp = pd.DataFrame(comparison_data)
    st.dataframe(df_comp, use_container_width=True)
