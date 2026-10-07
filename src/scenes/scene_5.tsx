import {Gradient, makeScene2D, Circle, Path, Camera} from '@motion-canvas/2d';
import {Rect, Txt, Img, Video} from '@motion-canvas/2d/lib/components';
import {all, sequence, waitFor} from '@motion-canvas/core/lib/flow';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { createSignal } from '@motion-canvas/core/lib/signals';
import {createRef} from '@motion-canvas/core/lib/utils';
import astronout from '../../public/assets/videos/astronout.mp4';

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

// ----
// Style constants
// ----
const gradient = new Gradient({
  from: [-600, 0],
  to:   [600, 0],
  stops: [
    {offset: 0, color: '#FFF574'},
    {offset: 1, color: '#ffffff'},
  ],
});

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const videoRef = createRef<Video>();
  const headingText = createRef<Txt>();

  // Video background
  view.add(
    <Camera>
      <Rect>
        <Video
          ref={videoRef}
          src={astronout}
          width={'100%'}
          height={'100%'}
          opacity={1}
          play
        />
        <Txt
          ref={headingText}
          text={'Build Better Websites, Without the Complexity.'}
          fontSize={120}
          fill={gradient}
          fontWeight={600}
          width={1440}
          textAlign={'center'}
          textWrap
        />
      </Rect>
    </Camera>
  );

  // ==============
  // Timeline
  // ==============
  yield* fadeTransition(0.1);
  yield* waitFor(HOLD_DURATION);

  yield* all(
    videoRef().opacity(1, 0.5),
  );
  yield* waitFor(HOLD_DURATION);
});
