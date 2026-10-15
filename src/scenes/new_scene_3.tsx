import { Gradient, makeScene2D } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loop, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
import logo from '../../public/assets/images/Logo.png';
import cursorSvg from '../../public/assets/images/new_cursor.svg';

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

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const btnMevin = createRef<Rect>();
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

  // Page
  view.add(
    <Rect
      layout
      direction="column"
      y={12}  
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
            y={300}
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
                    width={1200}
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
                    width={1100}
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
    </Rect>
  )

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
    })(),
  );
})
