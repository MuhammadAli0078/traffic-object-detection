const form = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
const dropzoneEmpty = document.getElementById("dropzone-empty");
const dropzoneFilled = document.getElementById("dropzone-filled");
const fileNameEl = document.getElementById("file-name");
const detectBtn = document.getElementById("detect-btn");
const spinner = document.getElementById("spinner");
const btnLabel = document.getElementById("btn-label");
const errorEl = document.getElementById("error");
const resultEmpty = document.getElementById("result-empty");
const resultEl = document.getElementById("result");
const resultImage = document.getElementById("result-image");
const resultVideo = document.getElementById("result-video");
const detectBadges = document.getElementById("detect-badges");

function getColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const CLASS_VARS = {
    Bike: "--class-bike",
    Bus: "--class-bus",
    Car: "--class-car",
    Motobike: "--class-motobike",
    Truck: "--class-truck",
};

function classColor(name) {
    return getColor(CLASS_VARS[name] || "--text-muted");
}

// ---------------- theme toggle ----------------
const themeToggle = document.getElementById("theme-toggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.innerHTML = theme === "dark"
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-stars-fill"></i>';
}

const savedTheme = localStorage.getItem("theme");
applyTheme(savedTheme || (prefersDark.matches ? "dark" : "light"));

themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    applyTheme(next);
    renderChart(lastDatasetStats);
});

// ---------------- dropzone ----------------
fileInput.addEventListener("change", updateDropzoneLabel);

["dragover", "dragenter"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    })
);

["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
    })
);

dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
        fileInput.files = e.dataTransfer.files;
        updateDropzoneLabel();
    }
});

function updateDropzoneLabel() {
    if (fileInput.files.length) {
        fileNameEl.textContent = fileInput.files[0].name;
        dropzoneEmpty.classList.add("d-none");
        dropzoneFilled.classList.remove("d-none");
    } else {
        dropzoneEmpty.classList.remove("d-none");
        dropzoneFilled.classList.add("d-none");
    }
}

// ---------------- detection ----------------
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!fileInput.files.length) {
        errorEl.textContent = "Please choose a file first.";
        errorEl.classList.remove("d-none");
        return;
    }

    setLoading(true);
    try {
        await runDetection(fileInput.files[0], fileInput.files[0].name, "Upload");
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    detectBtn.disabled = isLoading;
    spinner.classList.toggle("d-none", !isLoading);
    btnLabel.classList.toggle("d-none", isLoading);
}

async function runDetection(fileOrBlob, filename, sourceLabel) {
    errorEl.classList.add("d-none");
    resultEl.classList.add("d-none");

    const formData = new FormData();
    formData.append("file", fileOrBlob, filename);

    try {
        const response = await fetch("/api/detect", { method: "POST", body: formData });
        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || "Something went wrong.";
            errorEl.classList.remove("d-none");
            return;
        }

        showResult(data);
        addHistoryEntry(sourceLabel, data);
    } catch (err) {
        errorEl.textContent = "Could not reach the server.";
        errorEl.classList.remove("d-none");
    }
}

function showResult(data) {
    resultEmpty.classList.add("d-none");

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

    renderBadges(detectBadges, data.stats, data.total);
    resultEl.classList.remove("d-none");
}

function renderBadges(container, stats, total) {
    container.innerHTML = "";

    if (!stats.length) {
        container.innerHTML = `<div class="col-auto"><span class="class-badge bg-secondary">No objects detected</span></div>`;
    }

    stats.forEach((row) => {
        container.innerHTML += `
            <div class="col-auto">
                <span class="class-badge" style="background:${classColor(row.name)}">
                    <span class="class-dot"></span>${row.name}: ${row.count}
                </span>
            </div>`;
    });

    container.innerHTML += `
        <div class="col-auto">
            <span class="class-badge bg-dark">Total: ${total}</span>
        </div>`;
}

// ---------------- detection history ----------------
const historyTableBody = document.querySelector("#history-table tbody");
const historyEmptyRow = document.getElementById("history-empty-row");
const historyTotalsEl = document.getElementById("history-totals");
const historyClearBtn = document.getElementById("history-clear");

let history = [];

