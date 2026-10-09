import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {whiteRadialRect} from '../components/backgrounds/white_1';
import logo from '../../public/assets/images/Logo.png';

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
  const blackRect = createRef<Rect>();
  const logoBoxRef = createRef<Rect>();
  const logoRef = createRef<Rect>();
  const mevinRef = createRef<Txt>();
  const mevinProgress = createSignal(0);

  // Background
  const bg = whiteRadialRect();
  bg.opacity(0);
  view.add(bg);

  // Black background
  view.add(
    <Rect
      ref={logoBoxRef}
      fill={'#000000'}
      width={'100%'}
      height={'100%'}
    >
      <Img
        ref={logoRef}
        src={logo}
        width={96}
        height={96}
        scale={0}
      />
    </Rect>
  )

  view.add(
  <Rect
    layout
    width={450}              // wide enough for full 'Mevin' at 148px bold (~380px) + margin
    justifyContent="start"   // pins the Txt's left edge → true left-to-right typing
    x={160}                  // center of the text block (tunable)
  >
    <Txt
      ref={mevinRef}
      text={() => 'Mevin'.slice(0, Math.floor(mevinProgress()))}
      fontSize={148}
      fontWeight={700}
      opacity={0}
    />
  </Rect>
  )

  // =============
  // Timeline
  // =============
  yield* fadeTransition(0.15);
  yield* logoRef().scale(1, 0.5);
  yield* all (
    bg.opacity(1, 0.1),
    logoBoxRef().width(164, 0.75),
    logoBoxRef().height(164, 0.75),
    logoBoxRef().radius(24, 0.5),
  );

  yield* logoBoxRef().fill(purpleGradient, 0.75)
  yield* logoBoxRef().x(-196, 0.5);
  yield* mevinRef().opacity(1, 0.3);
  yield* mevinProgress('Mevin'.length, 1.0);
  yield* waitFor(HOLD_DURATION);
})
