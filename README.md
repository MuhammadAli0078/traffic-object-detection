# Traffic Object Detection

YOLO11-based detector for traffic objects (Bike, Bus, Car, Motorbike, Truck).

## Setup

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

Run scripts from the project root (`e:\image processing`):

| Script | Purpose |
|---|---|
| `src/test_install.py` | Check that all libraries are installed correctly |
| `src/dataset_analysis.py` | Count how many labels exist per class in the training set |
| `src/visualize_dataset.py` | Show one training image with its bounding boxes drawn |
| `src/train.py` | Train the YOLO11 model on the dataset |
| `src/image_detect.py` | Run detection on the test images |
| `src/video_detect.py` | Run detection on `videos/traffic.mp4` |
| `src/webcam_detect.py` | Run detection on a live webcam feed |
| `src/traffic_statistics.py` | Run detection on test images and save a CSV of detected objects |

Example:

```
python src/train.py
python src/image_detect.py
```

## Web page (test UI)

A local web page (Bootstrap 5 for styling + plain JS in `static/`) lets you:

- Upload an image or video and see the detection result plus a class-count table
- View dataset stats: image counts per split, a bar chart of class distribution in the training set, and the training result figures (`results.png`, `confusion_matrix.png`)

`app.py` serves the page and exposes:
- `POST /api/detect` - run detection on an uploaded file
- `GET /api/dataset-stats` - dataset split/class counts
- `GET /dataset-figures/<filename>` - training result images

```
python app.py
```

Then open http://127.0.0.1:5000 in your browser.

## Project layout

- `dataset/` - training/validation/test images and labels (`data.yaml` defines classes)
- `runs/detect/runs/traffic_detection/weights/best.pt` - trained model weights
- `outputs/` - CSVs and prediction results
- `videos/` - sample video for testing
