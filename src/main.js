import { createTimeline } from 'animejs';
import { CircleComponent } from './components/CircleComponent.js';
import { BoxComponent } from './components/BoxComponent.js';
import { RecordManager } from './capturer.js';

const canvas = document.getElementById('canvas-container');
const wrapper = document.getElementById('canvas-wrapper');
const btnPlay = document.getElementById('btn-play');
const btnExport = document.getElementById('btn-export');
const resSelect = document.getElementById('export-resolution');
const fpsSelect = document.getElementById('export-fps');

const circleComp = new CircleComponent();
const boxComp = new BoxComponent();

const masterTimeline = createTimeline({
  autoplay: false,
  onComplete: () => masterTimeline.seek(masterTimeline.duration)
});
masterTimeline.add(...circleComp.getTimelineParams());
masterTimeline.add(...boxComp.getTimelineParams());

function renderScene(ctx, scale = 1) {
  ctx.clearRect(0, 0, 600 * scale, 400 * scale);
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, 600 * scale, 400 * scale);
  circleComp.render(ctx, scale);
  boxComp.render(ctx, scale);
}

let renderId;
function startRenderLoop() {
  const ctx = canvas.getContext('2d');
  function tick() {
    renderScene(ctx);
    renderId = requestAnimationFrame(tick);
  }
  tick();
}

startRenderLoop();
masterTimeline.play();

btnPlay.addEventListener('click', () => {
  masterTimeline.restart();
});

btnExport.addEventListener('click', async () => {
  const [wStr, hStr] = resSelect.value.split('x');
  const outW = parseInt(wStr, 10);
  const outH = parseInt(hStr, 10);
  const fps = parseInt(fpsSelect.value, 10);
  const scaleX = outW / 600;
  const scaleY = outH / 400;
  const scale = Math.min(scaleX, scaleY);

  btnExport.disabled = true;
  btnExport.textContent = 'Exporting...';

  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'absolute', inset: '0', background: '#111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#888', fontSize: '18px', zIndex: '10',
    borderRadius: '8px'
  });
  overlay.textContent = 'Rendering video...';
  wrapper.appendChild(overlay);

  masterTimeline.pause();
  masterTimeline.seek(0);

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = outW;
  exportCanvas.height = outH;

  const recorder = new RecordManager(fps);
  await recorder.start();

  const frameDuration = 1000 / fps;
  const totalDuration = masterTimeline.duration;
  let currentTime = 0;

  while (currentTime <= totalDuration) {
    masterTimeline.seek(currentTime);

    const ctx = exportCanvas.getContext('2d');
    renderScene(ctx, scale);

    await recorder.captureFrame(exportCanvas);
    currentTime += frameDuration;
  }

  await recorder.stopAndSave();

  wrapper.removeChild(overlay);
  btnExport.disabled = false;
  btnExport.textContent = 'Export MP4';
  masterTimeline.restart();
});