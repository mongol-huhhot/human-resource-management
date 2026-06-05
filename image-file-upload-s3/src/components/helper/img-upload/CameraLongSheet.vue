<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

// refs
const videoRef = ref(null);
const overlayRef = ref(null);
const streamRef = ref(null);

const shots = ref([]);
const mergedUrl = ref(null);

const facingMode = ref("environment"); // "environment" | "user"
const isReady = ref(false);

// 撮影フレーム（レシート想定：縦長）
const frame = ref({
  x: 0.08,
  y: 0.08,
  w: 0.84,
  h: 0.84,
  radius: 18,
});

// overlayはvideo表示サイズに合わせる
function resizeOverlay() {
  const video = videoRef.value;
  const canvas = overlayRef.value;
  if (!video || !canvas) return;

  const rect = video.getBoundingClientRect();
  canvas.width = Math.floor(rect.width);
  canvas.height = Math.floor(rect.height);

  drawOverlay();
}

function drawOverlay() {
  const canvas = overlayRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;

  ctx.clearRect(0, 0, width, height);

  // 暗幕
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, width, height);

  // フレーム領域をくり抜く
  const fx = Math.floor(width * frame.value.x);
  const fy = Math.floor(height * frame.value.y);
  const fw = Math.floor(width * frame.value.w);
  const fh = Math.floor(height * frame.value.h);
  const r = frame.value.radius;

  ctx.globalCompositeOperation = "destination-out";
  roundRect(ctx, fx, fy, fw, fh, r);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  // フレーム枠線
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 3;
  roundRect(ctx, fx, fy, fw, fh, r);
  ctx.stroke();

  // ガイド線（上/中/下）
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx, fy + fh / 3);
  ctx.lineTo(fx + fw, fy + fh / 3);
  ctx.moveTo(fx, fy + (fh * 2) / 3);
  ctx.lineTo(fx + fw, fy + (fh * 2) / 3);
  ctx.stroke();

  // 文言
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "14px sans-serif";
  ctx.fillText("枠内にレシートを合わせてください（分割撮影 → 後で連結）", 12, 22);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

async function startCamera() {
  stopCamera();

  const constraints = {
    video: {
      facingMode: { ideal: facingMode.value },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  streamRef.value = stream;

  if (!videoRef.value) return;
  videoRef.value.srcObject = stream;
  await videoRef.value.play();

  isReady.value = true;

  requestAnimationFrame(() => {
    resizeOverlay();
  });
}

function stopCamera() {
  isReady.value = false;

  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.srcObject = null;
  }

  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop());
    streamRef.value = null;
  }
}

function switchCamera() {
  facingMode.value = facingMode.value === "environment" ? "user" : "environment";
  startCamera().catch(console.error);
}

// 枠の中だけを切り出して1枚保存
async function captureFrame() {
  const video = videoRef.value;
  const overlay = overlayRef.value;
  if (!video || !overlay) return;

  const dispW = overlay.width;
  const dispH = overlay.height;

  const fxDisp = dispW * frame.value.x;
  const fyDisp = dispH * frame.value.y;
  const fwDisp = dispW * frame.value.w;
  const fhDisp = dispH * frame.value.h;

  // video実ピクセル
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // object-fit: cover 前提で逆変換
  const scale = Math.max(dispW / vw, dispH / vh);
  const drawnW = vw * scale;
  const drawnH = vh * scale;
  const offsetX = (dispW - drawnW) / 2;
  const offsetY = (dispH - drawnH) / 2;

  const sx = (fxDisp - offsetX) / scale;
  const sy = (fyDisp - offsetY) / scale;
  const sw = fwDisp / scale;
  const sh = fhDisp / scale;

  const outW = Math.floor(sw);
  const outH = Math.floor(sh);

  const c = document.createElement("canvas");
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);

  const blob = await new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
  if (!blob) return;

  const url = URL.createObjectURL(blob);
  shots.value.push({ blob, url, w: outW, h: outH });
}

