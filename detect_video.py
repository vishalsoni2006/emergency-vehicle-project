import os
import cv2
import numpy as np
import argparse
import math
from ultralytics import YOLO

class TrafficSignalSystem:
    def __init__(self):
        # 4 lanes: index 0 is Lane 1 (Camera Lane), indices 1, 2, 3 are Lanes 2, 3, 4
        self.lane_green_duration = 30.0
        self.lane_yellow_duration = 3.0
        
        # State variables
        self.active_lane = 1  # Start with Lane 2 active
        self.phase_state = 'GREEN'  # 'GREEN' or 'YELLOW'
        self.time_remaining = self.lane_green_duration
        
        # Preemption state
        self.preemption_active = False
        self.preemption_timer = 0.0
        self.preemption_hold = False
        self.preemption_cooldown = 0.0
        self.cooldown_limit = 3.0  # 3 seconds buffer after detection drops

    def update(self, dt, emergency_detected):
        """
        Update the signal state machine.
        dt: elapsed time in seconds
        emergency_detected: boolean indicating if ambulance/fire truck is in camera lane
        """
        # 1. State changes triggered by detections
        if emergency_detected:
            if not self.preemption_active:
                self.preemption_active = True
                print("\n[TRAFFIC CONTROL] 🚨 Emergency Vehicle Detected! Triggering preemption...")
                
                if self.active_lane == 0:
                    # Lane 1 (index 0) is already green
                    self.preemption_hold = True
                    self.preemption_cooldown = self.cooldown_limit
                    if self.phase_state == 'YELLOW':
                        self.phase_state = 'GREEN'
                        self.time_remaining = self.lane_green_duration
                else:
                    # Trigger 5s preemption countdown to turn Lane 1 Green
                    self.preemption_timer = 5.0
                    # Current active lane immediately switches to Yellow for 2 seconds
                    self.phase_state = 'YELLOW'
                    self.time_remaining = min(2.0, self.time_remaining)
            else:
                # Preemption already active
                if self.active_lane == 0:
                    # We are in the Green hold phase, reset cooldown buffer
                    self.preemption_hold = True
                    self.preemption_cooldown = self.cooldown_limit
        else:
            # No emergency vehicle detected
            if self.preemption_active and self.active_lane == 0:
                # We are in the Green hold phase, countdown the cooldown buffer
                self.preemption_cooldown -= dt
                if self.preemption_cooldown <= 0:
                    print("[TRAFFIC CONTROL] Emergency vehicle cleared. Resuming normal cycle.")
                    self.preemption_active = False
                    self.preemption_hold = False
                    # Return to normal cycle with Lane 1 having 10 seconds of green left
                    self.active_lane = 0
                    self.phase_state = 'GREEN'
                    self.time_remaining = 10.0

        # 2. General timer decrement and state transition logic
        if self.preemption_active:
            if self.active_lane != 0:
                # We are counting down to green
                self.preemption_timer -= dt
                self.time_remaining -= dt
                
                # If the currently active green lane's yellow timer finishes, it turns Red
                if self.time_remaining <= 0 and self.phase_state == 'YELLOW':
                    self.phase_state = 'RED'
                    self.time_remaining = 0.0
                
                # When the 5-second preemption countdown finishes, Lane 1 turns GREEN
                if self.preemption_timer <= 0:
                    print("[TRAFFIC CONTROL] Preemption countdown complete. Switching Lane 1 to GREEN.")
                    self.active_lane = 0
                    self.phase_state = 'GREEN'
                    self.time_remaining = self.lane_green_duration
                    self.preemption_cooldown = self.cooldown_limit
        else:
            # Normal cycle execution
            self.time_remaining -= dt
            if self.time_remaining <= 0:
                if self.phase_state == 'GREEN':
                    self.phase_state = 'YELLOW'
                    self.time_remaining = self.lane_yellow_duration
                else:  # YELLOW
                    self.active_lane = (self.active_lane + 1) % 4
                    self.phase_state = 'GREEN'
                    self.time_remaining = self.lane_green_duration

    def get_lane_status(self):
        """
        Calculate and return (color, countdown) for all 4 lanes
        """
        status = []
        for i in range(4):
            color = 'RED'
            countdown = 0
            
            if self.preemption_active:
                if self.active_lane == 0:
                    if i == 0:
                        color = 'GREEN'
                        countdown = 999  # Indicates hold
                    else:
                        color = 'RED'
                        countdown = 0
                else:
                    # Preemption countdown
                    if i == 0:
                        color = 'RED'
                        countdown = max(0.0, self.preemption_timer)
                    elif i == self.active_lane:
                        if self.phase_state == 'YELLOW' and self.time_remaining > 0:
                            color = 'YELLOW'
                            countdown = max(0.0, self.time_remaining)
                        else:
                            color = 'RED'
                            countdown = 0
                    else:
                        color = 'RED'
                        countdown = max(0.0, self.preemption_timer)
            else:
                # Normal mode
                if i == self.active_lane:
                    color = self.phase_state
                    countdown = max(0.0, self.time_remaining)
                else:
                    color = 'RED'
                    # Calculate time to green
                    t = 0.0
                    curr = self.active_lane
                    curr_state = self.phase_state
                    steps = 0
                    while curr != i and steps < 4:
                        if steps == 0:
                            t += self.time_remaining
                            if curr_state == 'GREEN':
                                t += self.lane_yellow_duration
                        else:
                            t += self.lane_green_duration + self.lane_yellow_duration
                        curr = (curr + 1) % 4
                        steps += 1
                    countdown = t
            
            status.append({
                'color': color,
                'countdown': int(math.ceil(countdown))
            })
        return status


