import { Gradient, makeScene2D } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
import logo from '../../public/assets/images/Logo.png';
import cursorSvg from '../../public/assets/images/new_cursor.svg';

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

const skeleton = {
  padding:12,
  stroke:'rgba(124, 58, 237, 0.2)',
  lineWidth:2,
  fill:'rgba(139, 92, 246, 0.1)'
}

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const btnMevin = createRef<Rect>();

  const bgDark = blackRadialRect();
  bgDark.opacity(1);
  view.add(bgDark);
  bgDark.zIndex(-2);

  // btn mevinai
  view.add(
    <Rect
      layout
      alignItems={"center"}
      justifyContent={"center"}
      fill={purpleGradient}
      width={96}
      height={96}
      radius={999}
      x={860}
      y={460}
      zIndex={100}
    >
      <Img
        src={logo}
        width={40}
        height={40}
      />
    </Rect>
  );

  view.add(
    <Rect
      layout
      direction="column"
      gap={24}
      {...skeleton}
      width={1860}
      minHeight={1040}
      fill={null}
    >
      // Navigation
      <Rect
        layout
        direction="row"
        justifyContent="space-between"
        {...skeleton}
        height={64}
        width={1836}
      >
        <Txt
          text={"VOID"}
          fontSize={40}
          fontWeight={'700'}
          fill={'#ffffff'}
          letterSpacing={2}
        />
        
        <Rect
          layout
          direction="row"
          alignItems="center"
          gap={24}
        >
          <Txt 
            text="About" 
            fontSize={28}
            fill={'rgba(255, 255, 255, 0.5)'}
          />
          <Txt 
            text="Feature" 
            fontSize={28}
            fill={'rgba(255, 255, 255, 0.5)'}
          />
          <Txt 
            text="Pricing" 
            fontSize={28}
            fill={'rgba(255, 255, 255, 0.5)'}
          />
          <Txt 
            text="Contact" 
            fontSize={28}
            fill={'rgba(255, 255, 255, 0.5)'}
          />
          <Txt 
            text="Get Started" 
            fontSize={28}
            fontWeight={700}
            fill={'rgba(255, 255, 255, 1)'}
          />
        </Rect>
      </Rect>
      // Hero
      <Rect 
        {...skeleton}
        height={960}
        width={1836}
      >
        <Video
          src={'/assets/videos/bg_hero.mp4'}
          width={'100%'}
          play
          loop
          radius={24}
        />
      </Rect>
    </Rect>
  )

  // =============
  // Timeline
  // =============
  yield* fadeTransition(0.15);
  yield* waitFor(5);
})
