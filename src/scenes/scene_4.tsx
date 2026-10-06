import {Gradient, makeScene2D, Circle, Path} from '@motion-canvas/2d';
import {Rect, Txt, Img} from '@motion-canvas/2d/lib/components';
import {all, sequence, waitFor} from '@motion-canvas/core/lib/flow';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { createSignal } from '@motion-canvas/core/lib/signals';
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
  const websiteDetailTitle = createRef<Rect>();
  const styleGuideBox = createRef<Rect>();
  const styleGuideTitle = createRef<Rect>();
  const detailProgress = createSignal(0);
  const WEBSITE_DETAIL_TEXT = "Website detail";
  const styleGuideProgress = createSignal(0);
  const STYLE_GUIDE_TEXT = "Style Guide";
  const nameValueBox = createRef<Rect>();
  const addressValueBox = createRef<Rect>();
  const taglineValueBox = createRef<Rect>();
  const descValueBox = createRef<Rect>();
  const nameLabelText = createRef<Txt>();
  const addressLabelText = createRef<Txt>();
  const taglineLabelText = createRef<Txt>();
  const descLabelText = createRef<Txt>();
  const nameValueText = createRef<Txt>();
  const addrValueText = createRef<Txt>();
  const taglineValueText = createRef<Txt>();
  const descValueText = createRef<Txt>();
  const nameProgress = createSignal(0);
  const addrProgress = createSignal(0);
  const taglineProgress = createSignal(0);
  const descProgress = createSignal(0);
  const NAME_TEXT = "NOVA";
  const ADDR_TEXT = "nova .mevin.site";
  const TAGLINE_TEXT = "The AI-powered command center for your professional life.";
  const DESC_TEXT = "NOVA is an AI-driven productivity platform designed to streamline workflows and boost team efficiency.";
