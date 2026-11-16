// ============================================================
// CARROSSEL SINCRONIZADO COM LOOP PING-PONG DE 22s
// - Texturas pré-carregadas e enviadas para a GPU no init()
// - Aspectos e UVs (cover-fit) pré-calculados por imagem
// - Promise resolvida apenas quando tudo estiver pronto
// ============================================================

const CAROUSEL_CONFIG = {
  images: [
    'tudo/obts/fundo.jpg',
    'tudo/obts/fundo2.jpg',
    'tudo/obts/fundo3.jpg'
  ],

  // Duração total do loop (deve casar com o shader)
  cycleDuration: 22.0,

  // Duração do fade entre imagens (em segundos)
  fadeDuration: 1.0,

  // Momento do ciclo em que a troca é disparada.
  // 11.0 = pico do ping-pong (fim da ida, início da volta)
  swapAt: 11.0
};

// ============================================================
// FILA EMBARALHADA (Fisher-Yates) SEM REPETIÇÃO
// ============================================================
function shuffledCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class ImageQueue {
  constructor(sources) {
    this.sources = sources;
    this.queue = [];
    this.lastServed = null;
    this.refill();
  }

  refill() {
    this.queue = shuffledCopy(this.sources);
    if (this.queue.length > 1 && this.queue[0] === this.lastServed) {
      [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
    }
  }

  next() {
    if (this.queue.length === 0) this.refill();
    const src = this.queue.shift();
    this.lastServed = src;
    return src;
  }
}

// ============================================================
// CARREGADOR DE IMAGENS
// ============================================================
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
    img.src = src;
  });
}

// ============================================================
// CARROSSEL
// ============================================================
class Carousel {
  constructor(gl, config) {
    this.gl     = gl;
    this.config = config;
    this.queue  = new ImageQueue(config.images);

    // ---- Caches preenchidos em init() (nada é calculado em runtime) ----
    this.loaded   = new Map(); // src -> HTMLImageElement
    this.aspects  = new Map(); // src -> aspect (iw / ih)
    this.textures = new Map(); // src -> WebGLTexture (já na GPU)
    this.uvScales = new Map(); // src -> { sx, sy } (cover-fit vs canvasAspect)

    // ---- Referências ativas (trocadas por ponteiro, sem recriar) ----
    this.texA = null; // textura atual
    this.texB = null; // próxima (durante o fade)

    // ---- Estado do canvas ----
    this.canvasAspect = 1.0;

    // ---- Estado da transição ----
    this.currentSrc      = null;
    this.pendingSrc      = null;
    this.transition      = 0.0;
    this.transitioning   = false;
    this.transitionStart = 0.0;

    // ---- Controle de ciclo ----
    this.lastIntervalIndex = -1;

    this.ready       = false;
    this.imageAspect = 1.0;
  }

  // ----------------------------------------------------------
  // GPU / texturas
  // ----------------------------------------------------------
  _createTexture() {
    const gl  = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return tex;
  }

