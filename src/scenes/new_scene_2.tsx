import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {whiteRadialRect} from '../components/backgrounds/white_1';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
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
  const textareaRef = createRef<Rect>();

  // Background
  const bg = whiteRadialRect();
  bg.opacity(0);
  view.add(bg);
  // Lock % -> px early so later width()/height() tweens are number->number.
  // (Tweening directly from '100%' to a number is a no-op.)
  bg.width(view.width());
  bg.height(view.height());
  bg.clip(true);

  const bgDark = blackRadialRect();
  bgDark.opacity(0);
  view.add(bgDark);
  bgDark.zIndex(-2);

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

  // Textarea
  view.add(
    <Rect
      ref={textareaRef}
      layout
      direction={"column"}
      justifyContent={"space-between"}
      padding={32}
      height={250}
      lineWidth={2}
      stroke={'rgba(0, 0, 0, 0.5)'}
      fill={'rgba(0, 0, 0, 0.75)'}
      scale={1.2}
      radius={16}
      opacity={0}
    >
      <Txt
        text="A neighbourhood bakery in Lisbon that takes pre-orders..."
        fontSize="32"
        alignSelf={"flex-end"}
        fill={'rgba(255, 255, 255, 0.4)'}
      />
      <Rect
        layout
        direction={"row"}
        justifyContent={"space-between"}
        alignItems="end"
      >
        <Txt 
          text="Business, portfolio, clinic, blog: anything works."
          fontSize="20"
          fill={'rgba(255, 255, 255, 0.75)'}
        />
        <Rect
          fill={purpleGradient}
          padding={[16, 32]}
          radius={16}
        >
          <Txt
            text="Continue"
            fontSize="24"
            fontWeight="600"
            fill={'rgba(255, 255, 255, 1)'}
          />
        </Rect>
      </Rect>
    </Rect>
  )

  // =============
  // Timeline
  // =============
  yield* fadeTransition(0.15);
  
  // Fadein Logo
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
  // Fadeout Logo
  yield* waitFor(HOLD_DURATION);
  yield* mevinProgress(0, 0.5);
  yield* logoBoxRef().x(0, 0.5);
  yield* logoRef().scale(0, 0.5);
  yield* all(
    logoBoxRef().width(0, 0.75),
    logoBoxRef().height(0, 0.75),
    logoBoxRef().radius(0, 0.5),
  );
  yield* all(
    bgDark.opacity(1, 0.5),
    bg.width(1050, 0.5),
    bg.height(300, 0.5),
    // bg is a Layout (no radius prop) — round its inner Rects instead
    ...(bg.children() as Rect[]).map(child => child.radius(24, 0.5)),
    // bg.fill('#0a0a0a')
  )
  yield* all (
    bg.opacity(0, 0.5),
    textareaRef().opacity(1, 0.5),
  )
})
