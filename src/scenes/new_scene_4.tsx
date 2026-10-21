import { Gradient, makeScene2D, Path } from '@motion-canvas/2d';
import { Txt, Rect, Img, Video, Line, Node, Circle } from '@motion-canvas/2d/lib/components';
import { fadeTransition } from '@motion-canvas/core/lib/transitions';
import { useScene } from '@motion-canvas/core';
import { all, loop, loopFor, waitFor } from '@motion-canvas/core/lib/flow';
import { createSignal } from '@motion-canvas/core/lib/signals';
import { easeInOutCubic, easeOutCubic, createEaseOutElastic, spring, makeSpring } from '@motion-canvas/core/lib/tweening';
import { createRef } from '@motion-canvas/core/lib/utils';
import {blackRadialRect} from '../components/backgrounds/purple_4.tsx';
import xSvg from '../../public/assets/images/x.svg';
import palleteSvg from '../../public/assets/images/pallete.svg';
import typeSvg from '../../public/assets/images/type.svg'

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

const secondaryBtn = new Gradient({
  type: 'linear',
  from: [0, -20],   // adjust -20 to match your Rect's actual height; see note below
  to: [0, 20],
  stops: [
    { offset: 0, color: 'rgba(255, 255, 255, 0.14)' },  // top edge → lighter
    { offset: 1, color: 'rgba(255, 255, 255, 0.07)' }   // bottom edge → darker
  ],
})

// ---------------------------------------------------------------------------
// Timeline tuning (all values in seconds unless noted)
// ---------------------------------------------------------------------------
const HOLD_DURATION = 0.5; // pauses between animation beats

