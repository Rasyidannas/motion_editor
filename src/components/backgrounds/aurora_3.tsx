import {usePlayback} from '@motion-canvas/core';
import {Layout, Rect, ShaderConfig} from '@motion-canvas/2d';

// ---------------------------------------------------------------------------
// Third aurora background (21st.dev "Gradient Mesh").
//
// This ports the supplied WebGL Gradient Mesh demo to Motion Canvas's
// fragment-shader pipeline. The fragment source below is a literal port of
// the reference page's minified cy(i) function, adapted only for ES 3.00
// (in/out instead of attribute/varying/gl_FragColor).
//
// Reference defaults:
//   colors ["#3b2a8d", "#aaa7d7", "#f75092"], distortion 5, swirl 0.5,
//   speed 1, scale 1, offsetX 0, offsetY 0, rotation 90, waveAmp 0.1,
//   waveFreq 10, waveSpeed 0.2, grain 0.06.
// ---------------------------------------------------------------------------

const DISTORTION = 5;
const SWIRL = 0.5;
const SPEED = 1;
const SCALE = 1;
const OFFSET_X = 0;
const OFFSET_Y = 0;
const ROTATION = 90;
const WAVE_AMP = 0.1;
const WAVE_FREQ = 10;
const WAVE_SPEED = 0.2;
const GRAIN = 0.06;

const COLOR_A = [0x3b / 255, 0x2a / 255, 0x8d / 255];
const COLOR_B = [0xaa / 255, 0xa7 / 255, 0xd7 / 255];
const COLOR_C = [0xf7 / 255, 0x50 / 255, 0x92 / 255];

function playbackTime(): number {
  try {
    return usePlayback().time;
  } catch {
    return 0;
  }
}

const AURORA_3_FRAGMENT = `#version 300 es
precision highp float;

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
uniform float uSwirl;
uniform float uSpeed;
uniform float uScale;
uniform float uOffsetX;
uniform float uOffsetY;
uniform float uRotation;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uGrain;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

float wave(vec2 uv, float freq, float speed, float time) {
  return sin(uv.x * freq + time * speed) * cos(uv.y * freq + time * speed);
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 colorDodge(vec3 base, vec3 blend) {
  return min(base / (1.0 - blend + 0.0001), 1.0);
}

void main() {
  vec2 flippedUV = vec2(sourceUV.x, 1.0 - sourceUV.y);
  float mr = min(resolution.x, resolution.y);
  vec2 uv = (flippedUV * 2.0 - 1.0) * resolution.xy / mr;

  uv = uv * uScale + vec2(uOffsetX, uOffsetY);

  float cosR = cos(uRotation);
  float sinR = sin(uRotation);
  uv = vec2(
    uv.x * cosR - uv.y * sinR,
    uv.x * sinR + uv.y * cosR
  );

  uv.x += wave(uv, uWaveFreq, uWaveSpeed, uTime) * uWaveAmp;
  uv.y += wave(uv + 10.0, uWaveFreq * 1.5, uWaveSpeed * 0.8, uTime) * uWaveAmp * 0.5;

  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle += uSwirl * radius;
  uv = vec2(cos(angle), sin(angle)) * radius;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < ${DISTORTION.toFixed(1)}; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;

  float mix1 = (sin(d) + 1.0) * 0.5;
  float mix2 = (cos(a) + 1.0) * 0.5;
  vec3 col = mix(uColorA, uColorB, mix1);
  col = mix(col, uColorC, mix2);

  float grain = (random(gl_FragCoord.xy + uTime) - 0.5) * uGrain;
  vec3 grainCol = vec3(0.5 + grain);
  col = colorDodge(col, grainCol);

  float sourceAlpha = texture(sourceTexture, sourceUV).a;
  outColor = vec4(col, sourceAlpha);
}
`;

export function aurora3Shader(): ShaderConfig {
  return {
    fragment: AURORA_3_FRAGMENT,
    uniforms: {
      uTime: playbackTime,
      uSwirl: SWIRL,
      uSpeed: SPEED,
      uScale: SCALE,
      uOffsetX: OFFSET_X,
      uOffsetY: OFFSET_Y,
      uRotation: ROTATION,
      uWaveAmp: WAVE_AMP,
      uWaveFreq: WAVE_FREQ,
      uWaveSpeed: WAVE_SPEED,
      uGrain: GRAIN,
      uColorA: COLOR_A,
      uColorB: COLOR_B,
      uColorC: COLOR_C,
    },
  };
}

export function aurora3DarkRect() {
  return new Layout({
    width: '100%',
    height: '100%',
    children: [
      new Rect({
        width: '100%',
        height: '100%',
        fill: '#000000',
        shaders: [aurora3Shader()],
      }),
    ],
  });
}