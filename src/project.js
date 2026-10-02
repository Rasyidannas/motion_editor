import {makeProject} from '@motion-canvas/core';

import scene1 from './scenes/scene_1?scene';

export default makeProject({
  experimentalFeatures: true,
  scenes: [scene1],
});
