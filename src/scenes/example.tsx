import { makeScene2D, Rect } from '@motion-canvas/2d';
import { Txt } from '@motion-canvas/2d/lib/components';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { createRef } from '@motion-canvas/core/lib/utils';
import { waitFor } from '@motion-canvas/core/lib/flow';
import bgShader from '../shaders/bg_purple_1.glsl';

export default makeScene2D(function* (view) {
  const fullText = "Hello World! Welcome to Motion Canvas typing animation.";

  const progress = createSignal(0);

  const textRef = createRef<Txt>();

  const bg = new Rect({
    width: '100%',
    height: '100%',
    shaders: {
      fragment: bgShader,
      uniforms: {
        u_scale: 1.4,
        u_intensity: 0.72,
        u_warp: 0.35,
        u_detail: 3.4,
        u_contrast: 0.95,
        u_brightness: -0.04,
        u_saturation: 1.15,
        u_vignette: 0.75,
        u_grain: 0.12,
        u_drift: 0.08,
      },
    },
  });

  view.add(bg);

  view.add(
    <Txt
      ref={textRef}
      text={() => fullText.slice(0, Math.floor(progress()))}
      fontSize={48}
      fill={'#ffffff'}
      fontFamily={'Consolas, monospace'}
    />
  );

  yield* progress(fullText.length, 5);

  yield* waitFor(1);
});
