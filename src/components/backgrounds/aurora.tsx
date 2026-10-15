import {usePlayback} from '@motion-canvas/core';
import {Gradient, Layout, Rect} from '@motion-canvas/2d';

// ---------------------------------------------------------------------------
// Dark aurora-shader background.
//
// This is the reference WebGL aurora, adapted to Motion Canvas's fragment-
// shader pipeline (1080p stage = 1920x1080):
//   bg-black
//   <canvas>  (raymarched fbm aurora)
//   bg-gradient-to-t from-black/30 via-transparent to-black/20
//   absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent
//
// NOTE on direction: Tailwind's `bg-gradient-to-t` points the gradient
// *upward*, so the `from-` stop sits at the BOTTOM of the element. Motion
// Canvas uses screen coordinates (y grows downward), hence `from: [0, +540]`
// for the bottom-anchored stops below.
// ---------------------------------------------------------------------------

const FLOW_SPEED = 0.4;
const COLOR_INTENSITY = 1.2;
const NOISE_LAYERS = 4;
const MOUSE_INFLUENCE = 0.3;

function playbackTime(): number {
  try {
    return usePlayback().time;
  } catch {
    return 0;
  }
}

// Motion Canvas animations have no live browser cursor while rendering. Use a
// smooth, bounded virtual cursor so the reference's mouse-influence term keeps
// moving the aurora deterministically.
function virtualMouse(): [number, number] {
  const time = playbackTime();
  return [
    0.5 + 0.24 * Math.sin(time * 0.43),
    0.5 + 0.2 * Math.sin(time * 0.31),
  ];
}

const AURORA_FRAGMENT = `#version 300 es
precision highp float;

// Motion Canvas only preprocesses include directives in standalone .glsl
// files, so inline the common shader interface here for an inline fragment.
in vec2 screenUV;
in vec2 sourceUV;
in vec2 destinationUV;

out vec4 outColor;

uniform float deltaTime;
uniform float framerate;
uniform int frame;
uniform vec2 resolution;
uniform sampler2D sourceTexture;
uniform sampler2D destinationTexture;
uniform mat4 sourceMatrix;
uniform mat4 destinationMatrix;

uniform float uTime;
uniform float uFlowSpeed;
uniform float uColorIntensity;
uniform float uNoiseLayers;
uniform float uMouseInfluence;
uniform vec2 uMouse;

#define MARCH_STEPS 32

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
}

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float fbm(vec3 p) {
    float f = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 8; i++) {
        if (float(i) >= uNoiseLayers) break;
        f += amp * hash(p.xy);
        p *= 2.0;
        amp *= 0.5;
    }
    return f;
}

float map(vec3 p) {
    vec3 q = p;
    q.z += uTime * uFlowSpeed;
    vec2 mouse = (uMouse - 0.5) * 2.0;
    q.xy += mouse * uMouseInfluence;
    float f = fbm(q * 2.0);
    f *= sin(p.y * 2.0 + uTime) * 0.5 + 0.5;
    return clamp(f, 0.0, 1.0);
}

void main() {
    // Motion Canvas sourceUV has y = 1 at the top; convert it to the
    // reference shader's y-up coordinate system before aspect correction.
    vec2 centeredUV = vec2(sourceUV.x - 0.5, 0.5 - sourceUV.y);
    vec2 uv = centeredUV * resolution / resolution.y;
    vec3 ro = vec3(0, -1, 0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 col = vec3(0);
    float t = 0.0;

    for (int i = 0; i < MARCH_STEPS; i++) {
        vec3 p = ro + rd * t;
        float density = map(p);
        if (density > 0.0) {
            vec3 auroraColor = 0.5 + 0.5 * cos(uTime * 0.5 + p.y * 2.0 + vec3(0, 2, 4));
            col += auroraColor * density * 0.1 * uColorIntensity;
        }
        t += 0.1;
    }

    outColor = vec4(col, 1.0);
}
`;

export function auroraDarkRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      // Base: pure black (matches `bg-black`); the custom shader generates
      // the aurora over it, exactly like the reference `<canvas>`.
      new Rect({
        width: '100%',
        height: '100%',
        fill: '#000000',
        shaders: [
          {
            fragment: AURORA_FRAGMENT,
            uniforms: {
              uTime: playbackTime,
              uFlowSpeed: FLOW_SPEED,
              uColorIntensity: COLOR_INTENSITY,
              uNoiseLayers: NOISE_LAYERS,
              uMouseInfluence: MOUSE_INFLUENCE,
              uMouse: virtualMouse,
            },
          },
        ],
      }),
      // Scrim over the aurora, drawn last (on top) as in the reference.
      // `bg-gradient-to-t from-black/30 via-transparent to-black/20`:
      // 30% black at the BOTTOM edge, clear in the middle, 20% at the TOP.
      new Rect({
        width: '100%',
        height: '100%',
        fill: new Gradient({
          type: 'linear',
          from: [0, 540],
          to: [0, -540],
          stops: [
            {offset: 0.0, color: 'rgba(0, 0, 0, 0.3)'},
            {offset: 0.5, color: 'rgba(0, 0, 0, 0)'},
            {offset: 1.0, color: 'rgba(0, 0, 0, 0.2)'},
          ],
        }),
      }),
      // Bottom edge fade: h-24 (96px) pinned to bottom-0, 40% black at the
      // screen edge fading out going up. Strip centre sits at y = 540 - 48.
      new Rect({
        width: '100%',
        height: 96,
        y: 492,
        fill: new Gradient({
          type: 'linear',
          from: [0, 48],
          to: [0, -48],
          stops: [
            {offset: 0.0, color: 'rgba(0, 0, 0, 0.4)'},
            {offset: 1.0, color: 'rgba(0, 0, 0, 0)'},
          ],
        }),
      }),
    ],
  });
}
