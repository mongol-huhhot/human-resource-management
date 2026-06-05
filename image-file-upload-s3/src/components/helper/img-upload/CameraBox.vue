<!-- CameraBox.vue -->
<script setup>
// 写真撮るカメラにボックスを描きて、その枠内を撮影・トリミングするコンポーネント
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

const videoEl = ref(null);
const overlayEl = ref(null);
const streamRef = ref(null);

const capturedDataUrl = ref("");

// クレジットカード比率（ISO/IEC 7810 ID-1）: 85.60 × 53.98 => 約 1.586
const CARD_RATIO = 85.6 / 53.98;

// 表示枠サイズ（画面に合わせて調整）
const frameWidthRatio = 0.82; // 画面幅の82%を枠に使う
const frameHeightRatio = computed(() => frameWidthRatio / CARD_RATIO);

async function startCamera() {
  // 背面カメラ優先（スマホ）
  const constraints = {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  streamRef.value = stream;
  if (videoEl.value) {
    videoEl.value.srcObject = stream;
    await videoEl.value.play();
  }
}

function stopCamera() {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop());
    streamRef.value = null;
  }
}

function drawOverlay() {
  // overlay canvas を video 表示サイズに合わせる
  const video = videoEl.value;
  const canvas = overlayEl.value;
  if (!video || !canvas) return;

  const rect = video.getBoundingClientRect();
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 枠サイズ
  const fw = canvas.width * frameWidthRatio;
  const fh = fw / CARD_RATIO; // 比率固定
  const fx = (canvas.width - fw) / 2;
  const fy = (canvas.height - fh) / 2;

  // 外側を暗く（マスク）
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(fx, fy, fw, fh);
  ctx.restore();

  // 枠線
  ctx.strokeStyle = "rgba(0,255,0,0.95)";
  ctx.lineWidth = 3;
  ctx.strokeRect(fx, fy, fw, fh);

  // 角のガイド（ちょっとカッコよく）
  const corner = Math.min(fw, fh) * 0.08;
  ctx.lineWidth = 5;
  ctx.beginPath();
  // TL
  ctx.moveTo(fx, fy + corner); ctx.lineTo(fx, fy); ctx.lineTo(fx + corner, fy);
  // TR
  ctx.moveTo(fx + fw - corner, fy); ctx.lineTo(fx + fw, fy); ctx.lineTo(fx + fw, fy + corner);
  // BL
  ctx.moveTo(fx, fy + fh - corner); ctx.lineTo(fx, fy + fh); ctx.lineTo(fx + corner, fy + fh);
  // BR
  ctx.moveTo(fx + fw - corner, fy + fh); ctx.lineTo(fx + fw, fy + fh); ctx.lineTo(fx + fw, fy + fh - corner);
  ctx.stroke();

  // 後で切り出しに使うので保存
  lastFrameRect.value = { fx, fy, fw, fh, cw: canvas.width, ch: canvas.height };
}

const lastFrameRect = ref(null);

function onResize() {
  drawOverlay();
}

function captureFrameArea() {
  const video = videoEl.value;
  const r = lastFrameRect.value;
  if (!video || !r) return;

  // video の実ピクセル（カメラ解像度）
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // 表示サイズ(canvas)→実ピクセル(video)へのスケール
  const sx = vw / r.cw;
  const sy = vh / r.ch;

  const cropX = Math.round(r.fx * sx);
  const cropY = Math.round(r.fy * sy);
  const cropW = Math.round(r.fw * sx);
  const cropH = Math.round(r.fh * sy);

  // 切り出し用 canvas
  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  const ctx = out.getContext("2d");

  // 枠内だけ描画（= トリミング）
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  capturedDataUrl.value = out.toDataURL("image/jpeg", 0.92);
}

onMounted(async () => {
  await startCamera();

  // 映像メタデータが揃ってから描画
  videoEl.value.addEventListener("loadedmetadata", drawOverlay);
  window.addEventListener("resize", onResize);

  // 念のため少し遅延して再描画（端末差吸収）
  setTimeout(drawOverlay, 200);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (videoEl.value) videoEl.value.removeEventListener("loadedmetadata", drawOverlay);
  stopCamera();
});
</script>

<template>
  <div class="wrap">
    <div class="cameraBox">
      <video ref="videoEl" class="video" playsinline></video>
      <canvas ref="overlayEl" class="overlay"></canvas>
    </div>

    <div class="buttons">
      <button class="btn" @click="captureFrameArea">枠内を撮影</button>
      <button class="btn sub" @click="drawOverlay">枠を再描画</button>
    </div>

    <div v-if="capturedDataUrl" class="result">
      <h3>撮影結果（枠内トリミング）</h3>
      <img :src="capturedDataUrl" class="preview" />
    </div>
  </div>
</template>

<style scoped>
.wrap { max-width: 720px; margin: 0 auto; padding: 12px; }
.cameraBox { position: relative; width: 100%; aspect-ratio: 3 / 4; background: #000; border-radius: 12px; overflow: hidden; }
.video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.buttons { display: flex; gap: 10px; margin-top: 12px; }
.btn { padding: 10px 14px; border-radius: 10px; border: 0; cursor: pointer; }
.btn.sub { opacity: 0.8; }
.result { margin-top: 16px; }
.preview { width: 100%; border-radius: 12px; border: 1px solid #ddd; }
</style>
