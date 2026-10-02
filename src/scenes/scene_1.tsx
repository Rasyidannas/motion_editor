import { makeScene2D, Rect } from '@motion-canvas/2D';
import { Txt } from '@motion-canvas/2d/lib/components';
import { useScene } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const promptText = useScene().variables.get('text', 'Create me a landing page');

  const textRef = createRef<Txt>();
  
  
})
