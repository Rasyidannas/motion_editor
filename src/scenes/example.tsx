import { makeScene2D } from '@motion-canvas/2d';
import { Txt } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';

export default makeScene2D(function* (view) {
  const fullText = "Hello World! Welcome to Motion Canvas typing animation.";
  
  // Create a signal to track how many characters to render
  const progress = createSignal(0);
  
  const textRef = createRef<Txt>();

  // Add the text element to the scene
  view.add(
    <Txt
      ref={textRef}
      // Compute substring dynamically based on current progress signal value
      text={() => fullText.slice(0, Math.floor(progress()))}
      fontSize={48}
      fill={'#ffffff'}
      fontFamily={'Consolas, monospace'}
    />
  );

  // Animate progress from 0 to full string length over 2.5 seconds
  yield* progress(fullText.length, 2.5);

  // Pause at the end for 1 second
  yield* waitFor(1);
});
