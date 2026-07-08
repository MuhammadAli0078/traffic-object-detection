from ultralytics import YOLO

model = YOLO("runs/detect/runs/traffic_detection/weights/best.pt")

results = model.predict(
    source="dataset/test/images",
    conf=0.4,
    save=True,
    project="outputs",
    name="image_predictions"
)

print("Detection Completed!")