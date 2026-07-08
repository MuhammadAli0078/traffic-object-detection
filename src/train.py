from ultralytics import YOLO

def main():
    # Load pretrained YOLO11 Nano model
    model = YOLO("yolo11n.pt")

    # Train
    model.train(
        data="dataset/data.yaml",
        epochs=10,
        imgsz=416,
        batch=4,
        device="cpu",
        project="runs",
        name="traffic_detection",
        workers=0,
        verbose=True
    )

if __name__ == "__main__":
    main()