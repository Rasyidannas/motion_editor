import {makeProject} from '@motion-canvas/core';

import scene1 from './scenes/scene_1?scene';
import scene2 from './scenes/scene_2?scene';
import scene3 from './scenes/scene_3?scene';

export default makeProject({
  experimentalFeatures: true,
  scenes: [scene1, scene2, scene3],
});
