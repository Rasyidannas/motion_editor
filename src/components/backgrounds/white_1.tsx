import { Gradient, Layout, Rect } from '@motion-canvas/2d';

export function whiteRadialRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      // Base: solid white (matches `bg-white`)
      new Rect({
        width: '100%',
        height: '100%',
        fill: '#ffffff',
      }),
      // Soft purple glow centered (matches
      // `radial-gradient(circle at center, #8b5cf6, transparent)`)
      new Rect({
        width: '100%',
        height: '100%',
        fill: new Gradient({
          type: 'radial',
          from: [0, 0],
          to: [0, 0],
          fromRadius: 0,
          toRadius: 700,
          stops: [
            { offset: 0.0, color: 'rgba(139, 92, 246, 0.3)' },   // ← 50% opacity
            { offset: 0.4, color: 'rgba(139, 92, 246, 0.15)' },  // ← extended mid-taper
            { offset: 1.0, color: 'rgba(196, 181, 253, 0)' },
          ],
        }),
      }),
    ],
  });
}
