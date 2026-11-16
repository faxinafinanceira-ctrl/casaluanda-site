// ============================================================
// DETECÇÃO DE CAPACIDADES DO DISPOSITIVO (device-detect.js)
// ============================================================
function isMobileDevice() {
  const hasTouch =
    ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0) ||
    ('msMaxTouchPoints' in navigator && navigator.msMaxTouchPoints > 0);

  const pointerCoarse = window.matchMedia('(pointer: coarse)').matches;
  const hoverNone = window.matchMedia('(hover: none)').matches;
  const bp = (window.APP_CONFIG && window.APP_CONFIG.mobileNavigation && typeof window.APP_CONFIG.mobileNavigation.breakpointWidth === 'number')
    ? window.APP_CONFIG.mobileNavigation.breakpointWidth
    : 1024;
  const mobileWidth = window.innerWidth <= bp;

  return hasTouch && (pointerCoarse || hoverNone) && mobileWidth;
}
window.isMobileDevice = isMobileDevice;

// Aplicação imediata do estado de bloqueio no ciclo de vida da página para mobile
(function applyInitialMobileLock() {
  if (typeof isMobileDevice === 'function' && isMobileDevice()) {
    const applyClass = () => {
      const isEnabled = !(window.APP_CONFIG && window.APP_CONFIG.mobileNavigation && window.APP_CONFIG.mobileNavigation.enabled === false);
      if (isEnabled && !window.__isMobileUnlocked) {
        document.body.classList.add('is-mobile-device', 'is-mobile-locked');
        window.scrollTo(0, 0);
      }
    };
    if (document.body) {
      applyClass();
    } else {
      document.addEventListener('DOMContentLoaded', applyClass);
    }
  }
})();

// ============================================================
// CONFIGURAÇÕES GERAIS
// ============================================================
const CONFIG = {
  radius: 40,
  closingSpeed: 0.011
};

// ============================================================
// MAGNITUDE DE ESCALA — Fórmula baseada em window.innerWidth
// ============================================================
const MOTION_CONFIG = {
  mobileReferenceWidth: 480,   // largura até a qual mantemos movimento cheio
  dampingFactor: 1.2           // constante ajustável de amortecimento
};

function computeMotionMagnitude() {
  // Acessibilidade primeiro
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return 0.0;

  const w = window.innerWidth;
  const ref = MOTION_CONFIG.mobileReferenceWidth;
  const damp = MOTION_CONFIG.dampingFactor;

  if (w <= ref) return 1.0;

  const excess = (w - ref) / ref;
  return 1.0 / (1.0 + damp * excess);
}

// ============================================================
// PARÂMETROS DO SHADER (valores-alvo + magnitude global)
// ============================================================
const SHADER_PARAMS = {
  uImageAspect:     16.0 / 9.0, // será sobrescrito quando a imagem carregar
  uBlurIntensity:   80.0,
  uTintIntensity:   0.75,
  uGrainIntensity:  0.16,
  uShimmerSpeed:    2.0,
  uShimmerStrength: 0.2
};

