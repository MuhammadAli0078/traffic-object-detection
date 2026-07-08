from pathlib import Path
import pandas as pd

# Path to labels
label_folder = Path("dataset/train/labels")

all_classes = []

# Read all label files
for file in label_folder.glob("*.txt"):
    with open(file, "r") as f:
        lines = f.readlines()

    for line in lines:
        class_id = int(line.split()[0])
        all_classes.append(class_id)

# Convert to DataFrame
df = pd.DataFrame(all_classes, columns=["Class_ID"])

# Mapping IDs to class names
class_names = {
    0: "Bike",
    1: "Bus",
    2: "Car",
    3: "Motobike",
    4: "Truck"
}

df["Class_Name"] = df["Class_ID"].map(class_names)

summary = (
    df.groupby("Class_Name")
      .size()
      .reset_index(name="Count")
)

print("\n========== DATASET SUMMARY ==========\n")
print(summary)

summary.to_csv("outputs/class_distribution.csv", index=False)

print("\nCSV Saved Successfully!")