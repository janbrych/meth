export class PixelArtAssets {
  static createPlayerSheet(skin: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // 4 directions x 32px
    canvas.height = 128; // 4 animation frames x 32px
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Palette per skin
    let bodyColor = '#2980b9'; // Wizard blue
    let hatColor = '#8e44ad';
    let detailColor = '#f1c40f';

    if (skin.includes('Rytíř') || skin.includes('knight')) {
      bodyColor = '#7f8c8d'; // Steel armor
      hatColor = '#95a5a6';  // Helmet
      detailColor = '#e74c3c'; // Plume
    } else if (skin.includes('Nindža') || skin.includes('ninja')) {
      bodyColor = '#2c3e50'; // Dark ninja suit
      hatColor = '#1a252f';  // Cowl
      detailColor = '#c0392b'; // Red sash
    } else if (skin.includes('Robot') || skin.includes('robot')) {
      bodyColor = '#bdc3c7'; // Metal chassis
      hatColor = '#7f8c8d';
      detailColor = '#00ffff'; // Neon cyan eyes
    }

    const directions = ['down', 'left', 'right', 'up'];

    directions.forEach((dir, dirIdx) => {
      for (let frame = 0; frame < 4; frame++) {
        const x = dirIdx * 32;
        const y = frame * 32;

        ctx.save();
        ctx.translate(x + 16, y + 16);

        // Bobbing effect for walking animation
        const bobY = (frame % 2 === 1) ? -2 : 0;
        const legOffset = (frame === 1) ? 3 : (frame === 3 ? -3 : 0);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs / Feet
        ctx.fillStyle = '#111111';
        if (dir === 'left' || dir === 'right') {
          ctx.fillRect(-4 + legOffset, 8 + bobY, 4, 6);
          ctx.fillRect(0 - legOffset, 8 + bobY, 4, 6);
        } else {
          ctx.fillRect(-6 + legOffset, 8 + bobY, 4, 6);
          ctx.fillRect(2 - legOffset, 8 + bobY, 4, 6);
        }

        // Body / Tunic
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-8, -2 + bobY, 16, 12);

        // Belt / Sash
        ctx.fillStyle = detailColor;
        ctx.fillRect(-8, 5 + bobY, 16, 2);

        // Head
        ctx.fillStyle = '#f3c699'; // Skin tone
        ctx.fillRect(-6, -10 + bobY, 12, 10);

        // Face / Eyes / Helmet
        ctx.fillStyle = '#000000';
        if (dir === 'down') {
          if (skin.includes('Robot')) {
            ctx.fillStyle = detailColor; // Glowing cyan
            ctx.fillRect(-4, -7 + bobY, 3, 3);
            ctx.fillRect(1, -7 + bobY, 3, 3);
          } else {
            ctx.fillRect(-4, -7 + bobY, 2, 3);
            ctx.fillRect(2, -7 + bobY, 2, 3);
          }
        } else if (dir === 'left') {
          ctx.fillRect(-5, -7 + bobY, 2, 3);
        } else if (dir === 'right') {
          ctx.fillRect(3, -7 + bobY, 2, 3);
        }

        // Hat / Helmet
        if (skin.includes('Rytíř')) {
          ctx.fillStyle = hatColor;
          ctx.fillRect(-7, -12 + bobY, 14, 5);
          ctx.fillStyle = detailColor;
          ctx.fillRect(-2, -15 + bobY, 4, 4); // Red plume
        } else if (skin.includes('Nindža')) {
          ctx.fillStyle = hatColor;
          ctx.fillRect(-7, -11 + bobY, 14, 6); // Ninja cowl
        } else if (skin.includes('Robot')) {
          ctx.fillStyle = hatColor;
          ctx.fillRect(-7, -12 + bobY, 14, 4);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(-1, -15 + bobY, 2, 4); // Antenna
        } else {
          // Wizard pointy hat
          ctx.fillStyle = hatColor;
          ctx.beginPath();
          ctx.moveTo(-8, -8 + bobY);
          ctx.lineTo(8, -8 + bobY);
          ctx.lineTo(dir === 'right' ? 4 : (dir === 'left' ? -4 : 0), -18 + bobY);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = detailColor;
          ctx.fillRect(-8, -8 + bobY, 16, 2); // Hat band
        }

        ctx.restore();
      }
    });

    return canvas;
  }

  static createEnemySheet(enemyType: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // 4 frames x 32px
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    for (let frame = 0; frame < 4; frame++) {
      const x = frame * 32;
      ctx.save();
      ctx.translate(x + 16, 16);

      const bobY = (frame % 2 === 1) ? -2 : 0;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (enemyType === 'slime') {
        // Slime blob
        const squishX = (frame % 2 === 1) ? 2 : 0;
        const squishY = (frame % 2 === 1) ? -2 : 0;

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.ellipse(0, 4 + squishY, 12 + squishX, 8 - squishY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.ellipse(-3, 6 + squishY, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-5, 0 + squishY, 3, 4);
        ctx.fillRect(2, 0 + squishY, 3, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-4, 1 + squishY, 2, 2);
        ctx.fillRect(3, 1 + squishY, 2, 2);
      } else if (enemyType === 'demon') {
        // Night Demon
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(0, -2 + bobY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(-6, -10 + bobY);
        ctx.lineTo(-10, -18 + bobY);
        ctx.lineTo(-3, -12 + bobY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(6, -10 + bobY);
        ctx.lineTo(10, -18 + bobY);
        ctx.lineTo(3, -12 + bobY);
        ctx.fill();

        // Glowing Eyes
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-5, -4 + bobY, 3, 3);
        ctx.fillRect(2, -4 + bobY, 3, 3);
      } else if (enemyType === 'boss_goblin') {
        // Large Goblin Boss
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-10, -4 + bobY, 20, 16); // Armor torso

        ctx.fillStyle = '#e74c3c'; // Red skin
        ctx.fillRect(-8, -14 + bobY, 16, 10);

        // Helmet & Tusk
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-9, -16 + bobY, 18, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6 + bobY, 2, 4); // Tusks
        ctx.fillRect(4, -6 + bobY, 2, 4);
      } else {
        // Goblin
        ctx.fillStyle = '#e67e22'; // Leather loincloth
        ctx.fillRect(-6, 2 + bobY, 12, 8);

        ctx.fillStyle = '#27ae60'; // Goblin green skin
        ctx.fillRect(-6, -10 + bobY, 12, 12);

        // Pointy ears
        ctx.beginPath();
        ctx.moveTo(-6, -8 + bobY);
        ctx.lineTo(-12, -10 + bobY);
        ctx.lineTo(-6, -4 + bobY);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(6, -8 + bobY);
        ctx.lineTo(12, -10 + bobY);
        ctx.lineTo(6, -4 + bobY);
        ctx.fill();

        // Eyes & Spiked Club
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-4, -7 + bobY, 2, 2);
        ctx.fillRect(2, -7 + bobY, 2, 2);

        ctx.fillStyle = '#795548';
        ctx.fillRect(8, -8 + bobY, 4, 14); // Club
      }

      ctx.restore();
    }

    return canvas;
  }

  static createTileAtlas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 0,0: Lush Grass Base
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#366d2f';
    ctx.fillRect(4, 4, 4, 6);
    ctx.fillRect(20, 14, 4, 6);
    ctx.fillRect(10, 22, 6, 4);

    // 32,0: Grass with Flowers
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(32, 0, 32, 32);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(40, 8, 4, 4);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(41, 9, 2, 2);

    ctx.fillStyle = '#3498db';
    ctx.fillRect(52, 20, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(53, 21, 2, 2);

    // 64,0: Dirt Path
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(64, 0, 32, 32);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(68, 6, 8, 6);
    ctx.fillRect(80, 18, 10, 8);

    // 96,0: House Wood Floor
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(96, 0, 32, 32);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(96, 0, 32, 2);
    ctx.fillRect(96, 16, 32, 2);
    ctx.fillRect(112, 2, 2, 14);
    ctx.fillRect(128 - 4, 18, 2, 14);

    // 128,0: House Timber Wall
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(128, 0, 32, 32);
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(128, 0, 32, 4);
    ctx.fillRect(128, 28, 32, 4);
    ctx.fillRect(128, 0, 4, 32);
    ctx.fillRect(156, 0, 4, 32);

    // 160,0: Roof Tile
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(160, 0, 32, 32);
    ctx.fillStyle = '#962d22';
    ctx.fillRect(160, 8, 32, 2);
    ctx.fillRect(160, 16, 32, 2);
    ctx.fillRect(160, 24, 32, 2);

    return canvas;
  }
}
