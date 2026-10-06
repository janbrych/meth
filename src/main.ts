import './style.css';
import { GameState } from './gameState';
import { Renderer } from './renderer';
import { CombatSystem } from './combatSystem';
import { ShopSystem, SHOP_ITEMS } from './shopSystem';
import { MathQuestion } from './mathGenerator';
import { sounds } from './audio';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

function resizeCanvas() {
  const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  if (w > 0 && h > 0) {
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
  }
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('fullscreenchange', resizeCanvas);
document.addEventListener('webkitfullscreenchange', resizeCanvas);
resizeCanvas();

const state = new GameState();
const renderer = new Renderer(canvas, ctx);
const combatSystem = new CombatSystem();
const shopSystem = new ShopSystem();

const hpBar = document.getElementById('hp-bar') as HTMLElement;
const hpText = document.getElementById('hp-text') as HTMLElement;
const hungerBar = document.getElementById('hunger-bar') as HTMLElement;
const hungerText = document.getElementById('hunger-text') as HTMLElement;
const thirstBar = document.getElementById('thirst-bar') as HTMLElement;
const thirstText = document.getElementById('thirst-text') as HTMLElement;
const timeDisplay = document.getElementById('time-display') as HTMLElement;
const coinCount = document.getElementById('coin-count') as HTMLElement;

const mathModal = document.getElementById('math-modal') as HTMLElement;
const mathQuestionEl = document.getElementById('math-question') as HTMLElement;
const mathOptionsEl = document.getElementById('math-options') as HTMLElement;
const mathFeedbackEl = document.getElementById('math-feedback') as HTMLElement;
const enemyInfoBadge = document.getElementById('enemy-info-badge') as HTMLElement;

const shopModal = document.getElementById('shop-modal') as HTMLElement;
const shopItemsContainer = document.getElementById('shop-items-container') as HTMLElement;
const btnShop = document.getElementById('btn-shop') as HTMLElement;
const btnCloseShop = document.getElementById('btn-close-shop') as HTMLElement;
const btnEditor = document.getElementById('btn-editor') as HTMLElement;
const btnFullscreen = document.getElementById('btn-fullscreen') as HTMLElement;

const mapModal = document.getElementById('map-modal') as HTMLElement;
const mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const btnMap = document.getElementById('btn-map') as HTMLElement;
const btnCloseMap = document.getElementById('btn-close-map') as HTMLElement;

const toastEl = document.getElementById('toast') as HTMLElement;

const loadingScreen = document.getElementById('loading-screen') as HTMLElement;
const loadingBarFill = document.getElementById('loading-bar-fill') as HTMLElement;
const loadingText = document.getElementById('loading-text') as HTMLElement;
const btnStartGame = document.getElementById('btn-start-game') as HTMLElement;

let gameStarted = false;
let isEditorMode = false;
let activeShopTab = 'food';

function startGame(e?: Event) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  gameStarted = true;
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
    loadingScreen.classList.add('hidden');
  }
  try { sounds.playSuccess(); } catch (_e) {}
  resizeCanvas();
}

(window as any).__onGameStart = startGame;
(window as any).__forceStartGame = startGame;

if (btnStartGame) {
  btnStartGame.addEventListener('click', startGame);
  btnStartGame.addEventListener('pointerdown', startGame);
  btnStartGame.addEventListener('touchstart', startGame);
}

// Ensure loading bar finishes and start button turns visible
if (loadingBarFill) loadingBarFill.style.width = '100%';
if (loadingText) loadingText.textContent = 'Příprava sveta dokončena!';
if (btnStartGame) {
  btnStartGame.classList.remove('hidden');
  btnStartGame.style.display = 'block';
}

