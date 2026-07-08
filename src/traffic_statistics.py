from ultralytics import YOLO
import pandas as pd

model = YOLO("runs/detect/runs/traffic_detection/weights/best.pt")

results = model.predict(
    source="dataset/test/images",
    conf=0.4
)

records = []


for result in results:
    names = result.names

    for box in result.boxes:

        cls = int(box.cls[0])

        confidence = float(box.conf[0])

        records.append({
            "Object": names[cls],
            "Confidence": round(confidence,3)
        })

df = pd.DataFrame(records)

print(df)

df.to_csv(
    "outputs/traffic_statistics.csv",
    index=False
)

print("CSV Saved Successfully!")