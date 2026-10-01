// Master export timeline for CCapture.
// Mirrors scripts/animate.js timings (converted to seconds) as pure data so a
// single canvas renderer can seek to any time t deterministically.
// Segment boundaries:
//   S1 0.00 -> 8.10 | S2 8.10 -> 14.75 | S3 14.75 -> 20.91 | S4 20.91 -> 23.41
(function (global) {
  'use strict';

  var TL = {
    S1_START: 0.0,
    S1_WORDS_AT: 5.0,    // tl.add(words, 5000)
    S1_WORD_DUR: 0.4,
    S1_WORD_STAGGER: 0.3,
    S1_BOX_DUR: 0.6,     // appended after words
    S1_TILT_DELAY: 0.5, S1_TILT_DUR: 0.4,
    S1_FADE_DELAY: 0.8, S1_FADE_DUR: 0.1,
    S1_END: 8.1,

    S2_START: 8.1,
    S2_FADEIN_DUR: 0.1,
    S2_SLIDE_DUR: 2.5,   // left 200rem -> 60rem
    S2_SNAP_DUR: 0.05,   // scale 10 -> 1 (was 1ms; widened so export shows 2-3 frames)
    S2_BTN_DUR: 0.7,
    S2_CURSOR_DUR: 0.9,
    S2_CLICK_DUR: 0.35,
    S2_WIPE_DUR: 0.1,    // white circle 0% -> 150%, overlaps click start
    S2_OUT_DELAY: 1.2, S2_OUT_DUR: 0.4,
    S2_BG3_DUR: 0.9,     // purple2 translateY -100% -> 100%, overlaps fade-out
    S2_END: 14.8,

    S3_START: 14.8,
    S3_ICON_DUR: 0.7,
    S3_HEAD_DUR: 0.6,
    S3_SCROLL_DELAY: 0.9, S3_SCROLL_DUR: 5.05,
    S3_FADE_DELAY: 0.2, S3_FADE_DUR: 0.01,
    S3_END: 20.96,

    S4_START: 20.96,
    S4_BOX_DUR: 1.0,
    S4_TEXT_DELAY: 0.3, S4_TEXT_DUR: 0.6,
    S4_HOLD: 1.5,
    S4_END: 23.46
  };
  TL.TOTAL = TL.S4_END;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // Progress of [start, start+dur] at time t, clamped.
  function prog(t, start, dur) { return dur <= 0 ? (t >= start ? 1 : 0) : clamp01((t - start) / dur); }

  // --- easings (match anime.js names used in animate.js) ---
  function linear(t) { return t; }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function inCubic(t) { return t * t * t; }
  function inOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function inOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function inOutCirc(t) {
    return t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  }
  // Stand-in for anime spring({bounce, duration}): easeOutBack whose overshoot
  // scales with bounce. t is clamped progress.
  function spring(bounce) {
    var c = 1.0 + bounce * 3.0;
    return function (t) {
      t = clamp01(t);
      return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    };
  }
  // cubicBezier(0.341,0.362,0.659,0.665) used for the long slides.
  function cubicBezier(x1, y1, x2, y2) {
    function bx(t) {
      var u = 1 - t;
      return 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    }
    function by(t) {
      var u = 1 - t;
      return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
    }
    return function (x) {
      x = clamp01(x);
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 12; i++) {
        t = (lo + hi) / 2;
        if (bx(t) < x) lo = t; else hi = t;
      }
      return by((lo + hi) / 2);
    };
  }
  var SLIDE_EASE = cubicBezier(0.341, 0.362, 0.659, 0.665);

  global.ExportTL = {
    TL: TL,
    clamp01: clamp01, lerp: lerp, prog: prog,
    linear: linear, outCubic: outCubic, inCubic: inCubic,
    inOutCubic: inOutCubic, inOutQuad: inOutQuad, inOutCirc: inOutCirc,
    spring: spring, SLIDE_EASE: SLIDE_EASE
  };
})(window);
