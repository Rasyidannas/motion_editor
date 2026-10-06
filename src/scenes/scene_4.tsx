import {Gradient, makeScene2D, blur} from '@motion-canvas/2d';
import {Rect, Txt, Img} from '@motion-canvas/2d/lib/components';
import {all, sequence, waitFor} from '@motion-canvas/core/lib/flow';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import {createRef} from '@motion-canvas/core/lib/utils';
import {purpleDarkGlowRect} from '../components/backgrounds/purple_3';

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

// ----
// Style constants
// ----

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scen function) ---
  const container = createRef<Rect>();
  const titleText = createRef<Txt>();

  view.add(purpleDarkGlowRect());

  view.add(
    <Rect
      ref={container}
    >
      <Txt 
        ref={titleText}
        text={"See how MevinAI builds your website"}
        fontSize={48}
        fill={'rgba(255, 255, 255, .25)'}
        opacity={1}
      />
    </Rect>
  );

  // ==============
  // Timeline
  // ==============
  yield* fadeTransition(0.15);
  yield* waitFor(HOLD_DURATION);
})