function uploadUniforms(gl, program, elapsed) {
  const uTime            = gl.getUniformLocation(program, 'uTime');
  const uResolution      = gl.getUniformLocation(program, 'uResolution');
  const uTrail           = gl.getUniformLocation(program, 'uTrail');
  const uTextureA        = gl.getUniformLocation(program, 'uTextureA');
  const uTextureB        = gl.getUniformLocation(program, 'uTextureB');
  const uTransition      = gl.getUniformLocation(program, 'uTransition');
  const uHasB            = gl.getUniformLocation(program, 'uHasB');
  const uMotionMagnitude = gl.getUniformLocation(program, 'uMotionMagnitude');
  const uImageAspectA    = gl.getUniformLocation(program, 'uImageAspectA');
  const uImageAspectB    = gl.getUniformLocation(program, 'uImageAspectB');
  const uBlurIntensity   = gl.getUniformLocation(program, 'uBlurIntensity');
  const uTintIntensity   = gl.getUniformLocation(program, 'uTintIntensity');
  const uGrainIntensity  = gl.getUniformLocation(program, 'uGrainIntensity');
  const uShimmerSpeed    = gl.getUniformLocation(program, 'uShimmerSpeed');
  const uShimmerStrength = gl.getUniformLocation(program, 'uShimmerStrength');

  gl.uniform1f(uTime, elapsed);
  gl.uniform2f(uResolution, canvas.width, canvas.height);
  gl.uniform1i(uTrail, 0);
  gl.uniform1i(uTextureA, 1);
  gl.uniform1i(uTextureB, 2);

  const transition = carousel ? carousel.getTransition() : 0.0;
  const hasB       = carousel && carousel.hasPending() ? 1.0 : 0.0;
  const aspectA    = carousel ? carousel.getAspectA() : SHADER_PARAMS.uImageAspect;
  const aspectB    = carousel ? carousel.getAspectB() : SHADER_PARAMS.uImageAspect;

  gl.uniform1f(uTransition, transition);
  gl.uniform1f(uHasB, hasB);
  gl.uniform1f(uMotionMagnitude, computeMotionMagnitude());
  gl.uniform1f(uImageAspectA, aspectA);
  gl.uniform1f(uImageAspectB, aspectB);
  gl.uniform1f(uBlurIntensity, SHADER_PARAMS.uBlurIntensity);
  gl.uniform1f(uTintIntensity, SHADER_PARAMS.uTintIntensity);

  // Desativa o ruído de grão ao rolar até a seção de eventos e altera a opacidade do #glCanvas
  const evSec = document.getElementById('ultimos-eventos') || document.querySelector('.eventos-section');
  let currentGrain = SHADER_PARAMS.uGrainIntensity;
  if (evSec && evSec.offsetHeight > 0 && !document.body.classList.contains('is-mobile-locked')) {
    const rect = evSec.getBoundingClientRect();
    const glCanvasEl = document.getElementById('glCanvas');
    if (rect.top <= 0) {
      currentGrain = 0.0;
      if (glCanvasEl) glCanvasEl.style.opacity = '0';
    } else {
      if (glCanvasEl) glCanvasEl.style.opacity = '1';
    }
  } else {
    const glCanvasEl = document.getElementById('glCanvas');
    if (glCanvasEl && !glCanvasEl.style.opacity) {
      glCanvasEl.style.opacity = '1';
    }
  }
  gl.uniform1f(uGrainIntensity, currentGrain);

  gl.uniform1f(uShimmerSpeed, SHADER_PARAMS.uShimmerSpeed);
  gl.uniform1f(uShimmerStrength, SHADER_PARAMS.uShimmerStrength);
}

// ============================================================
// UTILIDADES
// ============================================================
function mix(a, b, t) {
  return a * (1.0 - t) + b * t;
}

// ============================================================
// ANIMAÇÃO — valores-alvo (movimento cheio, igual ao mobile).
// A magnitude é aplicada DEPOIS, dentro do shader.
// ============================================================
function getAnimParams(elapsed) {
  const cycle = 20.0;
  const t = elapsed % cycle / cycle;

  let scale   = 1.25;
  let offsetX = 0.0;
  let offsetY = 0.0;

  if (t < 0.2) {
    const p = t / 0.2;
    scale   = mix(1.25, 1.40, p);
    offsetX = mix(0.0, 0.5, p);
    offsetY = mix(0.0, -0.5, p);
  } else if (t < 0.6) {
    const p = (t - 0.2) / 0.4;
    scale   = 1.40;
    offsetX = mix(0.5, -0.5, p);
    offsetY = -0.5;
  } else if (t < 0.8) {
    const p = (t - 0.6) / 0.2;
    scale   = 1.40;
    offsetX = mix(-0.5, 0.5, p);
    offsetY = mix(-0.5, 0.5, p);
  } else {
    const p = (t - 0.8) / 0.2;
    scale   = 1.40;
    offsetX = mix(0.5, 0.0, p);
    offsetY = mix(0.5, 0.5, p);
  }

  return {
    scale:   scale,
    offsetX: offsetX * (1.0 - 1.0 / scale),
    offsetY: offsetY * (1.0 - 1.0 / scale)
  };
}

// ============================================================
// CANVAS / WEBGL
// ============================================================
const trailCanvas = document.createElement('canvas');
const trailCtx    = trailCanvas.getContext('2d');
const canvas      = document.getElementById('glCanvas');

const gl = canvas ? canvas.getContext('webgl', {
  alpha: false,
  antialias: false,
  powerPreference: "high-performance"
}) : null;

if (!gl) {
  console.error('WebGL não disponível neste navegador. Ativando degradação graciosa para o CSS.');
  if (canvas) canvas.style.display = 'none';
}

