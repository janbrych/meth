import { GameState } from './gameState';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  render(state: GameState, isEditorMode: boolean) {
    const ctx = this.ctx;
    const player = state.player;

    const cameraX = player.x - this.canvas.width / 2;
    const cameraY = player.y - this.canvas.height / 2;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.translate(-cameraX, -cameraY);

    this.renderGround(state);
    this.renderHouse(state, isEditorMode);
    this.renderFarms(state);
    this.renderFurniture(state);

    for (const enemy of state.enemies) {
      this.renderShadow(enemy.x, enemy.y, enemy.width / 2);
      this.renderEnemy(enemy);
    }

    this.renderShadow(player.x, player.y, player.width / 2);
    this.renderPlayer(player);
    this.renderDayNightOverlay(state, cameraX, cameraY);

    ctx.restore();
  }

  renderGround(state: GameState) {
    const ctx = this.ctx;
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, state.mapSize.width, state.mapSize.height);

    ctx.fillStyle = '#254b20';
    for (let x = 0; x < state.mapSize.width; x += 100) {
      for (let y = 0; y < state.mapSize.height; y += 100) {
        if ((x + y) % 200 === 0) {
          ctx.fillRect(x + 10, y + 10, 20, 20);
          ctx.fillRect(x + 60, y + 50, 15, 15);
        }
      }
    }
  }

  renderShadow(x: number, y: number, radius: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + 14, radius, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.restore();
  }

  renderHouse(state: GameState, isEditorMode: boolean) {
    const ctx = this.ctx;
    const h = state.houseBounds;

    ctx.fillStyle = '#3a2e2b';
    ctx.fillRect(h.x - 10, h.y - 10, h.width + 20, h.height + 20);

    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(h.x, h.y, h.width, h.height);

    ctx.strokeStyle = '#6b421d';
    ctx.lineWidth = 2;
    for (let y = h.y + 30; y < h.y + h.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(h.x, y);
      ctx.lineTo(h.x + h.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(h.x, h.y, h.width, 16);
    ctx.fillRect(h.x, h.y, 16, h.height);
    ctx.fillRect(h.x + h.width - 16, h.y, 16, h.height);

    ctx.fillRect(h.x, h.y + h.height - 16, h.width / 2 - 30, 16);
    ctx.fillRect(h.x + h.width / 2 + 30, h.y + h.height - 16, h.width / 2 - 30, 16);

    ctx.fillStyle = '#f1c40f';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('🏡 BEZPEČNÝ DŮM', h.x + 20, h.y + 35);

    if (isEditorMode) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      for (let x = h.x; x <= h.x + h.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, h.y);
        ctx.lineTo(x, h.y + h.height);
        ctx.stroke();
      }
      for (let y = h.y; y <= h.y + h.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(h.x, y);
        ctx.lineTo(h.x + h.width, y);
        ctx.stroke();
      }
    }
  }

  renderFurniture(state: GameState) {
    const ctx = this.ctx;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const furn of state.placedFurniture) {
      ctx.fillText(furn.icon, furn.x, furn.y);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  renderFarms(state: GameState) {
    const ctx = this.ctx;
    for (const farm of state.placedFarms) {
      ctx.fillStyle = '#4a2f13';
      ctx.fillRect(farm.x - 20, farm.y - 20, 40, 40);
      ctx.strokeStyle = '#734a1d';
      ctx.strokeRect(farm.x - 20, farm.y - 20, 40, 40);

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(farm.icon, farm.x, farm.y);

      if (farm.readyForHarvest) {
        ctx.fillStyle = '#2ecc71';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('SKLIZENO! (E)', farm.x, farm.y - 24);
      }
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  renderPlayer(player: any) {
    const ctx = this.ctx;

    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const skinIcon = player.skin.split(' ')[0] || '🧙‍♂️';
    ctx.fillText(skinIcon, player.x, player.y - 10);

    ctx.font = '18px sans-serif';
    const weaponOffset = player.direction === 'right' ? 20 : -20;
    ctx.fillText(player.weapon.icon, player.x + weaponOffset, player.y);

    if (player.isAttacking) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.weapon.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  renderEnemy(enemy: any) {
    const ctx = this.ctx;

    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height);

    const hpPercent = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.height / 2 - 12, 32, 6);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.height / 2 - 12, 32 * hpPercent, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x, enemy.y - enemy.height / 2 - 16);
    ctx.textAlign = 'start';
  }

  renderDayNightOverlay(state: GameState, cameraX: number, cameraY: number) {
    const ctx = this.ctx;
    const hour = state.worldTime.hour;

    let alpha = 0;
    if (hour >= 20 || hour < 5) {
      alpha = 0.55;
    } else if (hour === 18 || hour === 19) {
      alpha = 0.25;
    } else if (hour === 5 || hour === 6) {
      alpha = 0.25;
    }

    if (alpha > 0) {
      ctx.fillStyle = `rgba(10, 15, 40, ${alpha})`;
      ctx.fillRect(cameraX, cameraY, this.canvas.width, this.canvas.height);
    }
  }
}
