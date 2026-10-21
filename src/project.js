import {makeProject} from '@motion-canvas/core';

import scene1 from './scenes/new_scene_1?scene';
import scene2 from './scenes/new_scene_2?scene';
import scene3 from './scenes/new_scene_3?scene';
import scene4 from './scenes/new_scene_4?scene';
// import scene4 from './scenes/scene_4?scene';
// import scene5 from './scenes/scene_5?scene';
import scene_bg from './scenes/new_scene_bg?scene';

export default makeProject({
  experimentalFeatures: true,
  scenes: [
    // scene1, 
    // scene2,
    scene3,
    scene4
    // scene_bg
  ],
});
