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

// Same purples + direction as the Continue button (purpleGradient),
// but spanning the textarea height (±125 local units) so the full
// blend shows across the border instead of clamping to flat halves.
const textareaTraceGradient = new Gradient({
  type: 'linear',
  from: [0, 125],
  to:   [0, -125],
  stops: [
    {offset: 0, color: '#8b5cf6'},
    {offset: 1, color: '#7C3AED'},
  ],
});

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats
const TEXTAREA_RADIUS = 16; // must match textareaRef radius
const TRACE_WINDOW = 0.14; // visible segment length (fraction of perimeter)
const TRACE_DURATION = 1.6; // single walking lap around the textarea border

// Rounded-rectangle SVG path centered at the origin (same pattern as scene_2).
const roundedRectData = (hw: number, hh: number, r: number) =>
  `M ${-hw + r} ${-hh} H ${hw - r} Q ${hw} ${-hh} ${hw} ${-hh + r} ` +
  `V ${hh - r} Q ${hw} ${hh} ${hw - r} ${hh} ` +
  `H ${-hw + r} Q ${-hw} ${hh} ${-hw} ${hh - r} ` +
  `V ${-hh + r} Q ${-hw} ${-hh} ${-hw + r} ${-hh} Z`;

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const blackRect = createRef<Rect>();
  const logoBoxRef = createRef<Rect>();
  const logoRef = createRef<Rect>();
  const mevinRef = createRef<Txt>();
  const mevinProgress = createSignal(0);
  const textareaRef = createRef<Rect>();
  const textareaTrace = createRef<Path>();

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
      fill={'#0a0a0a'}
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

  // --- Walking border trace for the textarea (view-level sibling,
  // NOT inside any layout — same pattern as scene_2) ---
  // Tracks the textarea's live size/position with signals, so the
  // border fits even though the card width is content-driven (auto).
  view.add(
    <Path
      ref={textareaTrace}
      data={() =>
        roundedRectData(
          textareaRef().width() / 2,
          textareaRef().height() / 2,
          TEXTAREA_RADIUS,
        )
      }
      stroke={textareaTraceGradient}
      lineWidth={4}
      start={0}
      end={0}
      opacity={0}
      x={() => textareaRef().x()}
      y={() => textareaRef().y()}
      scale={1.2}
      shadowColor={'#8b5cf6'}
      shadowBlur={20}
    />,
  );

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
    bgDark.opacity(1, 0.5),
  );
  yield* all(
    bg.width(1050, 0.5),
    bg.height(300, 0.5),
    bg.radius(24, 0.5),
  )
  // bg is now a Rect, so radius/fill work on it directly.
  // (Instant set — must run outside all(), which only takes generators.)
  bg.fill('#0a0a0a');
  yield* all (
    bg.opacity(0, 0.5),
    textareaRef().opacity(1, 0.5),
    textareaTrace().opacity(1, 0.5),
  )
  // Glowing segment walks once around the textarea border (same trick as scene_2).
  yield* (function* () {
    textareaTrace().start(0);
    textareaTrace().end(TRACE_WINDOW);
    yield* all(
      textareaTrace().start(1 - TRACE_WINDOW, TRACE_DURATION, easeInOutCubic),
      textareaTrace().end(1, TRACE_DURATION, easeInOutCubic),
    );
  })();
})
