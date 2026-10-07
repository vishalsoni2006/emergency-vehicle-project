# Emergency Vehicle Traffic Signal Management System

An intelligent computer vision system that integrates deep learning object detection with municipal traffic signal controllers to provide automated green light preemption for emergency vehicles (ambulances, fire engines, police units) across a 4-road, 8-lane intersection.

---

## Overview

In urban environments, emergency vehicles frequently encounter severe traffic congestion, leading to delayed medical and rescue response times. This system provides an autonomous solution:
- Monitors traffic lanes using CCTV camera feeds.
- Detects approaching emergency vehicles using a fine-tuned YOLOv11 model combined with HSV color analysis for flashing siren strobes.
- Automatically overrides normal traffic light cycles to grant an immediate green wave corridor to the emergency vehicle's road while holding conflicting roads at red.
- Resumes normal round-robin signal cycling once the vehicle has cleared the junction.

---

## Core System Architecture

### 1. Junction Layout (4 Roads, 8 Lanes, 4 Signals)
- Road 1 (North): Lanes 1 and 2 (Monitored by Signal 1)
- Road 2 (East): Lanes 3 and 4 (Monitored by Signal 2)
- Road 3 (South): Lanes 5 and 6 (Monitored by Signal 3)
- Road 4 (West): Lanes 7 and 8 (Monitored by Signal 4)

### 2. Signal Preemption State Machine
- Normal Cycle: Sequential round-robin cycling through Road 1, Road 2, Road 3, and Road 4.
  - Green Duration: 10 seconds
  - Yellow Clearance Duration: 3 seconds
  - Conflicting Signals: Held at Red
- Emergency Preemption Mode:
  - Triggered automatically when an ambulance is identified in any lane video.
  - Determines the corresponding road and traffic signal from the detected lane.
  - Immediately transitions the corresponding signal to Priority Green.
  - Forces all conflicting intersection signals to Red.
  - Highlights the emergency corridor with laser guidance overlays.
- Safe Recovery Mode:
  - Once the emergency vehicle clears the junction, a 3.0-second post-clearance buffer runs.
  - Safely transitions through a yellow phase before returning the intersection to normal cyclic operation.

### 3. Detection Engine & Anti-Overfitting Safeguards
- Deep Learning Architecture: Ultralytics YOLOv11 Nano.
- Dual-Threshold Filtering:
  - Emergency Vehicles: Confidence threshold of 0.20 (prioritizing high recall).
  - Normal Traffic: Confidence threshold of 0.30 (filtering background noise).
- HSV Siren Strobe Scanner:
  - Analyzes the upper 35% roof region of vehicle candidate boxes.
  - Calibrated hue, saturation, and value thresholds for flashing blue and red strobes.
  - Rejects false positives from brake lights and halogen headlights.
- Temporal IoU Tracking:
  - Intersection-over-Union threshold of 0.50.
  - 8-frame memory buffer bridges dark flash intervals during alternating strobe phases.
  - Nested containment suppression filters out sub-bounding boxes for wheels, sirens, and body fragments.

---

## Repository Structure

```text
emergency-vehicle-project/
|-- api_server.py                 # FastAPI backend connecting to the YOLOv11 model
|-- app.py                        # Streamlit dashboard interface
|-- config.py                     # Central constants, model registry, and timing parameters
|-- detect_video.py               # Video processing script for offline generation
|-- inference.py                  # Model loader, IoU tracker, HSV strobe scanner, and OpenCV HUD
|-- ui_components.py              # Modular UI components for the dashboard
|-- requirements.txt              # Python production dependencies
|-- packages.txt                  # Linux system packages (ffmpeg, libgl1, libglib2.0-0)
|-- .gitignore                    # Clean Git exclusion rules
|-- README.md                     # Documentation
|-- frontend/                     # React + Vite Command Center Web Application
|   |-- index.html                # Main HTML entry point
|   |-- package.json              # Frontend dependencies (React, Vite, Tailwind CSS, Lucide)
|   |-- vite.config.js            # Vite bundler configuration
|   |-- postcss.config.js         # PostCSS configuration
|   `-- src/
|       |-- App.jsx               # Main React application shell
|       |-- main.jsx              # Application bootstrap
|       |-- index.css             # Styling, glassmorphic panels, and signal glow shaders
|       |-- config/
|       |   `-- trafficConfig.js  # Junction mappings and timing configurations
|       |-- services/
|       |   `-- api.js            # Frontend API client communicating with backend
|       |-- hooks/
|       |   `-- useTrafficController.js # Preemption state machine and cyclic scheduler
|       |-- components/
|       |   |-- Header.jsx        # Status bar and mode indicators
|       |   |-- TrafficJunction.jsx # Central 4-road graphical intersection visualizer
|       |   |-- TrafficSignal.jsx # 3-lamp traffic signal component
|       |   |-- Lane.jsx          # Lane markings and directional chevrons
|       |   |-- VideoUploadCard.jsx # 8 CCTV lane video upload cards with previews
|       |   |-- EmergencyBanner.jsx # Critical preemption alert banner
|       |   |-- DetectionTimeline.jsx # Real-time event log with timestamps
|       |   |-- TrafficControlStatus.jsx # Telemetry panel for Signals 1 through 4
|       |   |-- AnalyticsDashboard.jsx # Comprehensive analysis results and telemetry charts
|       |   |-- ConfusionMatrix.jsx # Validation split confusion matrix
|       |   |-- ModelMetrics.jsx  # Precision, Recall, F1, and mAP metric cards
|       |   `-- DemoControls.jsx  # Interactive Demo Mode testing harness
|       `-- pages/
|           `-- Dashboard.jsx     # Master dashboard page
`-- runs/                         # Model training outputs and evaluated checkpoints
    `-- detect/
        |-- train_emergency_v2/weights/best.pt # Fine-tuned 25-epoch checkpoint
        `-- runs/detect/train_emergency/weights/best.pt # Baseline 50-epoch checkpoint
```

