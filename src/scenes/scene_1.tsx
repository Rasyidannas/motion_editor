import { makeScene2D, Gradient } from '@motion-canvas/2d';
import { Txt } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';
import { useScene } from '@motion-canvas/core';
import { purpleGradientRect } from '../components/backgrounds/purple_2';

export default makeScene2D(function* (view) {
  const text = useScene().variables.get('text', 'Create me a landing page');

  const progress = createSignal(0);

  const textRef = createRef<Txt>();

  const bg = purpleGradientRect();
  view.add(bg);

  const fontSize = 240;
  const font = 'Inter, system-ui, sans-serif';
  const sliced = () => text().slice(0, Math.floor(progress()));

  view.add(
    <Txt
      text={sliced}
      fontSize={fontSize}
      fontWeight={700}
      fontFamily={font}
      lineWidth={2}
      fill={'rgba(255, 255, 255, .05)'}
      stroke={'rgba(255, 255, 255, .25)'}
      x={4}
      y={10}
      innerColor={'rgba(255, 255, 255, 1)'}
      shadowBlur={25}
      shadowOffsetY={0}
    />
  );

  // 1. Type the text in
  yield* progress(text().length, 2.5);

  // 2. Hold the full text
  yield* waitFor(1);

  // 3. Delete the text (backspace effect)
  yield* progress(0, 1.5);

  // 4. Hold the empty screen before finishing
  yield* waitFor(0.5);
});