function resize() {
  if (!gl || !canvas) return;
  const parent = canvas.parentElement || document.body;
  const w = parent.clientWidth || window.innerWidth;
  const h = parent.clientHeight || window.innerHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width  = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  trailCanvas.width  = Math.max(1, Math.floor(w / 2));
  trailCanvas.height = Math.max(1, Math.floor(h / 2));
  trailCtx.fillStyle = 'black';
  trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
}
resize();
window.addEventListener('resize', resize);

// ============================================================
// MOUSE / TOUCH (Limitado à Seção Hero para não interferir em outras seções)
// ============================================================
let mouse = {
  x: 0.5, y: 0.5,
  lastX: 0.5, lastY: 0.5,
  hovering: false,
  moved: false
};

window.addEventListener('mousemove', e => {
  const hero = document.getElementById('hero');
  if (hero) {
    const rect = hero.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) {
      mouse.hovering = false;
      return;
    }
  }
  mouse.lastX = mouse.x;
  mouse.lastY = mouse.y;
  mouse.x = e.clientX / window.innerWidth;
  mouse.y = e.clientY / window.innerHeight;
  mouse.hovering = true;
  mouse.moved = true;
});

window.addEventListener('touchmove', e => {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const hero = document.getElementById('hero');
    if (hero) {
      const rect = hero.getBoundingClientRect();
      if (touch.clientY < rect.top || touch.clientY > rect.bottom) {
        mouse.hovering = false;
        return;
      }
    }
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    mouse.x = touch.clientX / window.innerWidth;
    mouse.y = touch.clientY / window.innerHeight;
    mouse.hovering = true;
    mouse.moved = true;
  }
}, { passive: true });

document.addEventListener('mouseleave', () => {
  mouse.hovering = false;
  mouse.moved = false;
});

window.addEventListener('touchend', () => {
  mouse.hovering = false;
  mouse.moved = false;
});

// ============================================================
// TEXTURA DO FUNDO E ESTADOS GLOBAIS
// ============================================================
const bgTexture = gl ? gl.createTexture() : null;

// ============================================================
// CARROSSEL WEBGL E CONTROLE DE RENDERIZAÇÃO
// ============================================================
let carousel = null;
let renderEventos = null; // Declarado previamente no topo para evitar ReferenceError (TDZ)
let isHeroVisible = true;
let heroRafId = null;

if (gl) {
  carousel = new Carousel(gl, CAROUSEL_CONFIG);
  carousel.init()
    .then(() => console.log('Carrossel inicializado com sucesso.'))
    .catch(err => console.error('Erro ao inicializar carrossel:', err));
}

// ============================================================
// COMPILADORES WEBGL REUTILIZÁVEIS
// ============================================================
function compileShader(glContext, type, src) {
  const s = glContext.createShader(type);
  glContext.shaderSource(s, src);
  glContext.compileShader(s);
  if (!glContext.getShaderParameter(s, glContext.COMPILE_STATUS)) {
    console.error('Erro de compilação no shader:', glContext.getShaderInfoLog(s));
    glContext.deleteShader(s);
    return null;
  }
  return s;
}

