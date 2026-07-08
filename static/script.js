const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const detectBtn = document.getElementById("detect-btn");
const spinner = document.getElementById("spinner");
const btnLabel = document.getElementById("btn-label");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const resultImage = document.getElementById("result-image");
const resultVideo = document.getElementById("result-video");
const detectBadges = document.getElementById("detect-badges");

const root = getComputedStyle(document.documentElement);
const CLASS_COLORS = {
    Bike: root.getPropertyValue("--class-bike").trim(),
    Bus: root.getPropertyValue("--class-bus").trim(),
    Car: root.getPropertyValue("--class-car").trim(),
    Motobike: root.getPropertyValue("--class-motobike").trim(),
    Truck: root.getPropertyValue("--class-truck").trim(),
};

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    errorEl.classList.add("d-none");
    resultEl.classList.add("d-none");

    if (!fileInput.files.length) {
        errorEl.textContent = "Please choose a file first.";
        errorEl.classList.remove("d-none");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    setLoading(true);

    try {
        const response = await fetch("/api/detect", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || "Something went wrong.";
            errorEl.classList.remove("d-none");
            return;
        }

        showResult(data);
    } catch (err) {
        errorEl.textContent = "Could not reach the server.";
        errorEl.classList.remove("d-none");
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    detectBtn.disabled = isLoading;
    spinner.classList.toggle("d-none", !isLoading);
    btnLabel.classList.toggle("d-none", isLoading);
}

function showResult(data) {
    const cacheBustedUrl = data.result_url + "?t=" + Date.now();

    if (data.is_video) {
        resultVideo.src = cacheBustedUrl;
        resultVideo.classList.remove("d-none");
        resultImage.classList.add("d-none");
    } else {
        resultImage.src = cacheBustedUrl;
        resultImage.classList.remove("d-none");
        resultVideo.classList.add("d-none");
    }

    detectBadges.innerHTML = "";
    data.stats.forEach((row) => {
        const color = CLASS_COLORS[row.name] || "#666";
        detectBadges.innerHTML += `
            <div class="col-auto">
                <span class="class-badge" style="background:${color}">
                    <span class="class-dot"></span>${row.name}: ${row.count}
                </span>
            </div>`;
    });
    detectBadges.innerHTML += `
        <div class="col-auto">
            <span class="class-badge bg-dark">Total: ${data.total}</span>
        </div>`;

    resultEl.classList.remove("d-none");
}

const SPLIT_COLORS = { train: "#2a78d6", valid: "#1baf7a", test: "#eda100" };
const SPLIT_ICONS = { train: "bi-collection-play", valid: "bi-check2-circle", test: "bi-flag" };

async function loadDatasetStats() {
    const response = await fetch("/api/dataset-stats");
    const data = await response.json();

    const splitCountsEl = document.getElementById("split-counts");
    splitCountsEl.innerHTML = "";
    for (const [split, count] of Object.entries(data.splits)) {
        splitCountsEl.innerHTML += `
            <div class="col-4">
                <div class="stat-tile" style="background:${SPLIT_COLORS[split]}">
                    <i class="bi ${SPLIT_ICONS[split]} fs-4"></i>
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">${split} images</div>
                </div>
            </div>`;
    }

    const classTableBody = document.querySelector("#class-table tbody");
    classTableBody.innerHTML = "";
    data.classes.forEach((row) => {
        const color = CLASS_COLORS[row.name] || "#666";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="class-dot" style="color:${color}"></span> ${row.name}</td>
            <td class="text-end">${row.count}</td>`;
        classTableBody.appendChild(tr);
    });

    new Chart(document.getElementById("class-chart"), {
        type: "bar",
        data: {
            labels: data.classes.map((row) => row.name),
            datasets: [{
                label: "Labels in training set",
                data: data.classes.map((row) => row.count),
                backgroundColor: data.classes.map((row) => CLASS_COLORS[row.name] || "#666"),
                borderRadius: 6,
                maxBarThickness: 48,
            }],
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: getComputedStyle(document.documentElement).getPropertyValue("--gridline") } },
                x: { grid: { display: false } },
            },
        },
    });

    const figuresRow = document.getElementById("figures-row");
    figuresRow.innerHTML = "";
    data.figures.forEach((filename) => {
        figuresRow.innerHTML += `
            <div class="col-md-6">
                <img src="/dataset-figures/${filename}" alt="${filename}">
            </div>`;
    });
}

loadDatasetStats();