const keys: { [key: string]: boolean } = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key === ' ' && !isModalOpen()) {
    triggerAttack();
  }
  if ((e.key === 'e' || e.key === 'E') && !isModalOpen()) {
    toggleEditorMode();
  }
  if ((e.key === 'b' || e.key === 'B') && !isModalOpen()) {
    openShop();
  }
  if ((e.key === 'm' || e.key === 'M') && !isModalOpen()) {
    openMap();
  }
  if ((e.key === 'f' || e.key === 'F') && !isModalOpen()) {
    toggleFullscreen();
  }
  if (e.key === 'Escape') {
    closeShop();
    closeMap();
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('click', (e) => {
  if (isModalOpen()) return;

  if (isEditorMode) {
    const cameraX = state.player.x - canvas.width / 2;
    const cameraY = state.player.y - canvas.height / 2;
    const worldX = e.clientX + cameraX;
    const worldY = e.clientY + cameraY;

    if (state.isInsideHouse(worldX, worldY)) {
      showToast('🪑 Předmět v domě přesunut!');
      sounds.playHit();
    } else {
      showToast('❌ Nábytek lze stavět pouze uvnitř bezpečné základny!');
    }
  } else {
    checkFarmHarvest();
    triggerAttack();
  }
});

function isModalOpen(): boolean {
  return !gameStarted || !mathModal.classList.contains('hidden') || !shopModal.classList.contains('hidden') || !mapModal.classList.contains('hidden');
}

function showToast(msg: string) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2500);
}

function triggerAttack() {
  state.player.isAttacking = true;
  sounds.playHit();

  setTimeout(() => {
    state.player.isAttacking = false;
  }, 150);

  combatSystem.checkMeleeAttack(state, (enemy, question) => {
    openMathModal(enemy, question);
  });
}

function checkFarmHarvest() {
  for (const farm of state.placedFarms) {
    const dist = Math.hypot(farm.x - state.player.x, farm.y - state.player.y);
    if (dist < 40 && farm.readyForHarvest) {
      farm.readyForHarvest = false;
      if (farm.type === 'wheat') {
        state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 30);
        showToast('🌾 Sklizeno pšeničné pole (+30 Hlad)!');
      } else if (farm.type === 'berry') {
        state.player.hunger = Math.min(state.player.maxHunger, state.player.hunger + 20);
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
        showToast('🫐 Sklizeno čerstvé ovoce (+20 Hlad, +10 HP)!');
      } else {
        state.player.thirst = Math.min(state.player.maxThirst, state.player.thirst + 40);
        showToast('🚰 Vyčerpána studna (+40 Žízeň)!');
      }
      sounds.playCoin();
    }
  }
}

function toggleEditorMode() {
  if (!state.isInsideHouse(state.player.x, state.player.y)) {
    showToast('⚠️ Musíš být uvnitř domu pro zapnutí Editoru Základny!');
    return;
  }
  isEditorMode = !isEditorMode;
  btnEditor.style.background = isEditorMode ? '#e67e22' : '#34495e';
  showToast(isEditorMode ? '🏠 Režim Editoru Domu ZAPNUT!' : '🏠 Režim Editoru Domu VYPNUT');
}

function openMathModal(enemy: any, question: MathQuestion) {
  enemyInfoBadge.textContent = `${enemy.name} (Obtížnost: ${question.difficulty.toUpperCase()})`;
  mathQuestionEl.textContent = question.question;
  mathFeedbackEl.textContent = '';
  mathOptionsEl.innerHTML = '';

  question.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn pixel-btn';
    btn.textContent = opt;
    btn.onclick = () => handleMathAnswer(opt);
    mathOptionsEl.appendChild(btn);
  });

  mathModal.classList.remove('hidden');
}

function handleMathAnswer(chosenOption: string) {
  combatSystem.processAnswer(
    chosenOption,
    state,
    (coinsEarned, enemyKilled) => {
      if (enemyKilled) {
        sounds.playSuccess();
        sounds.playCoin();
        showToast(`🎉 Nepřítel poražen! Získal/a jsi ${coinsEarned} mincí!`);
      } else {
        sounds.playHit();
        showToast('⚔️ Zásah! Nepřítel byl zasažen!');
      }
      mathModal.classList.add('hidden');
    },
    (damageTaken) => {
      sounds.playError();
      showToast(`❌ Špatně! Nepřítel ti uštědřil ${damageTaken} poškození!`);
      mathModal.classList.add('hidden');
    }
  );
}