function linkProgram(glContext, vs, fs) {
  const p = glContext.createProgram();
  glContext.attachShader(p, vs);
  glContext.attachShader(p, fs);
  glContext.linkProgram(p);
  if (!glContext.getProgramParameter(p, glContext.LINK_STATUS)) {
    console.error('Erro ao linkar programa:', glContext.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ============================================================
// PROGRAMA WEBGL HERO (glCanvas)
// ============================================================
let program;
let positionBuffer;

if (gl) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  program = linkProgram(gl, vs, fs);

  if (program) {
    gl.useProgram(program);
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
  }
}

// ============================================================
// TEXTURA DO TRAIL
// ============================================================
const trailTexture = gl ? gl.createTexture() : null;

if (gl && trailTexture) {
  gl.bindTexture(gl.TEXTURE_2D, trailTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

// ============================================================
// LOOP PRINCIPAL
// ============================================================
const t0 = performance.now();

function frame() {
  if (!isHeroVisible) {
    heroRafId = null;
    return;
  }
  heroRafId = requestAnimationFrame(frame);
  if (!gl || !program) return;

  const elapsed = (performance.now() - t0) / 1000;
  const loopTime = elapsed % CAROUSEL_CONFIG.cycleDuration;

  // Atualiza o carrossel (só quando estiver pronto)
  if (carousel && carousel.getTransition !== undefined) {
    carousel.update(elapsed, loopTime);
  }

  // Fade do trail
  trailCtx.fillStyle = `rgba(0, 0, 0, ${CONFIG.closingSpeed})`;
  trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);

  if (mouse.hovering) {
    trailCtx.strokeStyle = 'white';
    trailCtx.fillStyle   = 'white';
    trailCtx.lineCap     = 'round';
    trailCtx.lineJoin    = 'round';

    const scaleFactor = trailCanvas.width / window.innerWidth;
    const trailRadius = CONFIG.radius * scaleFactor;
    trailCtx.lineWidth = trailRadius * 2;

    if (mouse.moved) {
      trailCtx.beginPath();
      trailCtx.moveTo(mouse.lastX * trailCanvas.width, mouse.lastY * trailCanvas.height);
      trailCtx.lineTo(mouse.x * trailCanvas.width, mouse.y * trailCanvas.height);
      trailCtx.stroke();
      mouse.moved = false;
    } else {
      trailCtx.beginPath();
      trailCtx.arc(mouse.x * trailCanvas.width, mouse.y * trailCanvas.height,
                   trailRadius, 0, Math.PI * 2);
      trailCtx.fill();
    }

    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
  }

  // Trail texture -> unidade 0
  if (trailCanvas.width > 0 && trailCanvas.height > 0) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, trailCanvas);
  }

  // Imagem atual -> unidade 1
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, carousel ? carousel.getTextureA() : null);

  // Próxima imagem -> unidade 2
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, carousel ? carousel.getTextureB() : null);

  // Envia uniforms
  uploadUniforms(gl, program, elapsed, loopTime);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Renderiza a seção de eventos quando estiver visível no viewport
  if (renderEventos) {
    const evCanvas = document.getElementById('eventosCanvas');
    if (evCanvas) {
      const section = evCanvas.closest('.eventos-section') || evCanvas.parentElement;
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          renderEventos();
        }
      }
    }
  }
}

function startHeroLoop() {
  if (!heroRafId && gl && program && isHeroVisible) {
    heroRafId = requestAnimationFrame(frame);
  }
}

// Configuração de IntersectionObserver para suspender renderização da Hero quando fora de visão
const heroElement = document.getElementById('hero');
if (heroElement && 'IntersectionObserver' in window) {
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (isHeroVisible) {
        startHeroLoop();
      }
    });
  }, {
    threshold: [0, 0.05]
  });
  heroObserver.observe(heroElement);
}

if (gl && program) {
  startHeroLoop();
}

// ============================================================
// WEBGL DEDICADO: SEÇÃO ÚLTIMOS EVENTOS
// Fundo estático com casa.png, desfoque e filtro terroso (SEM grão de areia)
// ============================================================
// Nota: renderEventos foi inicializado anteriormente no escopo superior para evitar TDZ.

