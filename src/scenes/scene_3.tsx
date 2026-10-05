import {Gradient, makeScene2D} from '@motion-canvas/2d';
import {Rect, Txt} from '@motion-canvas/2d/lib/components';
import {waitFor} from '@motion-canvas/core/lib/flow';
import {createRef} from '@motion-canvas/core/lib/utils';

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

// ----
// Style constants
// ----
const BOX_RADIUS = 32;
const BOX_TITLE_SIZE = 32;
const BOX_TITLE_WEIGHT = 600;
const BOX_TITLE_COLOR = 'rgba(0, 0, 0, 0.5)';

// Shared card background: purple top glow (left -> center -> right mirrors
// the CSS blobs at 0% / 50% / 100% of the top edge).
// Kept translucent so the white scene shows through, just like the CSS blobs
// fading to transparent. Reuse via `fill={cardRainbowGradient}` on any Rect —
// gradient coords are local pixels, so same-width cards share the exact look;
// adjust `from`/`to` if a card is much wider/narrower.
const cardRainbowGradient = new Gradient({
  type: 'linear',
  from: [-400, 0],
  to: [400, 0],
  stops: [
    {offset: 0.0, color: 'rgba(126, 86, 245, 0.15)'}, // hsla(255, 89%, 65%, 0.35)
    {offset: 0.5, color: 'rgba(138, 144, 240, 0.04)'}, // hsla(236, 77%, 74%, 0.24)
    {offset: 1.0, color: 'rgba(112, 54, 236, 0.15)'}, // hsla(259, 83%, 57%, 0.35)
  ],
});

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const colorPaletteBox = createRef<Rect>();
  const colorPaletteTitle = createRef<Txt>();

  // --- Pure white background (no import needed) ---
  view.add(<Rect width={'100%'} height={'100%'} fill={'#ffffff'} />);

  view.add(
    <Rect
      ref={colorPaletteBox}
      layout
      direction="column"
      gap={32}
      width={800}
      padding={48}
      radius={BOX_RADIUS}
      fill={cardRainbowGradient}
    >
      <Txt
        ref={colorPaletteTitle}
        text={"Color Palette"}
        fontSize={BOX_TITLE_SIZE}
        fontWeight={BOX_TITLE_WEIGHT}
        fill={BOX_TITLE_COLOR}
      />
      <Rect
        layout
        direction="row"
        radius={16}
        clip
      >
        <Rect 
          height={320}
          width={200}
          fill={'#000000'}
          padding={16}
          layout
          direction="column"
          justifyContent="space-between"
        >
          <Txt
            text={'Background'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
          <Txt
            text={'#000000'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
        </Rect>
        <Rect 
          height={320}
          width={200}
          fill={'#ffffff'}
          padding={16}
          layout
          direction="column"
          justifyContent="space-between"
        >
          <Txt
            text={'Neutral'}
            fill={'rgba(0, 0, 0, 0.5)'}
            fontSize={24}
          />
          <Txt
            text={'#ffffff'}
            fill={'rgba(0, 0, 0, 0.5)'}
            fontSize={24}
          />
        </Rect>
        <Rect 
          height={320}
          width={200}
          fill={'#9B7EBD'}
          padding={16}
          layout
          direction="column"
          justifyContent="space-between"
        >
          <Txt
            text={'Primary'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
          <Txt
            text={'#9B7EBD'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
        </Rect>
        <Rect 
          height={320}
          width={200}
          fill={'#3E54AC'}
          padding={16}
          layout
          direction="column"
          justifyContent="space-between"
        >
          <Txt
            text={'Primary'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
          <Txt
            text={'#3E54AC'}
            fill={'rgba(255, 255, 255, 0.5)'}
            fontSize={24}
          />
        </Rect>
      </Rect>
    </Rect>
  )

  // ===========================================================================
  // Timeline
  // ===========================================================================
  yield* waitFor(HOLD_DURATION);


})
