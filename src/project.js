import {makeProject} from '@motion-canvas/core';

import scene1 from './scenes/new_scene_1?scene';
import scene2 from './scenes/new_scene_2?scene';
// import scene3 from './scenes/scene_3?scene';
// import scene4 from './scenes/scene_4?scene';
// import scene5 from './scenes/scene_5?scene';

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    scene1, 
    scene2
  ],
});