def create_synthetic_video(output_path, test_dir, fps=30):
    """
    Creates a synthetic video from test dataset images.
    Structure:
      - 90 frames of normal vehicles (3 seconds) - Synthetic 2D traffic scene with no emergency vehicles.
      - 150 frames of emergency vehicles (5 seconds) - Real Ambulance/Fire truck images from dataset.
      - 60 frames of normal vehicles (2 seconds) - Synthetic 2D traffic scene.
    Total: 300 frames (10 seconds)
    """
    print(f"\n[SYNTHETIC VIDEO] Generating test video '{output_path}' from test images...")
    
    if not os.path.exists(test_dir):
        print(f"Error: Test directory '{test_dir}' not found.")
        return False
        
    all_files = os.listdir(test_dir)
    image_files = [f for f in all_files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    
    # Categorize images
    emergency_imgs = []
    
    for f in image_files:
        path = os.path.join(test_dir, f)
        f_lower = f.lower()
        if 'ambulance' in f_lower or 'fire' in f_lower:
            emergency_imgs.append(path)
            
    print(f"Found {len(emergency_imgs)} emergency vehicle images in test split.")
    
    if not emergency_imgs:
        print("Warning: No emergency images found. Cannot simulate ambulance detection.")
        return False

    width, height = 640, 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Helper to draw a synthetic traffic frame
    def draw_synthetic_traffic(frame_idx):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Background: dark green area for intersection sides
        frame[:] = (34, 139, 34)  # Forest Green BGR
        
        # Roads (grey asphalt)
        cv2.rectangle(frame, (240, 0), (400, 640), (70, 70, 70), -1)   # North-South
        cv2.rectangle(frame, (0, 240), (640, 400), (70, 70, 70), -1)   # East-West
        
        # Lane divider markings (dashed white)
        for y in range(0, 640, 40):
            if not (240 <= y <= 400):
                cv2.line(frame, (320, y), (320, y + 20), (255, 255, 255), 2)
        for x in range(0, 640, 40):
            if not (240 <= x <= 400):
                cv2.line(frame, (x, 320), (x + 20, 320), (255, 255, 255), 2)
                
        # Draw intersection box outline
        cv2.rectangle(frame, (240, 240), (400, 400), (100, 100, 100), 2)
        
        # Draw some "normal cars" (rectangles that YOLO won't identify as ambulances)
        # Car 1: Blue sedan moving south
        y1 = (frame_idx * 6) % 640
        cv2.rectangle(frame, (260, y1), (285, y1 + 35), (200, 50, 50), -1)  # Reddish-blue car
        cv2.rectangle(frame, (265, y1 + 10), (280, y1 + 25), (100, 200, 255), -1)  # Windshield
        
        # Car 2: Yellow car moving east
        x2 = (frame_idx * 5) % 640
        cv2.rectangle(frame, (x2, 355), (x2 + 35, 380), (50, 200, 200), -1)  # Yellow/Green car
        cv2.rectangle(frame, (x2 + 10, 360), (x2 + 25, 375), (100, 200, 255), -1)
        
        # Text explanation
        cv2.putText(frame, "NORMAL TRAFFIC SEGMENT (SYNTHETIC)", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "No Emergency Vehicles in Lane 1", (20, 70), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        return frame

    # Segment 1: Normal (90 frames)
    for i in range(90):
        frame = draw_synthetic_traffic(i)
        out.write(frame)
        
    # Segment 2: Emergency (150 frames)
    for i in range(150):
        img_path = emergency_imgs[i % len(emergency_imgs)]
        img = cv2.imread(img_path)
        img = cv2.resize(img, (width, height))
        cv2.putText(img, "REAL EMERGENCY VEHICLE ENTERS FRAME", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
        out.write(img)
        
    # Segment 3: Normal (60 frames)
    for i in range(60):
        frame = draw_synthetic_traffic(90 + i)
        out.write(frame)
        
    out.release()
    print(f"[SYNTHETIC VIDEO] Successfully created synthetic test video: {output_path}")
    return True


def draw_hud(dashboard, signal_system, frame_idx, total_frames, fps, num_detections):
    # Fill background
    dashboard[:] = (25, 25, 25)
    
    # Draw title
    cv2.putText(dashboard, "TRAFFIC CONTROLLER", (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.line(dashboard, (10, 45), (250, 45), (80, 80, 80), 1)
    
    # Draw Mode
    if signal_system.preemption_active:
        # Flashing emergency mode (alternating colors based on frame_idx)
        flash = (frame_idx // 15) % 2
        bg_color = (0, 0, 180) if flash == 0 else (180, 0, 0)
        cv2.rectangle(dashboard, (10, 55), (250, 95), bg_color, -1)
        cv2.putText(dashboard, "🚨 EMERGENCY 🚨", (35, 73), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        cv2.putText(dashboard, "PREEMPTION ACTIVE", (40, 88), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    else:
        cv2.rectangle(dashboard, (10, 55), (250, 95), (0, 120, 0), -1)
        cv2.putText(dashboard, "MODE: NORMAL CYCLE", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
    # Draw Lanes status
    lane_status = signal_system.get_lane_status()
    y_start = 120
    box_height = 80
    
    for i, status in enumerate(lane_status):
        # Draw background container
        box_y1 = y_start + i * (box_height + 10)
        box_y2 = box_y1 + box_height
        
        # Highlight Lane 1 as the video lane
        border_color = (0, 200, 200) if i == 0 else (60, 60, 60)
        border_thickness = 2 if i == 0 else 1
        cv2.rectangle(dashboard, (10, box_y1), (250, box_y2), (40, 40, 40), -1)
        cv2.rectangle(dashboard, (10, box_y1), (250, box_y2), border_color, border_thickness)
        
        # Lane Label
        label = "LANE 1 (CAMERA)" if i == 0 else f"LANE {i+1}"
        cv2.putText(dashboard, label, (20, box_y1 + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        
        # Draw lights
        colors = {
            'RED': {'active': (0, 0, 255), 'dim': (0, 0, 50)},
            'YELLOW': {'active': (0, 255, 255), 'dim': (0, 50, 50)},
            'GREEN': {'active': (0, 255, 0), 'dim': (0, 50, 0)}
        }
        
        light_radius = 8
        spacing = 22
        start_x = 35
        
        for k, l_color in enumerate(['RED', 'YELLOW', 'GREEN']):
            cx = start_x + k * spacing
            cy = box_y1 + 52
            
            fill_color = colors[l_color]['active'] if status['color'] == l_color else colors[l_color]['dim']
            cv2.circle(dashboard, (cx, cy), light_radius, fill_color, -1)
            cv2.circle(dashboard, (cx, cy), light_radius, (100, 100, 100), 1)
            
        # Draw Timer
        timer_text = ""
        timer_color = (255, 255, 255)
        
        if status['countdown'] > 500:
            timer_text = "HOLD"
            timer_color = (0, 255, 0)
        else:
            timer_text = f"{status['countdown']}s"
            if status['color'] == 'GREEN':
                timer_color = (0, 255, 0)
            elif status['color'] == 'YELLOW':
                timer_color = (0, 255, 255)
            else:
                timer_color = (0, 0, 255)
                
        # Draw timer countdown
        cv2.putText(dashboard, timer_text, (160, box_y1 + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, timer_color, 2)
        
    # Draw stats footer
    pct = int((frame_idx / total_frames) * 100)
    cv2.putText(dashboard, f"Progress: {pct}% ({frame_idx}/{total_frames})", (15, 595), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 180, 180), 1)
    cv2.putText(dashboard, f"Active Detections: {num_detections}", (15, 615), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 180, 180), 1)


def main():
    parser = argparse.ArgumentParser(description="Emergency Vehicle Traffic Light Preemption Simulator")
    parser.add_argument("--video", type=str, default="", help="Path to input traffic video")
    parser.add_argument("--model", type=str, default="runs/detect/runs/detect/train_emergency/weights/best.pt", help="Path to YOLO best.pt weights")
    parser.add_argument("--output", type=str, default="output_preemption.mp4", help="Path to output video file")
    parser.add_argument("--conf", type=float, default=0.30, help="Detection confidence threshold")
    args = parser.parse_args()

    # Determine paths
    model_path = args.model
    if not os.path.exists(model_path):
        print(f"[WARNING] Model weights '{model_path}' not found. Falling back to base 'yolo11n.pt'.")
        model_path = "yolo11n.pt"
        
    # Initialize YOLO
    print(f"[YOLO] Loading model weights from '{model_path}'...")
    model = YOLO(model_path)
    
    # Input video handling
    video_path = args.video
    test_dataset_images = "merged_dataset/test/images"
    
    if video_path == "" or not os.path.exists(video_path):
        if video_path != "":
            print(f"[WARNING] Input video '{video_path}' not found.")
        # Auto-create synthetic video
        video_path = "test_traffic.mp4"
        success = create_synthetic_video(video_path, test_dataset_images)
        if not success:
            print("[ERROR] Failed to find test images. Cannot run without a test video.")
            return

    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[ERROR] Could not open video file {video_path}")
        return

    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    if fps == 0:
        fps = 30
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[VIDEO] Processing '{video_path}' with {total_frames} frames at {fps} FPS...")

    # Output video specifications
    out_width = 900  # 640 (video) + 260 (dashboard)
    out_height = 640  # height matched to 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(args.output, fourcc, fps, (out_width, out_height))
    
    # Initialize Traffic Signal System
    signal_system = TrafficSignalSystem()
    dt = 1.0 / fps
    
    # Class names mapping
    # 0: 'Ambulance', 1: 'Fire_truck', 2: 'Normal_vehicle', 3: 'Police_car', 4: 'Towing_truck'
    emergency_classes = [0, 1]  # Ambulance and Fire_truck
    
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_idx += 1
        
        # Resize frame to uniform 640x640 size
        frame = cv2.resize(frame, (640, 640))
        
        # Run inference
        results = model(frame, verbose=False, conf=args.conf)
        
        # Check for emergency vehicles
        emergency_detected = False
        num_detections = 0
        
        # Process detections
        for result in results:
            boxes = result.boxes if hasattr(result, 'boxes') else result
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = model.names[cls_id]
                
                xyxy = box.xyxy[0].cpu().numpy().astype(int)
                x1, y1, x2, y2 = xyxy
                
                # Constrain coordinates to image dimensions
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(frame.shape[1], x2)
                y2 = min(frame.shape[0], y2)
                
                # Extract roof crop (top 35% of bounding box) to check for flashing lights
                h = y2 - y1
                crop_y2 = y1 + int(h * 0.35)
                
                siren_detected = False
                if crop_y2 > y1 and x2 > x1:
                    crop = frame[y1:crop_y2, x1:x2]
                    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
                    
                    # Red HSV range
                    lower_red1 = np.array([0, 80, 180])
                    upper_red1 = np.array([12, 255, 255])
                    lower_red2 = np.array([168, 80, 180])
                    upper_red2 = np.array([180, 255, 255])
                    
                    # Blue HSV range
                    lower_blue = np.array([95, 80, 180])
                    upper_blue = np.array([135, 255, 255])
                    
                    mask_red = cv2.bitwise_or(cv2.inRange(hsv, lower_red1, upper_red1), cv2.inRange(hsv, lower_red2, upper_red2))
                    mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)
                    
                    red_pixels = np.sum(mask_red > 0)
                    blue_pixels = np.sum(mask_blue > 0)
                    
                    # Flashing siren threshold: 4 blue pixels or 8 red pixels in roof crop
                    if blue_pixels >= 4 or red_pixels >= 8:
                        siren_detected = True
                        
                is_emergency = cls_id in emergency_classes or 'ambulance' in class_name.lower() or 'fire' in class_name.lower() or 'police' in class_name.lower()
                thresh = 0.20 if is_emergency else 0.30
                
                if conf >= thresh or siren_detected:
                    if siren_detected:
                        emergency_detected = True
                        num_detections += 1
                        box_color = (0, 0, 255)  # Bright Red for emergency override
                        thickness = 3
                        label_text = f"Ambulance (Siren) {conf:.2f}"
                    elif is_emergency:
                        emergency_detected = True
                        num_detections += 1
                        box_color = (0, 0, 255)
                        thickness = 3
                        label_text = f"{class_name} {conf:.2f}"
                    elif cls_id in [2, 4, 5, 7] or class_name.lower() in ['car', 'truck', 'bus', 'normal_vehicle', 'towing_truck']:
                        box_color = (0, 255, 0)  # Green
                        thickness = 1
                        label_text = f"Car {conf:.2f}"
                    else:
                        continue  # Ignore non-vehicle classes in base model
                        
                    cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, thickness)
                    cv2.putText(frame, label_text, (x1, max(0, y1 - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1)

        # Update Signal State Machine
        signal_system.update(dt, emergency_detected)
        
        # Draw overlay alerts on video frame if preemption is active
        if signal_system.preemption_active:
            # Add top warning bar
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (640, 45), (0, 0, 180), -1)
            cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
            cv2.putText(frame, "🚨 SIGNAL PREEMPTION: CLEARING LANE 1 🚨", 
                        (75, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            
            # Draw blinking red/blue border on video
            flash = (frame_idx // 15) % 2
            border_color = (0, 0, 200) if flash == 0 else (200, 0, 0)
            cv2.rectangle(frame, (0, 0), (640, 640), border_color, 4)
            
        # Draw Dashboard HUD
        dashboard = np.zeros((640, 260, 3), dtype=np.uint8)
        draw_hud(dashboard, signal_system, frame_idx, total_frames, fps, num_detections)
        
        # Combine video frame and dashboard side-by-side
        combined_frame = np.hstack((frame, dashboard))
        
        # Write to output file
        out.write(combined_frame)
        
        if frame_idx % 30 == 0:
            status_summary = ", ".join([f"L{i+1}:{s['color']}({s['countdown']}s)" for i, s in enumerate(signal_system.get_lane_status())])
            print(f"Frame {frame_idx}/{total_frames} | Detected: {num_detections} | Signals: {status_summary}")

    cap.release()
    out.release()
    
    print("\n" + "="*50)
    print(f"Processing finished successfully!")
    print(f"Saved processed output video to: {args.output}")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()
