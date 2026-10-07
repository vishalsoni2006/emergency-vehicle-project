import os

# Application Metadata
APP_TITLE = "Emergency Vehicle Traffic Preemption Dashboard"
APP_SUBTITLE = "Real-Time Optical Signal Preemption & Deep Learning Traffic Management"

# Model Registry
# Uses concise, non-truncated display names with detailed tooltips and metadata
MODEL_REGISTRY = {
    "YOLOv11 v2 (Fine-Tuned)": {
        "path": "runs/detect/train_emergency_v2/weights/best.pt",
        "alt_path": "runs/detect/runs/detect/train_emergency_v2/weights/best.pt",
        "desc": "Fine-tuned for 25 epochs on 8 custom Indian traffic videos (patience=8)",
        "params": "2.58M",
        "precision": "83.9% (Ambulance)",
        "recall": "84.9% (Ambulance)",
        "map50": "88.1% (Ambulance)",
        "recommended": True
    },
    "YOLOv11 v1 (50-Epoch)": {
        "path": "runs/detect/runs/detect/train_emergency/weights/best_v1_50ep.pt",
        "alt_path": "runs/detect/runs/detect/train_emergency/weights/best.pt",
        "desc": "Trained for 50 epochs on ~10,000 merged dataset images (Apple Silicon M4)",
        "params": "2.58M",
        "precision": "87.6%",
        "recall": "83.2%",
        "map50": "96.1% (Ambulance)",
        "recommended": False
    },
    "YOLOv11 Base (COCO)": {
        "path": "yolo11n.pt",
        "alt_path": "yolo11n.pt",
        "desc": "Pre-trained Ultralytics baseline weights on COCO-80 classes",
        "params": "2.58M",
        "precision": "Baseline",
        "recall": "Baseline",
        "map50": "Baseline",
        "recommended": False
    }
}

# Signal Preemption Timing Defaults
DEFAULT_INITIAL_RED = 50.0        # Default 50s red timer at video start
DEFAULT_PREEMPT_RED = 10.0        # Truncated to 10s upon ambulance detection
DEFAULT_YELLOW_TIME = 1.5         # Safety phase clearance
DEFAULT_POST_CLEARANCE_BUFFER = 2.0  # Seconds to hold green after vehicle exits frame

# Detection & Tracking Heuristics
IOU_TRACK_THRESH = 0.50           # Strict IoU matching to prevent jumping to adjacent cars
TRACK_MEMORY_FRAMES = 8           # Holds track identity during siren strobe dark phases (~0.25s)
MIN_BOX_SIZE = 15                 # Allows distant vehicles while filtering pixel noise
MAX_ASPECT_RATIO = 2.5            # Filters flat siren bars / text banners
CONTAINMENT_THRESH = 0.65         # Suppresses nested sub-boxes (keeps whole vehicle chunk)
EMERGENCY_CONF_THRESH = 0.20      # High-recall threshold for response vehicles
NORMAL_CONF_THRESH = 0.30         # Filtering threshold for standard traffic

# Video Upload Constraints
MAX_UPLOAD_SIZE_MB = 100
ALLOWED_EXTENSIONS = ["mp4", "avi", "mov", "mkv"]

# Class Index Mappings
CLASS_NAMES = {
    0: "Ambulance",
    1: "Fire Truck",
    2: "Normal Vehicle",
    3: "Police Car",
    4: "Towing Truck"
}

# Color Palettes (BGR for OpenCV, Hex for CSS)
COLOR_AMBULANCE_BGR = (0, 0, 255)       # Bright Red
COLOR_NORMAL_BGR = (255, 120, 0)        # Sky Blue / Cyan
COLOR_SIGNAL_RED = "#FF1744"
COLOR_SIGNAL_YELLOW = "#FFD600"
COLOR_SIGNAL_GREEN = "#00E676"
COLOR_ACCENT_PINK = "#FF007F"
COLOR_ACCENT_CYAN = "#00E5FF"
