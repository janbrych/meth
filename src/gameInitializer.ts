import { GameState } from './gameState';
import { Renderer } from './renderer';
import { AssetLoader } from './assetLoader';
import { sounds } from './audio';

export type InitState = 'uninitialized' | 'initializing' | 'ready' | 'starting' | 'running' | 'error';

export interface InitElements {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  loadingScreen: HTMLElement;
  loadingBarFill: HTMLElement;
  loadingText: HTMLElement;
  btnStartGame: HTMLElement;
  btnRetryLoading: HTMLElement;
  loadingError: HTMLElement;
}

export class GameInitializer {
  private state: InitState = 'uninitialized';
  private errorMessage: string = '';
  private isLoopRunning: boolean = false;

  getState(): InitState {
    return this.state;
  }

  getErrorMessage(): string {
    return this.errorMessage;
  }

  validateElements(doc: Document = document): InitElements {
    const canvas = doc.getElementById('gameCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error('Nenalezen element <canvas id="gameCanvas"> v DOM.');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Nepodařilo se získat CanvasRenderingContext2D. Váš prohlížeč nemusí podporovat 2D Canvas.');
    }

    const loadingScreen = doc.getElementById('loading-screen');
    const loadingBarFill = doc.getElementById('loading-bar-fill');
    const loadingText = doc.getElementById('loading-text');
    const btnStartGame = doc.getElementById('btn-start-game');
    const btnRetryLoading = doc.getElementById('btn-retry-loading');
    const loadingError = doc.getElementById('loading-error');

    if (!loadingScreen || !loadingBarFill || !loadingText || !btnStartGame || !btnRetryLoading || !loadingError) {
      throw new Error('Chybí požadované prvky načítací obrazovky v DOM.');
    }

    return {
      canvas,
      ctx,
      loadingScreen,
      loadingBarFill,
      loadingText,
      btnStartGame,
      btnRetryLoading,
      loadingError
    };
  }

  async initialize(
    state: GameState,
    renderer: Renderer,
    assetLoader: AssetLoader,
    doc: Document = document,
    onProgressUpdate?: (percent: number, statusText: string) => void
  ): Promise<boolean> {
    if (this.state === 'initializing' || this.state === 'running' || this.state === 'starting') {
      return false;
    }

    this.state = 'initializing';
    this.errorMessage = '';

    const updateProgress = (percent: number, statusText: string, elements?: InitElements) => {
      if (elements) {
        if (elements.loadingBarFill) elements.loadingBarFill.style.width = `${percent}%`;
        if (elements.loadingText) elements.loadingText.textContent = statusText;
      }
      if (onProgressUpdate) {
        onProgressUpdate(percent, statusText);
      }
    };

    let elements: InitElements | undefined;

    try {
      updateProgress(10, 'Ověřování rozhraní a Canvas 2D...');
      elements = this.validateElements(doc);

      elements.loadingError.classList.add('hidden');
      elements.loadingError.textContent = '';
      elements.btnRetryLoading.classList.add('hidden');
      elements.btnStartGame.classList.add('hidden');

      updateProgress(25, 'Inicilalizace vykreslovacího systému HiDPI...', elements);
      if (!renderer.ctx || !renderer.canvas) {
        throw new Error('Renderer nemá platný CanvasContext.');
      }

      updateProgress(50, 'Generování sprite sheets a herní grafiky...', elements);
      renderer.initSpriteSheets(state);

      updateProgress(75, 'Vytváření vyrovnávací paměti terénu...', elements);
      renderer.initTerrainCache(state);

      updateProgress(90, 'Načítání doplňkových modulů a audia...', elements);
      await assetLoader.loadAll((p, text) => {
        const mappedPercent = Math.min(99, 90 + Math.floor(p * 0.09));
        updateProgress(mappedPercent, text, elements);
      });

      updateProgress(100, 'Svět připraven! Klikni na tlačítko dole.', elements);
      elements.btnStartGame.classList.remove('hidden');
      elements.btnStartGame.style.display = 'block';

      this.state = 'ready';
      return true;
    } catch (err: any) {
      console.error('Initialization Error:', err);
      this.state = 'error';
      this.errorMessage = err?.message || 'Neznámá chyba při inicializaci hry.';

      if (elements) {
        if (elements.loadingText) elements.loadingText.textContent = '❌ Chyba inicializace!';
        if (elements.loadingError) {
          elements.loadingError.textContent = this.errorMessage;
          elements.loadingError.classList.remove('hidden');
        }
        if (elements.btnRetryLoading) {
          elements.btnRetryLoading.classList.remove('hidden');
          elements.btnRetryLoading.style.display = 'block';
        }
        if (elements.btnStartGame) {
          elements.btnStartGame.classList.add('hidden');
        }
      }
      return false;
    }
  }

  startGame(
    elements: InitElements,
    onStartGame: () => void
  ): boolean {
    if (this.state !== 'ready') {
      return false;
    }

    this.state = 'starting';

    try {
      sounds.init();
      try { sounds.playSuccess(); } catch (_e) {}
    } catch (_e) {}

    if (elements.loadingScreen) {
      elements.loadingScreen.style.display = 'none';
      elements.loadingScreen.classList.add('hidden');
    }

    this.state = 'running';

    if (!this.isLoopRunning) {
      this.isLoopRunning = true;
      onStartGame();
    }

    return true;
  }

  isGameLoopRunning(): boolean {
    return this.isLoopRunning;
  }
}
