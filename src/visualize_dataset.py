import cv2
import numpy as np
from pathlib import Path

# ----------------------------
# CHANGE THIS NUMBER TO SEE DIFFERENT IMAGES
# ----------------------------
IMAGE_NUMBER = 0

image_folder = Path("dataset/train/images")
label_folder = Path("dataset/train/labels")

images = sorted(image_folder.glob("*"))

image_path = images[IMAGE_NUMBER]

label_path = label_folder / (image_path.stem + ".txt")

image = cv2.imread(str(image_path))

height, width, channels = image.shape

print("=" * 50)
print("Image Information")
print("=" * 50)

print("Image Name :", image_path.name)
print("Width      :", width)
print("Height     :", height)
print("Channels   :", channels)
print("Image Shape:", image.shape)
print("Data Type  :", image.dtype)

print("\nNumPy Information")
print(type(image))
print("=" * 50)

# Class Names
classes = [
    "Bike",
    "Bus",
    "Car",
    "Motobike",
    "Truck"
]

with open(label_path, "r") as file:
    lines = file.readlines()

for line in lines:

    class_id, x_center, y_center, box_width, box_height = map(float, line.split())

    class_id = int(class_id)

    # Convert YOLO coordinates to pixels
    x_center *= width
    y_center *= height
    box_width *= width
    box_height *= height

    x1 = int(x_center - box_width / 2)
    y1 = int(y_center - box_height / 2)
    x2 = int(x_center + box_width / 2)
    y2 = int(y_center + box_height / 2)

    cv2.rectangle(image,
                  (x1, y1),
                  (x2, y2),
                  (0, 255, 0),
                  2)

    cv2.putText(
        image,
        classes[class_id],
        (x1, y1 - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 0, 255),
        2
    )

cv2.imshow("Dataset Visualization", image)

cv2.waitKey(0)
cv2.destroyAllWindows()