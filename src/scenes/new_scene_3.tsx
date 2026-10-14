import { Gradient, makeScene2D } from '@motion-canvas/2d';
import { Txt, Rect, Img } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
import logo from '../../public/assets/images/Logo.png';
import cursorSvg from '../../public/assets/images/new_cursor.svg';

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------
const purpleGradient = new Gradient({
  from: [0, 100],
  to:   [0, -100],
  stops: [
    {offset: 0, color: '#8b5cf6'},
    {offset: 1, color: '#7C3AED'},
  ],
});

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const btnMevin = createRef<Rect>();

  const bgDark = blackRadialRect();
  bgDark.opacity(1);
  view.add(bgDark);
  bgDark.zIndex(-2);

  view.add(
    <Rect
      layout
      alignItems={"center"}
      justifyContent={"center"}
      fill={purpleGradient}
      width={96}
      height={96}
      radius={999}
      x={860}
      y={460}
    >
      <Img
        src={logo}
        width={40}
        height={40}
      />
    </Rect>
  );

  // =============
  // Timeline
  // =============
  yield* fadeTransition(0.15);
  yield* waitFor(1);
})
