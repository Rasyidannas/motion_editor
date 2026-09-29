function animateScene1() {
  const { animate, stagger, spring, createTimeline } = anime;
  const tl = createTimeline();
  tl.add('#word-first, #word-second', {
    opacity: [0, 1],
    scale: [0, 1],
    duration: 400,
    delay: stagger(300, { start: 2000 }),
    ease: spring({ bounce: 0.15, duration: 400 }),
  })
  .add('#black-box', {
    width: [0, '6rem'],
    opacity: [0, 1],
    scale: [0, 1],
    duration: 600,
    ease: spring({ bounce: 0.35, duration: 600 }),
    onBegin: () => document.querySelector('#black-box video')?.play(),
  });
}
