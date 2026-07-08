from ultralytics import YOLO

model = YOLO("runs/detect/runs/traffic_detection/weights/best.pt")

model.predict(
    source="videos/traffic.mp4",
    save=True,
    conf=0.4,
    project="outputs",
    name="video_predictions"
)