import os
import uuid
from pathlib import Path
from collections import Counter

import cv2
from flask import Flask, jsonify, request, send_from_directory
from ultralytics import YOLO
from werkzeug.utils import secure_filename

MODEL_PATH = "runs/detect/runs/traffic_detection/weights/best.pt"
RESULTS_DIR = Path("static/results")
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

DATASET_DIR = Path("dataset")
FIGURES_DIR = Path("runs/detect/runs/traffic_detection")
CLASS_NAMES = {0: "Bike", 1: "Bus", 2: "Car", 3: "Motobike", 4: "Truck"}

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}

app = Flask(__name__, static_folder="static", static_url_path="/static")
model = YOLO(MODEL_PATH)


def detect_image(upload_path, output_path):
    result = model.predict(source=str(upload_path), conf=0.4)[0]
    cv2.imwrite(str(output_path), result.plot())
    return count_classes([result])


def detect_video(upload_path, output_path):
    capture = cv2.VideoCapture(str(upload_path))
    fps = capture.get(cv2.CAP_PROP_FPS) or 25
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    capture.release()

    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    all_results = []
    for result in model.predict(source=str(upload_path), conf=0.4, stream=True):
        writer.write(result.plot())
        all_results.append(result)

    writer.release()
    return count_classes(all_results)


def count_classes(results):
    counts = Counter()
    for result in results:
        for box in result.boxes:
            class_name = result.names[int(box.cls[0])]
            counts[class_name] += 1
    return counts


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/dataset-stats")
def dataset_stats():
    split_counts = {
        split: len(list((DATASET_DIR / split / "images").glob("*")))
        for split in ("train", "valid", "test")
    }

    class_counts = Counter()
    for label_file in (DATASET_DIR / "train" / "labels").glob("*.txt"):
        with open(label_file) as f:
            for line in f:
                class_id = int(line.split()[0])
                class_counts[CLASS_NAMES[class_id]] += 1

    class_stats = sorted(class_counts.items(), key=lambda item: item[1], reverse=True)

    figures = [f for f in ("results.png", "confusion_matrix.png") if (FIGURES_DIR / f).exists()]

    return jsonify({
        "splits": split_counts,
        "classes": [{"name": name, "count": count} for name, count in class_stats],
        "figures": figures,
    })


@app.route("/dataset-figures/<filename>")
def dataset_figure(filename):
    return send_from_directory(FIGURES_DIR, filename)


@app.route("/api/detect", methods=["POST"])
def detect():
    uploaded_file = request.files.get("file")

    if uploaded_file is None or uploaded_file.filename == "":
        return jsonify({"error": "Please choose a file first."}), 400

    safe_name = secure_filename(uploaded_file.filename)
    if not safe_name:
        return jsonify({"error": "Invalid file name."}), 400

    unique_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"
    upload_path = RESULTS_DIR / unique_name
    uploaded_file.save(upload_path)

    is_video = upload_path.suffix.lower() in VIDEO_EXTENSIONS
    output_suffix = upload_path.suffix if is_video else ".jpg"
    output_path = RESULTS_DIR / (upload_path.stem + "_result" + output_suffix)

    if is_video:
        counts = detect_video(upload_path, output_path)
    else:
        counts = detect_image(upload_path, output_path)

    stats = sorted(counts.items(), key=lambda item: item[1], reverse=True)

    return jsonify({
        "result_url": "/" + output_path.as_posix(),
        "is_video": is_video,
        "stats": [{"name": name, "count": count} for name, count in stats],
        "total": sum(counts.values()),
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
