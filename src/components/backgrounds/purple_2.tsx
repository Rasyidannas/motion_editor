import { Gradient, Grid, Layout, Rect } from '@motion-canvas/2d';

export function purpleGradientRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      new Rect({
        width: '100%',
        height: '100%',
        fill: new Gradient({
          type: 'linear',
          from: [0, -540],
          to: [0, 540],
          stops: [
            { offset: 0.0, color: '#000000' },
            { offset: 0.2, color: '#05080f' },
            { offset: 0.4, color: '#2e1065' },
            { offset: 0.7, color: '#7c3aed' },
            { offset: 1.0, color: '#a78bfa' },
          ],
        }),
      }),
      new Grid({
        width: '100%',
        height: '100%',
        stroke: 'rgba(255, 255, 255, 0.1)',
        lineWidth: 1,
        spacing: [60, 60],
        opacity: 0.2,
      }),
      new Grid({
        width: '100%',
        height: '100%',
        stroke: 'rgba(255, 255, 255, 0.1)',
        lineWidth: 1,
        spacing: [40, 40],
        rotation: 45,
        opacity: 0.1,
      }),
    ],
  });
}
