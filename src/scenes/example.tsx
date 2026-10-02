import { makeScene2D, Rect } from '@motion-canvas/2d';
import { Txt } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';
import { useScene } from '@motion-canvas/core';
import { purpleGradientRect } from '../components/backgrounds/purple_2';

export default makeScene2D(function* (view) {
  const text = useScene().variables.get('text', 'Enter your prompt here');

  const progress = createSignal(0);

  const textRef = createRef<Txt>();

  const bg = purpleGradientRect();
  view.add(bg);

  view.add(
    <Rect
      stroke='#ffffff'
      lineWidth={4}
      padding={24}
      radius={9999}
      width={640}
      layout="true"
    >
      <Txt
        ref={textRef}
        text={() => text().slice(0, Math.floor(progress()))}
        fontSize={48}
        fill={'#ffffff'}
        fontFamily={'Consolas, monospace'}
      />
    </Rect>
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
