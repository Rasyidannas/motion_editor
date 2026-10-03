import { makeScene2D, Gradient, Img } from '@motion-canvas/2d';
import { Txt, Rect } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';
import { useScene } from '@motion-canvas/core';
import { purpleGradientRect } from '../components/backgrounds/purple_2';
import arrowUp from "../../public/assets/images/arrow_up.svg"

export default makeScene2D(function* (view) {
  const text = useScene().variables.get('text', 'Create me');

  const progress = createSignal(0);

  const textRef = createRef<Txt>();

  const inputText = createRef<Rect>();
  const inputTextHole = createRef<Rect>();
  const placholder = createRef<Txt>();
  const btnInput = createRef<Rect>();
  const btnIcon = createRef<Img>();

  const bg = purpleGradientRect();
  view.add(bg);

  const fontSize = 320;
  const font = 'Inter, system-ui, sans-serif';
  const sliced = () => text().slice(0, Math.floor(progress()));
  
  const verticalGradient = new Gradient({
    type: 'linear',
    from: [0, -5], // Top
    to: [0, 40],    // Bottom
    stops: [
      { offset: 0, color: 'rgba(255, 255, 255, 0.025)' },
      { offset: 1, color: 'rgba(255, 255, 255, 0.055)' },
    ],
  });

  view.add(
    <Txt
      ref={textRef}
      text={sliced}
      fontSize={fontSize}
      fontWeight={700}
      fontFamily={font}
      lineWidth={2}
      fill={verticalGradient}
      stroke={'rgba(255, 255, 255, .075)'}
      x={4}
      y={10}
      shadowColor={'rgba(255, 255, 255, 1)'}
      shadowBlur={25}
      shadowOffsetY={0}
      opacity={1}
    />
  );

  view.add(
    <Rect
      ref={inputText}
      x={0}
      y={0}
      width={960}
      height={140}
      radius={16}
      lineWidth={2}
      fill={verticalGradient}
      stroke={'rgba(255, 255, 255, .15)'}
      shadowColor={'rgba(255, 255, 255, 1)'}
      shadowBlur={25}
      shadowOffsetY={0}
      opacity={0}
      compositeOperation={'source-over'}
    >
      <Rect
        ref={inputTextHole}
        fill={'#ffffff'}
        width={950}
        height={130}
        radius={16}
        compositeOperation={'destination-out'}
      />
      <Txt
        ref={placholder}
        text={"Create me a landing page"}
        fontSize={48}
        fontFamily={font}
        x={-160}
        y={0}
        fill={'rgba(255, 255, 255, 0.25)'}
      />
      <Rect
        ref={btnInput}
        width={64}
        height={64}
        x={400}
        fill={'rgba(255, 255, 255, 0.075)'}
        radius={8}
      >
        <Img
          ref={btnIcon}
          src={arrowUp}
          width={48}
          height={48}
          x={0}
          y={0}
          opacity={0.25}
        />
      </Rect>
    </Rect>
  )

  yield* waitFor(0.5);

  yield* progress(text().length, 2.5);

  yield* textRef().opacity(0, 0.25);

  yield* inputText().opacity(1, 0.25);

  yield* waitFor(0.5);
});
