export type Direction = 'down' | 'left' | 'right' | 'up';

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnimationDef {
  name: string;
  frames: FrameRect[];
  frameDuration: number; // in seconds
  loop: boolean;
}

export class AnimationController {
  private currentAnim: AnimationDef | null = null;
  private currentFrameIndex: number = 0;
  private elapsedTime: number = 0;
  private isFinished: boolean = false;

  setAnimation(anim: AnimationDef, forceReset: boolean = false) {
    if (!forceReset && this.currentAnim?.name === anim.name) {
      return;
    }
    this.currentAnim = anim;
    this.currentFrameIndex = 0;
    this.elapsedTime = 0;
    this.isFinished = false;
  }

  update(dt: number) {
    if (!this.currentAnim || this.isFinished) return;

    this.elapsedTime += dt;
    if (this.elapsedTime >= this.currentAnim.frameDuration) {
      this.elapsedTime -= this.currentAnim.frameDuration;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.currentAnim.frames.length) {
        if (this.currentAnim.loop) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.currentAnim.frames.length - 1;
          this.isFinished = true;
        }
      }
    }
  }

  getCurrentFrame(): FrameRect | null {
    if (!this.currentAnim) return null;
    return this.currentAnim.frames[this.currentFrameIndex] || null;
  }
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  text?: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  emitSparkles(x: number, y: number, count: number = 8, color: string = '#f1c40f') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3
      });
    }
  }

  emitFloatingText(x: number, y: number, text: string, color: string = '#2ecc71') {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: -30 - Math.random() * 15,
      color,
      size: 12,
      life: 0,
      maxLife: 0.8,
      text
    });
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;

      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = `${p.size}px "Press Start 2P", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.restore();
  }
}
