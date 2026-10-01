export class CircleComponent {
  constructor() {
    this.state = { x: 75 };
  }

  getTimelineParams() {
    return [
      this.state,
      { x: 525, duration: 2000, ease: 'inOutQuad' },
      0
    ];
  }

  render(ctx, scale = 1) {
    ctx.beginPath();
    ctx.arc(this.state.x * scale, 125 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4757';
    ctx.fill();
  }
}