// 撮った複数枚を縦に連結して1枚PNGにする
async function mergeVertical() {
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value);
    mergedUrl.value = null;
  }
  if (shots.value.length === 0) return;

  const targetW = Math.min(...shots.value.map((s) => s.w));

  const bitmaps = await Promise.all(shots.value.map((s) => createImageBitmap(s.blob)));

  const scaledHeights = bitmaps.map((bmp) => Math.floor((bmp.height * targetW) / bmp.width));
  const totalH = scaledHeights.reduce((a, b) => a + b, 0);

  const c = document.createElement("canvas");
  c.width = targetW;
  c.height = totalH;

  const ctx = c.getContext("2d");
  if (!ctx) return;

  let y = 0;
  for (let i = 0; i < bitmaps.length; i++) {
    const bmp = bitmaps[i];
    const h = scaledHeights[i];
    ctx.drawImage(bmp, 0, 0, bmp.width, bmp.height, 0, y, targetW, h);
    y += h;
    bmp.close?.(); // ✅ optional call (correct form)
  }

  const blob = await new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
  if (!blob) return;

  mergedUrl.value = URL.createObjectURL(blob);
}

function clearShots() {
  shots.value.forEach((s) => URL.revokeObjectURL(s.url));
  shots.value = [];
  if (mergedUrl.value) {
    URL.revokeObjectURL(mergedUrl.value);
    mergedUrl.value = null;
  }
}

function removeShot(idx) {
  const s = shots.value[idx];
  if (!s) return;
  URL.revokeObjectURL(s.url);
  shots.value.splice(idx, 1);
}

const canMerge = computed(() => shots.value.length >= 2);

onMounted(() => {
  window.addEventListener("resize", resizeOverlay);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeOverlay);
  stopCamera();
  clearShots();
});
</script>

<template>
  <div style="max-width: 980px; margin: 0 auto; padding: 12px;">
    <h2 style="margin: 8px 0 12px;">Long Receipt Camera (Vue3)</h2>

    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
      <button @click="startCamera" style="padding: 8px 12px;">Start</button>
      <button @click="stopCamera" style="padding: 8px 12px;">Stop</button>
      <button @click="switchCamera" style="padding: 8px 12px;">Switch Camera</button>

      <button :disabled="!isReady" @click="captureFrame" style="padding: 8px 12px;">
        Capture (frame only)
      </button>

      <button :disabled="!canMerge" @click="mergeVertical" style="padding: 8px 12px;">
        Merge vertically
      </button>

      <button :disabled="shots.length === 0" @click="clearShots" style="padding: 8px 12px;">
        Clear
      </button>
    </div>

    <div style="margin-top: 12px; position: relative; width: 100%; aspect-ratio: 3 / 4; background: #111; border-radius: 14px; overflow: hidden;">
      <video
        ref="videoRef"
        playsinline
        muted
        style="width: 100%; height: 100%; object-fit: cover; display: block;"
      />
      <canvas
        ref="overlayRef"
        style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;"
      />
    </div>

    <p style="margin: 10px 0 0; color: #555;">
      コツ：1枚目はレシート上部、2枚目は<strong>1枚目の下端が少し写るように</strong>、3枚目も同様に…（重なりがあると連結後に見やすい）
    </p>

    <h3 style="margin-top: 18px;">Shots</h3>
    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
      <div v-for="(s, i) in shots" :key="s.url" style="width: 180px;">
        <img :src="s.url" style="width: 100%; border-radius: 10px; border: 1px solid #ddd;" />
        <div style="display: flex; justify-content: space-between; margin-top: 6px;">
          <small>{{ i + 1 }} ({{ s.w }}×{{ s.h }})</small>
          <button @click="removeShot(i)" style="padding: 2px 8px;">X</button>
        </div>
      </div>
    </div>

    <div v-if="mergedUrl" style="margin-top: 18px;">
      <h3>Merged (PNG)</h3>
      <img :src="mergedUrl" style="width: 100%; border-radius: 12px; border: 1px solid #ddd;" />
      <p style="color:#555; margin-top: 8px;">
        右クリック保存 or モバイルなら長押し保存（必要なら「ダウンロード」ボタンも追加できます）
      </p>
    </div>
  </div>
</template>