function addHistoryEntry(sourceLabel, data) {
    history.unshift({ time: new Date(), source: sourceLabel, stats: data.stats, total: data.total });
    renderHistory();
}

function renderHistory() {
    historyTableBody.innerHTML = "";

    if (!history.length) {
        historyTableBody.appendChild(historyEmptyRow);
        historyTotalsEl.innerHTML = "";
        return;
    }

    history.forEach((entry) => {
        const chips = entry.stats.length
            ? entry.stats.map((s) => `<span class="history-chip" style="background:${classColor(s.name)}">${s.name}: ${s.count}</span>`).join("")
            : `<span class="history-chip bg-secondary">None</span>`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="text-muted">${entry.time.toLocaleTimeString()}</td>
            <td>${entry.source}</td>
            <td>${chips}</td>
            <td class="text-end fw-semibold">${entry.total}</td>`;
        historyTableBody.appendChild(tr);
    });

    const grandTotals = {};
    let grandTotal = 0;
    history.forEach((entry) => {
        entry.stats.forEach((s) => {
            grandTotals[s.name] = (grandTotals[s.name] || 0) + s.count;
            grandTotal += s.count;
        });
    });

    historyTotalsEl.innerHTML = `
        <div class="col-auto"><span class="class-badge bg-dark">Detections run: ${history.length}</span></div>
        <div class="col-auto"><span class="class-badge bg-dark">Objects counted: ${grandTotal}</span></div>`;
    Object.entries(grandTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
            historyTotalsEl.innerHTML += `
                <div class="col-auto">
                    <span class="class-badge" style="background:${classColor(name)}">${name}: ${count}</span>
                </div>`;
        });
}

historyClearBtn.addEventListener("click", () => {
    history = [];
    renderHistory();
});

// ---------------- dataset stats ----------------
const SPLIT_COLORS = { train: "--class-bike", valid: "--class-bus", test: "--class-car" };
const SPLIT_ICONS = { train: "bi-collection-play", valid: "bi-check2-circle", test: "bi-flag" };

let lastDatasetStats = null;
let classChart = null;

function renderChart(data) {
    if (!data) return;
    if (classChart) classChart.destroy();

    classChart = new Chart(document.getElementById("class-chart"), {
        type: "bar",
        data: {
            labels: data.classes.map((row) => row.name),
            datasets: [{
                label: "Labels in training set",
                data: data.classes.map((row) => row.count),
                backgroundColor: data.classes.map((row) => classColor(row.name)),
                borderRadius: 6,
                maxBarThickness: 48,
            }],
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: getColor("--gridline") }, ticks: { color: getColor("--text-secondary") } },
                x: { grid: { display: false }, ticks: { color: getColor("--text-secondary") } },
            },
        },
    });
}

const FIGURE_LABELS = {
    "results.png": "Training accuracy & loss curves",
    "confusion_matrix.png": "Confusion matrix",
};

async function loadDatasetStats() {
    const response = await fetch("/api/dataset-stats");
    const data = await response.json();
    lastDatasetStats = data;

    const splitCountsEl = document.getElementById("split-counts");
    splitCountsEl.innerHTML = "";
    for (const [split, count] of Object.entries(data.splits)) {
        splitCountsEl.innerHTML += `
            <div class="col-4">
                <div class="stat-tile" style="background:${getColor(SPLIT_COLORS[split])}">
                    <i class="bi ${SPLIT_ICONS[split]} fs-4"></i>
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">${split} images</div>
                </div>
            </div>`;
    }

    const classTableBody = document.querySelector("#class-table tbody");
    classTableBody.innerHTML = "";
    data.classes.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="class-dot" style="color:${classColor(row.name)}"></span> ${row.name}</td>
            <td class="text-end">${row.count}</td>`;
        classTableBody.appendChild(tr);
    });

    renderChart(data);

    const figuresRow = document.getElementById("figures-row");
    figuresRow.innerHTML = "";
    data.figures.forEach((filename) => {
        figuresRow.innerHTML += `
            <div class="col-md-6">
                <a href="/dataset-figures/${filename}" target="_blank" rel="noopener">
                    <img src="/dataset-figures/${filename}" alt="${filename}">
                </a>
                <figcaption>${FIGURE_LABELS[filename] || filename}</figcaption>
            </div>`;
    });
}

loadDatasetStats();