const HEADING_TEXT = "Space Grotesk";
const BODY_TEXT = "Inter";
const cardBorder = createRef<Path>();
const colorsLabelText = createRef<Txt>();
const colorsRowBox = createRef<Rect>();
const headingLabelText = createRef<Txt>();
const headingValueBox = createRef<Rect>();
const headingValueText = createRef<Txt>();
const bodyLabelText = createRef<Txt>();
const bodyValueBox = createRef<Rect>();
const bodyValueText = createRef<Txt>();
const headingProgress = createSignal(0);
const bodyProgress = createSignal(0);
const styleBorder = createRef<Path>();

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
      padding={24}
      radius={16}
      width={768}
    >
      <Rect
        ref={websiteDetailTitle}
        padding={0}
        fill={'rgba(139, 92, 246, 0.5)'}
        radius={4}
        alignSelf="start"
      >
        <Txt 
          text={() => WEBSITE_DETAIL_TEXT.slice(0, Math.floor(detailProgress()))}
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
          ref={nameLabelText}
          text={"Website name"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
          opacity={0}
        />
        <Rect
          ref={nameValueBox}
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={0}
          height={0}
          opacity={0}
          fill={'rgba(255, 255, 255, 0.05)'}>
          <Txt
            ref={nameValueText}
            text={() => NAME_TEXT.slice(0, Math.floor(nameProgress()))}
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
          ref={addressLabelText}
          text={"Website address"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
          opacity={0}
        />
        <Rect
          ref={addressValueBox}
          layout
          direction="row"
          justifyContent="space-between"
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={0}
          height={0}
          opacity={0}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            ref={addrValueText}
            text={() => ADDR_TEXT.slice(0, Math.floor(addrProgress()))}
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
          ref={taglineLabelText}
          text={"Tagline"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
          opacity={0}
        />
        <Rect
          ref={taglineValueBox}
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={0}
          height={0}
          opacity={0}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            ref={taglineValueText}
            text={() => TAGLINE_TEXT.slice(0, Math.floor(taglineProgress()))}
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
          ref={descLabelText}
          text={"Description"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
          opacity={0}
        />
        <Rect
          ref={descValueBox}
          lineWidth={1}
          stroke={'rgba(255, 255, 255, 0.5)'}
          padding={[16, 24]}
          radius={8}
          width={0}
          height={0}
          opacity={0}
          fill={'rgba(255, 255, 255, 0.05)'}
        >
          <Txt
            ref={descValueText}
            text={() => DESC_TEXT.slice(0, Math.floor(descProgress()))}
            fill={'rgba(255, 255, 255, 1)'}
            fontSize={24}
            textWrap
          />
        </Rect>
      </Rect>
    </Rect>
  );

  // Card border: draws on after the description animation finishes
  view.add(
    <Path
      ref={cardBorder}
      stroke={'rgba(139, 92, 246, 0.8)'}
      data={
        'M -368 -300 H 368 Q 384 -300 384 -284 V 284 Q 384 300 368 300 H -368 Q -384 300 -384 284 V -284 Q -384 -300 -368 -300 Z'
      }      
      lineWidth={2}
      start={0}
      end={0}
      opacity={0}
      x={0}
      y={-24}
    />,
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
      padding={24}
      radius={16}
      width={768}
    >
      <Rect
        ref={styleGuideTitle}
        padding={[0, 0]}
        fill={'rgba(139, 92, 246, 0.5)'}
        radius={4}
        alignSelf="start"
      >
        <Txt 
          text={() => STYLE_GUIDE_TEXT.slice(0, Math.floor(styleGuideProgress()))}
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
          ref={colorsLabelText}
          text={"Colors"}
          fill={'rgba(255, 255, 255, 0.6)'}
          fontSize={20}
          opacity={0}
        />
        <Rect
          ref={colorsRowBox}
          layout
          direction="rows"
          padding={4}
          width={0}
          height={0}
          opacity={0}
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

      <Rect
        layout
        direction="row"
        gap={24}
      >
        <Rect
          layout
          direction="column"
          gap={8}
        >
          <Txt
            ref={headingLabelText}
            text={"Description"}
            fill={'rgba(255, 255, 255, 0.6)'}
            fontSize={20}
            opacity={0}
          />
          <Rect
            ref={headingValueBox}
            lineWidth={1}
            stroke={'rgba(255, 255, 255, 0.5)'}
            padding={[16, 24]}
            radius={8}
            width={0}
            height={0}
            opacity={0}
            fill={'rgba(255, 255, 255, 0.05)'}
          >
            <Txt
              ref={headingValueText}
              text={() => HEADING_TEXT.slice(0, Math.floor(headingProgress()))}
              fill={'rgba(255, 255, 255, 1)'}
              fontSize={24}
              textWrap
            />
          </Rect>
        </Rect>

        <Rect
          layout
          direction="column"
          gap={8}
        >
          <Txt
            ref={bodyLabelText}
            text={"Body font"}
            fill={'rgba(255, 255, 255, 0.6)'}
            fontSize={20}
            opacity={0}
          />
          <Rect
            ref={bodyValueBox}
            lineWidth={1}
            stroke={'rgba(255, 255, 255, 0.5)'}
            padding={[16, 24]}
            radius={8}
            width={0}
            height={0}
            opacity={0}
            fill={'rgba(255, 255, 255, 0.05)'}
          >
            <Txt
              ref={bodyValueText}
              text={() => BODY_TEXT.slice(0, Math.floor(bodyProgress()))}
              fill={'rgba(255, 255, 255, 1)'}
              fontSize={24}
              textWrap
            />
          </Rect>
        </Rect>
      </Rect>
    </Rect>
  );

  // Style Guide border: draws on after style guide content is revealed
  view.add(
    <Path
      ref={styleBorder}
      stroke={'rgba(139, 92, 246, 0.8)'}
      data={
        'M -368 -210 H 368 Q 384 -210 384 -194 V 194 Q 384 210 368 210 H -368 Q -384 210 -384 194 V -194 Q -384 -210 -368 -210 Z'
      }
      lineWidth={2}
      start={0}
      end={0}
      opacity={0}
      x={0}
      y={420}
    />,
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
  // badge types in while the pill grows — same beat, same duration/easing
  yield* sequence(
    0.2,
    all(
      detailProgress(WEBSITE_DETAIL_TEXT.length, 0.5),
      websiteDetailTitle().padding([4, 12], 0.5),
    ),
  );
  // value boxes grow from 0 to full width, staggered — label + box reveal together
  yield* sequence(0.1,
    all(
      nameLabelText().opacity(1, 0.75),
      nameValueBox().width(720, 0.4),
      nameValueBox().height(64, 0.4),
      nameValueBox().opacity(1, 0.75),
      sequence(1, nameProgress(NAME_TEXT.length, 0.4)),
    ),
  );
  yield* sequence(0.05,
    all(
      addressLabelText().opacity(1, 0.75),
      addressValueBox().width(720, 0.4),
      addressValueBox().height(64, 0.4),
      addressValueBox().opacity(1, 0.75),
      sequence(1, addrProgress(ADDR_TEXT.length, 0.4)),
    ),
  );
  yield* sequence(0.05,
    all(
      taglineLabelText().opacity(1, 0.75),
      taglineValueBox().width(720, 0.4),
      taglineValueBox().height(64, 0.4),
      taglineValueBox().opacity(1, 0.75),
      sequence(1, taglineProgress(TAGLINE_TEXT.length, 0.5)),
    ),
  );
  yield* sequence(0.05,
    all(
      descLabelText().opacity(1, 0.75),
      descValueBox().width(720, 0.4),
      descValueBox().height(96, 0.4),
      descValueBox().opacity(1, 0.75),
      sequence(1, descProgress(DESC_TEXT.length, 0.6)),
    ),
  );
  // card border draws on after all content is revealed
  yield* all(
    cardBorder().opacity(1, 0.3),
    cardBorder().end(1, 1),
  );
  // all content walks upward together once the border is drawn
  yield* all(
    titleText().y(-960, 0.8),
    websiteDetailBox().y(-720, 0.8),
    cardBorder().y(-720, 0.8),
    styleGuideBox().y(-160, 0.8),
    styleBorder().y(-160, 0.8),
  );
  // "Style Guide" badge types in after website detail finishes
  yield* sequence(
    0.15,
    all(
      styleGuideProgress(STYLE_GUIDE_TEXT.length, 0.5),
      styleGuideTitle().padding([4, 12], 0.5),
    ),
);
  // style guide content reveals — badge types first, then colors fade + grow in
  yield* sequence(
    0.2,
    all(
      colorsLabelText().opacity(1, 0.75),
      colorsRowBox().width(720, 0.4),
      colorsRowBox().height(124, 0.4),
      colorsRowBox().opacity(1, 0.75),
    ),
);
  // heading + body font fields reveal after colors
  yield* sequence(0.1,
    all(
      headingLabelText().opacity(1, 0.75),
      headingValueBox().width(340, 0.4),
      headingValueBox().height(56, 0.4),
      headingValueBox().opacity(1, 0.75),
      sequence(0.15, headingProgress(HEADING_TEXT.length, 0.4)),
    ),
  );
  yield* sequence(0.05,
    all(
      bodyLabelText().opacity(1, 0.75),
      bodyValueBox().width(340, 0.4),
      bodyValueBox().height(56, 0.4),
      bodyValueBox().opacity(1, 0.75),
      sequence(0.15, bodyProgress(BODY_TEXT.length, 0.4)),
    ),
  );
  // style guide border draws on after all content is revealed
  yield* all(
    styleBorder().opacity(1, 0.3),
    styleBorder().end(1, 1),
  );
  yield* waitFor(HOLD_DURATION);
})
