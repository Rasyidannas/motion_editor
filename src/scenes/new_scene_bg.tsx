import { makeScene2D } from '@motion-canvas/2d';
import { waitFor } from '@motion-canvas/core/lib/flow';
import { auroraDarkRect } from '../components/backgrounds/aurora.tsx';

const HOLD_DURATION = 10; // hold so the scene has a playable duration

export default makeScene2D(function* (view) {
  // Create nodes INSIDE the scene function — nodes are disposed when the
  // scene ends, so a module-level instance is dead on any reload/re-entry.
  const bgHero = auroraDarkRect();
  view.add(bgHero);

  // The scene needs at least one yield, otherwise its duration is 0.
  yield* waitFor(HOLD_DURATION);
});
