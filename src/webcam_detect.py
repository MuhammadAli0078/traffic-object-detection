from ultralytics import YOLO

model = YOLO("runs/detect/runs/traffic_detection/weights/best.pt")

model.predict(
    source=0,
    show=True,
    conf=0.4
)