---

## Installation & Setup

### Prerequisites
- Python 3.10, 3.11, or 3.12
- Node.js v18 or higher with npm

### 1. Clone the Repository
```bash
git clone https://github.com/vishalsoni2006/emergency-vehicle-project.git
cd emergency-vehicle-project
```

### 2. Python Backend Setup
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

pip install -r requirements.txt
pip install fastapi uvicorn python-multipart
```

### 3. Frontend Web Application Setup
```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

### Option A: Complete Web Application (Recommended)

1. Start the FastAPI Model Backend:
```bash
python api_server.py
```
The backend starts on `http://localhost:8000` and automatically loads the trained YOLO checkpoint.

2. Start the React Frontend Dashboard:
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

### Option B: Classic Streamlit Application

If you prefer the single-process Streamlit dashboard:
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## API Documentation

The FastAPI backend exposes the following REST endpoints:

### GET /health
Checks server and model status.
- Response:
```json
{
  "status": "online",
  "model_loaded": true,
  "weights_path": "runs/detect/train_emergency_v2/weights/best.pt"
}
```

### POST /detect or POST /process-video
Processes an uploaded CCTV lane video and evaluates emergency preemption.
- Request: `multipart/form-data`
  - `video`: Video file (.mp4, .avi, .mov)
  - `lane_id`: Integer between 1 and 8
- Response:
```json
{
  "ambulance_detected": true,
  "confidence": 0.946,
  "lane_id": 5,
  "road_id": 3,
  "signal_id": 3,
  "emergency": true,
  "detections": [
    {
      "frame": 120,
      "confidence": 0.946,
      "siren_active": true
    }
  ]
}
```

### GET /metrics
Returns validation split metrics and the evaluation confusion matrix.
- Response:
```json
{
  "metrics": {
    "precision": 0.839,
    "recall": 0.849,
    "f1": 0.844,
    "map50": 0.881,
    "map50_95": 0.677
  },
  "confusion_matrix": {
    "tp": 411,
    "fn": 73,
    "fp": 79,
    "tn": 1560
  }
}
```

---

## Model Evaluation Results

Evaluation performed on 2,123 validation images (2,763 instances):

| Metric | Score |
| :--- | :--- |
| Ambulance Precision | 83.9% |
| Ambulance Recall | 84.9% |
| Ambulance mAP@0.50 | 88.1% |
| Overall Model Precision | 83.7% |
| Overall Model Recall | 76.2% |
| Overall Model mAP@0.50 | 83.5% |
| Overall Model mAP@0.50:0.95 | 64.7% |

---

## Cloud Deployment Guide

### 1. Streamlit Community Cloud
- Push this repository to GitHub.
- Sign in to Streamlit Community Cloud (share.streamlit.io).
- Select your repository and set the entry file to `app.py`.
- Deployment installs system dependencies via `packages.txt` and libraries via `requirements.txt`.

### 2. Hugging Face Spaces
- Create a new Space with the Streamlit SDK.
- Push this repository to the Space Git remote.
- The platform automatically detects `packages.txt` and starts `app.py`.

### 3. Vercel Architecture Notes
Streamlit cannot run natively on Vercel Serverless Functions due to file size limits (50MB zipped / 250MB uncompressed) and execution timeouts.
For production deployments targeting Vercel:
- Deploy the React frontend (`frontend/`) directly to Vercel.
- Deploy the FastAPI backend (`api_server.py`) to Fly.io, AWS ECS, or Hugging Face Spaces.
- Configure `VITE_API_URL` in Vercel environment variables to point to the hosted backend URL.

---

## License

This project is licensed under the MIT License.
