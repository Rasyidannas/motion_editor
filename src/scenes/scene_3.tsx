import {Gradient, makeScene2D, blur, Circle} from '@motion-canvas/2d';
import {Rect, Txt, Img} from '@motion-canvas/2d/lib/components';
import {all, sequence, waitFor} from '@motion-canvas/core/lib/flow';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import {createRef} from '@motion-canvas/core/lib/utils';
import hamburgerSvg from '../../public/assets/images/hamburger.svg';
import houseSvg from '../../public/assets/images/house.svg';
import trashSvg from '../../public/assets/images/trash.svg';
import phoneSvg from '../../public/assets/images/phone.svg';
import mapPinSvg from '../../public/assets/images/map-pin.svg';
import mailSvg from '../../public/assets/images/mail.svg';
import plusSvg from '../../public/assets/images/plus.svg';
import cardImageJpg from '../../public/assets/images/image.jpg';

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
  const typographyBox = createRef<Rect>();
  const typographyTitle = createRef<Txt>();
  const buttonBox = createRef<Rect>();
  const textFieldBox = createRef<Rect>();
  const submitFormBox = createRef<Rect>();
  const navigationBox = createRef<Rect>();
  const footerBox = createRef<Rect>();
  const IconsBox = createRef<Rect>();
  const cardBox = createRef<Rect>();
  const worldBox = createRef<Rect>();
  const wordFast = createRef<Txt>();
  const wordEasy = createRef<Txt>();
  const wordInstant = createRef<Txt>();
  const headlineBox = createRef<Rect>();
  const dotCircle = createRef<Circle>();

  // --- Pure white background (no import needed) ---
  view.add(<Rect width={'100%'} height={'100%'} fill={'#ffffff'} />);

  view.add(
    // world wrapper (no layout, so cards keep their x/y) — scale animates
    // the zoomout, filters carry the blur. Everything lives in view space
    // (no Camera), so the blur cache math stays in one coordinate space.
    // NOTE: camera zoom z about screen center === wrapper scale z about its
    // center, and the camera sat at default (0,0), so 2 -> 0.65 matches the
    // old zoom exactly.
    <Rect ref={worldBox} scale={2} filters={[blur(0)]} y={-75}>
      // Color Palette
      <Rect
        ref={colorPaletteBox}
        layout
        opacity={0}
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
            fill={'#E4D329'}
            padding={16}
            layout
            direction="column"
            justifyContent="space-between"
          >
            <Txt
              text={'Primary'}
              fill={'rgba(0, 0, 0, 0.5)'}
              fontSize={24}
            />
            <Txt
              text={'#E4D329'}
              fill={'rgba(0, 0, 0, 0.5)'}
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
              text={'Secondary'}
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

      // --- Typography
      <Rect
        ref={typographyBox}
        layout
        opacity={0}
        direction="column"
        gap={32}
        // width={800}
        scale={1.5}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={900}
        y={200}
      >
        <Txt
          ref={typographyTitle}
          text={"Typography"}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          gap={48}
          clip
        >
          <Rect
            layout
            direction='column'
            gap={8}
          >
            <Txt 
              text={'For Headline'}
              fontSize={16}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Aa'}
              fontSize={48}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Aa Bb Cc Dd Ee Ff Gg Hh Jj Kk Ll Mm Nn'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'1234567890!@#$%^&*()'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
          </Rect>

          <Rect
            layout
            direction='column'
            gap={8}
          >
            <Txt 
              text={'For Body'}
              fontSize={16}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Aa'}
              fontSize={48}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Aa Bb Cc Dd Ee Ff Gg Hh Jj Kk Ll Mm Nn'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={'1234567890!@#$%^&*()'}
              fontSize={12}
              fill={BOX_TITLE_COLOR}
            />
          </Rect>
        </Rect>
      </Rect>

      // --- Buttons
      <Rect
        ref={buttonBox}
        layout
        opacity={0}
        direction="column"
        gap={32}
        // width={800}
        scale={1.25}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={-800}
        y={-75}
      >
        <Txt
          ref={typographyTitle}
          text={"Buttons"}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          gap={48}
          clip
        >
          <Rect
            layout
            direction='column'
            gap={12}
          >
            <Rect
              padding={[12, 16]}
              radius={8}
              fill={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Primary Button'}
                fontSize={16}
                fill={'rgba(0, 0, 0, 0.5)'}
              />
            </Rect>
            <Rect
              padding={[16, 24]}
              radius={8}
              fill={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Primary Button'}
                fontSize={16}
                fill={'rgba(0, 0, 0, 0.5)'}
              />
            </Rect>
            <Rect
              padding={[20, 32]}
              radius={8}
              fill={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Primary Button'}
                fontSize={16}
                fill={'rgba(0, 0, 0, 0.5)'}
              />
            </Rect>
          </Rect>


          <Rect
            layout
            direction='column'
            gap={12}
          >
            <Rect
              padding={[12, 16]}
              radius={8}
              lineWidth={2}
              stroke={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Secondary Button'}
                fontSize={16}
                fill={'#E4D329'}
              />
            </Rect>
            <Rect
              padding={[16, 20]}
              radius={8}
              lineWidth={2}
              stroke={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Secondary Button'}
                fontSize={16}
                fill={'#E4D329'}
              />
            </Rect>
            <Rect
              padding={[20, 32]}
              radius={8}
              lineWidth={2}
              stroke={'#E4D329'}
              layout
              alignItems="center"
              justifyContent="center"
            >
              <Txt
                text={'Secondary Button'}
                fontSize={16}
                fill={'#E4D329'}
              />
            </Rect>
          </Rect>
        </Rect>
      </Rect>
      
      // --- Text Field
      <Rect
        ref={textFieldBox}
        layout
        opacity={0}
        direction="column"
        gap={24}
        // width={800}
        scale={0.9}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={-950}
        y={275}
      >
        <Txt
          ref={typographyTitle}
          text={"Text Field"}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          gap={24}
          padding={12}
          width={320}
          lineWidth={2}
          stroke={'rgba(0, 0, 0, 0.25)'}
          radius={8}
          clip
        >
          <Txt
            text="Enter your name here"
            fontSize={16}
            fill={'rgba(0, 0, 0, 0.45)'}
          />
        </Rect>
      </Rect>

      // --- Submit Form
      <Rect
        ref={submitFormBox}
        layout
        opacity={0}
        direction="column"
        gap={24}
        // width={800}
        scale={1.25}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={450}
        y={-450}
      >
        <Txt
          ref={typographyTitle}
          text={"Submit Form"}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          gap={16}
        >
          <Rect
            layout
            direction="row"
            justifyContent="space-between"
            gap={24}
            padding={12}
            width={320}
            lineWidth={2}
            stroke={'rgba(0, 0, 0, 0.25)'}
            radius={8}
            clip
          >
            <Txt
              text="Enter your name here"
              fontSize={16}
              fill={'rgba(0, 0, 0, 0.45)'}
            />
          </Rect>

          <Rect
            padding={[8, 16]}
            radius={8}
            fill={'#E4D329'}
          >
            <Txt 
              text={"Submit"}
              fontSize={20}
              fill={'rgba(0, 0, 0, 0.5)'}
            />
          </Rect>
        </Rect>
      </Rect>

      // --- Navigation
      <Rect
        ref={navigationBox}
        layout
        opacity={0}
        direction="column"
        gap={24}
        // width={800}
        scale={1.25}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={-500}
        y={-450}
      >
        <Txt
          ref={typographyTitle}
          text={"Navigation"}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect
          layout
          direction="row"
          justifyContent="space-between"
          gap={124}
        >
          <Txt 
            text={"LOGO"}
            fontSize={24}
            fontWeight={700}
            fill={BOX_TITLE_COLOR}
          />
          <Rect
            layout
            direction="row"
            gap={16}
          >
            <Txt 
              text={"Home"}
              fontSize={20}
              fontWeight={500}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={"Pricing"}
              fontSize={20}
              fontWeight={500}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={"About"}
              fontSize={20}
              fontWeight={500}
              fill={BOX_TITLE_COLOR}
            />
            <Txt 
              text={"Contact"}
              fontSize={20}
              fontWeight={500}
              fill={BOX_TITLE_COLOR}
            />
          </Rect>
          <Img src={hamburgerSvg} width={24} height={24} />
        </Rect>
      </Rect>

      // --- Footer
      <Rect
        ref={footerBox}
        layout
        opacity={0}
        direction="column"
        gap={24}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={-650}
        y={625}
        scale={1.5}
      >
        {/* top: 3 columns */}
        <Rect layout direction="row" gap={64} justifyContent="space-between">
          {/* brand */}
          <Rect layout direction="column" gap={12}>
            <Txt text={'LOGO'} fontSize={24} fontWeight={700} fill={BOX_TITLE_COLOR} />
            <Txt
              text={'Dummy description of the product in one short line.'}
              fontSize={16}
              fill={BOX_TITLE_COLOR}
              width={280}
              textWrap
            />
          </Rect>
          {/* links */}
          <Rect layout direction="column" gap={12}>
            <Txt text={'Links'} fontSize={20} fontWeight={600} fill={BOX_TITLE_COLOR} />
            <Txt text={'Home'} fontSize={16} fill={BOX_TITLE_COLOR} />
            <Txt text={'About'} fontSize={16} fill={BOX_TITLE_COLOR} />
            <Txt text={'Contact'} fontSize={16} fill={BOX_TITLE_COLOR} />
          </Rect>
          {/* legal */}
          <Rect layout direction="column" gap={12}>
            <Txt text={'Legal'} fontSize={20} fontWeight={600} fill={BOX_TITLE_COLOR} />
            <Txt text={'Privacy Policy'} fontSize={16} fill={BOX_TITLE_COLOR} />
            <Txt text={'Terms & Conditions'} fontSize={16} fill={BOX_TITLE_COLOR} />
          </Rect>
        </Rect>
        {/* divider */}
        <Rect height={2} width={'100%'} fill={'rgba(0, 0, 0, 0.15)'} radius={1} />
        {/* copyright, centered */}
        <Rect layout direction="row" width={'100%'} justifyContent="center">
          <Txt
            text={'Copyright Mevin. All rights reserved.'}
            fontSize={16}
            fill={BOX_TITLE_COLOR}
          />
        </Rect>
      </Rect>

      // Icons
      <Rect
        ref={IconsBox}
        layout
        opacity={0}
        direction="column"
        gap={32}
        scale={1.25}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={900}
        y={-175}
      >
        <Txt
          text={'Icons'}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Rect layout direction="row" gap={24} alignItems="center">
          <Img src={houseSvg} width={32} height={32} />
          <Img src={trashSvg} width={32} height={32} />
          <Img src={phoneSvg} width={32} height={32} />
          <Img src={mapPinSvg} width={32} height={32} />
          <Img src={mailSvg} width={32} height={32} />
          <Img src={plusSvg} width={32} height={32} />
        </Rect>
      </Rect>

      // --- Card
      <Rect
        ref={cardBox}
        layout
        opacity={0}
        direction="column"
        gap={24}
        width={800}
        padding={48}
        radius={BOX_RADIUS}
        fill={cardRainbowGradient}
        x={500}
        y={850}
      >
        <Txt
          text={'Card'}
          fontSize={BOX_TITLE_SIZE}
          fontWeight={BOX_TITLE_WEIGHT}
          fill={BOX_TITLE_COLOR}
        />
        <Txt
          text={'Title Card'}
          fontSize={48}
          fontWeight={700}
fill={'rgba(0, 0, 0, 0.5)'}
        />
        <Txt
          text={'Dummy description of the card in one short line.'}
          fontSize={20}
          fill={BOX_TITLE_COLOR}
          width={640}
          textWrap
        />
        <Img
          src={cardImageJpg}
          width={704}
          height={470}
          radius={16}
          clip
        />
      </Rect>
    </Rect>
  )

  // --- Frosted-glass veil (fullscreen — added last so it stays on top) ---
  const veil = createRef<Rect>();
  view.add(
    <Rect
      ref={veil}
      width={'100%'}
      height={'100%'}
      fill={'#ffffff'}
      opacity={0}
    />,
  );

  // --- Closing headline (screen space, above veil) ---
  // The ROW rises as one unit (it is a layout root, so its y tween applies —
  // y tweens on flex children are silently ignored, see Layout.getY).
  // Stagger comes from per-word opacity: Fast → Easy → Instant.
  view.add(
    <Rect
      ref={headlineBox}
      layout
      direction="row"
      alignItems="center"
      justifyContent="center"
      gap={40}
      opacity={0}
      y={40}
    >
      <Txt
        ref={wordFast}
        text={'Fast.'}
        fontSize={120}
        fontWeight={700}
        fill={'rgba(0, 0, 0, 0.85)'}
        opacity={0}
      />
      <Txt
        ref={wordEasy}
        text={'Easy.'}
        fontSize={120}
        fontWeight={700}
        fill={'rgba(0, 0, 0, 0.85)'}
        opacity={0}
      />
      <Txt
        ref={wordInstant}
        text={'Instant.'}
        fontSize={120}
        fontWeight={700}
        fill={'rgba(0, 0, 0, 0.85)'}
        opacity={0}
      />
    </Rect>,
  );

  // --- Dot for transition
  view.add(
    <Circle
      ref={dotCircle}
      size={20}
      x={48}
      y={33}
      fill={'rgba(0, 0, 0, 1)'}
      scale={1}
      opacity={0}
    />
  )

  // ===========================================================================
  // Timeline
  // ===========================================================================
  yield* fadeTransition(0.15);
  // all cards fade in together (children ride along: effective opacity =
  // parent x child, same as scene_2's onboarding beat)
  yield* all(
    colorPaletteBox().opacity(1, 0.4),
    typographyBox().opacity(1, 0.4),
    buttonBox().opacity(1, 0.4),
    textFieldBox().opacity(1, 0.4),
    submitFormBox().opacity(1, 0.4),
    navigationBox().opacity(1, 0.4),
    footerBox().opacity(1, 0.4),
    IconsBox().opacity(1, 0.4),
    cardBox().opacity(1, 0.4),
  );
  yield* waitFor(HOLD_DURATION);

  yield* worldBox().scale(0.75, 2, easeInOutCubic);
  // veil fades in only after the zoomout is 100% done
  yield* veil().opacity(0.7, 1);
  // blur ramps in last (same wrapper, so zoom + blur share one transform)
  yield* worldBox().filters.blur(12, 1, easeInOutCubic);
  // closing headline: row rises like "onboarding steps" in scene_2, words
  // pop in order — Fast → Easy → Instant
  yield* all(
    headlineBox().opacity(1, 0.4),
    headlineBox().y(0, 0.4),
    wordFast().opacity(1, 0.3),
    sequence(0.15, wordEasy().opacity(1, 0.3)),
    sequence(0.3, wordInstant().opacity(1, 0.3)),
  );

  yield* waitFor(HOLD_DURATION);
  yield* veil().opacity(1, 0.5);
  yield* waitFor(HOLD_DURATION);
  yield* dotCircle().opacity(1, .5);
  yield* dotCircle().scale(200, .25);
})
