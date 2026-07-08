const REQUIRED_ROW_FIELDS = ["brand", "tier", "model", "priceBand", "power", "region"];

const brandFilter = document.getElementById("brandFilter");
const tierFilter = document.getElementById("tierFilter");
const powerFilter = document.getElementById("powerFilter");
const tableBody = document.getElementById("modelTableBody");
const exportBtn = document.getElementById("exportCsvBtn");
const matrixMeta = document.getElementById("matrixMeta");
const matrixJsonInput = document.getElementById("matrixJsonInput");
const resetMatrixDataBtn = document.getElementById("resetMatrixDataBtn");
const matrixValidation = document.getElementById("matrixValidation");

let matrixRows = [];
let defaultPayload = null;

function showValidation(kind, lines) {
  if (!matrixValidation) {
    return;
  }
  matrixValidation.className = `validation-box ${kind}`;
  matrixValidation.innerHTML = "";

  if (!lines || !lines.length) {
    matrixValidation.style.display = "none";
    return;
  }

  matrixValidation.style.display = "block";
  const ul = document.createElement("ul");
  lines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  });
  matrixValidation.appendChild(ul);
}

function validateMatrixPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    errors.push("JSON 根对象无效，必须是 object。");
    return { valid: false, errors };
  }

  if (!payload.version || typeof payload.version !== "string") {
    errors.push("缺少 version 字段，或类型不是 string。");
  }

  if (!payload.updatedAt || typeof payload.updatedAt !== "string") {
    errors.push("缺少 updatedAt 字段，或类型不是 string。");
  }

  if (!Array.isArray(payload.rows)) {
    errors.push("缺少 rows 字段，或 rows 不是数组。");
    return { valid: false, errors };
  }

  payload.rows.forEach((row, index) => {
    if (!row || typeof row !== "object") {
      errors.push(`rows[${index}] 不是 object。`);
      return;
    }

    REQUIRED_ROW_FIELDS.forEach((field) => {
      if (!(field in row)) {
        errors.push(`rows[${index}] 缺少字段: ${field}`);
      } else if (typeof row[field] !== "string" || row[field].trim() === "") {
        errors.push(`rows[${index}].${field} 必须为非空 string`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

function getFilteredRows() {
  const b = brandFilter.value;
  const t = tierFilter.value;
  const p = powerFilter.value;

  return matrixRows.filter((row) => {
    const brandOk = b === "ALL" || row.brand === b;
    const tierOk = t === "ALL" || row.tier === t;
    const powerOk = p === "ALL" || row.power === p;
    return brandOk && tierOk && powerOk;
  });
}

function renderRows() {
  const rows = getFilteredRows();
  tableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6">无匹配结果，请调整筛选条件。</td>';
    tableBody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.brand}</td>
      <td>${row.tier}</td>
      <td>${row.model}</td>
      <td>${row.priceBand}</td>
      <td>${row.power}</td>
      <td>${row.region}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function toCsv(rows) {
  const header = ["brand", "tier", "model", "price_band", "power", "region"];
  const body = rows.map((row) => [
    row.brand,
    row.tier,
    row.model,
    row.priceBand,
    row.power,
    row.region
  ]);

  return [header, ...body]
    .map((line) => line.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

function exportCsv() {
  const rows = getFilteredRows();
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "auto_product_matrix_filtered.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function applyPayload(payload, sourceLabel) {
  matrixRows = payload.rows;
  const version = payload.version || "N/A";
  const updatedAt = payload.updatedAt || "N/A";
  if (matrixMeta) {
    matrixMeta.textContent = `数据来源: ${sourceLabel} | 版本: ${version} | 更新日期: ${updatedAt} | 记录数: ${matrixRows.length}`;
  }
  renderRows();
}

async function initDefaultData() {
  try {
    const response = await fetch("./assets/matrix-data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`加载数据失败: ${response.status}`);
    }

    const payload = await response.json();
    const check = validateMatrixPayload(payload);
    if (!check.valid) {
      showValidation("error", ["默认 matrix-data.json 校验失败:", ...check.errors]);
      tableBody.innerHTML = '<tr><td colspan="6">默认数据校验失败，请修复 JSON 字段。</td></tr>';
      return;
    }

    defaultPayload = payload;
    applyPayload(payload, "默认文件");
    showValidation("success", ["默认 matrix-data.json 校验通过。"]);
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="6">数据加载失败，请检查 assets/matrix-data.json 是否可访问。</td></tr>';
    if (matrixMeta) {
      matrixMeta.textContent = "数据状态: 加载失败";
    }
    showValidation("error", ["默认数据加载失败。", error.message]);
    console.error(error);
  }
}

function handleImportFile(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      const check = validateMatrixPayload(payload);

      if (!check.valid) {
        showValidation("error", ["导入失败，发现以下字段问题:", ...check.errors]);
        return;
      }

      applyPayload(payload, `导入文件 ${file.name}`);
      showValidation("success", ["导入成功，JSON 字段校验通过。"]);
    } catch (error) {
      showValidation("error", ["导入失败：JSON 解析错误。", error.message]);
    }
  };

  reader.onerror = () => {
    showValidation("error", ["导入失败：文件读取错误。"]);
  };

  reader.readAsText(file, "utf-8");
}

matrixJsonInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }
  handleImportFile(file);
});

resetMatrixDataBtn.addEventListener("click", () => {
  if (!defaultPayload) {
    showValidation("error", ["默认数据尚未加载，无法恢复。"]);
    return;
  }
  applyPayload(defaultPayload, "默认文件");
  showValidation("success", ["已恢复默认 matrix-data.json 数据。"]);
  matrixJsonInput.value = "";
});

brandFilter.addEventListener("change", renderRows);
tierFilter.addEventListener("change", renderRows);
powerFilter.addEventListener("change", renderRows);
exportBtn.addEventListener("click", exportCsv);

initDefaultData();