  _uploadTo(tex, img) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  }

  // ----------------------------------------------------------
  // Aspect / UVs
  // ----------------------------------------------------------
  _readCanvasAspect() {
    const canvas = this.gl.canvas;
    const w = canvas.width  || 1;
    const h = canvas.height || 1;
    return w / h;
  }

  // Escala "cover": preenche o canvas mantendo proporção da imagem
  _computeUVScale(src) {
    const imgAspect    = this.aspects.get(src);
    const canvasAspect = this.canvasAspect;
    let sx = 1.0, sy = 1.0;
    if (imgAspect > canvasAspect) {
      // imagem mais "larga" que o canvas → encolhe X
      sx = canvasAspect / imgAspect;
    } else {
      // imagem mais "alta" que o canvas → encolhe Y
      sy = imgAspect / canvasAspect;
    }
    return { sx, sy };
  }

  _recomputeAllUVScales() {
    for (const src of this.config.images) {
      this.uvScales.set(src, this._computeUVScale(src));
    }
  }

  // ----------------------------------------------------------
  // Resize — recalcula apenas UVs, nunca refaz upload de textura
  // ----------------------------------------------------------
  resize() {
    if (!this.ready) return;
    const newAspect = this._readCanvasAspect();
    if (newAspect === this.canvasAspect) return;
    this.canvasAspect = newAspect;
    this._recomputeAllUVScales();
  }

  // ----------------------------------------------------------
  // Init assíncrono — resolve quando tudo estiver pronto
  // ----------------------------------------------------------
  async init() {
    // 1) Preload de TODAS as imagens
    const imgs = await Promise.all(this.config.images.map(loadImage));

    // 2) Upload de TODAS as texturas para a GPU + pré-cálculo de aspectos
    this.config.images.forEach((src, i) => {
      const img = imgs[i];
      this.loaded.set(src, img);
      this.aspects.set(src, img.naturalWidth / img.naturalHeight);

      const tex = this._createTexture();
      this._uploadTo(tex, img);          // já sobe para a GPU agora
      this.textures.set(src, tex);
    });

    // 3) Aspecto do canvas + UVs "cover" de cada imagem
    this.canvasAspect = this._readCanvasAspect();
    this._recomputeAllUVScales();

    // 4) Primeira imagem pronta para exibição
    const firstSrc  = this.queue.next();
    this.currentSrc = firstSrc;
    this.texA       = this.textures.get(firstSrc);
    this.texB       = this.texA;        // evita null antes do 1º swap
    this.imageAspect = this.aspects.get(firstSrc);

    this.ready = true;
  }

  // ----------------------------------------------------------
  // Loop
  // ----------------------------------------------------------
  update(elapsed, loopTime) {
    if (!this.ready) return;

    // Transição exatamente a cada 11 segundos
    const interval = 11.0;
    const intervalIndex = Math.floor(elapsed / interval);

    if (this.lastIntervalIndex === -1) {
      this.lastIntervalIndex = intervalIndex;
    } else if (intervalIndex !== this.lastIntervalIndex) {
      if (!this.transitioning) {
        this._beginTransition(elapsed);
      }
      this.lastIntervalIndex = intervalIndex;
    }

    // Avança a transição
    if (this.transitioning) {
      const dt = elapsed - this.transitionStart;
      this.transition = Math.min(dt / this.config.fadeDuration, 1.0);

      if (this.transition >= 1.0) {
        this.transition = 1.0;
        this._commitTransition();
      }
    }
  }

  _beginTransition(elapsed) {
    const nextSrc = this.queue.next();
    if (nextSrc === this.currentSrc) return;

    const tex = this.textures.get(nextSrc);
    if (!tex) return;

    // ---- Zero trabalho de GPU aqui: textura já está pronta ----
    this.texB            = tex;
    this.pendingSrc      = nextSrc;
    this.transition      = 0.0;
    this.transitionStart = elapsed;
    this.transitioning   = true;
  }

  _commitTransition() {
    // Troca apenas de referência
    this.texA = this.texB;

    this.currentSrc = this.pendingSrc;
    this.pendingSrc = null;

    this.transition    = 0.0;
    this.transitioning = false;

    this.imageAspect = this.aspects.get(this.currentSrc);
  }

  // ----------------------------------------------------------
  // Getters (lidos pelo shader/render, sem nenhum cálculo)
  // ----------------------------------------------------------
  getTextureA()     { return this.texA; }
  getTextureB()     { return this.texB; }
  getTransition()   { return this.transition; }
  hasPending()      { return this.pendingSrc !== null; }
  getAspectA()      { return this.aspects.get(this.currentSrc) || 1.0; }
  getAspectB()      { return this.pendingSrc ? (this.aspects.get(this.pendingSrc) || 1.0) : this.getAspectA(); }
  getUVScale()      { return this.uvScales.get(this.currentSrc) || { sx: 1, sy: 1 }; }
  getCanvasAspect() { return this.canvasAspect; }
}