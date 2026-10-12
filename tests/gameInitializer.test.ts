import test from 'node:test';
import assert from 'node:assert';
import { GameInitializer } from '../src/gameInitializer';
import { GameState } from '../src/gameState';
import { Renderer } from '../src/renderer';
import { AssetLoader } from '../src/assetLoader';

function createMockDocument(hasCanvas = true, hasContext = true, hasLoadingScreen = true) {
  const elementsMap: Record<string, any> = {};

  const mockCtx = hasContext ? {
    imageSmoothingEnabled: false,
    fillRect: () => {},
    clearRect: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    beginPath: () => {},
    ellipse: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillText: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    strokeRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
  } : null;

  const mockCanvas = hasCanvas ? {
    width: 800,
    height: 600,
    style: {},
    getContext: (type: string) => (type === '2d' ? mockCtx : null),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
  } : null;

  elementsMap['gameCanvas'] = mockCanvas;

  if (hasLoadingScreen) {
    const ids = ['loading-screen', 'loading-bar-fill', 'loading-text', 'btn-start-game', 'btn-retry-loading', 'loading-error'];
    for (const id of ids) {
      const classes = new Set<string>();
      elementsMap[id] = {
        id,
        style: {},
        textContent: '',
        classList: {
          add: (cls: string) => classes.add(cls),
          remove: (cls: string) => classes.delete(cls),
          contains: (cls: string) => classes.has(cls),
        }
      };
    }
  }

  return {
    doc: {
      getElementById: (id: string) => elementsMap[id] || null
    } as unknown as Document,
    elementsMap,
    mockCanvas,
    mockCtx
  };
}

test('GameInitializer reaches ready state when DOM and Canvas are valid', async () => {
  const { doc } = createMockDocument(true, true);
  const initializer = new GameInitializer();
  const state = new GameState();

  const mockRenderer = {
    canvas: {} as any,
    ctx: {} as any,
    initSpriteSheets: () => {},
    initTerrainCache: () => {},
  } as unknown as Renderer;

  const assetLoader = new AssetLoader();

  assert.strictEqual(initializer.getState(), 'uninitialized');

  const success = await initializer.initialize(state, mockRenderer, assetLoader, doc);

  assert.strictEqual(success, true);
  assert.strictEqual(initializer.getState(), 'ready');
});

test('GameInitializer enters error state when canvas or context is missing', async () => {
  const { doc } = createMockDocument(false, false);
  const initializer = new GameInitializer();
  const state = new GameState();

  const mockRenderer = {
    canvas: null,
    ctx: null,
  } as unknown as Renderer;

  const assetLoader = new AssetLoader();

  const success = await initializer.initialize(state, mockRenderer, assetLoader, doc);

  assert.strictEqual(success, false);
  assert.strictEqual(initializer.getState(), 'error');
  assert.ok(initializer.getErrorMessage().includes('Nenalezen element'));
});

test('GameInitializer allows retrying initialization after a failure', async () => {
  let mock = createMockDocument(false, false);
  const initializer = new GameInitializer();
  const state = new GameState();

  const mockRenderer = {
    canvas: {} as any,
    ctx: {} as any,
    initSpriteSheets: () => {},
    initTerrainCache: () => {},
  } as unknown as Renderer;

  const assetLoader = new AssetLoader();

  let success = await initializer.initialize(state, mockRenderer, assetLoader, mock.doc);
  assert.strictEqual(success, false);
  assert.strictEqual(initializer.getState(), 'error');

  mock = createMockDocument(true, true);
  success = await initializer.initialize(state, mockRenderer, assetLoader, mock.doc);
  assert.strictEqual(success, true);
  assert.strictEqual(initializer.getState(), 'ready');
});

test('GameInitializer startGame only enables running state when ready and prevents duplicate loops', async () => {
  const mock = createMockDocument(true, true);
  const initializer = new GameInitializer();
  const state = new GameState();

  const mockRenderer = {
    canvas: {} as any,
    ctx: {} as any,
    initSpriteSheets: () => {},
    initTerrainCache: () => {},
  } as unknown as Renderer;

  const assetLoader = new AssetLoader();

  const elements = initializer.validateElements(mock.doc);

  let loopCount = 0;
  const onStart = () => { loopCount++; };

  assert.strictEqual(initializer.startGame(elements, onStart), false);
  assert.strictEqual(loopCount, 0);

  await initializer.initialize(state, mockRenderer, assetLoader, mock.doc);
  assert.strictEqual(initializer.getState(), 'ready');

  assert.strictEqual(initializer.startGame(elements, onStart), true);
  assert.strictEqual(initializer.getState(), 'running');
  assert.strictEqual(loopCount, 1);

  assert.strictEqual(initializer.startGame(elements, onStart), false);
  assert.strictEqual(loopCount, 1);
});
