import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video, Line } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loop, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
import logo from '../../public/assets/images/Logo.png';
import cursorSvg from '../../public/assets/images/new_cursor.svg';
import oneDiceSvg from '../../public/assets/images/one_dice.svg';
import twoDiceSvg from '../../public/assets/images/two_dice.svg';
import threeDiceSvg from '../../public/assets/images/three_dice.svg';
import arrowRightSvg from '../../public/assets/images/arrow_right.svg';
import closeSvg from '../../public/assets/images/x.svg';
import layoutSvg from '../../public/assets/images/layout.svg';
import undoSvg from '../../public/assets/images/undo.svg';
import redoSvg from '../../public/assets/images/redo.svg';
import desktopSvg from '../../public/assets/images/desktop.svg';
import mobileSvg from '../../public/assets/images/mobile.svg';
import rocketSvg from '../../public/assets/images/rocket.svg';
import sparklesSvg from '../../public/assets/images/sparkles.svg';
import arrowUpSvg from '../../public/assets/images/arrow_up.svg';

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------
const purpleGradient = new Gradient({
  from: [0, 100],
  to:   [0, -100],
  stops: [
    {offset: 0, color: '#8b5cf6'},
    {offset: 1, color: '#7C3AED'},
  ],
});

const skeletonOpacity = createSignal(1);

const section = {
  padding:12,
}

const skeleton = {
  stroke:'rgba(124, 58, 237, 0.2)',
  lineWidth:2,
  fill:'rgba(139, 92, 246, 0.1)',
  opacity: () => skeletonOpacity(),
}

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

// ---------------------------------------------------------------------------
// Textarea walking-border trace (ported from scene_2)
// ---------------------------------------------------------------------------
const textareaTraceGradient = new Gradient({
  type: 'linear',
  from: [0, 80],
  to:   [0, -80],
  stops: [
    {offset: 0, color: '#8b5cf6'},
    {offset: 1, color: '#7C3AED'},
  ],
});

const TEXTAREA_RADIUS = 16; // must match chatTextareaMevin radius
const TRACE_WINDOW = 0.75;
const TRACE_SEGMENTS = 200;
const TRACE_LAPS = 1.5;

const roundedRectPoint = (hw: number, hh: number, r: number, t: number) => {
  const segLen = [
    2 * hw - 2 * r,
    Math.PI * r / 2,
    2 * hh - 2 * r,
    Math.PI * r / 2,
    2 * hw - 2 * r,
    Math.PI * r / 2,
    2 * hh - 2 * r,
    Math.PI * r / 2,
  ];
  const total = segLen.reduce((a, b) => a + b, 0);
  const pos = ((t % 1) + 1) % 1 * total;
  let cumul = 0;
  for (let i = 0; i < 8; i++) {
    if (pos < cumul + segLen[i] || i === 7) {
      const f = (pos - cumul) / segLen[i];
      switch (i) {
        case 0: return { x: -hw + r + f * (2 * hw - 2 * r), y: -hh };
        case 1: return { x: hw - r + r * Math.cos(-Math.PI / 2 + f * Math.PI / 2), y: -hh + r + r * Math.sin(-Math.PI / 2 + f * Math.PI / 2) };
        case 2: return { x: hw, y: -hh + r + f * (2 * hh - 2 * r) };
        case 3: return { x: hw - r + r * Math.cos(f * Math.PI / 2), y: hh - r + r * Math.sin(f * Math.PI / 2) };
        case 4: return { x: hw - r - f * (2 * hw - 2 * r), y: hh };
        case 5: return { x: -hw + r + r * Math.cos(Math.PI / 2 + f * Math.PI / 2), y: hh - r + r * Math.sin(Math.PI / 2 + f * Math.PI / 2) };
        case 6: return { x: -hw, y: hh - r - f * (2 * hh - 2 * r) };
        case 7: return { x: -hw + r + r * Math.cos(Math.PI + f * Math.PI / 2), y: -hh + r + r * Math.sin(Math.PI + f * Math.PI / 2) };
      }
    }
    cumul += segLen[i];
  }
  return { x: -hw + r, y: -hh };
};

