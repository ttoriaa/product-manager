const canvas = document.getElementById("scoreRadar");
const ctx = canvas.getContext("2d");
const exportPngBtn = document.getElementById("exportPngBtn");
const scoreControls = document.getElementById("scoreControls");
const scoreTableBody = document.getElementById("scoreTableBody");
const scoreConfigMeta = document.getElementById("scoreConfigMeta");
const scoreValidation = document.getElementById("scoreValidation");

let labels = ["产品力", "市场力", "盈利力"];
const maxScore = 10;
let datasets = [];

function showValidation(kind, lines) {
  if (!scoreValidation) {
    return;
  }
  scoreValidation.className = `validation-box ${kind}`;
  scoreValidation.innerHTML = "";

  if (!lines || !lines.length) {
    scoreValidation.style.display = "none";
    return;
  }

  scoreValidation.style.display = "block";
  const ul = document.createElement("ul");
  lines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  });
  scoreValidation.appendChild(ul);
}

function validateScoreConfig(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("配置根对象无效，必须是 object。");
    return { valid: false, errors };
  }

  if (!payload.version || typeof payload.version !== "string") {
    errors.push("缺少 version 字段，或类型不是 string。");
  }

  if (!payload.updatedAt || typeof payload.updatedAt !== "string") {
    errors.push("缺少 updatedAt 字段，或类型不是 string。");
  }

  if (!Array.isArray(payload.labels) || payload.labels.length !== 3) {
    errors.push("labels 必须是长度为 3 的数组。");
  } else {
    payload.labels.forEach((label, idx) => {
      if (typeof label !== "string" || label.trim() === "") {
        errors.push(`labels[${idx}] 必须为非空 string。`);
      }
    });
  }

  if (!Array.isArray(payload.datasets) || payload.datasets.length === 0) {
    errors.push("datasets 必须是非空数组。");
    return { valid: false, errors };
  }

  payload.datasets.forEach((set, index) => {
    if (!set || typeof set !== "object") {
      errors.push(`datasets[${index}] 不是 object。`);
      return;
    }

    if (!set.name || typeof set.name !== "string") {
      errors.push(`datasets[${index}].name 必须为 string。`);
    }

    if (!set.color || typeof set.color !== "string") {
      errors.push(`datasets[${index}].color 必须为 string。`);
    }

    if (!Array.isArray(set.values) || set.values.length !== 3) {
      errors.push(`datasets[${index}].values 必须是长度为 3 的数组。`);
    } else {
      set.values.forEach((v, vi) => {
        if (typeof v !== "number" || Number.isNaN(v)) {
          errors.push(`datasets[${index}].values[${vi}] 必须为 number。`);
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

function angleForIndex(index, total) {
  return (-Math.PI / 2) + (index * 2 * Math.PI) / total;
}

function pointForValue(index, value, cx, cy, radius) {
  const angle = angleForIndex(index, labels.length);
  const ratio = value / maxScore;
  return {
    x: cx + Math.cos(angle) * radius * ratio,
    y: cy + Math.sin(angle) * radius * ratio
  };
}

function drawGrid(cx, cy, radius) {
  for (let step = 1; step <= 5; step += 1) {
    const r = (radius * step) / 5;
    ctx.beginPath();
    labels.forEach((_, i) => {
      const a = angleForIndex(i, labels.length);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.strokeStyle = "#d8d0c4";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawAxes(cx, cy, radius) {
  labels.forEach((label, i) => {
    const a = angleForIndex(i, labels.length);
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#b8aea0";
    ctx.lineWidth = 1;
    ctx.stroke();

    const lx = cx + Math.cos(a) * (radius + 26);
    const ly = cy + Math.sin(a) * (radius + 26);
    ctx.fillStyle = "#162029";
    ctx.font = "700 17px Noto Sans SC";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  });
}

function drawDatasets(cx, cy, radius) {
  datasets.forEach((set) => {
    ctx.beginPath();
    set.values.forEach((value, i) => {
      const p = pointForValue(i, value, cx, cy, radius);
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.closePath();

    ctx.fillStyle = `${set.color}33`;
    ctx.strokeStyle = set.color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    set.values.forEach((value, i) => {
      const p = pointForValue(i, value, cx, cy, radius);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = set.color;
      ctx.fill();
    });
  });
}

function drawLegend() {
  const startX = 30;
  const startY = 26;
  datasets.forEach((set, idx) => {
    const y = startY + idx * 24;
    ctx.fillStyle = set.color;
    ctx.fillRect(startX, y - 10, 16, 10);
    ctx.fillStyle = "#162029";
    ctx.font = "600 13px Space Grotesk";
    ctx.textAlign = "left";
    ctx.fillText(set.name, startX + 24, y);
  });
}

function drawRadar() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 12;
  const radius = Math.min(w, h) * 0.32;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  drawGrid(cx, cy, radius);
  drawAxes(cx, cy, radius);
  drawDatasets(cx, cy, radius);
  drawLegend();
}

function renderScoreTable() {
  scoreTableBody.innerHTML = "";
  datasets.forEach((set) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${set.name}</td>
      <td>${set.values[0].toFixed(1)}</td>
      <td>${set.values[1].toFixed(1)}</td>
      <td>${set.values[2].toFixed(1)}</td>
    `;
    scoreTableBody.appendChild(tr);
  });
}

function createSliderControl(brandIndex, metricIndex) {
  const set = datasets[brandIndex];
  const row = document.createElement("div");
  row.className = "slider-row";

  const label = document.createElement("label");
  label.textContent = `${set.name} - ${labels[metricIndex]}`;

  const valueTag = document.createElement("span");
  valueTag.className = "slider-value";
  valueTag.textContent = set.values[metricIndex].toFixed(1);

  const input = document.createElement("input");
  input.type = "range";
  input.min = "1";
  input.max = "10";
  input.step = "0.1";
  input.value = String(set.values[metricIndex]);

  input.addEventListener("input", () => {
    const nextVal = Number(input.value);
    set.values[metricIndex] = nextVal;
    valueTag.textContent = nextVal.toFixed(1);
    renderScoreTable();
    drawRadar();
  });

  row.appendChild(label);
  row.appendChild(valueTag);
  row.appendChild(input);
  return row;
}

function renderControls() {
  scoreControls.innerHTML = "";
  datasets.forEach((_, brandIndex) => {
    labels.forEach((_, metricIndex) => {
      scoreControls.appendChild(createSliderControl(brandIndex, metricIndex));
    });
  });
}

function exportRadarPng() {
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "auto_competitor_radar.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function initScorePage() {
  try {
    const response = await fetch("./assets/score-config.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`加载评分配置失败: ${response.status}`);
    }

    const payload = await response.json();
    const check = validateScoreConfig(payload);
    if (!check.valid) {
      showValidation("error", ["score-config.json 校验失败:", ...check.errors]);
      return;
    }

    labels = payload.labels;
    datasets = payload.datasets.map((set) => ({
      name: set.name,
      color: set.color,
      values: [...set.values]
    }));

    if (scoreConfigMeta) {
      scoreConfigMeta.textContent = `评分配置版本: ${payload.version} | 更新日期: ${payload.updatedAt} | 品牌数: ${datasets.length}`;
    }

    showValidation("success", ["score-config.json 校验通过。"]);
    renderControls();
    renderScoreTable();
    drawRadar();
  } catch (error) {
    showValidation("error", ["评分配置加载失败。", error.message]);
    console.error(error);
  }
}

exportPngBtn.addEventListener("click", exportRadarPng);

initScorePage();
