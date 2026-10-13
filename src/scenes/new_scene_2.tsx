import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, waitFor } from '@motion-canvas/core/lib/flow';
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
const TRACE_WINDOW = 0.75; // visible fraction; 25% gap walks around
const TRACE_SEGMENTS = 200; // fine subdivisions for perfectly smooth motion
const TRACE_LAPS = 1.5; // slow, visible circuits while the prompt types
const TEXTAREA_TYPED_TEXT = 'Create me a landing page with premium dark theme';
const TEXTAREA_TYPING_DURATION = 2.5; // char-by-char typing speed for the prompt

// Point on a rounded-rect border at parameter t (0–1, clockwise from
// top-left corner start).  Used to build a multi-segment SVG path so
// phase steps are small enough to be invisible under the glow blur.
const roundedRectPoint = (hw: number, hh: number, r: number, t: number) => {
  const segLen = [
    2 * hw - 2 * r,
    Math.PI * r / 2,
    2 * hh - 2 * r,
    Math.PI * r / 2,
    2 * hw - 2 * r,
    Math.PI * r / 2,
    2 * hh - 2 * r,
    Math.PI * r / 2,
  ];
  const total = segLen.reduce((a, b) => a + b, 0);
  const pos = ((t % 1) + 1) % 1 * total;
  let cumul = 0;
  for (let i = 0; i < 8; i++) {
    if (pos < cumul + segLen[i] || i === 7) {
      const f = (pos - cumul) / segLen[i];
      switch (i) {
        case 0: return { x: -hw + r + f * (2 * hw - 2 * r), y: -hh };
        case 1: return { x: hw - r + r * Math.cos(-Math.PI / 2 + f * Math.PI / 2), y: -hh + r + r * Math.sin(-Math.PI / 2 + f * Math.PI / 2) };
        case 2: return { x: hw, y: -hh + r + f * (2 * hh - 2 * r) };
        case 3: return { x: hw - r + r * Math.cos(f * Math.PI / 2), y: hh - r + r * Math.sin(f * Math.PI / 2) };
        case 4: return { x: hw - r - f * (2 * hw - 2 * r), y: hh };
        case 5: return { x: -hw + r + r * Math.cos(Math.PI / 2 + f * Math.PI / 2), y: hh - r + r * Math.sin(Math.PI / 2 + f * Math.PI / 2) };
        case 6: return { x: -hw, y: hh - r - f * (2 * hh - 2 * r) };
        case 7: return { x: -hw + r + r * Math.cos(Math.PI + f * Math.PI / 2), y: -hh + r + r * Math.sin(Math.PI + f * Math.PI / 2) };
      }
    }
    cumul += segLen[i];
  }
  return { x: -hw + r, y: -hh };
};

// `phase` sweeps across the *segment* index (0 … TRACE_SEGMENTS per lap),
// keeping the 75 % window walking at a consistent pace.
const roundedRectData = (hw: number, hh: number, r: number, phase: number) => {
  const n = TRACE_SEGMENTS;
  const idx = ((Math.floor(phase) % n) + n) % n;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = roundedRectPoint(hw, hh, r, (i + idx) / n);
    pts.push(i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`);
  }
  pts.push('Z');
  return pts.join(' ');
};

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const blackRect = createRef<Rect>();
  const logoBoxRef = createRef<Rect>();
  const logoRef = createRef<Rect>();
  const mevinRef = createRef<Txt>();
  const mevinProgress = createSignal(0);
  const textareaRef = createRef<Rect>();
  const textareaTrace = createRef<Path>();
  const textareaPlaceholder = createRef<Txt>();
  const textareaProgress = createSignal(0);
  const tracePhase = createSignal(0);

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
        ref={textareaPlaceholder}
        minWidth={840}
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
          tracePhase(),
        )
      }
      stroke={textareaTraceGradient}
      lineWidth={3}
      start={0}
      end={TRACE_WINDOW}
      opacity={0}
      x={() => textareaRef().x()}
      y={() => textareaRef().y()}
      scale={1.2}
      shadowColor={'#8b5cf6'}
      shadowBlur={45}
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
  // 1.5 slow continuous laps (200 fine segments per lap) while typing.
  // The per-frame segment shift is tiny — perfectly smooth under the glow blur.
  yield* all(
    tracePhase(Math.ceil(TRACE_LAPS * TRACE_SEGMENTS), TEXTAREA_TYPING_DURATION),
    (function* () {
      textareaPlaceholder().text(() =>
        TEXTAREA_TYPED_TEXT.slice(0, Math.floor(textareaProgress())),
      );
      yield* textareaProgress(TEXTAREA_TYPED_TEXT.length, TEXTAREA_TYPING_DURATION);
    })(),
  );
})
