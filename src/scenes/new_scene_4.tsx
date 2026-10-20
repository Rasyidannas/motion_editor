import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video, Line, Node } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loop, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {aurora3DarkRect} from '../components/backgrounds/aurora_3.tsx';

export default makeScene2D(function* (view) {
  const bgInvert = aurora3DarkRect();
  bgInvert.zIndex(-2);
  bgInvert.opacity(0);
  view.add(bgInvert);

  yield* bgInvert.opacity(1, 1, easeOutCubic);
  yield* waitFor(0.5);
})