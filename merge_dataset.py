import os
import shutil

def merge_split(src_dir, dest_dir, split_src, split_dest, prefix="ind_"):
    src_images_dir = os.path.join(src_dir, split_src, "images")
    src_labels_dir = os.path.join(src_dir, split_src, "labels")
    
    dest_images_dir = os.path.join(dest_dir, split_dest, "images")
    dest_labels_dir = os.path.join(dest_dir, split_dest, "labels")
    
    os.makedirs(dest_images_dir, exist_ok=True)
    os.makedirs(dest_labels_dir, exist_ok=True)
    
    if not os.path.exists(src_images_dir):
        print(f"Source split {split_src} images not found at {src_images_dir}")
        return
        
    # Class Translation Mapping
    # Standard Classes: 0: Ambulance, 1: Fire_truck, 2: Normal_vehicle, 3: Police_car, 4: Towing_truck
    class_map = {
        # Ambulance (Class 0)
        2: 0,   # ambulance
        3: 0,   # ambulance_108
        4: 0,   # ambulance_SOL
        21: 0,  # tempo traveller
        
        # Fire Truck (Class 1)
        11: 1,  # fire_truck
        
        # Normal Vehicle (Class 2)
        0: 2,   # Army
        1: 2,   # Vehicle
        7: 2,   # auto
        8: 2,   # bike
        9: 2,   # bus
        10: 2,  # car
        22: 2,  # truck
        
        # Police Car (Class 3)
        17: 3,  # police
    }
    
    # All other classes are parts (lamps, texts, signs, writing) and are discarded.
    
    image_files = [f for f in os.listdir(src_images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Merging split: {split_src} -> {split_dest}. Found {len(image_files)} images.")
    
    copied_count = 0
    discarded_only_count = 0
    
    for img_file in image_files:
        name, ext = os.path.splitext(img_file)
        label_file = name + ".txt"
        
        src_img_path = os.path.join(src_images_dir, img_file)
        src_lbl_path = os.path.join(src_labels_dir, label_file)
        
        dest_img_name = f"{prefix}{img_file}"
        dest_lbl_name = f"{prefix}{label_file}"
        
        dest_img_path = os.path.join(dest_images_dir, dest_img_name)
        dest_lbl_path = os.path.join(dest_labels_dir, dest_lbl_name)
        
        # Check label file
        new_lines = []
        if os.path.exists(src_lbl_path):
            with open(src_lbl_path, "r") as f:
                lines = f.readlines()
                
            for line in lines:
                parts = line.strip().split()
                if not parts:
                    continue
                cls_id = int(parts[0])
                
                # Check if class is mapped (not discarded)
                if cls_id in class_map:
                    target_cls = class_map[cls_id]
                    new_lines.append(f"{target_cls} " + " ".join(parts[1:]) + "\n")
                    
        # Copy image and write label file
        shutil.copy(src_img_path, dest_img_path)
        
        # If there are valid label lines, write them. Else write an empty label file (background image).
        with open(dest_lbl_path, "w") as f:
            if new_lines:
                f.writelines(new_lines)
                copied_count += 1
            else:
                discarded_only_count += 1
                
    print(f"Finished split: Copied {copied_count} labeled images. Created {discarded_only_count} empty-label background images.")

def main():
    src_dir = "indian_dataset"
    dest_dir = "merged_dataset"
    
    print("--- Starting Dataset Merge & Translation ---")
    merge_split(src_dir, dest_dir, "train", "train")
    merge_split(src_dir, dest_dir, "valid", "val")
    merge_split(src_dir, dest_dir, "test", "test")
    print("--- Dataset Merge Complete! ---")

if __name__ == "__main__":
    main()
