import { makeScene2D } from '@motion-canvas/2d';
import { Rect, Txt, Img } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { all, sequence, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { whiteRadialRect } from '../components/backgrounds/white_1';
import astroidSvg from '../../public/assets/images/astroid.svg';

// ----
// Style constants
// ----
const TEXT_BOX_RADIUS = 32;
const MEVIN_FULL_TEXT =
  "I've refined the NOVA landing page with a premium, dark mode aesthetic and structured sections to highlight your core AI features and pricing. Let me know if you'd like to adjust the plan names or add specific feature details!";
const MEVIN_PURPLE_DURATION = 2.0;
const MEVIN_BLACK_DURATION = 3.0;
const MEVIN_CHASE_DELAY = 0.5;

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const userTextBox = createRef<Rect>();
  const innerUserText = createRef<Txt>();
  const astroidIcon = createRef<Img>();
  const onboardingBox = createRef<Rect>();
  const onboardingText = createRef<Txt>();
  const mevinTextBox = createRef<Rect>();
  const mevinTextStack = createRef<Rect>();
  const innerMevinText = createRef<Txt>();
  const innerMevinTextPurple = createRef<Txt>();
  const mevinProgressPurple = createSignal(0);
  const mevinProgressBlack = createSignal(0);

  // --- Background ---
  view.add(whiteRadialRect());

  // --- User text box ---
  view.add(
    <Rect
      ref={userTextBox}
      layout
      x={400}
      y={-340}
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
      />
    </Rect>,
  );

  view.add(
    <Img
      ref={astroidIcon}
      src={astroidSvg}
      width={0}
      height={0}
      x={-800}
      y={-220}
      opacity={0}
    />
  );

  view.add(
    <Rect
      ref={onboardingBox}
      layout
      direction="column"
      alignItems="start"
      x={-200}
      y={180}
      gap={48}
      opacity={0}
    >
      <Txt
        ref={onboardingText}
        text={"Onboarding steps"}
        fill={'rgba(0, 0, 0, 0.5)'}
        fontSize={48}
        opacity={0}
      />

      <Rect
        ref={mevinTextBox}
        layout
        direction="column"
        justifyContent={'start'}
        alignItems={'center'}
        width={1240}
        height={480}
        fill={'#ffffff'}
        radius={[TEXT_BOX_RADIUS, TEXT_BOX_RADIUS, TEXT_BOX_RADIUS, 4]}
        padding={48}
        opacity={0}
        shadowColor={'rgba(0, 0, 0, 0.1)'}
        shadowBlur={16}
        shadowOffsetY={4}
      >
        {/* Relative container (= position: relative), static size =
            card content area (480 - 2*48 padding). Children are absolute
            (= position: absolute), both pinned to the TOP-LEFT corner so
            typing starts at the top and grows downward. No reactive
            size bindings, so layout can't thrash. */}
        <Rect ref={mevinTextStack} width={1144} height={384} layout={false}>
          <Txt
            ref={innerMevinTextPurple}
            text={() =>
              MEVIN_FULL_TEXT.slice(0, Math.floor(mevinProgressPurple()))
            }
            textWrap
            width={1144}
            lineHeight={80}
            textAlign={'left'}
            fill={'#7c3aed'}
            fontSize={56}
            opacity={0}
            offset={[-1, -1]}
            x={-572}
            y={-192}
          />
          <Txt
            ref={innerMevinText}
            text={() =>
              MEVIN_FULL_TEXT.slice(0, Math.floor(mevinProgressBlack()))
            }
            textWrap
            width={1144}
            lineHeight={80}
            textAlign={'left'}
            fill={'rgba(0, 0, 0, 0.75)'}
            fontSize={56}
            opacity={0}
            offset={[-1, -1]}
            x={-572}
            y={-192}
          />
        </Rect>
      </Rect>
    </Rect>
  )

  // --- Timeline ---
  yield* fadeTransition(0.15);
  yield* all(
    userTextBox().y(-360, 0.6),
    userTextBox().opacity(1, 0.5),
    innerUserText().opacity(1, 0.2),
  );
  yield* all(
    astroidIcon().opacity(1, 0.5),
    astroidIcon().height(64, 0.5),
    astroidIcon().width(64, 0.5),
  );
  yield* astroidIcon().rotation(180, 0.5);

  // Beat: onboarding panel fades up (slide + fade together
  // so the motion is visible — children must fade WITH the box,
  // not after, since effective opacity = parent * child)
  yield* waitFor(0.3);
  yield* all(
      onboardingBox().opacity(1, 0.4),
      onboardingBox().y(140, 0.4),
      onboardingText().opacity(1, 0.3),
    );
  yield* all(
    mevinTextBox().opacity(1, 0.5),
    innerMevinTextPurple().opacity(1, 0.4),
    innerMevinText().opacity(1, 0.4),
    // purple types faster (2s) so it runs ahead; black chases slower (3s)
    // after a 0.5s delay — gap widens as they type
    mevinProgressPurple(MEVIN_FULL_TEXT.length, MEVIN_PURPLE_DURATION),
    sequence(
      MEVIN_CHASE_DELAY,
      mevinProgressBlack(MEVIN_FULL_TEXT.length, MEVIN_BLACK_DURATION),
    ),
  );

  yield* waitFor(1);
});