btnShop.onclick = () => openShop();
btnCloseShop.onclick = () => closeShop();
btnEditor.onclick = () => toggleEditorMode();
btnFullscreen.onclick = () => toggleFullscreen();
btnMap.onclick = () => openMap();
btnCloseMap.onclick = () => closeMap();

function openMap() {
  renderer.renderFullMap(state, mapCanvas);
  mapModal.classList.remove('hidden');
}

function closeMap() {
  mapModal.classList.add('hidden');
}

function toggleFullscreen() {
  const elem = document.documentElement as any;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => resizeCanvas()).catch((err: any) => {
        showToast(`Chyba celoobrazovkového režimu: ${err.message}`);
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => resizeCanvas());
    }
  }
}

function openShop() {
  renderShopItems();
  shopModal.classList.remove('hidden');
}

function closeShop() {
  shopModal.classList.add('hidden');
}

document.querySelectorAll('.shop-tabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.shop-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
    const target = e.target as HTMLElement;
    target.classList.add('active');
    activeShopTab = target.getAttribute('data-tab') || 'food';
    renderShopItems();
  });
});

function renderShopItems() {
  shopItemsContainer.innerHTML = '';
  const filtered = SHOP_ITEMS.filter((i) => i.category === activeShopTab);

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'shop-card pixel-panel';
    card.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div style="font-weight:bold;">${item.name}</div>
      <div style="color: #aaa; font-size: 8px;">${item.description}</div>
      <div style="color: #f1c40f; margin-top: 4px;">🪙 ${item.price} mincí</div>
      <button class="pixel-btn buy-btn" style="margin-top: 6px; width: 100%;">Koupit</button>
    `;

    const buyBtn = card.querySelector('.buy-btn') as HTMLButtonElement;
    buyBtn.onclick = () => {
      const res = shopSystem.buyItem(item.id, state);
      if (res.success) {
        sounds.playCoin();
        showToast(res.message);
      } else {
        sounds.playError();
        showToast(res.message);
      }
    };

    shopItemsContainer.appendChild(card);
  });
}

function update(_dt: number) {
  if (isModalOpen()) return;

  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['arrowup']) { dy -= 1; state.player.direction = 'up'; }
  if (keys['s'] || keys['arrowdown']) { dy += 1; state.player.direction = 'down'; }
  if (keys['a'] || keys['arrowleft']) { dx -= 1; state.player.direction = 'left'; }
  if (keys['d'] || keys['arrowright']) { dx += 1; state.player.direction = 'right'; }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  state.player.x = Math.max(20, Math.min(state.mapSize.width - 20, state.player.x + dx * state.player.speed));
  state.player.y = Math.max(20, Math.min(state.mapSize.height - 20, state.player.y + dy * state.player.speed));

  for (const enemy of state.enemies) {
    const edx = state.player.x - enemy.x;
    const edy = state.player.y - enemy.y;
    const dist = Math.hypot(edx, edy);

    const inHouse = state.isInsideHouse(state.player.x, state.player.y);
    if (dist < 350 && dist > 30 && !inHouse) {
      enemy.x += (edx / dist) * enemy.speed;
      enemy.y += (edy / dist) * enemy.speed;
    }
  }

  state.updateTime();
  state.updateSurvival();

  updateHUD();
}

function updateHUD() {
  hpBar.style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;
  hpText.textContent = `${Math.ceil(state.player.hp)}/${state.player.maxHp}`;

  hungerBar.style.width = `${state.player.hunger}%`;
  hungerText.textContent = `${Math.ceil(state.player.hunger)}%`;

  thirstBar.style.width = `${state.player.thirst}%`;
  thirstText.textContent = `${Math.ceil(state.player.thirst)}%`;

  const hourStr = state.worldTime.hour.toString().padStart(2, '0');
  const minStr = state.worldTime.minute.toString().padStart(2, '0');
  const icon = state.worldTime.isNight ? '🌙' : '🌞';
  timeDisplay.textContent = `${icon} Den ${state.worldTime.day} | ${hourStr}:${minStr}`;

  coinCount.textContent = state.player.coins.toString();
}

function loop() {
  renderer.render(state, isEditorMode);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
