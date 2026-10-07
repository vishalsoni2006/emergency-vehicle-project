import os
import cv2
import numpy as np
import streamlit as st
from ultralytics import YOLO

from config import (
    IOU_TRACK_THRESH,
    TRACK_MEMORY_FRAMES,
    MIN_BOX_SIZE,
    MAX_ASPECT_RATIO,
    CONTAINMENT_THRESH,
    COLOR_AMBULANCE_BGR,
    COLOR_NORMAL_BGR
)

@st.cache_resource(show_spinner=False)
def load_yolo_model(weights_path: str) -> YOLO:
    """
    Cached model loader to prevent redundant model instantiation across Streamlit reruns.
    """
    if not os.path.exists(weights_path):
        # Fallback to local base model if specified weights not found
        fallback = "yolo11n.pt"
        if os.path.exists(fallback):
            return YOLO(fallback)
        raise FileNotFoundError(f"Neither '{weights_path}' nor '{fallback}' could be located.")
    return YOLO(weights_path)


def get_iou(box1, box2):
    """
    Computes Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2].
    """
    xA = max(box1[0], box2[0])
    yA = max(box1[1], box2[1])
    xB = min(box1[2], box2[2])
    yB = min(box1[3], box2[3])
    
    interArea = max(0, xB - xA) * max(0, yB - yA)
    
    box1Area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2Area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    unionArea = box1Area + box2Area - interArea
    if unionArea == 0:
        return 0
    return interArea / unionArea


def filter_contained_boxes(raw_detections):
    """
    Suppresses sub-contained part detections (e.g. wheels, texts, roof sirens)
    so that only the outer, full-chunk vehicle boundary is retained.
    """
    if not raw_detections:
        return []
        
    # Sort detections by box area descending (largest first)
    raw_detections = sorted(
        raw_detections,
        key=lambda x: (x["box"][2] - x["box"][0]) * (x["box"][3] - x["box"][1]),
        reverse=True
    )
    
    filtered = []
    for raw in raw_detections:
        box_a = raw["box"]
        area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
        if area_a <= 0:
            continue
            
        is_contained = False
        for parent in filtered:
            box_b = parent["box"]
            
            # Intersection coordinates
            ix1 = max(box_a[0], box_b[0])
            iy1 = max(box_a[1], box_b[1])
            ix2 = min(box_a[2], box_b[2])
            iy2 = min(box_a[3], box_b[3])
            
            if ix2 > ix1 and iy2 > iy1:
                intersection_area = (ix2 - ix1) * (iy2 - iy1)
                # If box_a is more than 65% contained inside the larger box_b, suppress it
                if (intersection_area / area_a) > CONTAINMENT_THRESH:
                    is_contained = True
                    break
        if not is_contained:
            filtered.append(raw)
    return filtered


def check_siren_hsv(frame, x1, y1, x2, y2):
    """
    Crops the upper 35% of the vehicle box and runs a calibrated HSV color scan
    to detect active flashing red/blue strobe lights, avoiding headlight glare false positives.
    """
    h = y2 - y1
    crop_y2 = y1 + int(h * 0.35)
    
    if crop_y2 <= y1 or x2 <= x1:
        return False
        
    crop = frame[y1:crop_y2, x1:x2]
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    
    # Red HSV range (Saturation >= 40 for overexposed cores, Value >= 210 for high brightness)
    lower_red1 = np.array([0, 40, 210])
    upper_red1 = np.array([15, 255, 255])
    lower_red2 = np.array([165, 40, 210])
    upper_red2 = np.array([180, 255, 255])
    
    # Blue HSV range (Saturation >= 40, Value >= 210)
    lower_blue = np.array([90, 40, 210])
    upper_blue = np.array([140, 255, 255])
    
    mask_red = cv2.bitwise_or(cv2.inRange(hsv, lower_red1, upper_red1), cv2.inRange(hsv, lower_red2, upper_red2))
    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
    
    red_pixels = np.sum(mask_red > 0)
    blue_pixels = np.sum(mask_blue > 0)
    
    box_w = x2 - x1
    box_h = y2 - y1
    is_small = (box_w < 55 or box_h < 55)
    
    # Flashing siren rule: require blue light to reject normal red taillights
    if is_small:
        # Distant vehicles: require at least 1 blue pixel
        return bool(blue_pixels >= 1)
    else:
        # Nearby vehicles: require both red and blue pixels
        return bool(blue_pixels >= 2 and red_pixels >= 2)


