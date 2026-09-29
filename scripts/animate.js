function animateScene1() {
  const { animate, stagger, spring, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#word-first, #word-second', {
    opacity: [0, 1],
    scale: [0, 1],
    duration: 400,
    delay: stagger(300, { start: 3000 }),
    ease: spring({ bounce: 0.15, duration: 400 }),
  })
  .add('#black-box', {
    width: [0, '6rem'],
    opacity: [0, 1],
    scale: [0, 1],
    duration: 600,
    ease: spring({ bounce: 0.35, duration: 600 }),
    onBegin: () => document.querySelector('#black-box video')?.play(),
  })
  .add('#black-box', {
    rotate: 5,
    duration: 400,
    delay: 500,
    ease: 'outCubic',
  }).add('#word-first, #word-second, #black-box', {
    opacity:[1, 0],
    delay: 800,
    duration: 100,
    ease: 'outCubic',
    onComplete: () => {
      fetch('content/scene_2.html')
        .then(r => r.text())
        .then(html => {
          document.getElementById('scene-container').innerHTML = html;
          animateScene2();
        });
    }
  });
}

function animateScene2() {
  const { animate, stagger, spring, cubicBezier, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#scene_2', {
    opacity: [0, 1],
    duration: 100,
    delay: stagger(300),
    ease: 'outCubic',
  }).add('#scene_2', {
    left: ['200rem', '60rem'],
    duration: 2500,
    ease: cubicBezier(0.341,0.362,0.659,0.665),
  }).add('#scene_2', {
    scale: [10, 1],
    left: ['60rem', '0rem'],
    duration: 1,
    ease: 'linear'
  }).add('#btn-publish', {
    opacity: [0, 1],
    scale: [1.25, 1],
    duration: 700,
    ease: spring({ bounce: 0.5, duration: 700 }),
    onBegin: () => {
      document.querySelector('#btn-publish').style.display = '';
      const parts = document.querySelectorAll('#btn-publish svg circle, #btn-publish svg path');
      parts.forEach(el => {
        const len = el.getTotalLength();
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
      });
      animate(parts, {
        strokeDashoffset: 0,
        duration: 900,
        delay: stagger(120),
        ease: 'inOutCirc',
      });
    },
  }).add('#cursor', {
    translate: ['50vw -10vh', '45vw 50vh'],
    duration: 900,
    ease: 'inOutCubic',
    onBegin: () => { document.querySelector('#cursor').style.display = ''; },
  }).add('#btn-publish', {
    scale: [1, 0.9, 1],
    duration: 350,
    ease: 'inOutQuad',
  }).add('#bg-frame-2', {
    clipPath: ['circle(0% at 50% 50%)', 'circle(150% at 50% 50%)'],
    duration: 100,
    ease: 'inOutCubic',
  }, '<<').add('#scene_2', {
    scale: [1, 0],
    opacity: [1, 0],
    duration: 500,
    ease: 'inCubic',
  });
}
