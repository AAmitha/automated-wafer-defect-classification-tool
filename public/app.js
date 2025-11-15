const canvas = document.getElementById('waferCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('waferImage');
const asciiInput = document.getElementById('asciiMap');
const simulateBtn = document.getElementById('simulateBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const debugLog = document.getElementById('debugLog');
const resultCard = document.getElementById('resultCard');
const predictionEl = document.getElementById('prediction');
const confidenceEl = document.getElementById('confidence');
const explanationEl = document.getElementById('explanation');

let currentImageBase64 = '';

const log = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  debugLog.textContent = `[${timestamp}] ${message}\n` + debugLog.textContent;
};

const drawWafer = (defects = []) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const radius = canvas.width / 2 - 10;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

  defects.forEach(({ x, y, size, color }) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });
};

drawWafer();

const randomDefects = () => {
  const count = Math.floor(Math.random() * 6) + 3;
  const defects = Array.from({ length: count }).map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 12 + 4,
    color: ['#f97316', '#22d3ee', '#fb7185'][Math.floor(Math.random() * 3)]
  }));
  drawWafer(defects);
  asciiInput.value = defects
    .map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`)
    .join('\n');
  analyzeBtn.disabled = false;
  statusEl.textContent = 'Simulation ready for inference.';
  log('Simulated wafer map with random anomalies.');
};

simulateBtn.addEventListener('click', randomDefects);

resetBtn.addEventListener('click', () => {
  fileInput.value = '';
  asciiInput.value = '';
  currentImageBase64 = '';
  drawWafer();
  analyzeBtn.disabled = true;
  statusEl.textContent = 'Waiting for input...';
  resultCard.classList.add('hidden');
  debugLog.textContent = '';
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    currentImageBase64 = reader.result;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = reader.result;
    analyzeBtn.disabled = false;
    statusEl.textContent = 'Image ready for inference.';
    log(`Loaded image ${file.name} (${Math.round(file.size / 1024)} kB).`);
  };
  reader.readAsDataURL(file);
});

asciiInput.addEventListener('input', () => {
  analyzeBtn.disabled = !(asciiInput.value.trim() || currentImageBase64);
});

const parseGeminiResult = (text = '') => {
  const firstLine = text.split('\n')[0];
  const prediction = firstLine.match(/(Scratch|Contamination|Missing Pattern|Uniform)/i)?.[0] || 'Unknown';
  const confidence = text.match(/(\d{1,3})%/);
  return {
    prediction,
    confidence: confidence ? `${confidence[1]}% confidence (approximation).` : 'Confidence not provided.',
    explanation: text
  };
};

const analyze = async () => {
  statusEl.textContent = 'Calling Gemini...';
  analyzeBtn.disabled = true;
  log('Sending payload to /api/classify');

  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: currentImageBase64,
        asciiMap: asciiInput.value.trim() || null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gemini classification failed');
    }

    const parsed = parseGeminiResult(data.result);
    predictionEl.textContent = parsed.prediction;
    confidenceEl.textContent = parsed.confidence;
    explanationEl.textContent = parsed.explanation;
    resultCard.classList.remove('hidden');
    statusEl.textContent = 'Classification complete.';
    log('Gemini response received.');
  } catch (error) {
    statusEl.textContent = 'Classification failed.';
    log(error.message);
    alert(error.message);
  } finally {
    analyzeBtn.disabled = !(asciiInput.value.trim() || currentImageBase64);
  }
};

analyzeBtn.addEventListener('click', analyze);