def draw_traffic_signal_hud_cv2(frame, state, timer, preemption_active, is_amb_detected):
    """
    Draws a realistic traffic light HUD with countdown timer on the OpenCV frame.
    """
    h, w = frame.shape[:2]
    box_w, box_h = 240, 105
    bx1 = w - box_w - 15
    by1 = 15
    bx2 = w - 15
    by2 = by1 + box_h
    
    # Semi-transparent dark background
    overlay = frame.copy()
    cv2.rectangle(overlay, (bx1, by1), (bx2, by2), (15, 8, 25), -1)
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)
    
    # Border
    border_color = (255, 0, 127) if preemption_active else (188, 0, 221)
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), border_color, 2)
    
    # Traffic light housing
    tl_x = bx1 + 25
    r = 10
    
    # Red light
    c_red = (0, 0, 255) if state == "RED" else (0, 0, 60)
    cv2.circle(frame, (tl_x, by1 + 25), r, c_red, -1)
    cv2.circle(frame, (tl_x, by1 + 25), r, (255, 255, 255) if state == "RED" else (80, 80, 80), 1)
    
    # Yellow light
    c_yel = (0, 230, 255) if state == "YELLOW" else (0, 60, 60)
    cv2.circle(frame, (tl_x, by1 + 52), r, c_yel, -1)
    cv2.circle(frame, (tl_x, by1 + 52), r, (255, 255, 255) if state == "YELLOW" else (80, 80, 80), 1)
    
    # Green light
    c_grn = (0, 255, 0) if state == "GREEN" else (0, 60, 0)
    cv2.circle(frame, (tl_x, by1 + 80), r, c_grn, -1)
    cv2.circle(frame, (tl_x, by1 + 80), r, (255, 255, 255) if state == "GREEN" else (80, 80, 80), 1)
    
    # Text labels
    text_x = tl_x + 22
    state_color = (0, 0, 255) if state == "RED" else ((0, 230, 255) if state == "YELLOW" else (0, 255, 0))
    cv2.putText(frame, f"SIGNAL: {state}", (text_x, by1 + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.50, state_color, 2)
    
    # Timer text
    if state == "GREEN" and is_amb_detected:
        timer_str = "TIMER: HOLD (AMB)"
    else:
        timer_str = f"TIMER: {max(0.0, timer):4.1f}s"
    cv2.putText(frame, timer_str, (text_x, by1 + 52), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 2)
    
    # Preemption status
    if preemption_active and state == "RED":
        cv2.putText(frame, "PREEMPT: CUT TO 10s", (text_x, by1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 255), 2)
        cv2.putText(frame, "AMBULANCE OVERRIDE", (text_x, by1 + 92), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
    elif state == "GREEN":
        if is_amb_detected:
            cv2.putText(frame, "GREEN: HELD ON AMB", (text_x, by1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 0), 2)
            cv2.putText(frame, "CROSS-TRAFFIC RED", (text_x, by1 + 92), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
        else:
            cv2.putText(frame, "CLEARING JUNCTION", (text_x, by1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 0), 2)
            cv2.putText(frame, "RETURNING TO RED", (text_x, by1 + 92), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 230, 255), 1)
    else:
        cv2.putText(frame, "NORMAL CYCLE", (text_x, by1 + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 180, 180), 1)
        cv2.putText(frame, "CROSS-TRAFFIC GREEN", (text_x, by1 + 92), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (100, 255, 100), 1)
        
    return frame


def create_synthetic_video(output_path, test_dir, fps=30):
    """
    Creates a synthetic traffic video combining test images and moving shapes
    if no test video is present.
    """
    if not os.path.exists(test_dir):
        return False
        
    all_files = os.listdir(test_dir)
    image_files = [f for f in all_files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    emergency_imgs = []
    for f in image_files:
        path = os.path.join(test_dir, f)
        f_lower = f.lower()
        if 'ambulance' in f_lower or 'fire' in f_lower:
            emergency_imgs.append(path)
            
    if not emergency_imgs:
        return False

    width, height = 640, 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    def draw_synthetic_traffic(frame_idx):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        cv2.rectangle(frame, (100, 0), (540, 640), (40, 40, 40), -1)
        for y in range(0, 640, 40):
            cv2.line(frame, (320, (y + frame_idx * 5) % 640), 
                     (320, (y + frame_idx * 5 + 20) % 640), (255, 255, 255), 2)
        
        y_pos1 = (frame_idx * 4) % 600
        cv2.rectangle(frame, (150, y_pos1), (250, y_pos1 + 120), (200, 50, 50), -1)
        cv2.circle(frame, (170, y_pos1 + 10), 8, (255, 255, 255), -1)
        cv2.circle(frame, (230, y_pos1 + 10), 8, (255, 255, 255), -1)
        
        y_pos2 = ((frame_idx * 3) + 200) % 600
        cv2.rectangle(frame, (380, y_pos2), (480, y_pos2 + 100), (50, 150, 50), -1)
        
        cv2.putText(frame, "SYNTHETIC TRAFFIC DEMO", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        return frame

    # 1. Normal traffic (3 seconds)
    for i in range(fps * 3):
        out.write(draw_synthetic_traffic(i))
        
    # 2. Real emergency images (3 seconds)
    for img_path in emergency_imgs[:3]:
        img = cv2.imread(img_path)
        if img is not None:
            img = cv2.resize(img, (width, height))
            for _ in range(fps):
                out.write(img)
                
    # 3. Normal traffic (2 seconds)
    for i in range(fps * 2):
        out.write(draw_synthetic_traffic(90 + i))
        
    out.release()
    return True
