import {Gradient, Img, Layout, Rect} from '@motion-canvas/2d';

// ---------------------------------------------------------------------------
// White background with a rainbow glow band across the top edge + film grain.
//
// Ports this CSS (1080p stage = 1920x1080, top edge y = -540):
//   background-color: #fff;
//   background-image:
//     <noise SVG (feTurbulence fractalNoise, baseFrequency 0.65)>,
//     radial-gradient(circle at 0% 0%,   hsla(256,82%,77%,0.35) 3.12%, transparent 40%),
//     radial-gradient(circle at 20% 0%,  hsla(197,77%,74%,0.35) 3.12%, transparent 40%),
//     radial-gradient(circle at 40% 0%,  hsla(147,77%,74%,0.35) 3.12%, transparent 40%),
//     radial-gradient(circle at 60% 0%,  hsla(88,77%,74%,0.35)  3.12%, transparent 40%),
//     radial-gradient(circle at 80% 0%,  hsla(23,77%,74%,0.35)  3.12%, transparent 40%),
//     radial-gradient(circle at 100% 0%, hsla(234,100%,50%,0.35) 3%,  transparent 40%);
//   background-blend-mode: overlay, normal x6;
//
// Notes:
// - Each radial blob becomes a square Rect centered on the top edge with a
//   radial Gradient fill (solid -> transparent). Stacked with normal blending
//   this matches the CSS `normal` layers.
// - The noise SVG becomes an Img with `overlay` compositeOperation + disabled
//   smoothing so the grain stays crisp when stretched to full screen.
// ---------------------------------------------------------------------------

// Film-grain tile (decoded from the CSS data-URL, re-encoded at runtime).
const NOISE_SVG = `<svg viewBox='0 0 962 962' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#noiseFilter)'/></svg>`;
const NOISE_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}`;

// Blob centers: 0/20/40/60/80/100% of 1920px width, pinned to the top edge.
const TOP_Y = -540;
const BLOB_RADIUS = 700;
const BLOBS: {x: number; color: string}[] = [
  {x: -960, color: 'rgba(174, 148, 244, 0.35)'}, // hsla(256, 82%, 77%, 0.35)
  {x: -576, color: 'rgba(138, 211, 240, 0.35)'}, // hsla(197, 77%, 74%, 0.35)
  {x: -192, color: 'rgba(138, 240, 184, 0.35)'}, // hsla(147, 77%, 74%, 0.35)
  {x: 192, color: 'rgba(192, 240, 138, 0.35)'}, // hsla(88, 77%, 74%, 0.35)
  {x: 576, color: 'rgba(240, 177, 138, 0.35)'}, // hsla(23, 77%, 74%, 0.35)
  {x: 960, color: 'rgba(0, 25, 255, 0.35)'}, // hsla(234, 100%, 50%, 0.35)
];

export function whiteRainbowTopRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      // Base: solid white.
      new Rect({
        width: '100%',
        height: '100%',
        fill: '#ffffff',
      }),
      // Rainbow band: one radial blob per CSS gradient stop list.
      // CSS holds the solid color until ~3% then fades to transparent at 40%,
      // i.e. solid until 3/40 = 0.075 of the gradient radius.
      ...BLOBS.map(
        blob =>
          new Rect({
            width: BLOB_RADIUS * 2,
            height: BLOB_RADIUS * 2,
            x: blob.x,
            y: TOP_Y,
            fill: new Gradient({
              type: 'radial',
              from: [0, 0],
              to: [0, 0],
              fromRadius: 0,
              toRadius: BLOB_RADIUS,
              stops: [
                {offset: 0, color: blob.color},
                {offset: 0.075, color: blob.color},
                {offset: 1, color: 'rgba(255, 255, 255, 0)'},
              ],
            }),
          }),
      ),
      // Film grain on top with `overlay` blending (matches CSS blend mode).
      new Img({
        src: NOISE_SRC,
        width: '100%',
        height: '100%',
        smoothing: false,
        compositeOperation: 'overlay',
      }),
    ],
  });
}
