import {Gradient, makeScene2D, Circle} from '@motion-canvas/2d';
import {Rect, Txt, Img} from '@motion-canvas/2d/lib/components';
import {all, waitFor} from '@motion-canvas/core/lib/flow';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import {createRef} from '@motion-canvas/core/lib/utils';
import {purpleDarkGlowRect} from '../components/backgrounds/purple_3';
import checkSvg from '../../public/assets/images/check.svg';

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

// ----
// Style constants
// ----

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const titleText = createRef<Txt>();
  const websiteDetailBox = createRef<Rect>();
  const styleGuideBox = createRef<Rect>();

  view.add(purpleDarkGlowRect());

  // Title is a direct view child (layout root) so its y tween works.
  view.add(
    <Txt 
      ref={titleText}
      text={"See how MevinAI builds your website"}
      fontSize={48}
      fill={'rgba(255, 255, 255, .75)'}
      opacity={0}
      y={-360}
    />
  );

  // Detail box also a direct view child, positioned below the title.
  view.add(
    
    <Rect
      ref={websiteDetailBox}
      layout
      direction="column"
      alignItems="left"
      gap={24}
      y={-24}
      lineWidth={1}
      stroke={'rgba(255, 255, 255, 0.35)'}
      padding={24}
      radius={16}
      width={768}
    >
      <Rect
        padding={[4, 12]}
        fill={'rgba(139, 92, 246, 0.5)'}
        radius={4}
        alignSelf="start"
      >
        <Txt 
          text={"Website detail"}
          fontSize={20}
          fontWeight={700}
          letterSpacing={1}
          fill={'rgba(255, 255, 255, 0.6)'}
        />
      </Rect>

      <Rect
        layout
        direction="column"
        gap={8}
      >
        <Txt
          text={"Website name"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
        />
        <Rect
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={720}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            text="NOVA"
            fill={'rgba(255, 255, 255, 1)'}
            fontSize={24}
          />
        </Rect>
      </Rect>
      
      <Rect
        layout
        direction="column"
        gap={8}
      >
        <Txt
          text={"Website address"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={720}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            text="nova"
            fill={'rgba(255, 255, 255, 1)'}
            fontSize={24}
          />
          <Txt
            text=".mevin.site"
            fill={'rgba(255, 255, 255, .5)'}
            fontSize={24}
          />
        </Rect>
      </Rect>

      <Rect
        layout
        direction="column"
        gap={8}
      >
        <Txt
          text={"Tagline"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
        />
        <Rect
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={720}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            text="The AI-powered command center for your professional life."
            fill={'rgba(255, 255, 255, 1)'}
            fontSize={24}
          />
        </Rect>
      </Rect>

      <Rect
        layout
        direction="column"
        gap={8}
      >
        <Txt
          text={"Description"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
        />
        <Rect
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={720}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            text="NOVA is an AI-driven productivity platform designed to streamline workflows and boost team efficiency."
            fill={'rgba(255, 255, 255, 1)'}
            fontSize={24}
            textWrap
          />
        </Rect>
      </Rect>
    </Rect>
  );

  // Style Guide Box
  view.add(
    <Rect
      ref={styleGuideBox}
      layout
      direction="column"
      alignItems="left"
      gap={24}
      y={420}
      lineWidth={1}
      stroke={'rgba(255, 255, 255, 0.35)'}
      padding={24}
      radius={16}
      width={768}
    >
      <Rect
        padding={[4, 12]}
        fill={'rgba(139, 92, 246, 0.5)'}
        radius={4}
        alignSelf="start"
      >
        <Txt 
          text={"Style Guide"}
          fontSize={20}
          fontWeight={700}
          letterSpacing={1}
          fill={'rgba(255, 255, 255, 0.6)'}
        />
      </Rect>
      
      <Rect
        layout
        direction="column"
        gap={8}
      >
        <Txt
          text={"Colors"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
        />
        <Rect
          layout
          direction="rows"
          padding={4}
          width={720}
          gap={24}
        >
          <Rect
            layout
            direction="column"
            gap={16}
            width={96}
          >
            <Rect 
              width={64}
              height={64}
              fill={'rgba(0, 0, 0, 1)'}
              radius={4}
            />
            <Txt
              text="Background"
              fontSize={16}
              fill={'rgba(255, 255, 255, 0.6)'}
            />
          </Rect>
          <Rect
            layout
            direction="column"
            gap={16}
            width={96}
          >
            <Rect 
              width={64}
              height={64}
              fill={'rgba(255, 255, 255, 1)'}
              radius={4}
            />
            <Txt
              text="Neutral"
              fontSize={16}
              fill={'rgba(255, 255, 255, 0.6)'}
            />
          </Rect>
          <Rect
            layout
            direction="column"
            gap={16}
            width={96}
          >
            <Rect 
              width={64}
              height={64}
              fill={'#9B7EBD'}
              radius={4}
            />
            <Txt
              text="Primary"
              fontSize={16}
              fill={'rgba(255, 255, 255, 0.6)'}
            />
          </Rect>
          <Rect
            layout
            direction="column"
            gap={16}
            width={96}
          >
            <Rect 
              width={64}
              height={64}
              fill={'#3E54AC'}
              radius={4}
            />
            <Txt
              text="Secondary"
              fontSize={16}
              fill={'rgba(255, 255, 255, 0.6)'}
            />
          </Rect>
        </Rect>
      </Rect>
    </Rect>
  );

  // ==============
  // Timeline
  // ==============
  yield* fadeTransition(0.15);
  yield* waitFor(HOLD_DURATION);
  // title rises bottom-to-top like "Onboarding steps" in scene_2
  yield* all(
    titleText().opacity(1, 0.4),
    titleText().y(-380, 0.4),
  );
})
