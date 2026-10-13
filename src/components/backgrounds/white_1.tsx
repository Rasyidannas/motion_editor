import { Gradient, Rect } from '@motion-canvas/2d';

export function whiteRadialRect() {
  return new Rect({
    width: '100%',
    height: '100%',
    // Single fill flattening the old two layers (solid white base +
    // soft purple glow overlay) via compositing math, so this can be
    // a Rect (which supports fill/radius) instead of a Layout:
    //   rgba(139,92,246,0.3) over #fff = #dccefc
    //   rgba(139,92,246,0.15) over #fff = #eee7fe
    // Matches `radial-gradient(circle at center, #8b5cf6, transparent)`.
    fill: new Gradient({
      type: 'radial',
      from: [0, 0],
      to: [0, 0],
      fromRadius: 0,
      toRadius: 700,
      stops: [
        { offset: 0.0, color: '#dccefc' },
        { offset: 0.4, color: '#eee7fe' },
        { offset: 1.0, color: '#ffffff' },
      ],
    }),
  });
}
