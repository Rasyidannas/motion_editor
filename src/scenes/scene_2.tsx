import { makeScene2D } from '@motion-canvas/2d';
import { Rect, Txt, Img } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { all, waitFor } from '@motion-canvas/core/lib/flow';
import { createRef } from '@motion-canvas/core/lib/utils';
import { whiteRadialRect } from '../components/backgrounds/white_1';
import astroidSvg from '../../public/assets/images/astroid.svg';

// ----
// Style constants
// ----
const TEXT_BOX_RADIUS = 32;

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const userTextBox = createRef<Rect>();
  const innerUserText = createRef<Txt>();
  const astroidIcon = createRef<Img>();
  const onboardingBox = createRef<Rect>();
  const onboardingText = createRef<Txt>();
  const mevinTextBox = createRef<Rect>();
  const innerMevinText = createRef<Txt>();

  // --- Background ---
  view.add(whiteRadialRect());

  // --- User text box ---
  view.add(
    <Rect
      ref={userTextBox}
      layout
      x={400}
      y={-300}
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
      y={-160}
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
      y={220}
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
        width={1240}
        fill={'#ffffff'}
        radius={[TEXT_BOX_RADIUS, TEXT_BOX_RADIUS, TEXT_BOX_RADIUS, 4]}
        padding={[24, 24]}
        opacity={0}
        shadowColor={'rgba(0, 0, 0, 0.1)'}
        shadowBlur={16}
        shadowOffsetY={4}
      >
<Txt
        ref={innerMevinText}
        text={'I\'ve refined the NOVA landing page with a premium, dark mode aesthetic and structured sections to highlight your core AI features and pricing. Let me know if you\'d like to adjust the plan names or add specific feature details!'}
        textWrap
        fill={'rgba(0, 0, 0, 0.75)'}
        fontSize={56}
        opacity={0}
      />
      </Rect>
    </Rect>
  )

  // --- Timeline ---
  yield* fadeTransition(0.15);
  yield* all(
    userTextBox().y(-320, 0.6),
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
      onboardingBox().y(180, 0.4),
      onboardingText().opacity(1, 0.3),
    );
  yield* all(
    mevinTextBox().opacity(1, 0.5),
    innerMevinText().opacity(1, 0.4),
  );

  yield* waitFor(1);
});
