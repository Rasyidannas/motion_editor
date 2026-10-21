import { Gradient, Node, Rect, blur } from '@motion-canvas/2d';

// ---------------------------------------------------------------------------
// Dark top-glow background.
//
// Ports this CSS (1080p stage = 1920x1080):
//   bg-neutral-950
//   bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]
//
// - Base: neutral-950 -> #0a0a0a.
// - Glow: ellipse 80% wide (rx = 768) x 80% tall (ry = 432),
//   centered at 50% x / -20% y -> (0, -756) in stage coords
//   (top edge is y = -540, minus 20% of 1080).
// - The circular radial gradient is stretched into the ellipse with
//   scale (matches the CSS ellipse), then blurred so the falloff
//   stays smooth with no banding.
// ---------------------------------------------------------------------------

const GLOW_RX = 768; // 80% of 1920 / 2
const GLOW_RY = 432; // 80% of 1080 / 2
const FOCUS_X = 0; // 50% of the stage width
const FOCUS_Y = -756; // -20% down from the top edge (-540 - 216)
const OVAL_Y = GLOW_RY / GLOW_RX; // ≈ 0.5625

export function blackRadialRect() {
  return new Node({
    children: [
      // Base: neutral-950.
      new Rect({
        width: 1920,
        height: 1080,
        fill: '#000000',
      }),
      // Top glow: lavender core fading to transparent.
      new Rect({
        width: GLOW_RX * 2,
        height: GLOW_RX * 2,
        x: FOCUS_X,
        y: FOCUS_Y,
        scale: [1, OVAL_Y],
        filters: [blur(40)],
        fill: new Gradient({
          type: 'radial',
          from: [0, 0],
          to: [0, 0],
          fromRadius: 0,
          toRadius: GLOW_RX,
          stops: [
            { offset: 0.0, color: 'rgba(102, 51, 238, 0.3)' },
            { offset: 0.4, color: 'rgba(102, 51, 238, 0.18)' },
            { offset: 0.7, color: 'rgba(102, 51, 238, 0.07)' },
            { offset: 1.0, color: 'rgba(102, 51, 238, 0)' },
          ],
        }),
      }),
    ],
  });
}
