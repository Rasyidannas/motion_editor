import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img } from '@motion-canvas/2d/lib/components';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {purpleDarkGlowRect} from '../components/backgrounds/purple_3';
import break1 from '../../public/assets/images/break_1.png';
import break2 from '../../public/assets/images/break_2.png';

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
  const FIFTH_SENTENCES = "the whole thing"

  // --- Node refs (must live inside the scene function) ---
  const firstSentencesProgress = createSignal(0);
  const firstSentencesRef = createRef<Txt>();
  const secondSentencesRefs = SECOND_SENTENCES.split(' ').map(() => createRef<Txt>());
  const thirdSentencesRefs = THRID_SENTENCES.split(' ').map(() => createRef<Txt>());
  const fourthSentencesRefs = FOURTH_SENTENCES.split(' ').map(() => createRef<Txt>());
  const detailProgress = createSignal(0);
  const oneClipRef = createRef<Rect>();
  const smallClipRef = createRef<Rect>();
  const detailClipRef = createRef<Rect>();
  const fifthSentencesRefs = FIFTH_SENTENCES.split(' ').map(() => createRef<Txt>());
  const fifthBox = createRef<Rect>();
  const firstBreak = createRef<Img>();
  const secondBreak = createRef<Img>();

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

  view.add([
    <Rect layout direction="column" gap={8} x={-160} alignItems="start">
      <Rect
        ref={oneClipRef}
        layout
        width={0}
        height={64}
        clip
        justifyContent="start"
        alignItems="center"
      >
        <Txt
          ref={fourthSentencesRefs[0]}
          text={fourthWords[0]}
          width={100}
          fill={'#8b5cf6'}
          fontSize={48}
          fontWeight={600}
          fontStyle={'italic'}
        />
      </Rect>
      <Rect
        ref={smallClipRef}
        layout
        width={0}
        height={64}
        clip
        justifyContent="start"
        alignItems="center"
      >
        <Txt
          ref={fourthSentencesRefs[1]}
          text={fourthWords[1]}
          fill={'#8b5cf6'}
          fontSize={48}
          fontWeight={600}
          fontStyle={'italic'}
        />
      </Rect>
    </Rect>,
    <Rect
      ref={detailClipRef}
      layout
      height={150}
      clip
      justifyContent="start"
      alignItems="center"
      x={150}
    >
      <Txt
        ref={fourthSentencesRefs[2]}
        text={() => fourthWords[2].slice(0, Math.floor(detailProgress()))}
        width={460}
        fill={whiteToPurpleGradient}
        fontSize={120}
        fontWeight={600}
        opacity={0}
      />
    </Rect>
  ])

  const fifthWords = FIFTH_SENTENCES.split(' ');
  const xFifth = {
    0: -500,
    1: -230,
    2: 90,
    3: 480
  }

  view.add([
    ...fifthWords.slice(0, fifthWords.length).map((word, i) => (
      <Txt
        ref={fifthSentencesRefs[i]}
        text={word}
        fill={whiteToPurpleGradient}
        fontSize={120}
        fontWeight={600}
        x={xFifth[i]}
        y={-100}
        opacity={0}
      />
    )),
    <Rect
      ref={fifthBox}
      height={120}
      width={430}
      radius={12}
      x={xFifth[3]}
      y={-100}
      opacity={0}
    >
      <Img
        ref={firstBreak}
        src={break1}
        height={120}
        x={-90}
      />
      <Img
        ref={secondBreak}
        src={break2}
        height={120}
        x={-28}
        y={60}
        offset={[-1, 1]}
      />
    </Rect>
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
      thirdSentencesRefs[i]().y(1, 0.15),
      thirdSentencesRefs[i]().opacity(0, 0.15),
    )
  }
  // Window-slide reveal for "one" then "small" (left to right),
  // then fade + typewriter for "detail"
  yield* oneClipRef().width(100, 0.4);
  yield* smallClipRef().width(160, 0.4);
  yield* fourthSentencesRefs[2]().opacity(1, 0.5);
  yield* detailProgress(fourthWords[2].length, 0.8);
  yield* waitFor(HOLD_DURATION);
  // Fadeout FOURTH_SENTENCES (windows close, width -> 0)
  yield* oneClipRef().width(0, 0.3);
  yield* smallClipRef().width(0, 0.3);
  yield* all(
    detailClipRef().width(0, 0.15),
    detailClipRef().x(-170, 0.15),
    fourthSentencesRefs[2]().opacity(0, 0.15),
  );
  // Fadein FIFTH_SENTENCES
  for (let i = 0; i < fifthSentencesRefs.length; i++){
    yield* all (
      fifthSentencesRefs[i]().opacity(1, 0.5),
      fifthSentencesRefs[i]().y(1, 0.25),
    )
  }
  yield* all(
      fifthBox().opacity(1, 0.5),
      fifthBox().y(1, 0.25)
  )
  yield* secondBreak().rotation(15, 0.25)
  yield* waitFor(HOLD_DURATION);
})