function initEventosWebGL() {
  const evCanvas = document.getElementById('eventosCanvas');
  if (!evCanvas) return;

  const glEv = evCanvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'high-performance'
  });

  if (!glEv) {
    console.warn('[Eventos] WebGL não suportado no canvas de eventos. Fallback CSS ativo.');
    evCanvas.style.display = 'none';
    return;
  }

  // Compilação dos shaders específicos de eventos (sem ruído procedural de grão)
  const vs = compileShader(glEv, glEv.VERTEX_SHADER, EVENTOS_VERTEX_SHADER);
  const fs = compileShader(glEv, glEv.FRAGMENT_SHADER, EVENTOS_FRAGMENT_SHADER);
  const evProgram = linkProgram(glEv, vs, fs);
  if (!evProgram) return;

  glEv.useProgram(evProgram);

  // Buffer de geometria (Full quad)
  const posBuffer = glEv.createBuffer();
  glEv.bindBuffer(glEv.ARRAY_BUFFER, posBuffer);
  glEv.bufferData(glEv.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    glEv.STATIC_DRAW);
  const aPos = glEv.getAttribLocation(evProgram, 'aPosition');
  glEv.enableVertexAttribArray(aPos);
  glEv.vertexAttribPointer(aPos, 2, glEv.FLOAT, false, 0, 0);

  // Localizações de uniforms
  const uResolutionLoc       = glEv.getUniformLocation(evProgram, 'uResolution');
  const uScreenResolutionLoc = glEv.getUniformLocation(evProgram, 'uScreenResolution');
  const uTextureLoc          = glEv.getUniformLocation(evProgram, 'uTexture');
  const uImageAspectLoc      = glEv.getUniformLocation(evProgram, 'uImageAspect');
  const uBlurIntensityLoc    = glEv.getUniformLocation(evProgram, 'uBlurIntensity');
  const uTintIntensityLoc    = glEv.getUniformLocation(evProgram, 'uTintIntensity');

  // Textura casa.png
  const texCasa = glEv.createTexture();
  let casaAspect = 16.0 / 9.0;
  let casaLoaded = false;

  const imgCasa = new Image();
  imgCasa.crossOrigin = 'anonymous';
  imgCasa.onload = () => {
    glEv.bindTexture(glEv.TEXTURE_2D, texCasa);
    glEv.texParameteri(glEv.TEXTURE_2D, glEv.TEXTURE_WRAP_S, glEv.CLAMP_TO_EDGE);
    glEv.texParameteri(glEv.TEXTURE_2D, glEv.TEXTURE_WRAP_T, glEv.CLAMP_TO_EDGE);
    glEv.texParameteri(glEv.TEXTURE_2D, glEv.TEXTURE_MIN_FILTER, glEv.LINEAR);
    glEv.texParameteri(glEv.TEXTURE_2D, glEv.TEXTURE_MAG_FILTER, glEv.LINEAR);
    glEv.texImage2D(glEv.TEXTURE_2D, 0, glEv.RGBA, glEv.RGBA, glEv.UNSIGNED_BYTE, imgCasa);
    casaAspect = imgCasa.naturalWidth / imgCasa.naturalHeight;
    casaLoaded = true;
    resizeEv();
  };
  imgCasa.onerror = (err) => {
    console.error('[Eventos] Erro ao carregar imagem tudo/obts/casa.png:', err);
  };
  imgCasa.src = 'tudo/obts/casa.png';

  function resizeEv() {
    const parent = evCanvas.parentElement;
    const parentW = parent ? parent.clientWidth : 0;
    const parentH = parent ? parent.clientHeight : 0;
    const w = parentW > 0 ? parentW : window.innerWidth;
    const h = parentH > 0 ? parentH : window.innerHeight;
    if (evCanvas.width !== w || evCanvas.height !== h) {
      evCanvas.width = w;
      evCanvas.height = h;
    }
    renderEv();
  }

  function renderEv() {
    if (!casaLoaded) return;

    glEv.viewport(0, 0, evCanvas.width, evCanvas.height);
    glEv.useProgram(evProgram);

    glEv.bindBuffer(glEv.ARRAY_BUFFER, posBuffer);
    glEv.vertexAttribPointer(aPos, 2, glEv.FLOAT, false, 0, 0);

    glEv.activeTexture(glEv.TEXTURE0);
    glEv.bindTexture(glEv.TEXTURE_2D, texCasa);
    glEv.uniform1i(uTextureLoc, 0);

    glEv.uniform2f(uResolutionLoc, evCanvas.width, evCanvas.height);
    glEv.uniform2f(uScreenResolutionLoc, window.innerWidth, window.innerHeight);
    glEv.uniform1f(uImageAspectLoc, casaAspect);
    glEv.uniform1f(uBlurIntensityLoc, SHADER_PARAMS.uBlurIntensity);
    glEv.uniform1f(uTintIntensityLoc, SHADER_PARAMS.uTintIntensity);

    glEv.clear(glEv.COLOR_BUFFER_BIT);
    glEv.drawArrays(glEv.TRIANGLES, 0, 6);
  }

  renderEventos = renderEv;

  window.addEventListener('resize', resizeEv);
  window.addEventListener('scroll', () => {
    const section = evCanvas.closest('.eventos-section') || evCanvas.parentElement;
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        renderEv();
      }
    }
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    const evObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          renderEv();
        }
      });
    }, { threshold: [0, 0.1, 0.5, 1.0] });
    const evSec = evCanvas.closest('.eventos-section') || evCanvas.parentElement;
    if (evSec) evObserver.observe(evSec);
  }

  resizeEv();
}

// Inicializa o WebGL da seção de eventos após o carregamento do DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventosWebGL);
} else {
  initEventosWebGL();
}

