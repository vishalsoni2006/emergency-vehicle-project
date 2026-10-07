import os
import torch
from ultralytics import YOLO

def main():
    # Detect the best available device
    if torch.backends.mps.is_available():
        device = 'mps'
    elif torch.cuda.is_available():
        device = 'cuda'
    else:
        device = 'cpu'
    
    print(f"Using device: {device}")
    
    # Locate best.pt, fallback to yolo11n.pt if not trained yet
    model_path = "runs/detect/runs/detect/train_emergency/weights/best.pt"
    if not os.path.exists(model_path):
        print(f"Warning: {model_path} not found. Falling back to base yolo11n.pt model.")
        model_path = "yolo11n.pt"
        
    print(f"Loading model from: {model_path}")
    model = YOLO(model_path)
    
    dataset_yaml = os.path.abspath("merged_dataset/data.yaml")
    print(f"Dataset configuration path: {dataset_yaml}")
    
    if not os.path.exists(dataset_yaml):
        print(f"Error: {dataset_yaml} not found!")
        return

    print("Evaluating model on the split configured in data.yaml...")
    
    # Run evaluation
    metrics = model.val(
        data=dataset_yaml,
        split='test',  # Evaluate on test set
        device=device,
        project="runs/detect",
        name="val_emergency",
        exist_ok=True
    )
    
    print("\nEvaluation completed. Key Metrics:")
    print(f"mAP50-95: {metrics.box.map:.4f}")
    print(f"mAP50:    {metrics.box.map50:.4f}")
    print(f"Precision (all classes): {metrics.box.mp:.4f}")
    print(f"Recall (all classes):    {metrics.box.mr:.4f}")
    
    # Print metrics per class
    print("\nClass-wise Metrics:")
    names = model.names
    for i, class_name in names.items():
        if i < len(metrics.box.maps):
            map50 = metrics.box.maps[i]
            print(f"  Class {i} ({class_name}): mAP50 = {map50:.4f}")

if __name__ == "__main__":
    main()
