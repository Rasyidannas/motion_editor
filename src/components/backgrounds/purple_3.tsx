import {Gradient, Layout, Rect} from '@motion-canvas/2d';

// ---------------------------------------------------------------------------
// Dark radial glow background.
//
// Ports this CSS (1080p stage = 1920x1080):
//   background: radial-gradient(125% 125% at 50% 10%, #000 40%, #63e 100%);
//
// - Focal point at 50% x, 10% y  ->  (0, -432) in stage coords.
// - Black core held until 40% of the radius, then blends out to #6633ee.
// - Radius sized (~1400) so the far corners land on the purple end stop,
//   matching the CSS ellipse reaching past the viewport corners.
// ---------------------------------------------------------------------------

const FOCUS_X = 0; // 50% of the stage width
const FOCUS_Y = -432; // 10% down from the top edge (-540 + 108)
const GLOW_RADIUS = 1400;
// Horizontal stretch: the CSS 125%/125% ellipse is ~1.78x wider than tall
// in pixels (2400 x 1350), so the circular gradient is scaled into an oval.
const OVAL_X = 1.75;

export function purpleDarkGlowRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      // Base: solid black (matches `#000` core).
      new Rect({
        width: '100%',
        height: '100%',
        fill: '#000000',
      }),
      // Glow: black core fading to vivid purple-blue at the edges,
      // stretched into an oval (matches the CSS ellipse).
      new Rect({
        width: GLOW_RADIUS * 2,
        height: GLOW_RADIUS * 2,
        x: FOCUS_X,
        y: FOCUS_Y,
        scale: [OVAL_X, 1],
        fill: new Gradient({
          type: 'radial',
          from: [0, 0],
          to: [0, 0],
          fromRadius: 0,
          toRadius: GLOW_RADIUS,
          stops: [
            {offset: 0, color: '#000000'},
            {offset: 0.4, color: '#000000'},
            {offset: 1, color: '#6633ee'},
          ],
        }),
      }),
    ],
  });
}
