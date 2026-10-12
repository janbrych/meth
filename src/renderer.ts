import { GameState } from './gameState';
import { PixelArtAssets } from './pixelArtAssets';
import { ParticleSystem } from './spriteSystem';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  particleSystem: ParticleSystem;

  private offscreenGround: HTMLCanvasElement | null = null;
  private playerSheets: Record<string, HTMLCanvasElement> = {};
  private enemySheets: Record<string, HTMLCanvasElement> = {};
  private animTime: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particleSystem = new ParticleSystem();
  }

  getDpr(): number {
    return Math.max(1, window.devicePixelRatio || 1);
  }

  getViewportWidth(): number {
    return this.canvas.width / this.getDpr();
  }

  getViewportHeight(): number {
    return this.canvas.height / this.getDpr();
  }

  screenToWorld(clientX: number, clientY: number, state: GameState): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cssX = clientX - rect.left;
    const cssY = clientY - rect.top;
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();
    const cameraX = state.player.x - vw / 2;
    const cameraY = state.player.y - vh / 2;

    return {
      x: cssX + cameraX,
      y: cssY + cameraY
    };
  }

  private getPlayerSheet(skin: string): HTMLCanvasElement {
    if (!this.playerSheets[skin]) {
      this.playerSheets[skin] = PixelArtAssets.createPlayerSheet(skin);
    }
    return this.playerSheets[skin];
  }

  private getEnemySheet(type: string): HTMLCanvasElement {
    if (!this.enemySheets[type]) {
      this.enemySheets[type] = PixelArtAssets.createEnemySheet(type);
    }
    return this.enemySheets[type];
  }

  update(dt: number) {
    this.animTime += dt;
    this.particleSystem.update(dt);
  }

  render(state: GameState, isEditorMode: boolean) {
    const ctx = this.ctx;
    const dpr = this.getDpr();
    const vw = this.getViewportWidth();
    const vh = this.getViewportHeight();

    const cameraX = state.player.x - vw / 2;
    const cameraY = state.player.y - vh / 2;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.scale(dpr, dpr);

    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;

    ctx.translate(-cameraX, -cameraY);

    // Layer 1: Pre-rendered terrain
    this.renderGround(state);

    // Layer 2: House Floor & Interior
    this.renderHouseInterior(state, isEditorMode);

    // Layer 3: Depth-Sorted Y-Entities (Furniture, Farms, Enemies, Player)
    this.renderYSortedEntities(state);

    // Layer 4: House Roof (Roof hides when player is inside)
    this.renderHouseRoof(state);

    // Layer 5: Particles
    this.particleSystem.render(ctx);

    // Layer 6: Atmospheric Day/Night & Lighting halos
    this.renderDayNightOverlay(state, cameraX, cameraY, vw, vh);

    ctx.restore();

    this.renderMinimap(state);
  }

  private buildGroundCache(state: GameState) {
    const off = document.createElement('canvas');
    off.width = state.mapSize.width;
    off.height = state.mapSize.height;
    const octx = off.getContext('2d');
    if (!octx) return;

    // Grass Base
    octx.fillStyle = '#2d5a27';
    octx.fillRect(0, 0, state.mapSize.width, state.mapSize.height);

    // Darker grass patches
    octx.fillStyle = '#254b20';
    for (let x = 0; x < state.mapSize.width; x += 80) {
      for (let y = 0; y < state.mapSize.height; y += 80) {
        if ((x * 13 + y * 17) % 5 === 0) {
          octx.fillRect(x, y, 40, 40);
        }
      }
    }

    // Dirt paths leading to the safe house
    octx.fillStyle = '#795548';
    const h = state.houseBounds;
    // Main path to entrance
    const doorX = h.x + h.width / 2;
    const doorY = h.y + h.height;
    octx.fillRect(doorX - 25, doorY, 50, 400);

    // Crossroads
    octx.fillRect(doorX - 300, doorY + 200, 600, 40);

    // Cobblestone pebbles on paths
    octx.fillStyle = '#5d4037';
    for (let px = doorX - 20; px < doorX + 20; px += 15) {
      for (let py = doorY + 10; py < doorY + 380; py += 25) {
        if ((px + py) % 2 === 0) {
          octx.fillRect(px, py, 6, 4);
        }
      }
    }

    // Environmental trees / decorative rocks
    for (let tx = 100; tx < state.mapSize.width; tx += 200) {
      for (let ty = 100; ty < state.mapSize.height; ty += 200) {
        const inHouseZone = (
          tx >= h.x - 100 && tx <= h.x + h.width + 100 &&
          ty >= h.y - 100 && ty <= h.y + h.height + 100
        );
        if (!inHouseZone && (tx + ty) % 3 === 0) {
          // Decorative tree base
          octx.fillStyle = 'rgba(0,0,0,0.2)';
          octx.beginPath();
          octx.ellipse(tx, ty + 10, 20, 8, 0, 0, Math.PI * 2);
          octx.fill();
        }
      }
    }

    this.offscreenGround = off;
  }

  renderGround(state: GameState) {
    if (!this.offscreenGround) {
      this.buildGroundCache(state);
    }
    if (this.offscreenGround) {
      this.ctx.drawImage(this.offscreenGround, 0, 0);
    }
  }

  renderHouseInterior(state: GameState, isEditorMode: boolean) {
    const ctx = this.ctx;
    const h = state.houseBounds;

    // Wood floor planks inside house
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(h.x, h.y, h.width, h.height);

    ctx.fillStyle = '#8b4513';
    ctx.lineWidth = 1;
    for (let y = h.y + 20; y < h.y + h.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(h.x, y);
      ctx.lineTo(h.x + h.width, y);
      ctx.stroke();
    }

    // Walls
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(h.x - 8, h.y - 8, h.width + 16, 12); // Top wall
    ctx.fillRect(h.x - 8, h.y - 8, 12, h.height + 16); // Left wall
    ctx.fillRect(h.x + h.width - 4, h.y - 8, 12, h.height + 16); // Right wall

    // Doorway opening on bottom wall
    const doorX = h.x + h.width / 2;
    ctx.fillRect(h.x - 8, h.y + h.height - 4, doorX - (h.x - 8) - 30, 12);
    ctx.fillRect(doorX + 30, h.y + h.height - 4, (h.x + h.width + 8) - (doorX + 30), 12);

    // Welcome mat
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(doorX - 25, h.y + h.height - 12, 50, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('DOMOV', doorX, h.y + h.height + 2);

    if (isEditorMode) {
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(h.x, h.y, h.width, h.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let x = h.x; x <= h.x + h.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, h.y); ctx.lineTo(x, h.y + h.height); ctx.stroke();
      }
      for (let y = h.y; y <= h.y + h.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(h.x, y); ctx.lineTo(h.x + h.width, y); ctx.stroke();
      }
    }
  }

  renderHouseRoof(state: GameState) {
    const ctx = this.ctx;
    const h = state.houseBounds;
    const playerInHouse = state.isInsideHouse(state.player.x, state.player.y);

    ctx.save();
    // Semi-transparent roof if player is inside so they can see furniture
    ctx.globalAlpha = playerInHouse ? 0.3 : 1.0;

    ctx.fillStyle = '#c0392b'; // Red roof tiles
    ctx.fillRect(h.x - 12, h.y - 20, h.width + 24, 40);

    ctx.fillStyle = '#962d22';
    ctx.fillRect(h.x - 12, h.y + 20, h.width + 24, 6);

    ctx.fillStyle = '#f1c40f';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 BEZPEČNÝ DŮM', h.x + h.width / 2, h.y - 25);

    ctx.restore();
  }

  renderYSortedEntities(state: GameState) {
    const entities: Array<{ y: number; render: () => void }> = [];

    // Furniture
    for (const furn of state.placedFurniture) {
      entities.push({
        y: furn.y,
        render: () => this.renderFurnitureItem(furn)
      });
    }

    // Farms
    for (const farm of state.placedFarms) {
      entities.push({
        y: farm.y,
        render: () => this.renderFarmPlot(farm)
      });
    }

    // Enemies
    for (const enemy of state.enemies) {
      entities.push({
        y: enemy.y,
        render: () => {
          this.renderShadow(enemy.x, enemy.y, enemy.width / 2);
          this.renderEnemySprite(enemy);
        }
      });
    }

    // Player
    entities.push({
      y: state.player.y,
      render: () => {
        this.renderShadow(state.player.x, state.player.y, state.player.width / 2);
        this.renderPlayerSprite(state.player);
      }
    });

    // Trees / Nature
    const h = state.houseBounds;
    for (let tx = 100; tx < state.mapSize.width; tx += 200) {
      for (let ty = 100; ty < state.mapSize.height; ty += 200) {
        const inHouseZone = (
          tx >= h.x - 100 && tx <= h.x + h.width + 100 &&
          ty >= h.y - 100 && ty <= h.y + h.height + 100
        );
        if (!inHouseZone && (tx + ty) % 3 === 0) {
          entities.push({
            y: ty + 10,
            render: () => this.renderTree(tx, ty)
          });
        }
      }
    }

    // Sort by Y coordinate
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) {
      entity.render();
    }
  }

  renderTree(x: number, y: number) {
    const ctx = this.ctx;
    ctx.save();

    // Trunk
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 6, y - 10, 12, 20);

    // Leaves
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.arc(x, y - 30, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(x - 6, y - 36, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderFurnitureItem(furn: any) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(furn.x, furn.y);

    if (furn.id === 'bed' || furn.name.includes('Postel')) {
      // Wood frame
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-18, -12, 36, 24);
      // Sheet
      ctx.fillStyle = '#ecf0f1';
      ctx.fillRect(-16, -10, 32, 20);
      // Pillow
      ctx.fillStyle = '#3498db';
      ctx.fillRect(-14, -8, 10, 16);
    } else if (furn.id === 'sofa' || furn.name.includes('Pohovka')) {
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-20, -10, 40, 20);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-16, -6, 32, 12);
    } else if (furn.id === 'tv' || furn.name.includes('Televize')) {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#34495e';
      ctx.fillRect(-14, -10, 28, 18);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-10, -6, 4, 4); // Screen glow
    } else if (furn.id === 'furn_plant' || furn.name.includes('Rostlina')) {
      ctx.fillStyle = '#d35400';
      ctx.fillRect(-8, 0, 16, 12); // Pot
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(0, -8, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (furn.id === 'furn_chest' || furn.name.includes('Truhla')) {
      ctx.fillStyle = '#795548';
      ctx.fillRect(-14, -10, 28, 20);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-14, -4, 28, 3);
      ctx.fillRect(-2, -2, 4, 6); // Lock
    } else {
      // Table & Chair default
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-14, -10, 28, 20);
    }

    ctx.restore();
  }

  renderFarmPlot(farm: any) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(farm.x, farm.y);

    // Soil plot
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-20, -20, 40, 40);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, 40, 40);

    if (farm.type === 'wheat') {
      ctx.fillStyle = farm.readyForHarvest ? '#f1c40f' : '#27ae60';
      for (let i = -12; i <= 12; i += 8) {
        ctx.fillRect(i, -12, 4, 24);
      }
    } else if (farm.type === 'berry') {
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      if (farm.readyForHarvest) {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-6, -6, 4, 4);
        ctx.fillRect(4, 2, 4, 4);
        ctx.fillRect(-2, 6, 4, 4);
      }
    } else {
      // Water Well
      ctx.fillStyle = '#7f8c8d';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    if (farm.readyForHarvest) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('SKLIZENO! (KLIK)', 0, -24);
    }

    ctx.restore();
  }

  renderPlayerSprite(player: any) {
    const ctx = this.ctx;
    const sheet = this.getPlayerSheet(player.skin);

    let dirIndex = 0; // down
    if (player.direction === 'left') dirIndex = 1;
    else if (player.direction === 'right') dirIndex = 2;
    else if (player.direction === 'up') dirIndex = 3;

    const frame = Math.floor(this.animTime * 6) % 4;

    ctx.save();
    ctx.drawImage(
      sheet,
      dirIndex * 32,
      frame * 32,
      32,
      32,
      player.x - 16,
      player.y - 16,
      32,
      32
    );

    // Attack Slash animation
    if (player.isAttacking) {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.weapon.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderEnemySprite(enemy: any) {
    const ctx = this.ctx;
    const sheet = this.getEnemySheet(enemy.type);

    const frame = Math.floor(this.animTime * 5) % 4;

    ctx.save();
    ctx.drawImage(
      sheet,
      frame * 32,
      0,
      32,
      32,
      enemy.x - 16,
      enemy.y - 16,
      32,
      32
    );

    // Health Bar
    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32, 5);

    ctx.fillStyle = '#c0392b';
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32, 5);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32 * hpPercent, 5);

    // Name Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, enemy.x, enemy.y - 28);

    ctx.restore();
  }

  renderShadow(x: number, y: number, radius: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y + 12, radius, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();
    ctx.restore();
  }

  renderDayNightOverlay(state: GameState, cameraX: number, cameraY: number, vw: number, vh: number) {
    const ctx = this.ctx;
    const hour = state.worldTime.hour;

    let alpha = 0;
    if (hour >= 20 || hour < 5) {
      alpha = 0.5; // Night
    } else if (hour === 18 || hour === 19) {
      alpha = 0.25; // Evening dusk
    } else if (hour === 5 || hour === 6) {
      alpha = 0.2; // Dawn
    }

    if (alpha > 0) {
      ctx.fillStyle = `rgba(15, 20, 45, ${alpha})`;
      ctx.fillRect(cameraX, cameraY, vw, vh);

      // Light glow halos around player, house, and farms at night
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';

      // Player light halo
      const grad = ctx.createRadialGradient(
        state.player.x, state.player.y, 10,
        state.player.x, state.player.y, 120
      );
      grad.addColorStop(0, 'rgba(0,0,0,0.9)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 120, 0, Math.PI * 2);
      ctx.fill();

      // House light halo
      const h = state.houseBounds;
      const hGrad = ctx.createRadialGradient(
        h.x + h.width / 2, h.y + h.height / 2, 40,
        h.x + h.width / 2, h.y + h.height / 2, 220
      );
      hGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
      hGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(h.x + h.width / 2, h.y + h.height / 2, 220, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  renderMinimap(state: GameState) {
    const ctx = this.ctx;
    const size = 120;
    const padding = 12;
    const x = this.canvas.width - size - padding;
    const y = this.canvas.height - size - padding - 30;

    ctx.save();
    ctx.fillStyle = 'rgba(20, 25, 35, 0.85)';
    ctx.strokeStyle = '#4a4a68';
    ctx.lineWidth = 3;
    ctx.fillRect(x, y, size, size);
    ctx.strokeRect(x, y, size, size);

    const scale = size / state.mapSize.width;

    // House
    ctx.fillStyle = '#f39c12';
    const h = state.houseBounds;
    ctx.fillRect(x + h.x * scale, y + h.y * scale, h.width * scale, h.height * scale);

    // Farms
    ctx.fillStyle = '#2ecc71';
    for (const farm of state.placedFarms) {
      ctx.fillRect(x + farm.x * scale - 2, y + farm.y * scale - 2, 5, 5);
    }

    // Enemies
    ctx.fillStyle = '#e74c3c';
    for (const enemy of state.enemies) {
      ctx.fillRect(x + enemy.x * scale - 2, y + enemy.y * scale - 2, 4, 4);
    }

    // Player
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(x + state.player.x * scale, y + state.player.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('MAPA', x + 4, y + 12);

    ctx.restore();
  }

  renderFullMap(state: GameState, targetCanvas: HTMLCanvasElement) {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = targetCanvas.width;
    const height = targetCanvas.height;

    ctx.fillStyle = '#1c3818';
    ctx.fillRect(0, 0, width, height);

    const scaleX = width / state.mapSize.width;
    const scaleY = height / state.mapSize.height;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < width; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
    }

    // House
    ctx.fillStyle = '#f39c12';
    const h = state.houseBounds;
    ctx.fillRect(h.x * scaleX, h.y * scaleY, h.width * scaleX, h.height * scaleY);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(h.x * scaleX, h.y * scaleY, h.width * scaleX, h.height * scaleY);

    // Farms
    ctx.fillStyle = '#2ecc71';
    for (const farm of state.placedFarms) {
      ctx.beginPath();
      ctx.arc(farm.x * scaleX, farm.y * scaleY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Enemies
    ctx.fillStyle = '#e74c3c';
    for (const enemy of state.enemies) {
      ctx.beginPath();
      ctx.arc(enemy.x * scaleX, enemy.y * scaleY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(state.player.x * scaleX, state.player.y * scaleY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