export default makeScene2D(function* (view) {
  // --- Node refs (must live inside the scene function) ---
  const bgDark = createRef<Rect>();
  const componentCollection = createRef<Rect>();
  const colorsDesignSystem = createRef<Rect>();
  const fontsDesignSystem = createRef<Rect>();

  view.add(
    <Rect
      ref={bgDark}
      width={'100%'}
      height={'100%'}
      fill='#000000'
    />
  )

  // Design System
  view.add(
    <Rect
      ref={colorsDesignSystem}
      layout
      direction={'column'}
      width={920}
      height={460}
      fill={'#0a0a0a'}
      stroke={'rgba(255, 255, 255, 0.15)'}
      lineWidth={2}
      radius={48}      
      // Simulate rotateY(-72deg) → compress width by cos(72°) ≈ 0.31
      skewY={-10}
      scale={1.5}
      position={[1500, 0]}
      opacity={0}
    >
      <Rect
        layout
        direction={'row'}
        padding={[32, 48]}
        justifyContent="space-between"
      >
        <Txt
          text="Colors Design System"
          fontSize={24}
          fontWeight={700}
          fill={'rgba(255, 255, 255, 1)'}
        />
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [920, 100]]} /* start/end coords at bottom */
          position={[-460, -60]}
          layout={false}
        />
      </Rect>

      <Rect>
        <Rect
          layout
          direction={'column'}
          gap={24}
          padding={[24, 48]}
        >
          <Rect
            layout
            direction={'row'}
            gap={16}
          >
            <Rect
              padding={24}
              fill='#8a5cf630'
              radius={24}
            >
              <Img
                src={palleteSvg}
                width={32}
                height={32}
                opacity={0.5}
              />
            </Rect>
            <Rect
              layout
              direction={"column"}
              gap={16}
              justifyContent="center"
            >
              <Txt
                text="Colors"
                fontSize={20}
                fontWeight={600}
                fill={'rgba(255, 255, 255, 0.75)'}
              />
              <Txt
                text="5 colors role"
                fontSize={20}
                fontWeight={600}
                fill={'rgba(255, 255, 255, 0.5)'}
              />
            </Rect>
          </Rect>
          <Rect
            layout
            direction={'row'}
            gap={16}
          >
            <Rect
              fill={'#4C2365'}
              width={64}
              height={64}
              radius={16}
            />
            <Rect
              fill={'#7F5D99'}
              width={64}
              height={64}
              radius={16}
            />
            <Rect
              fill={'#9E7EB5'}
              width={64}
              height={64}
              radius={16}
            />
            <Rect
              fill={'#C4A4DA'}
              width={64}
              height={64}
              radius={16}
            />
             <Rect
              fill={'#ffffff'}
              width={64}
              height={64}
              radius={16}
            />
          </Rect>

          <Txt
            text={"Primary, secondary, accent and background colors that define your website's visual identity."}
            fill={'rgba(255, 255, 255, 0.5)'}
            width={624}
            fontSize={20}
            alignSelf={"start"}
          />

          <Rect
            padding={[8, 16]}
            width={148}
            radius={12}
            stroke={'rgba(255, 255, 255, 0.5)'}
            lineWidth={2}
            fill={purpleGradient}
            marginTop={24}
          >
            <Txt
              text="Edit Colors"
              fontSize={24}
              fill="#ffffff"
              fontWeight={600}
            />
          </Rect>
        </Rect>
      </Rect>
    </Rect>
  )

  // Fonts
  view.add(
    <Rect
      ref={fontsDesignSystem}
      layout
      direction={'column'}
      width={920}
      height={460}
      fill={'#0a0a0a'}
      stroke={'rgba(255, 255, 255, 0.15)'}
      lineWidth={2}
      radius={48}      
      // Simulate rotateY(-72deg) → compress width by cos(72°) ≈ 0.31
      scaleX={0.5}
      x={-230}
      opacity={0}
    >
      <Rect
        layout
        direction={'row'}
        padding={[32, 48]}
        justifyContent="space-between"
      >
        <Txt
          text="Fonts Design System"
          fontSize={24}
          fontWeight={700}
          fill={'rgba(255, 255, 255, 1)'}
        />
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [920, 100]]} /* start/end coords at bottom */
          position={[-460, -60]}
          layout={false}
        />
      </Rect>

      <Rect>
        <Rect
          layout
          direction={'column'}
          gap={24}
          padding={[24, 48]}
        >
          <Rect
            layout
            direction={'row'}
            gap={16}
          >
            <Rect
              padding={24}
              fill='#8a5cf630'
              radius={24}
            >
              <Img
                src={typeSvg}
                width={32}
                height={32}
                opacity={0.5}
              />
            </Rect>
            <Rect
              layout
              direction={"column"}
              gap={16}
              justifyContent="center"
            >
              <Txt
                text="Fonts"
                fontSize={20}
                fontWeight={600}
                fill={'rgba(255, 255, 255, 0.75)'}
              />
              <Txt
                text="2 font roles"
                fontSize={20}
                fontWeight={600}
                fill={'rgba(255, 255, 255, 0.5)'}
              />
            </Rect>
          </Rect>

          <Rect
            layout
            direction={'column'}
            gap={12}
          >
            <Txt
              text={"Body: Inter"}
              fill={'rgba(255, 255, 255, 0.5)'}
              width={624}
              fontSize={20}
              alignSelf={"start"}
            />
            <Txt
              text={"Heading: Space Mono"}
              fill={'rgba(255, 255, 255, 0.5)'}
              width={624}
              fontSize={20}
              alignSelf={"start"}
            />
          </Rect>

          <Txt
            text={"Heading, body, and other typographic roles that control your website's typography."}
            fill={'rgba(255, 255, 255, 0.5)'}
            width={624}
            fontSize={20}
            alignSelf={"start"}
          />

          <Rect
            padding={[8, 16]}
            width={148}
            radius={12}
            stroke={'rgba(255, 255, 255, 0.5)'}
            lineWidth={2}
            fill={purpleGradient}
            marginTop={24}
          >
            <Txt
              text="Edit Fonts"
              fontSize={24}
              fill="#ffffff"
              fontWeight={600}
            />
          </Rect>
        </Rect>
      </Rect>
    </Rect>
  )

    // CMS Collection
  view.add(
    <Rect
      ref={componentCollection}
      layout
      direction={'column'}
      width={740}
      height={740}
      fill={'#0a0a0a'}
      stroke={'rgba(255, 255, 255, 0.15)'}
      lineWidth={2}
      radius={48}      
      // Simulate rotateY(-72deg) → compress width by cos(72°) ≈ 0.31
      skewY={10}
      scale={3}
      position={[-1500, 0]}
      opacity={0}
    >
      <Rect
        layout
        direction={'row'}
        padding={[32, 48]}
        justifyContent="space-between"
      >
        <Txt
          text="Data Settings"
          fontSize={24}
          fontWeight={700}
          fill={'rgba(255, 255, 255, 1)'}
        />
        <Img 
          src={xSvg}
          width={24}
          height={24}
          opacity={0.5}
        />
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [720, 100]]} /* start/end coords at bottom */
          position={[-360, -60]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={'row'}
        padding={[24, 48]}
        justifyContent="space-between"
      >
        <Rect
          layout
          direction={'column'}
          gap={8}
        >
          <Rect>
            <Txt
              text="Filters"
              fontSize={20}
              fontWeight={700}
              fill={'rgba(255, 255, 255, 1)'}
              marginRight={16}
            />
            <Rect
              layout
              direction={'row'}
              gap={8}
              justifyContent="center"
              alignItems="center"
            >
              <Circle
                fill={'#8b5cf6'}
                stroke={'#ffffff'}
                lineWidth={3}
                width={16}
                height={16}
              />
              <Txt
              text="Match all"
              fontSize={20}
              fill={'#ffffff'}
              marginRight={12}
              />
              <Circle
                fill={'#ffffff'}
                width={16}
                height={16}
              />
              <Txt
                text="Match any"
                fontSize={20}
                fill={'#ffffff'}
                />
            </Rect>
          </Rect>
          <Txt
            text="No rules. Add one to filter records."
            fontSize={16}
            fontWeight={700}
            fill={'rgba(255, 255, 255, 0.4)'}
          />
        </Rect>
        <Txt
          text="Add"
          fontSize={20}
          fontWeight={700}
          fill={'#8b5cf6'}
        />
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [720, 100]]} /* start/end coords at bottom */
          position={[-360, -60]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={'row'}
        padding={[24, 48]}
        justifyContent="space-between"
      >
          <Txt
            text="Sort"
            fontSize={20}
            fontWeight={700}
            fill={'rgba(255, 255, 255, 1)'}
          />
        <Rect
          layout
          direction={'row'}
          gap={8}
          justifyContent="center"
          alignItems="center"
        >
          <Circle
            fill='#ffffff'
            width={16}
            height={16}
          />
          <Txt
          text="Field"
          fontSize={20}
          fill={'#ffffff'}
          marginRight={12}
          />
          <Circle
            fill={'#8b5cf6'}
            stroke={'#ffffff'}
            lineWidth={3}
            width={16}
            height={16}
          />
          <Txt
            text="Manual"
            fontSize={20}
            fill={'#ffffff'}
            />
        </Rect>
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [720, 100]]} /* start/end coords at bottom */
          position={[-360, -60]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={'row'}
        padding={[24, 48]}
        justifyContent="space-between"
      >
          <Txt
            text="Limit"
            fontSize={20}
            fontWeight={700}
            fill={'rgba(255, 255, 255, 1)'}
          />
        <Rect
          layout
          direction={'row'}
          gap={8}
          justifyContent="center"
          alignItems="center"
        >
          <Txt
            text="Paginate"
            fontSize={20}
            fill={'#ffffff'}
            marginRight={12}
          />
          <Rect
            fill='#ffffff'
            width={40}
            height={20}
            radius={99}
            stroke={"#ffffff"}
            lineWidth={4}
          >
            <Circle
              fill={'#8b5cf6'}
              height={20}
              width={20}
              stroke={"#ffffff"}
              lineWidth={4}
            />
          </Rect>
        </Rect>
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [720, 100]]} /* start/end coords at bottom */
          position={[-360, -60]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={'column'}
        gap={24}
        padding={[24, 48]}
        justifyContent="space-between"
      >
          <Txt
            text="Preview"
            fontSize={20}
            fontWeight={700}
            fill={'rgba(255, 255, 255, 1)'}
          />

          <Txt
            text={"Showing 3 of 10 records"}
            fill={"rgba(255, 255, 255, 0.5)"}
            fontSize={16}
          />

          <Rect
            layout
            direction={'column'}
          >
            <Rect
              padding={16}
              stroke={'rgba(255, 255, 255, .15)'}
              lineWidth={2}
            >
              <Txt
                text="How We Built an AI App in 10 Minutes"
                fontSize={20}
                fill="#ffffff"
              />
            </Rect>
            <Rect
              padding={16}
              stroke={'rgba(255, 255, 255, .15)'}
              lineWidth={2}
            >
              <Txt
                text="10 Strategies to Scale Your SaaS Landing Page"
                fontSize={20}
                fill="#ffffff"
              />
            </Rect>
            <Rect
              padding={16}
              stroke={'rgba(255, 255, 255, .15)'}
              lineWidth={2}
            >
              <Txt
                text="The AI Creation Playbook"
                fontSize={20}
                fill="#ffffff"
              />
            </Rect>
          </Rect>
        <Line
          lineWidth={2}
          stroke={"rgba(255, 255, 255, 0.05)"}
          points={[[0, 100], [720, 100]]} /* start/end coords at bottom */
          position={[-360, 50]}
          layout={false}
        />
      </Rect>

      <Rect
        layout
        direction={'row'}
        gap={24}
        alignSelf="end"
        padding={[24, 48]}
      >
        <Rect
          padding={[8, 16]}
          radius={12}
          stroke={'rgba(255, 255, 255, 0.5)'}
          lineWidth={2}
          fill={secondaryBtn}
        >
          <Txt
            text="Cancel"
            fontSize={24}
            fill="#ffffff"
            fontWeight={600}
          />
        </Rect>
        <Rect
          padding={[8, 16]}
          radius={12}
          stroke={'rgba(255, 255, 255, 0.5)'}
          lineWidth={2}
          fill={purpleGradient}
        >
          <Txt
            text="Apply"
            fontSize={24}
            fill="#ffffff"
            fontWeight={600}
          />
        </Rect>
      </Rect>
    </Rect>
  )

  // =============
  // Timeline
  // =============
  yield* fadeTransition(0.15);
  yield* all (
    colorsDesignSystem().opacity(1, 0.15),
    colorsDesignSystem().x(0, 0.5),
    colorsDesignSystem().y(0, 0.5),
    colorsDesignSystem().skew.y(0, 0.5),
    colorsDesignSystem().scale(1, 0.5)
  )
  
  yield* all (
    componentCollection().opacity(1, 0.15),
    componentCollection().x(0, 0.5),
    componentCollection().y(0, 0.5),
    componentCollection().skew.y(0, 0.5),
    componentCollection().scale(1.25, 0.5),
  )


})