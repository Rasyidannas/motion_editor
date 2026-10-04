import { makeScene2D } from '@motion-canvas/2d';
import { Rect, Txt } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { all, waitFor } from '@motion-canvas/core/lib/flow';
import { createRef } from '@motion-canvas/core/lib/utils';
import { whiteRadialRect } from '../components/backgrounds/white_1';

// ----
// Style constants
// ----
const TEXT_BOX_RADIUS = 32;

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const userTextBox = createRef<Rect>();
  const innerUserText = createRef<Txt>();

  // --- Background ---
  view.add(whiteRadialRect());

  // --- User text box ---
  view.add(
    <Rect
      ref={userTextBox}
      layout
      x={400}
      y={-200}
      direction="row"
      alignItems="center"
      justifyContent="center"
      fill={'#ffffff'}
      radius={[TEXT_BOX_RADIUS, TEXT_BOX_RADIUS, 4, TEXT_BOX_RADIUS]}
      padding={32}
      opacity={0}
      shadowColor={'rgba(0, 0, 0, 0.15)'}
      shadowBlur={24}
      shadowOffsetY={8}
    >
      <Txt
        ref={innerUserText}
        text={'Create me a landing page'}
        fill={'rgba(0, 0, 0, 0.75)'}
        fontSize={56}
        opacity={0}
        offset={[0, 20]}
      />
    </Rect>,
  );

  // --- Timeline ---
  yield* fadeTransition(0.15);
  yield* all(
    userTextBox().y(-220, 0.6),
    userTextBox().opacity(1, 0.5),
  );
  yield* all(
    innerUserText().offset([0, 0], 0.5),
    innerUserText().opacity(1, 0.2),
  );
  yield* waitFor(1);
});