// ============================================================
// NAVEGAÇÃO EXCLUSIVA MOBILE (Hero Lock, Reveal & Smooth Scroll)
// ============================================================
function initMobileNavigation() {
  if (!isMobileDevice()) {
    // Desktop: assegura que o botão mobile permaneça totalmente oculto
    const btn = document.getElementById('heroScrollBtn') || document.querySelector('.hero-scroll-btn');
    if (btn) btn.style.display = 'none';
    return;
  }

  const navConfig = (window.APP_CONFIG && window.APP_CONFIG.mobileNavigation) || {};
  if (navConfig.enabled === false) return;

  // Garante a existência do botão no DOM
  let btn = document.getElementById('heroScrollBtn') || document.querySelector('.hero-scroll-btn');
  if (!btn) {
    const hero = document.getElementById('hero');
    if (hero) {
      btn = document.createElement('button');
      btn.id = 'heroScrollBtn';
      btn.className = 'hero-scroll-btn';
      btn.setAttribute('aria-label', 'Ver últimos eventos');
      btn.innerHTML = '<img data-img="setaAbaixo" src="tudo/obts/setaparabaixo.svg" alt="Rolar para baixo">';
      hero.appendChild(btn);
    }
  }

  // Gerenciamento do evento de toque/clique no botão da seta
  if (btn && !btn._hasMobileNavHandler) {
    btn._hasMobileNavHandler = true;

    const handleUnlock = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      unlockMobileNavigation();
    };

    btn.addEventListener('click', handleUnlock);
    btn.addEventListener('touchend', handleUnlock, { passive: false });
  }

  // Revela o botão somente quando a experiência inicial da Hero for concluída
  function revealScrollButton() {
    if (!isMobileDevice() || window.__isMobileUnlocked) return;
    const currentNavConfig = (window.APP_CONFIG && window.APP_CONFIG.mobileNavigation) || {};
    if (currentNavConfig.enabled === false) return;

    const delay = currentNavConfig.buttonFadeDelayMs ?? 400;
    const duration = currentNavConfig.buttonFadeDurationMs ?? 800;
    const bounce = currentNavConfig.bounceAnimation !== false;

    setTimeout(() => {
      if (window.__isMobileUnlocked) return;
      const scrollBtn = document.getElementById('heroScrollBtn') || document.querySelector('.hero-scroll-btn');
      if (scrollBtn) {
        scrollBtn.style.setProperty('--hero-btn-fade-duration', `${duration}ms`);
        if (!bounce) {
          scrollBtn.classList.add('no-bounce');
        } else {
          scrollBtn.classList.remove('no-bounce');
        }
        scrollBtn.classList.remove('is-hidden');
        scrollBtn.classList.add('is-visible');
      }
    }, delay);
  }

  if (window.__heroExperienceFinished) {
    revealScrollButton();
  } else {
    window.addEventListener('heroExperienceFinished', revealScrollButton, { once: true });
    // Contingência: se o evento de término da Hero não for disparado em até 4.5s
    setTimeout(() => {
      if (!window.__heroExperienceFinished && !window.__isMobileUnlocked) {
        revealScrollButton();
      }
    }, 4500);
  }
}

/**
 * Liberação definitiva do restante do documento e rolagem suave até Últimos Eventos
 */
function unlockMobileNavigation() {
  if (window.__isMobileUnlocked) return;
  window.__isMobileUnlocked = true;

  const btn = document.getElementById('heroScrollBtn') || document.querySelector('.hero-scroll-btn');
  if (btn) {
    btn.classList.remove('is-visible');
    btn.classList.add('is-hidden');
  }

  // Liberação definitiva do documento
  document.body.classList.remove('is-mobile-locked');
  document.body.classList.add('is-mobile-unlocked');

  const evSection = document.getElementById('ultimos-eventos') || document.querySelector('.eventos-section');
  if (!evSection) return;

  // Notifica o recálculo dos elementos WebGL e carrosséis após revelar a seção
  window.dispatchEvent(new Event('resize'));
  if (typeof renderEventos === 'function') {
    renderEventos();
  }

  // Executa rolagem suave após dois frames de animação (garante que o reflow do DOM terminou)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const currentNavConfig = (window.APP_CONFIG && window.APP_CONFIG.mobileNavigation) || {};
      const scrollBehavior = currentNavConfig.scrollBehavior || 'smooth';
      evSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNavigation);
} else {
  initMobileNavigation();
}