const roundedRectData = (hw: number, hh: number, r: number, phase: number) => {
  const n = TRACE_SEGMENTS;
  const offset = ((phase % n) + n) % n;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const p = roundedRectPoint(hw, hh, r, (i + offset) / n);
    pts.push(i === 0 ? `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}` : `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  }
  pts.push('Z');
  return pts.join(' ');
};

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const btnMevin = createRef<Rect>();
  const magicToolMevin = createRef<Rect>();
  const chatMevin = createRef<Rect>();
  const chatTextareaMevin = createRef<Rect>();
  const chatPlaceholderMevin = createRef<Txt>();
  const chatTextareaTrace = createRef<Path>();
  const chatTracePhase = createSignal(0);
  const chatTraceRadius = createSignal(TEXTAREA_RADIUS);
  const chatTextedBox = createRef<Rect>();
  const chatResTextedBox = createRef<Rect>();
  const chatResTexted = createRef<Txt>();

  const page = createRef<Rect>();
  const navSkeleton = createRef<Rect>();
  const navLogo = createRef<Txt>();
  const navLogoSkeleton = createRef<Rect>();
  const navAbout = createRef<Txt>();
  const navAboutSkeleton = createRef<Rect>();
  const navFeature = createRef<Txt>();
  const navFeatureSkeleton = createRef<Rect>();
  const navPricing = createRef<Txt>();
  const navPricingSkeleton = createRef<Rect>();
  const navContact = createRef<Txt>();
  const navContactSkeleton = createRef<Rect>();
  const navGetStarted = createRef<Txt>();
  const navGetStartedSkeleton = createRef<Rect>();
  // --- Hero
  const videoContent = createRef<Video>();
  const videoContentSkeleton = createRef<Rect>();
  const headingContent = createRef<Txt>();
  const headingContentSkeleton = createRef<Rect>();
  const paragraphContent = createRef<Txt>();
  const paragraphContentSkeleton = createRef<Rect>();
  const firstBtn = createRef<Rect>();
  const firstBtnSkeleton = createRef<Rect>();
  const secondBtn = createRef<Rect>();
  const secondBtnSkeleton = createRef<Rect>();
  const serviceHeadingContent = createRef<Txt>();
  const serviceHeadingSkeleton = createRef<Rect>();
  const CARET_CHAR = '|';
  // --- Service Second Card (02) ---
  const serviceFirstCard = createRef<Rect>();
  const serviceFirstCardSkeleton = createRef<Rect>();
  const serviceFirstCardNumber = createRef<Txt>();
  const serviceFirstCardNumberSkeleton = createRef<Rect>();
  const serviceFirstCardIcon = createRef<Img>();
  const serviceFirstCardIconSkeleton = createRef<Rect>();  
  const serviceFirstCardHeading = createRef<Txt>();
  const serviceFirstCardHeadingSkeleton = createRef<Rect>();
  const serviceFirstCardParagraph = createRef<Txt>();
  const serviceFirstCardParagraphSkeleton = createRef<Rect>();
  const serviceFirstCardButton = createRef<Txt>();
  const serviceFirstCardButtonSkeleton = createRef<Rect>();
  // --- Service Second Card (02) ---
  const serviceSecondCard = createRef<Rect>();
  const serviceSecondCardSkeleton = createRef<Rect>();
  const serviceSecondCardNumber = createRef<Txt>();
  const serviceSecondCardNumberSkeleton = createRef<Rect>();
  const serviceSecondCardIcon = createRef<Img>();
  const serviceSecondCardIconSkeleton = createRef<Rect>();
  const serviceSecondCardHeading = createRef<Txt>();
  const serviceSecondCardHeadingSkeleton = createRef<Rect>();
  const serviceSecondCardParagraph = createRef<Txt>();
  const serviceSecondCardParagraphSkeleton = createRef<Rect>();
  const serviceSecondCardButton = createRef<Rect>();
  const serviceSecondCardButtonSkeleton = createRef<Rect>();

  // --- Service Third Card (03) ---
  const serviceThirdCard = createRef<Rect>();
  const serviceThirdCardSkeleton = createRef<Rect>();
  const serviceThirdCardNumber = createRef<Txt>();
  const serviceThirdCardNumberSkeleton = createRef<Rect>();
  const serviceThirdCardIcon = createRef<Img>();
  const serviceThirdCardIconSkeleton = createRef<Rect>();
  const serviceThirdCardHeading = createRef<Txt>();
  const serviceThirdCardHeadingSkeleton = createRef<Rect>();
  const serviceThirdCardParagraph = createRef<Txt>();
  const serviceThirdCardParagraphSkeleton = createRef<Rect>();
  const serviceThirdCardButton = createRef<Rect>();
  const serviceThirdCardButtonSkeleton = createRef<Rect>();

  const cursor = createRef<Img>();
  // cursor
  view.add(
    <Img
      ref={cursor}
      src={cursorSvg}
      width={48}
      height={48}
      opacity={0}
      y={1000}
      zIndex={200}
    />
  );

  const bgDark = blackRadialRect();
  bgDark.opacity(1);
  view.add(bgDark);
  bgDark.zIndex(-2);

  // btn mevinai
  view.add(
    <Rect
      layout
      alignItems={"center"}
      justifyContent={"center"}
      fill={purpleGradient}
      width={96}
      height={96}
      radius={999}
      x={860}
      y={460}
      zIndex={100}
    >
      <Img
        src={logo}
        width={40}
        height={40}
      />
    </Rect>
  );

  // Chat Mevin
  view.add(
    <Rect
      ref={chatMevin}
      layout
      direction={"column"}
      gap={48}
      padding={32}
      fill={'rgba(10, 10, 10, 1)'}
      radius={24}
      lineWidth={2}
      stroke={"rgba(255, 255, 255, 0.25)"}
      zIndex={100}
      position={[590, 50]}
      width={660}
      height={0}
      opacity={0}
    >
      <Rect
        layout
        direction={"row"}
        gap={24}
        
      >
        <Img
          src={sparklesSvg}
          width={32}
          height={32}
        />
        <Txt 
          text="Chat to edit"
          fontSize={32}
          fontWeight={700}
          fill={"#ffffff"}
        />
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.25)"}
          points={[[0, 100], [640, 100]]} /* start/end coords at bottom */
          position={[-320, -60]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={"row"}
        gap={24}
        padding={24}
        lineWidth={2}
        stroke={"rgba(139, 92, 246, 0.5)"}
        fill={"rgba(139, 92, 246, 0.15)"}
        radius={8}
      >
        <Img
          src={cursorSvg}
          width={32}
          height={32}
        />
        <Txt
          text="Collection Blog posts, products and projects."
          fontSize={24}
          fontWeight={700}
          fill={"#ffffff"}
          textWrap
        />
      </Rect>

      <Rect grow={1} fill={null} /> 

      // User ask
      <Rect
        ref={chatTextedBox}
        layout
        direction={'row'}
        alignSelf={"end"}  
        padding={12}
        fill={purpleGradient}
        radius={[16, 16, 8, 16]}
        y={80}        // start below, slides up
        opacity={0}
      >
        <Txt
          text="Change the color to be light purple"
          fontSize={24}
          fill={"#ffffff"}
        />
      </Rect>

      // Textarea
      <Rect
        ref={chatTextareaMevin}
        layout
        direction={"column"}
        justifyContent={"space-between"}
        padding={24}
        height={160}
        lineWidth={2}
        stroke={'rgba(255, 255, 255, 0.25)'}
        fill={'#0a0a0a'}
        radius={16}
      >
        <Txt
          ref={chatPlaceholderMevin}
          text="Describe the change to this selection..."
          fontSize="28"
          fill={'rgba(255, 255, 255, 0.5)'}
        />

        <Rect
          layout
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Txt
            text="Enter to send. Shift + Enter to newline."
            fontSize="16"
            fill={'rgba(255, 255, 255, 0.35)'}
          />
          <Rect
            padding={12}
            fill={'rgba(255, 255, 255, 0.15)'}
            radius={8}
          >
            <Img
              src={arrowUpSvg}
              width={28}
              height={28}
              opacity={0.5}
            />
          </Rect>
        </Rect>
      </Rect>
      <Path
        ref={chatTextareaTrace}
        data={() => {
          const hw = chatTextareaMevin().width() / 2;
          const hh = chatTextareaMevin().height() / 2;
          return roundedRectData(
            hw,
            hh,
            Math.min(chatTraceRadius(), hw, hh),
            chatTracePhase(),
          );
        }}
        stroke={textareaTraceGradient}
        lineWidth={3}
        start={0}
        end={TRACE_WINDOW}
        opacity={0}
        x={() => chatTextareaMevin().x()}
        y={() => chatTextareaMevin().y()}
        shadowColor={'#8b5cf6'}
        shadowBlur={45}
        layout={false}
        zIndex={10}
      />
    </Rect>
  )

  // magicTool mevinai
  view.add(
    <Rect
      ref={magicToolMevin}
      layout
      direction="row"
      padding={[24, 32]}
      justifyContent="center"
      alignItems="center"
      fill={'rgba(0, 0, 0, 0.9)'}
      lineWidth={2}
      stroke={'rgba(124, 58, 237, 0.5)'}
      radius={999}
      gap={12}
      zIndex={2}
      y={800}
    >
      <Rect
        padding={12}
      >
        <Img
          src={closeSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
      </Rect>
      <Rect
        padding={12}
      >
        <Img
          src={layoutSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
      </Rect>
      <Rect
        layout
        direction="row"
        gap={48}
        fill={'rgba(255, 255, 255, 0.15)'}
        padding={[16, 24]}
        radius={999}
      >
        <Img
          src={undoSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
        <Img
          src={redoSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
      </Rect>
      <Rect
        layout
        direction="row"
        gap={48}
        fill={'rgba(255, 255, 255, 0.15)'}
        padding={[16, 24]}
        radius={999}
      >
        <Img
          src={desktopSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
        <Img
          src={mobileSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
      </Rect>
      <Rect
        padding={12}
      >
        <Img
          src={rocketSvg}
          width={32}
          height={32}
          opacity={0.75}
        />
      </Rect>
      <Rect      
        layout
        alignItems={"center"}
        justifyContent={"center"}
        fill={purpleGradient}
        radius={99}
        padding={[24, 48]}
      >
        <Txt
          text="Preview"
          fontSize={28}
          fontWeight={700}
          fill={'#ffffff'}
        />
      </Rect>
    </Rect>
  ) 

  // Page
  view.add(
    <Rect
      layout
      direction="column"
      ref={page}
      y={450}  
      gap={24}
      width={1860}
      minHeight={1040}
      fill={null}
    >
      // Navigation
      <Rect
        {...section}
        layout
        direction="row"
        justifyContent="space-between"
        height={64}
        width={1836}
      >
        // border skeleton (NOW PROPERLY OVERLAID)
        <Rect
          ref={navSkeleton}
          {...skeleton}
          layout={false}
          width={1860}
          height={96}
        />

        //Logo
        <Rect>
          <Txt
            ref={navLogo}
            opacity={0}
            text={"VOID"}
            fontSize={40}
            fontWeight={'700'}
            fill={'#ffffff'}
            letterSpacing={2}
          />

          // border skeleton (NOW PROPERLY OVERLAID)
          <Rect
            {...skeleton}
            ref={navLogoSkeleton}
            layout={false}
            width={120}
            height={64}
          />
        </Rect>

        <Rect
          layout
          direction="row"
          alignItems="center"
          gap={48}
        >
          <Rect>
            <Txt ref={navAbout} text="About" fontSize={24} fill={'rgba(255, 255, 255, 0.5)'} opacity={0} />

            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={navAboutSkeleton}
              {...skeleton}
              layout={false}
              width={96}
              height={64}
            />
          </Rect>
          <Rect>
            <Txt ref={navFeature} text="Feature" fontSize={24} fill={'rgba(255, 255, 255, 0.5)'}  opacity={0} />

            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={navFeatureSkeleton}
              {...skeleton}
              layout={false}
              width={120}
              height={64}
            />
          </Rect>
          <Rect>
            <Txt ref={navPricing} text="Pricing" fontSize={24} fill={'rgba(255, 255, 255, 0.5)'}  opacity={0} />

            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={navPricingSkeleton}
              {...skeleton}
              layout={false}
              width={120}
              height={64}
            />
          </Rect>
          <Rect>
            <Txt ref={navContact} text="Contact" fontSize={24} fill={'rgba(255, 255, 255, 0.5)'}  opacity={0} />

            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={navContactSkeleton}
              {...skeleton}
              layout={false}
              width={120}
              height={64}
            />
          </Rect>
          <Rect>
            <Txt ref={navGetStarted} text="Get Started" fontSize={24} fontWeight={700} fill={'rgba(255, 255, 255, 1)'} opacity={0} />

            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={navGetStartedSkeleton}
              {...skeleton}
              layout={false}
              width={172}
              height={64}
            />
          </Rect>
        </Rect>
      </Rect>      
      // Hero
      <Rect 
        {...section}
        height={960}
        width={1836}
      >
        <Video
          ref={videoContent}
          src={'/assets/videos/bg_hero2.mp4'}
          width={'100%'}
          play
          loop
          radius={24}
          opacity={0}
        />

          // border skeleton (NOW PROPERLY OVERLAID)
          <Rect
            ref={videoContentSkeleton}
            {...skeleton}
            layout={false}
            width={1860}
            height={956}
          />

          // Content
          <Rect
            layout={false}
            width={1200}
            y={200}
            x={0}
          >
            <Rect
              layout
              direction="row"
              alignItems="center"
              gap={48}
            >
              <Rect
                layout
                direction="column"
                gap={24}
              >
                <Rect>
                  <Txt
                    ref={headingContent}
                    text={"WE MAKE THE UNSEEN, UNIGNORABLE."}
                    fontSize={64}
                    fontWeight={600}
                    letterSpacing={-1.25}
                    fill="#ffffff"
                    opacity={0}
                  />

                  // border skeleton (NOW PROPERLY OVERLAID)
                  <Rect
                    ref={headingContentSkeleton}
                    {...skeleton}
                    layout={false}
                    width={1170}
                    height={96}
                  />
                </Rect>

                <Rect>
                  <Txt
                    ref={paragraphContent}
                    text={"We build brands, digital experiences, and visual identities for those who refuse to blend in."}
                    fontSize={32}
                    fontWeight={500}
                    fill="rgba(255, 255, 255, 0.75)"
                    textWrap
                    width={1100}
                    opacity={0}
                  />

                  // border skeleton (NOW PROPERLY OVERLAID)
                  <Rect
                    ref={paragraphContentSkeleton}
                    {...skeleton}
                    layout={false}
                    width={1070}
                    height={80}
                    x={-50}
                  />
                </Rect>
              </Rect>

              // Buttons
              <Rect
                layout
                direction="row"
                gap={24}
              >
                <Rect>
                  <Rect
                    ref={firstBtn}
                    fill="#ffffff"
                    padding={[24, 48]}
                    radius={8}
                    opacity={0}
                  >
                    <Txt
                      text={"Start Project"}
                      fontSize={24}
                      fontWeight={600}
                      fill="#000000"
                    />
                  </Rect>

                  // border skeleton (NOW PROPERLY OVERLAID)
                  <Rect
                    ref={firstBtnSkeleton}
                    {...skeleton}
                    layout={false}
                    width={256}
                    height={96}
                  />
                </Rect>

                <Rect>
                  <Rect
                    ref={secondBtn}
                    fill="#000000"
                    padding={[24, 48]}
                    radius={8}
                    opacity={0}
                  >
                    <Txt
                      text={"Explore Our Works"}
                      fontSize={24}
                      fontWeight={600}
                      fill="#ffffff"
                    />
                  </Rect>

                  // border skeleton (NOW PROPERLY OVERLAID)
                  <Rect
                    ref={secondBtnSkeleton}
                    {...skeleton}
                    layout={false}
                    width={310}
                    height={96}
                  />
                </Rect>
              </Rect>
            </Rect>
          </Rect>
      </Rect>
      // Services
      <Rect
        {...section}
        paddingTop={48}
        width={1836}
        layout
        direction="column"
        gap={48}
      >
        <Txt
          ref={serviceHeadingContent}
          text={"FROM THE FIRST SPARK OF AN IDEA TO THE LAST PIXEL OF PERFECTION."}
          fontSize={56}
          fontWeight={600}
          letterSpacing={-1.25}
          lineHeigth={2}
          fill="#ffffff"
          width={1000}
          textWrap
          opacity={0}
        />
        // border skeleton (NOW PROPERLY OVERLAID)
        <Rect
          ref={serviceHeadingSkeleton}
          {...skeleton}
          layout={false}
          width={1020}
          height={148}
          x={-410}
          y={-290}
        />

        // 4 kind of services
        <Rect
          layout
          direction="row"
          gap={24}
        >
          // 01
          // border skeleton (NOW PROPERLY OVERLAID)
          <Rect
            ref={serviceFirstCardSkeleton}
            {...skeleton}
            layout={false}
            width={580}
            height={610}
            x={-622}
            y={0}
          />
          <Rect
            ref={serviceFirstCard}
            padding={48}
            fill={new Gradient({
              type: 'radial',
              from: [0, 0],
              to: [0, 0],
              fromRadius: 0,
              toRadius: 400,
              stops: [
                { offset: 0.0, color: 'rgba(10, 10, 10, 0)' },
                { offset: 0.2, color: 'rgba(10, 10, 10, 0)' },   // ← transparent holds to 50% radius
                { offset: 1.0, color: 'rgba(10, 10, 10, 0.85)' },
              ],
            })}
            layout
            direction="column"
            gap={16}
            radius={24}
            lineWidth={2}
            stroke={"rgba(255, 255, 255, 0.15)"}
            opacity={0}
          >
            <Rect
              layout
              direction="row"
              justifyContent="space-between"
              paddingBottom={24}
            >
              <Txt
                ref={serviceFirstCardNumber}
                text={"01"}
                fontSize={96}
                fontWeight={700}
                fill={'rgba(255, 255, 255, 0.25)'}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceFirstCardNumberSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={-185}
                y={-15}
              />
              <Img
                ref={serviceFirstCardIcon}
                src={oneDiceSvg}
                width={96}
                height={96}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceFirstCardIconSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={185}
                y={-20}
              />
            </Rect>
            <Txt 
              ref={serviceFirstCardHeading}
              text={"Brand Identity"}
              fontSize={48}
              fontWeight={600}
              fill="rgba(255, 255, 255, 1)"
              opacity={0}
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceFirstCardHeadingSkeleton}
              {...skeleton}
              layout={false}
              width={360}
              height={64}
              x={-75}
              y={-50}
            />
            <Txt
              ref={serviceFirstCardParagraph}
              text={"We create distinctive identities that give your brand a voice, a presence, and a reason to be remembered."}
              fontSize={32}
              fill="rgba(255, 255, 255, 0.75)"
              textWrap
              opacity={0}
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceFirstCardParagraphSkeleton}
              {...skeleton}
              layout={false}
              width={460}
              height={165}
              x={-25}
              y={70}
            />

            <Rect
              layout
              direction="row"
              justifyContent="end"
              alignItems="center"
              gap={8}
              paddingTop={48}
            >
              <Rect
                ref={serviceFirstCardButton}
                opacity={0}
              >
                <Txt
                  text={"Learn more"}
                  fontSize={24}
                  fill="rgba(255, 255, 255, 1)"
                />

                <Img
                  src={arrowRightSvg}
                  width={24}
                  height={24}
                />
              </Rect>
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceFirstCardButtonSkeleton}
                {...skeleton}
                layout={false}
                width={190}
                height={40}
                x={155}
                y={25}
              />
            </Rect>
          </Rect>

          // 02
          // border skeleton (NOW PROPERLY OVERLAID)
          <Rect
            ref={serviceSecondCardSkeleton}
            {...skeleton}
            layout={false}
            width={600}
            height={610}
            x={-20}
            y={0}
          />
          <Rect
            ref={serviceSecondCard}
            padding={48}
            fill={new Gradient({
              type: 'radial',
              from: [0, 0],
              to: [0, 0],
              fromRadius: 0,
              toRadius: 400,
              stops: [
                { offset: 0.0, color: 'rgba(10, 10, 10, 0)' },
                { offset: 0.2, color: 'rgba(10, 10, 10, 0)' },   // ← transparent holds to 50% radius
                { offset: 1.0, color: 'rgba(10, 10, 10, 0.85)' },
              ],
            })}
            layout
            direction="column"
            gap={16}
            radius={24}
            lineWidth={2}
            stroke={"rgba(255, 255, 255, 0.15)"}
            opacity={0}
          >
            <Rect
              layout
              direction="row"
              justifyContent="space-between"
              paddingBottom={24}
            >
              <Txt
                ref={serviceSecondCardNumber}
                text={"02"}
                fontSize={96}
                fontWeight={700}
                fill={'rgba(255, 255, 255, 0.25)'}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceSecondCardNumberSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={-190}
                y={-15}
              />
              <Img
                ref={serviceSecondCardIcon}
                src={twoDiceSvg}
                width={96}
                height={96}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceSecondCardIconSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={195}
                y={-20}
              />
            </Rect>
            <Txt 
              ref={serviceSecondCardHeading}
              text={"Digital Experiences"}
              fontSize={48}
              fontWeight={600}
              fill="rgba(255, 255, 255, 1)"
              opacity={0}
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceSecondCardHeadingSkeleton}
              {...skeleton}
              layout={false}
              width={450}
              height={64}
              x={-35}
              y={-55}
            />
            <Txt
              ref={serviceSecondCardParagraph}
              text={"We design and build digital products that make complex things feel effortless and turn visitors into believers."}
              fontSize={32}
              fill="rgba(255, 255, 255, 0.75)"
              opacity={0}
              textWrap
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceSecondCardParagraphSkeleton}
              {...skeleton}
              layout={false}
              width={460}
              height={165}
              x={-30}
              y={65}
            />

            <Rect
              layout
              direction="row"
              justifyContent="end"
              alignItems="center"
              gap={8}
              paddingTop={48}
            >
              <Rect
                ref={serviceSecondCardButton}
                opacity={0}
              >
                <Txt
                  text={"Learn more"}
                  fontSize={24}
                  fill="rgba(255, 255, 255, 1)"
                />

                <Img
                  src={arrowRightSvg}
                  width={24}
                  height={24}
                />
              </Rect>
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceSecondCardButtonSkeleton}
                {...skeleton}
                layout={false}
                width={190}
                height={40}
                x={165}
                y={25}
              />
            </Rect>
          </Rect>

          // 03
          // border skeleton (NOW PROPERLY OVERLAID)
          <Rect
            ref={serviceThirdCardSkeleton}
            {...skeleton}
            layout={false}
            width={625}
            height={610}
            x={600}
            y={0}
          />
          <Rect
            ref={serviceThirdCard}
            padding={48}
            fill={new Gradient({
              type: 'radial',
              from: [0, 0],
              to: [0, 0],
              fromRadius: 0,
              toRadius: 400,
              stops: [
                { offset: 0.0, color: 'rgba(10, 10, 10, 0)' },
                { offset: 0.2, color: 'rgba(10, 10, 10, 0)' },   // ← transparent holds to 50% radius
                { offset: 1.0, color: 'rgba(10, 10, 10, 0.85)' },
              ],
            })}
            layout
            direction="column"
            gap={16}
            radius={24}
            lineWidth={2}
            stroke={"rgba(255, 255, 255, 0.15)"}
            opacity={0}
          >
            <Rect
              layout
              direction="row"
              justifyContent="space-between"
              paddingBottom={24}
            >
              <Txt
                ref={serviceThirdCardNumber}
                text={"03"}
                fontSize={96}
                fontWeight={700}
                fill={'rgba(255, 255, 255, 0.25)'}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceThirdCardNumberSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={-200}
                y={-15}
              />
              <Img
                ref={serviceThirdCardIcon}
                src={threeDiceSvg}
                width={96}
                height={96}
                opacity={0}
              />
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceThirdCardIconSkeleton}
                {...skeleton}
                layout={false}
                width={124}
                height={96}
                x={210}
                y={-20}
              />
            </Rect>
            <Txt 
              ref={serviceThirdCardHeading}
              text={"Creative Direction"}
              fontSize={48}
              fontWeight={600}
              fill="rgba(255, 255, 255, 1)"
              opacity={0}
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceThirdCardHeadingSkeleton}
              {...skeleton}
              layout={false}
              width={420}
              height={64}
              x={-65}
              y={-55}
            />
            <Txt
              ref={serviceThirdCardParagraph}
              text={"We transform ideas into visual stories that communicate clearly, connect emotionally, and challenge expectations."}
              fontSize={32}
              fill="rgba(255, 255, 255, 0.75)"
              opacity={0}
              textWrap
            />
            // border skeleton (NOW PROPERLY OVERLAID)
            <Rect
              ref={serviceThirdCardParagraphSkeleton}
              {...skeleton}
              layout={false}
              width={540}
              height={165}
              x={-5}
              y={70}
            />

            <Rect
              layout
              direction="row"
              justifyContent="end"
              alignItems="center"
              gap={8}
              paddingTop={48}
            >
              <Rect
                ref={serviceThirdCardButton}
                opacity={0}
              >
                <Txt
                  text={"Learn more"}
                  fontSize={24}
                  fill="rgba(255, 255, 255, 1)"
                />

                <Img
                  src={arrowRightSvg}
                  width={24}
                  height={24}
                />
              </Rect>
              // border skeleton (NOW PROPERLY OVERLAID)
              <Rect
                ref={serviceThirdCardButtonSkeleton}
                {...skeleton}
                layout={false}
                width={190}
                height={40}
                x={175}
                y={25}
              />
            </Rect>
          </Rect>
        </Rect>
      </Rect>
    </Rect>
  )

  // =============
  // Generator helpers
  // =============
  function* typeWrite(target: Ref<Txt>, text: string, charTime: number) {
    for (let i = 1; i <= text.length; i++) {
      target().text(text.substring(0, i) + CARET_CHAR);
      yield* waitFor(charTime);
    }
  }

  function* typeDelete(target: Ref<Txt>, text: string, charTime: number) {
    for (let i = text.length - 1; i >= 0; i--) {
      target().text(text.substring(0, i) + CARET_CHAR);
      yield* waitFor(charTime);
    }
  }

  function* blinkCaret(target: Ref<Txt>, times: number) {
    for (let i = 0; i < times; i++) {
      target().text(target().text().replace(CARET_CHAR, ''));
      yield* waitFor(0.25);
      target().text(target().text() + CARET_CHAR);
      yield* waitFor(0.25);
    }
  }

  // =============
  // Timeline
  // =============
  // One full pulse cycle lasts 3s (1.5s down + 1.5s up), so the main beats
  // below are timed to total exactly 3s. The pulse therefore runs
  // continuously until the end of the scene and finishes cleanly back at
  // full opacity.
  yield* all(
    loop(1, function* () {
      yield* skeletonOpacity(0.35, 1.5, easeInOutCubic);
      yield* skeletonOpacity(1, 1.5, easeInOutCubic);
    }),
    (function* () {
      yield* fadeTransition(0.15);

      yield* magicToolMevin().y(440, 0.5);

      yield* waitFor(HOLD_DURATION);
      // Navigation
      // Reveal nav logo right after the fade-in.
      yield* navLogo().opacity(1, 0.5);
      yield* navLogoSkeleton().opacity(0, 0.25);
      yield* navAbout().opacity(1, 0.25);
      yield* navAboutSkeleton().opacity(0, 0.25);
      yield* navFeature().opacity(1, 0.25);
      yield* navFeatureSkeleton().opacity(0, 0.25);
      yield* navPricing().opacity(1, 0.25);
      yield* navPricingSkeleton().opacity(0, 0.25);
      yield* navContact().opacity(1, 0.25);
      yield* navContactSkeleton().opacity(0, 0.25);
      yield* navGetStarted().opacity(1, 0.25);
      yield* navGetStartedSkeleton().opacity(0, 0.25);
      yield* navSkeleton().opacity(0, 0.25);
      yield* videoContent().opacity(1, 0.5);
      yield* videoContentSkeleton().opacity(0, 0.25);
      yield* headingContent().opacity(1, 0.25);
      yield* headingContentSkeleton().opacity(0, 0.25);
      yield* paragraphContent().opacity(1, 0.25);
      yield* paragraphContentSkeleton().opacity(0, 0.25);
      yield* firstBtn().opacity(1, 0.25);
      yield* firstBtnSkeleton().opacity(0, 0.25);
      yield* secondBtn().opacity(1, 0.25);
      yield* secondBtnSkeleton().opacity(0, 0.25);
      yield* waitFor(HOLD_DURATION);
      yield* page().y(-640, 0.75, easeOutCubic);
      yield* waitFor(0.25)
      yield* serviceHeadingContent().opacity(1, 0.5);
      yield* serviceHeadingSkeleton().opacity(0, 0.5);
      // 01
      yield* serviceFirstCard().opacity(1, 0.25);
      yield* serviceFirstCardSkeleton().opacity(0, 0.25);
      // 01 header row — number + icon
      yield* serviceFirstCardNumber().opacity(1, 0.25);
      yield* serviceFirstCardNumberSkeleton().opacity(0, 0.25);
      yield* serviceFirstCardIcon().opacity(1, 0.25);
      yield* serviceFirstCardIconSkeleton().opacity(0, 0.25);
      // body
      yield* serviceFirstCardHeading().opacity(1, 0.25);
      yield* serviceFirstCardHeadingSkeleton().opacity(0, 0.25);
      yield* serviceFirstCardParagraph().opacity(1, 0.25);
      yield* serviceFirstCardParagraphSkeleton().opacity(0, 0.25);
      // footer CTA — note ref is on wrapper Rect (:544), not Txt
      yield* serviceFirstCardButton().opacity(1, 0.25);
      yield* serviceFirstCardButtonSkeleton().opacity(0, 0.25);
      // 02 
      yield* serviceSecondCard().opacity(1, 0.25);
      yield* serviceSecondCardSkeleton().opacity(0, 0.25);
      // 02 header row — number + icon
      yield* serviceSecondCardNumber().opacity(1, 0.25);
      yield* serviceSecondCardNumberSkeleton().opacity(0, 0.25);
      yield* serviceSecondCardIcon().opacity(1, 0.25);
      yield* serviceSecondCardIconSkeleton().opacity(0, 0.25);
      // body
      yield* serviceSecondCardHeading().opacity(1, 0.25);
      yield* serviceSecondCardHeadingSkeleton().opacity(0, 0.25);
      yield* serviceSecondCardParagraph().opacity(1, 0.25);
      yield* serviceSecondCardParagraphSkeleton().opacity(0, 0.25);
      // footer CTA — note ref is on wrapper Rect (:544), not Txt
      yield* serviceSecondCardButton().opacity(1, 0.25);
      yield* serviceSecondCardButtonSkeleton().opacity(0, 0.25);
      yield* waitFor(HOLD_DURATION);
      // 02 
      yield* serviceThirdCard().opacity(1, 0.25);
      yield* serviceThirdCardSkeleton().opacity(0, 0.25);
      // 02 header row — number + icon
      yield* serviceThirdCardNumber().opacity(1, 0.25);
      yield* serviceThirdCardNumberSkeleton().opacity(0, 0.25);
      yield* serviceThirdCardIcon().opacity(1, 0.25);
      yield* serviceThirdCardIconSkeleton().opacity(0, 0.25);
      // body
      yield* serviceThirdCardHeading().opacity(1, 0.25);
      yield* serviceThirdCardHeadingSkeleton().opacity(0, 0.25);
      yield* serviceThirdCardParagraph().opacity(1, 0.25);
      yield* serviceThirdCardParagraphSkeleton().opacity(0, 0.25);
      // footer CTA — note ref is on wrapper Rect (:544), not Txt
      yield* serviceThirdCardButton().opacity(1, 0.25);
      yield* serviceThirdCardButtonSkeleton().opacity(0, 0.25);
      yield* waitFor(HOLD_DURATION);

      // Cursor animation
      yield* cursor().opacity(1, 0.25);
      yield* cursor().position({x: 0, y: -400}, 0.5, easeOutCubic);     // move to heading
      yield* cursor().scale(0.85, 0.1);                               // press down
      yield* cursor().scale(1, 0.1);                                  // release
      yield* waitFor(0.25);

      // Dive: restore heading skeleton to hide old text, then typewrite
      yield* serviceHeadingSkeleton().opacity(1, 0.25);
      yield* serviceHeadingContent().text(
        "FROM THE FIRST SPARK OF AN IDEA TO THE LAST PIXEL OF PERFECTION." + CARET_CHAR,
        0,
      );

      // Cursor animation
      yield* cursor().opacity(0, 0.25);
      yield* waitFor(0.25);

      // Phase 1: delete current text character by character
      yield* typeDelete(
        serviceHeadingContent,
        "FROM THE FIRST SPARK OF AN IDEA TO THE LAST PIXEL OF PERFECTION.",
        0.03,
      );
      yield* serviceHeadingSkeleton().height(96, 1);

      // Phase 2: write new text character by character
      yield* typeWrite(
        serviceHeadingContent,
        "FROM FIRST THOUGHT TO FINAL PIXEL.",
        0.03,
      );

      // Phase 3: blink caret a few times then remove it
      yield* blinkCaret(serviceHeadingContent, 3);
      yield* serviceHeadingContent().text(
        serviceHeadingContent().text().replace(CARET_CHAR, ''),
      );
      yield* waitFor(0.15);
      yield* serviceHeadingSkeleton().opacity(0, 0.25);
      
      yield* serviceHeadingSkeleton().opacity(0, 0.25);

      // Chat Mevin animation
      // Cursor animation
      yield* cursor().opacity(1, 0.25);
      yield* cursor().position({x: 0, y: -400}, 0.5, easeOutCubic);     // move to heading
      yield* cursor().scale(0.85, 0.1);                               // press down
      yield* cursor().scale(1, 0.1);                                  // release
      yield* waitFor(0.25);

      yield* serviceHeadingSkeleton().opacity(1, 0.25);

      // Cursor animation
      yield* cursor().position({x: 860, y: 450}, 0.5, easeOutCubic);     // move to chat mevinai
      yield* cursor().scale(0.85, 0.1);                               // press down
      yield* cursor().scale(1, 0.1);                                  // release
      yield* waitFor(0.25);

      yield* all (
        chatMevin().height(640, 0.5),
        waitFor(1),
        chatMevin().opacity(1, 0.5),
      )

      // Cursor animation
      yield* cursor().position({x: 860, y: 220}, 0.5, easeOutCubic);     // move to chat mevinai
      yield* cursor().scale(0.85, 0.1);                               // press down
      yield* cursor().scale(1, 0.1);                                  // release
      yield* waitFor(0.25);

      chatPlaceholderMevin().text("");
      yield* chatPlaceholderMevin().fill("#ffffff", 0.5)
      yield* waitFor(0.5); 

      // Walking purple border trace while the prompt types
      const TYPING_TIME = "Change color to be light purple".length * 0.05;
      const TRACE_TOTAL_DURATION = TYPING_TIME + 1.2;
      const TRACE_PHASE_TOTAL = Math.ceil(
        TRACE_LAPS * TRACE_SEGMENTS * (TRACE_TOTAL_DURATION / TYPING_TIME),
      );

      yield* all(
        chatTracePhase(TRACE_PHASE_TOTAL, TRACE_TOTAL_DURATION),
        chatTextareaTrace().opacity(1, 0.3),
        (function* () {
          yield* typeWrite(
            chatPlaceholderMevin,
            "Change color to be light purple",
            0.05,
          );
        })(),
      );
      yield* waitFor(0.5);

      // Keep the trace walking through the remaining beats (cursor click +
      // headline color change), then let it fade out at the very end.
      const TRACE_REST_DURATION = 0.5 + 0.5 + 0.1 + 0.1 + 0.25 + 0.5 + 0.3;
      const TRACE_REST_PHASE = Math.ceil(
        TRACE_LAPS * TRACE_SEGMENTS * (TRACE_REST_DURATION / TYPING_TIME),
      );
      yield* all(
        chatTracePhase(
          chatTracePhase() + TRACE_REST_PHASE,
          TRACE_REST_DURATION,
        ),
        (function* () {
          // Cursor animation
          yield* cursor().position({x: 860, y: 300}, 0.5, easeOutCubic);     // move to chat mevinai btn
          yield* cursor().scale(0.85, 0.1);                               // press down
          yield* cursor().scale(1, 0.1);                                  // release
          yield* waitFor(0.25);

          yield* all(
            chatTextedBox().y(0, 0.5, easeOutCubic),     // slides up into its slot
            chatTextedBox().opacity(1, 0.5),
            chatTextedBox().opacity(1, 0.5),                 // user-ask bubble fades in same time
          );

          yield* serviceHeadingContent().fill('rgba(190, 162, 255, 1)')
          yield* serviceHeadingSkeleton().opacity(0, 0.5)
          yield* chatTextareaTrace().opacity(0, 0.3);
        })(),
      );
    })(),
  );
})
