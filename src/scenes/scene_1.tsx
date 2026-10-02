import { makeScene2D, Gradient } from '@motion-canvas/2d';
import { Txt } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';
import { useScene } from '@motion-canvas/core';
import { purpleGradientRect } from '../components/backgrounds/purple_2';

export default makeScene2D(function* (view) {
  const text = useScene().variables.get('text', 'Create me');

  const progress = createSignal(0);

  const textRef = createRef<Txt>();

  const bg = purpleGradientRect();
  view.add(bg);

  const fontSize = 320;
  const font = 'Inter, system-ui, sans-serif';
  const sliced = () => text().slice(0, Math.floor(progress()));
  
  const verticalGradient = new Gradient({
    type: 'linear',
    from: [0, -5], // Top
    to: [0, 40],    // Bottom
    stops: [
      { offset: 0, color: 'rgba(255, 255, 255, 0.025)' },
      { offset: 1, color: 'rgba(255, 255, 255, 0.055)' },
    ],
  });

  view.add(
    <Txt
      text={sliced}
      fontSize={fontSize}
      fontWeight={700}
      fontFamily={font}
      lineWidth={2}
      fill={verticalGradient}
      stroke={'rgba(255, 255, 255, .075)'}
      x={4}
      y={10}
      shadowColor={'rgba(255, 255, 255, 1)'}
      shadowBlur={25}
      shadowOffsetY={0}
    />
  );

  // 1. Type the text in
  yield* progress(text().length, 2.5);

  yield* waitFor(0.5);
});
