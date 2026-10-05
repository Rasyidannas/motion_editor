import { Gradient, Img, makeScene2D, Path } from '@motion-canvas/2d';
import { Rect, Txt } from '@motion-canvas/2d/lib/components';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import { purpleGradientRect } from '../components/backgrounds/purple_2';
import arrowUp from '../../public/assets/images/arrow_up.svg';
import cursorSvg from '../../public/assets/images/cursor.svg';

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const TYPE_DURATION = 2.5; // typewriter effect duration
const BLINK_HALF_PERIOD = 0.25; // caret on/off time (full blink = x2)
const FADE_DURATION = 0.25; // generic fade in/out duration
const HOLD_DURATION = 0.5; // pauses between animation beats
const TRACE_DURATION = 1.25; // glow-border draw-on duration
const CURSOR_GLIDE_DURATION = 0.3; // mouse cursor slide duration

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------
const FONT_FAMILY = 'Inter, system-ui, sans-serif';
const HEADLINE_FONT_SIZE = 320;
const PLACEHOLDER_FONT_SIZE = 48;
const CARET_GAP = 20; // gap (px) between last glyph and the caret

const INPUT_WIDTH = 960;
const INPUT_HEIGHT = 140;
const INPUT_RADIUS = 16;

export default makeScene2D(function* (view) {
  // --- Scene state ---------------------------------------------------------
  // `text` comes from the scene variables (editable in the editor UI).
  const headline = useScene().variables.get('text', 'Create me');

  // Drives the typewriter effect: visible chars = text[0 .. floor(progress)].
  const progress = createSignal(0);
  const sliced = () => headline().slice(0, Math.floor(progress()));

  // --- Node refs (only the animated nodes need one) -------------------------
  const headlineRef = createRef<Txt>();
  const caretRef = createRef<Rect>();
  const inputRef = createRef<Rect>();
  const placeholderRef = createRef<Txt>();
  const sendButtonRef = createRef<Rect>();
  const traceRef = createRef<Path>();
  const cursorRef = createRef<Img>();

  // --- Shared styles ---------------------------------------------------------
  // Frosted-glass fill used by the headline and the input box.
  const glassGradient = new Gradient({
    type: 'linear',
    from: [0, -5], // top
    to: [0, 40], // bottom
    stops: [
      { offset: 0, color: 'rgba(255, 255, 255, 0.025)' },
      { offset: 1, color: 'rgba(255, 255, 255, 0.055)' },
    ],
  });

  // Purple glow gradient tracing the input border (top -> bottom).
  const traceGradient = new Gradient({
    type: 'linear',
    from: [0, -INPUT_HEIGHT / 2], // top edge
    to: [0, INPUT_HEIGHT / 2], // bottom edge
    stops: [
      { offset: 0, color: '#8b5cf6' },
      { offset: 1, color: '#7c3aed' },
    ],
  });

  // --- Background ------------------------------------------------------------
  view.add(purpleGradientRect());

  // --- Headline + blinking caret ----------------------------------------------
  // The caret tracks the end of the growing text via a reactive `x` binding.
  view.add(
    <Rect opacity={1}>
      <Txt
        ref={headlineRef}
        text={sliced}
        fontSize={HEADLINE_FONT_SIZE}
        fontWeight={700}
        fontFamily={FONT_FAMILY}
        lineWidth={2}
        fill={glassGradient}
        stroke={'rgba(255, 255, 255, .075)'}
        x={4}
        y={10}
        shadowColor={'rgba(255, 255, 255, 1)'}
        shadowBlur={25}
        shadowOffsetY={0}
        opacity={1}
      />
      <Rect
        ref={caretRef}
        width={4}
        height={260}
        fill={'#cba6f7'}
        x={() => headlineRef().x() + headlineRef().width() / 2 + CARET_GAP}
        y={10}
        opacity={1}
      />
    </Rect>,
  );

  // --- Chat input box ----------------------------------------------------------
  // Border-ring trick: the outer rect paints the glass fill, then the inner
  // `destination-out` rect punches a hole through it, leaving only the rim.
  // NOTE: keep the hole as the FIRST child so later siblings (placeholder,
  // button) draw on top instead of being erased by it.
  view.add(
    <Rect
      ref={inputRef}
      x={0}
      y={0}
      width={INPUT_WIDTH}
      height={INPUT_HEIGHT}
      radius={INPUT_RADIUS}
      lineWidth={2}
      fill={glassGradient}
      stroke={'rgba(255, 255, 255, .15)'}
      shadowColor={'rgba(255, 255, 255, 1)'}
      shadowBlur={25}
      shadowOffsetY={0}
      opacity={0} // faded in after the headline types out
      compositeOperation={'source-over'}
    >
      <Rect
        fill={'#ffffff'}
        width={950}
        height={130}
        radius={INPUT_RADIUS}
        compositeOperation={'destination-out'}
      />
      <Txt
        ref={placeholderRef}
        text={'Create me a landing page'}
        fontSize={PLACEHOLDER_FONT_SIZE}
        fontFamily={FONT_FAMILY}
        x={-160}
        y={0}
        fill={'rgba(255, 255, 255, 0.25)'}
      />
      <Rect
        ref={sendButtonRef}
        width={64}
        height={64}
        x={400}
        fill={'rgba(255, 255, 255, 0.075)'}
        radius={8}
      >
        <Img src={arrowUp} width={48} height={48} x={0} y={0} opacity={0.25} />
      </Rect>
    </Rect>,
  );

  // --- Glow trace ---------------------------------------------------------------
  // Rounded-rect path matching the input border exactly; drawn on with `end`.
  // Kept as a view-level sibling (NOT inside the input) so the
  // `destination-out` hole can never erase it.
  view.add(
    <Path
      ref={traceRef}
      data={
        'M -464 -70 H 464 Q 480 -70 480 -54 V 54 Q 480 70 464 70 H -464 Q -480 70 -480 54 V -54 Q -480 -70 -464 -70 Z'
      }
      stroke={traceGradient}
      lineWidth={4}
      end={0} // hidden until the draw-on animation runs
      opacity={0}
      shadowColor={'#8b5cf6'}
      shadowBlur={20}
    />,
  );

  // --- Mouse cursor (starts off-screen right, glides in later) ------------------
  view.add(
    <Img ref={cursorRef} src={cursorSvg} width={48} height={48} x={1200} />,
  );

  // ===========================================================================
  // Timeline
  // ===========================================================================

  // Beat 1: beat of silence before typing starts.
  yield* waitFor(HOLD_DURATION);

  // Beat 2: type the headline while the caret blinks (both run in parallel).
  yield* all(
    progress(headline().length, TYPE_DURATION),
    loopFor(TYPE_DURATION, function* () {
      yield* caretRef().opacity(0, BLINK_HALF_PERIOD);
      yield* caretRef().opacity(1, BLINK_HALF_PERIOD);
    }),
  );

  // Beat 3: hold the finished headline for a moment.
  yield* waitFor(HOLD_DURATION);

  // Beat 4: fade the headline + caret out together.
  yield* all(
    headlineRef().opacity(0, FADE_DURATION),
    caretRef().opacity(0, FADE_DURATION),
  );

  // Beat 5: fade the input box + glow trace in together...
  yield* all(
    inputRef().opacity(1, FADE_DURATION),
    traceRef().opacity(1, FADE_DURATION),
  );

  // ...then draw the glow border on.
  yield* traceRef().end(1, TRACE_DURATION, easeInOutCubic);

  // Beat 6: glide the cursor in and "press" the send button (shrink + release).
  yield* cursorRef().x(400, CURSOR_GLIDE_DURATION, easeOutCubic);
  yield* all(sendButtonRef().width(58), sendButtonRef().height(58));

  yield* waitFor(HOLD_DURATION);

  yield* all(sendButtonRef().width(64), sendButtonRef().height(64));

  // Beat 7: hold the final frame before the scene ends.
  yield* waitFor(HOLD_DURATION);
});
