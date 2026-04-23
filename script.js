const DATA_URL = "./data/eggs.csv";

const form = document.querySelector("#query-form");
const heightInput = document.querySelector("#height-input");
const weightInput = document.querySelector("#weight-input");
const statusMessage = document.querySelector("#status-message");
const resultCard = document.querySelector("#result-card");
const resultName = document.querySelector("#result-name");
const confidenceBadge = document.querySelector("#confidence-badge");
const submitButton = form.querySelector('button[type="submit"]');
const globalLoading = document.querySelector("#global-loading");

let eggData = [];

init();

async function init() {
  try {
    setStatus("正在加载数据...");
    eggData = await loadEggData();
    setStatus(`数据加载完成，共 ${eggData.length} 条记录。`);
  } catch (error) {
    console.error(error);
    setStatus("数据加载失败，请检查 data/eggs.csv 是否存在且格式正确。", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!eggData.length) {
    setStatus("数据还没有准备好，请稍后再试。", true);
    return;
  }

  const heightMeters = Number.parseFloat(heightInput.value);
  const weightKg = Number.parseFloat(weightInput.value);

  if (!Number.isFinite(heightMeters) || !Number.isFinite(weightKg) || heightMeters <= 0 || weightKg < 0) {
    setStatus("请输入有效的尺寸和重量。", true);
    return;
  }

  setLoadingState(true);
  setStatus("思考中");
  await delay(500);

  const bestMatch = findBestMatch({
    heightMeters,
    weightKg,
  });

  if (!bestMatch) {
    clearResult();
    setStatus("没有找到符合区间和线性拟合条件的结果。", true);
    setLoadingState(false);
    return;
  }

  renderResult(bestMatch, heightMeters, weightKg);
  setStatus("查询完成。");
  setLoadingState(false);
});

async function loadEggData() {
  const response = await fetch(DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to load CSV: ${response.status}`);
  }

  const rawText = await response.text();
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const [, ...rows] = lines;

  return rows.map((row, index) => {
    const [minHeight, maxHeight, minWeight, maxWeight, ...nameParts] = row.split(",");
    const name = nameParts.join(",").trim();
    const parsed = {
      minHeight: Number.parseFloat(minHeight),
      maxHeight: Number.parseFloat(maxHeight),
      minWeight: Number.parseFloat(minWeight),
      maxWeight: Number.parseFloat(maxWeight),
      name,
    };

    if (
      !Number.isFinite(parsed.minHeight) ||
      !Number.isFinite(parsed.maxHeight) ||
      !Number.isFinite(parsed.minWeight) ||
      !Number.isFinite(parsed.maxWeight) ||
      !parsed.name
    ) {
      throw new Error(`Invalid CSV row at line ${index + 2}`);
    }

    return parsed;
  });
}

function findBestMatch(input) {
  const tolerance = 0.3;

  const candidates = eggData
    .map((item) => buildCandidate(item, input, tolerance))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return a.error - b.error;
    });

  return candidates[0] ?? null;
}

function renderResult(result, heightMeters, weightKg) {
  resultCard.hidden = false;
  resultName.textContent = result.name;
  confidenceBadge.textContent = formatConfidence(result);
  confidenceBadge.className = `confidence-badge ${getConfidenceClassName(result)}`;
}

function buildCandidate(item, input, tolerance) {
  const heightInRange = input.heightMeters >= item.minHeight && input.heightMeters <= item.maxHeight;
  const weightInRange = input.weightKg >= item.minWeight && input.weightKg <= item.maxWeight;

  if (!heightInRange || !weightInRange) {
    return null;
  }

  const heightDelta = item.maxHeight - item.minHeight;

  if (heightDelta === 0) {
    return null;
  }

  const slope = (item.maxWeight - item.minWeight) / heightDelta;
  const predictedWeight = item.minWeight + slope * (input.heightMeters - item.minHeight);
  const error = Math.abs(predictedWeight - input.weightKg);

  if (error > tolerance) {
    return null;
  }

  return {
    ...item,
    predictedWeight,
    error,
    score: 1 - error / tolerance,
  };
}

function formatConfidence(result) {
  return `拟合度 ${Math.round(result.score * 100)}%`;
}

function getConfidenceClassName(result) {
  if (result.score >= 0.8) {
    return "is-perfect";
  }

  if (result.score >= 0.5) {
    return "is-partial";
  }

  return "is-nearest";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#a23c16" : "";
}

function clearResult() {
  resultCard.hidden = true;
  resultName.textContent = "";
  confidenceBadge.textContent = "";
  confidenceBadge.className = "confidence-badge";
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = "🔍 开始查询";
  globalLoading.hidden = !isLoading;
  document.body.classList.toggle("is-loading", isLoading);
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
