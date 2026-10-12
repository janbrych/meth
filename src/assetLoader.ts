export interface LoadedAssets {
  images: Record<string, HTMLImageElement>;
}

export class AssetLoader {
  private imagesToLoad: Record<string, string> = {};
  private loadedImages: Record<string, HTMLImageElement> = {};

  registerImage(key: string, url: string) {
    this.imagesToLoad[key] = url;
  }

  async loadAll(onProgress: (percent: number, statusText: string) => void): Promise<LoadedAssets> {
    const keys = Object.keys(this.imagesToLoad);
    const total = keys.length;

    if (total === 0) {
      onProgress(100, 'Příprava herního světa...');
      return { images: this.loadedImages };
    }

    let completed = 0;

    for (const key of keys) {
      const url = this.imagesToLoad[key];
      onProgress(
        Math.floor((completed / total) * 100),
        `Načítání grafických prvků: ${key} (${completed + 1}/${total})...`
      );

      try {
        const img = await this.loadImage(url);
        this.loadedImages[key] = img;
      } catch (err) {
        console.warn(`Nepodařilo se načíst obrázek ${key} z ${url}, vytvářím záložní texturu.`, err);
        this.loadedImages[key] = this.createFallbackTexture(key);
      }

      completed++;
      onProgress(
        Math.floor((completed / total) * 100),
        `Grafické prvky načteny (${completed}/${total})`
      );
    }

    onProgress(100, 'Příprava herního světa a rendereru...');
    return { images: this.loadedImages };
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  private createFallbackTexture(key: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillRect(32, 32, 32, 32);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(key, 4, 36);
    }
    const fallbackImg = new Image();
    fallbackImg.src = canvas.toDataURL();
    return fallbackImg;
  }
}
