import { Rect, Gradient } from '@motion-canvas/2d';

export function purpleGradientRect() {
  return new Rect({
    width: '100%',
    height: '100%',
    fill: new Gradient({
      type: 'linear',
      from: [0, -540],
      to: [0, 540],
      stops: [
        { offset: 0, color: '#8b5cf6' },
        { offset: 1, color: '#7c3aed' },
      ],
    }),
  });
}
