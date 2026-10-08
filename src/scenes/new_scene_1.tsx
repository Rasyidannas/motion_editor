import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect } from '@motion-canvas/2d/lib/components';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {purpleDarkGlowRect} from '../components/backgrounds/purple_3';

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------
const whiteToPurpleGradient = new Gradient({
  from: [0, 100],
  to:   [0, -100],
  stops: [
    {offset: 0, color: '#8b5cf6'},
    {offset: 1, color: '#ffffff'},
  ],
});

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

export default makeScene2D(function* (view) {

  // Const text for typing
  const FIRST_SENTENCES = "Most AI website builders"
  const SECOND_SENTENCES = "build for you ..."
  const THRID_SENTENCES = "until you want to change"
  const FOURTH_SENTENCES = "one small detail"

  // --- Node refs (must live inside the scene function) ---
  const firstSentencesProgress = createSignal(0);
  const firstSentencesRef = createRef<Txt>();
  const secondSentencesRefs = SECOND_SENTENCES.split(' ').map(() => createRef<Txt>());
  const thirdSentencesRefs = THRID_SENTENCES.split(' ').map(() => createRef<Txt>());
  const fourthSentencesRefs = FOURTH_SENTENCES.split(' ').map(() => createRef<Txt>());

  // Background
  view.add(purpleDarkGlowRect());

  view.add(
    <Txt
      ref={firstSentencesRef}
      text={() => FIRST_SENTENCES.slice(0, Math.floor(firstSentencesProgress()))}
      fill={whiteToPurpleGradient}
      fontSize={120}
      fontWeight={600}
    />
  )

  const secondWords = SECOND_SENTENCES.split(' ');
  const x = {
    0: -240,
    1: 0,
    2: 200,
    3: 360
  }

  view.add(
    secondWords.map((word, i) => 
      (<Txt
        ref={secondSentencesRefs[i]}
        text={word}
        fill={whiteToPurpleGradient}
fontSize={120}
        fontWeight={600}
        x={2000} // offset each word
        opacity={0}  // start invisible
      />)
    )
  )

  const thridWords = THRID_SENTENCES.split(' ');
  const xThrid = {
    0: -500,
    1: -250,
    2: 0,
    3: 210,
    4: 480
  }

  view.add(
    thridWords.map((word, i) => (
      <Txt
        ref={thirdSentencesRefs[i]}
        text={word}
        fill={whiteToPurpleGradient}
        fontSize={120}
        fontWeight={600}
        x={xThrid[i]} // offset each word
        y={100}
        opacity={0}  // start invisible
      />
    ))
  )

  const fourthWords = FOURTH_SENTENCES.split(' ');
  const widthFourthWords = {
    0: 100,
    1: 150,
    2: 20,
  }

  view.add([
    <Rect
      layout
      direction="column"
      x={-180}
    >
      <Txt
        ref={fourthSentencesRefs[0]}
        text={fourthWords[0]}
        fill={'#8b5cf6'}
        fontSize={48}
        fontWeight={600}
        fontStyle={'italic'}
        width={0}
        opacity={0}
      />
      <Txt
        ref={fourthSentencesRefs[1]}
        text={fourthWords[1]}
        fill={'#8b5cf6'}
        fontSize={48}
        fontWeight={600}
        fontStyle={'italic'}
        width={0}
        opacity={0}
      />
    </Rect>,
    <Txt
      ref={fourthSentencesRefs[2]}
      text={fourthWords[2]}
      fill={whiteToPurpleGradient}
      fontSize={120}
      fontWeight={600}
      x={60}
      width={0}
      opacity={0}
    />
  ])

  // =============
  // Timeline
  // =============
  yield* waitFor(HOLD_DURATION);
  // Fadein FIRST_SENTENCES
  yield* firstSentencesProgress(FIRST_SENTENCES.length, 2.75);
  yield* waitFor(HOLD_DURATION);
  // Fadeout FIRST_SENTENCES
  yield* all(
    firstSentencesRef().x(-40, 0.25),
    firstSentencesRef().opacity(0, 0.25),
  )
  // Fadein SECOND_SENTENCES
  for (let i = 0; i < secondSentencesRefs.length; i++ ) {
    yield* secondSentencesRefs[i]().opacity(1, 0.2);
    yield* secondSentencesRefs[i]().x(x[i], 0.25)
  }
  // Fadeout SECOND_SENTENCES
  yield* all(...secondSentencesRefs.map(ref => ref().opacity(0, 0.3)));
  // Fadein THIRD_SENTENCES
  for (let i = 0; i < thirdSentencesRefs.length; i++) {
    yield* all (
      thirdSentencesRefs[i]().opacity(1, 0.5),
      thirdSentencesRefs[i]().y(1, 0.25)
    )
  }
  // Fadeout THIRD_SENTENCES
  for (let i = 0; i < thirdSentencesRefs.length; i++) {
    yield* all (
      thirdSentencesRefs[i]().y(1, 0.25),
      thirdSentencesRefs[i]().opacity(0, 0.2),
    )
  }
  // Fadein FOURTH_SENTENCES
  for (let i = 0; i < fourthSentencesRefs.length; i++) {
    yield* all (
      fourthSentencesRefs[i]().opacity(1, 0.5),
      fourthSentencesRefs[i]().width(widthFourthWords[i], 0.8)
    )
  }
  yield* waitFor(HOLD_DURATION);
})
