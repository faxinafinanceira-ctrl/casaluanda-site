/* ==========================================================================
   Nova Seção: Últimos Eventos - Lógica e Interações
   ========================================================================== */

// Dados dos cartazes obtidos centralizadamente de config.img.js
const cartazesData = (window.configImg && window.configImg.paginaInicial && Array.isArray(window.configImg.paginaInicial.cartazes))
    ? window.configImg.paginaInicial.cartazes.map((item, index) => ({
        id: index + 1,
        titulo: item.alt,
        imagemSrc: item.caminho,
        link: item.link || ""
    }))
    : [];

// O carrossel usará 7 posições no DOM para garantir o loop infinito fluido
let carouselElements = [];
const positionClasses = ['pos-neg-1', 'pos-0', 'pos-1', 'pos-2', 'pos-3', 'pos-4', 'pos-5'];

// Configurações padrão e integração com panel.config.JSON
const DEFAULT_EVENTOS_CONFIG = {
    baseOpacity: 0.5,
    hoverOpacity: 1.0,
    hoverScalePercent: 33.4,
    hoverTransitionDurationMs: 500,
    clickDelayMs: 2000
};

const DEFAULT_LOGO_CONFIG = {
    widthPx: 60,
    heightPx: 60
};

const DEFAULT_TITLE_CONFIG = {
    glowEnabled: true,
    glowIntensity: 1.0,
    letterSpacingEm: 0.015
};

let eventosConfig = Object.assign({}, DEFAULT_EVENTOS_CONFIG);
let logoConfig = Object.assign({}, DEFAULT_LOGO_CONFIG);
let titleConfig = Object.assign({}, DEFAULT_TITLE_CONFIG);

function applyTitleConfig() {
    const rawTitle = (window.APP_CONFIG && (
        (window.APP_CONFIG.eventos && window.APP_CONFIG.eventos.title) ||
        window.APP_CONFIG.title
    )) || {};

    titleConfig = Object.assign({}, DEFAULT_TITLE_CONFIG, rawTitle);

    const glowEnabled = (titleConfig.glowEnabled !== false);
    const intensity = (typeof titleConfig.glowIntensity === 'number' && titleConfig.glowIntensity >= 0)
        ? titleConfig.glowIntensity
        : 1.0;
    const letterSpacing = (typeof titleConfig.letterSpacingEm === 'number')
        ? `${titleConfig.letterSpacingEm}em`
        : (titleConfig.letterSpacing || '0.015em');

    const textShadowValue = (glowEnabled && intensity > 0)
        ? [
            `0 0 50px rgba(255,255,255,${Math.min(1, 1.0 * intensity).toFixed(2)})`,
            `0 0 100px rgba(255,240,200,${Math.min(1, 1.0 * intensity).toFixed(2)})`,
            `0 0 150px rgba(255,240,200,${Math.min(1, 0.9 * intensity).toFixed(2)})`,
            `0 0 250px rgba(255,240,200,${Math.min(1, 0.8 * intensity).toFixed(2)})`,
            `0 0 350px rgba(255,240,200,${Math.min(1, 0.7 * intensity).toFixed(2)})`
        ].join(', ')
        : 'none';

    document.documentElement.style.setProperty('--eventos-title-letter-spacing', letterSpacing);
    document.documentElement.style.setProperty('--eventos-title-text-shadow', textShadowValue);

    const titleEls = document.querySelectorAll('.eventos-title');
    titleEls.forEach(el => {
        el.style.setProperty('letter-spacing', letterSpacing);
        el.style.setProperty('text-shadow', textShadowValue);
    });
}

function applyLogoConfig() {
    const rawLogo = (window.APP_CONFIG && (
        (window.APP_CONFIG.header && window.APP_CONFIG.header.logo) ||
        (window.APP_CONFIG.eventos && window.APP_CONFIG.eventos.logo) ||
        (window.APP_CONFIG.eventos && window.APP_CONFIG.eventos.header && window.APP_CONFIG.eventos.header.logo) ||
        window.APP_CONFIG.logo
    )) || {};

    const rawWidth = rawLogo.widthPx ?? rawLogo.width ?? rawLogo.sizePx ?? rawLogo.size ?? DEFAULT_LOGO_CONFIG.widthPx;
    const rawHeight = rawLogo.heightPx ?? rawLogo.height ?? rawLogo.sizePx ?? rawLogo.size ?? DEFAULT_LOGO_CONFIG.heightPx;

    const widthStr = typeof rawWidth === 'number' ? `${rawWidth}px` : String(rawWidth);
    const heightStr = typeof rawHeight === 'number' ? `${rawHeight}px` : String(rawHeight);

    // Aplica as variáveis CSS
    document.documentElement.style.setProperty('--header-logo-width', widthStr);
    document.documentElement.style.setProperty('--header-logo-height', heightStr);

    const eventosSection = document.getElementById('ultimos-eventos');
    if (eventosSection) {
        eventosSection.style.setProperty('--header-logo-width', widthStr);
        eventosSection.style.setProperty('--header-logo-height', heightStr);
    }

    // Aplica inline diretamente com prioridade máxima
    const logoImgs = document.querySelectorAll('.header-logo img, header.eventos-header img, header img[src*="logo.png"]');
    logoImgs.forEach(img => {
        img.style.setProperty('width', widthStr, 'important');
        img.style.setProperty('height', heightStr, 'important');
        img.style.setProperty('max-width', 'none', 'important');
        img.style.setProperty('max-height', 'none', 'important');
    });
}

function applyEventosConfig() {
    if (window.APP_CONFIG && window.APP_CONFIG.eventos && window.APP_CONFIG.eventos.animation) {
        eventosConfig = Object.assign({}, DEFAULT_EVENTOS_CONFIG, window.APP_CONFIG.eventos.animation);
    }

    applyLogoConfig();
    applyTitleConfig();

    const eventosSection = document.getElementById('ultimos-eventos') || document.documentElement;
    if (eventosSection) {
        const baseOpacity = typeof eventosConfig.baseOpacity === 'number' ? eventosConfig.baseOpacity : DEFAULT_EVENTOS_CONFIG.baseOpacity;
        const hoverOpacity = typeof eventosConfig.hoverOpacity === 'number' ? eventosConfig.hoverOpacity : DEFAULT_EVENTOS_CONFIG.hoverOpacity;
        const hoverScalePercent = typeof eventosConfig.hoverScalePercent === 'number' ? eventosConfig.hoverScalePercent : DEFAULT_EVENTOS_CONFIG.hoverScalePercent;
        const durationMs = typeof eventosConfig.hoverTransitionDurationMs === 'number' ? eventosConfig.hoverTransitionDurationMs : DEFAULT_EVENTOS_CONFIG.hoverTransitionDurationMs;

        // Fator multiplicador de escala: 33.4% -> 1.334 para centro (base 1.0) e 1.167 para laterais (base 0.875)
        const scaleCenter = 1.0 * (1 + (hoverScalePercent / 100));
        const scaleSide = 0.875 * (1 + (hoverScalePercent / 100));

        eventosSection.style.setProperty('--cartaz-base-opacity', baseOpacity);
        eventosSection.style.setProperty('--cartaz-hover-opacity', hoverOpacity);
        eventosSection.style.setProperty('--cartaz-hover-scale-center', scaleCenter.toFixed(3));
        eventosSection.style.setProperty('--cartaz-hover-scale-side', scaleSide.toFixed(3));
        eventosSection.style.setProperty('--cartaz-transition-duration', `${durationMs}ms`);
    }
}

async function loadEventosConfiguration() {
    if (!window.APP_CONFIG) {
        const cb = "?_t=" + Date.now();
        let jsonConfig = null;
        let yamlConfig = null;
        let jsonTime = 0;
        let yamlTime = 0;

        try {
            const resJson = await fetch("config/panel.config.JSON" + cb, { cache: "no-store" });
            if (resJson.ok) {
                const text = await resJson.text();
                jsonConfig = JSON.parse(text.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "").replace(/,\s*([\]}])/g, '$1'));
                const lm = resJson.headers.get("Last-Modified");
                if (lm) jsonTime = new Date(lm).getTime();
            }
        } catch (e) { }

        try {
            const resYaml = await fetch("config/panel.config.yaml" + cb, { cache: "no-store" });
            if (resYaml.ok && typeof window.parseSimpleYAML === "function") {
                const text = await resYaml.text();
                yamlConfig = window.parseSimpleYAML(text);
                const lm = resYaml.headers.get("Last-Modified");
                if (lm) yamlTime = new Date(lm).getTime();
            }
        } catch (e) { }

        if (jsonConfig && yamlConfig && typeof window.deepMergeConfig === "function") {
            window.APP_CONFIG = yamlTime > jsonTime
                ? window.deepMergeConfig({}, jsonConfig, yamlConfig)
                : window.deepMergeConfig({}, yamlConfig, jsonConfig);
        } else if (yamlConfig) {
            window.APP_CONFIG = yamlConfig;
        } else if (jsonConfig) {
            window.APP_CONFIG = jsonConfig;
        }
    }
    applyEventosConfig();
}

function getHoverTransitionDuration() {
    return (typeof eventosConfig.hoverTransitionDurationMs === 'number' && eventosConfig.hoverTransitionDurationMs >= 0)
        ? eventosConfig.hoverTransitionDurationMs
        : DEFAULT_EVENTOS_CONFIG.hoverTransitionDurationMs;
}

function getClickDelayMs() {
    return (typeof eventosConfig.clickDelayMs === 'number' && eventosConfig.clickDelayMs >= 0)
        ? eventosConfig.clickDelayMs
        : DEFAULT_EVENTOS_CONFIG.clickDelayMs;
}

// Rastreamento seguro do cursor para validação de posição em repouso
let lastMousePos = { x: -1, y: -1 };
document.addEventListener('mousemove', (e) => {
    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
}, { passive: true });

function isCursorOverElement(el) {
    if (el.matches(':hover')) return true;
    if (lastMousePos.x < 0) return false;
    const rect = el.getBoundingClientRect();
    return (
        lastMousePos.x >= rect.left &&
        lastMousePos.x <= rect.right &&
        lastMousePos.y >= rect.top &&
        lastMousePos.y <= rect.bottom
    );
}

function isCartazHoverable(el) {
    return el.classList.contains('pos-1') || el.classList.contains('pos-2') || el.classList.contains('pos-3');
}

/**
 * Inicia a transição de entrada com bloqueio temporário contra oscilação
 */
function handleCartazMouseEnter(el) {
    if (el.classList.contains('is-animating') || !isCartazHoverable(el)) return;

    const track = document.getElementById('carouselTrack');
    if (track) {
        track.classList.add('has-active-hover');
    }

    el.classList.add('is-hovered', 'is-animating');
    el.classList.remove('is-clickable');
    el.style.cursor = 'default';

    // Inicia controle de tempo para liberar o clique apenas após 2 segundos
    el._clickUnlocked = false;
    el._hoverStartTime = Date.now();

    if (el._hoverTimer) clearTimeout(el._hoverTimer);
    if (el._clickDelayTimer) clearTimeout(el._clickDelayTimer);

    const duration = getHoverTransitionDuration();
    el._hoverTimer = setTimeout(() => {
        el.classList.remove('is-animating');

        // Se o cursor já saiu durante a transição contínua de entrada
        if (!isCursorOverElement(el)) {
            handleCartazMouseLeave(el);
        }
    }, duration);

    // Libera o clique e ativa o cursor pointer apenas após 2s em repouso/foco no cartaz
    const clickDelay = getClickDelayMs();
    el._clickDelayTimer = setTimeout(() => {
        if (el.classList.contains('is-hovered')) {
            el._clickUnlocked = true;
            el.classList.add('is-clickable');
            el.style.cursor = 'pointer';
        }
    }, clickDelay);
}

/**
 * Inicia a transição de saída bloqueando interações até o repouso absoluto
 */
function handleCartazMouseLeave(el) {
    if (el.classList.contains('is-animating') || !el.classList.contains('is-hovered')) return;

    el.classList.remove('is-hovered', 'is-clickable');
    el.classList.add('is-animating');
    el.style.cursor = 'default';

    el._clickUnlocked = false;
    el._hoverStartTime = 0;

    if (el._hoverTimer) clearTimeout(el._hoverTimer);
    if (el._clickDelayTimer) clearTimeout(el._clickDelayTimer);

    const duration = getHoverTransitionDuration();
    el._hoverTimer = setTimeout(() => {
        el.classList.remove('is-animating');

        const track = document.getElementById('carouselTrack');
        if (track) {
            track.classList.remove('has-active-hover');
        }

        // Se o cursor retornou ao cartaz após atingir 100% de repouso
        if (isCursorOverElement(el)) {
            handleCartazMouseEnter(el);
        }
    }, duration);
}

/**
 * Cria um elemento de cartaz
 */
function createCartazElement(dataIndex) {
    const data = cartazesData[dataIndex] || (window.configImg?.paginaInicial?.cartazes?.[dataIndex]) || {};
    const el = document.createElement('div');
    el.className = 'cartaz';
    el.dataset.dataIndex = dataIndex;
    el.style.cursor = 'default';
    el._clickUnlocked = false;
    el._hoverStartTime = 0;

    const imgSrc = data.imagemSrc || data.caminho || '';
    const imgAlt = data.titulo || data.alt || `Evento ${dataIndex + 1}`;
    el.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;

    // Listeners para controle de hover estável e sem engasgos
    el.addEventListener('mouseenter', () => handleCartazMouseEnter(el));
    el.addEventListener('mouseleave', () => handleCartazMouseLeave(el));

    // Clique com trava de 2s para evitar cliques acidentais
    el.onclick = (e) => {
        if (e) e.stopPropagation();

        const clickDelay = getClickDelayMs();
        const tempoDecorrido = el._hoverStartTime ? (Date.now() - el._hoverStartTime) : 0;
        const liberado = el._clickUnlocked === true || (el.classList.contains('is-hovered') && tempoDecorrido >= clickDelay);

        if (!liberado) {
            console.log(`[Carrossel] Clique bloqueado: aguarde ${(clickDelay / 1000).toFixed(1)}s com o cartaz em foco para ativar o redirecionamento.`);
            return;
        }

        const currentIdx = parseInt(el.dataset.dataIndex, 10);
        aoClicarNoCartaz(currentIdx + 1);
    };
    return el;
}

/**
 * Inicializa o carrossel no DOM
 */
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    track.innerHTML = '';
    carouselElements = [];

    // Queremos 5 itens visíveis, então começamos mapeando do último para dar o wrap
    // Ex: para 5 itens, índices de dados: 4, 0, 1, 2, 3, 4, 0
    const initialIndices = [4, 0, 1, 2, 3, 4, 0];

    initialIndices.forEach((dataIdx, i) => {
        const el = createCartazElement(dataIdx);
        el.classList.add(positionClasses[i]);
        track.appendChild(el);
        carouselElements.push(el);
    });
}

/**
 * Atualiza as classes CSS baseando-se na posição do elemento no array
 */
function updateClasses() {
    carouselElements.forEach((el, i) => {
        el.classList.remove(...positionClasses);
        el.classList.add(positionClasses[i]);
    });
}

/**
 * Utilitário para envolver (wrap) o índice dentro do tamanho do array
 */
function getWrappedIndex(idx) {
    const len = cartazesData.length;
    return ((idx % len) + len) % len;
}

/**
 * Move o carrossel. 
 * @param {number} direction - 1 para próximo, -1 para anterior
 */
function moverCarrossel(direction) {
    if (carouselElements.length === 0) return;

    const track = document.getElementById('carouselTrack');
    if (track) {
        track.classList.remove('has-active-hover');
    }

    // Limpa estados temporários de hover e timers residuais ao navegar no carrossel
    carouselElements.forEach(el => {
        el.classList.remove('is-hovered', 'is-animating', 'is-clickable');
        el.style.cursor = 'default';
        el._clickUnlocked = false;
        el._hoverStartTime = 0;
        if (el._hoverTimer) {
            clearTimeout(el._hoverTimer);
            el._hoverTimer = null;
        }
        if (el._clickDelayTimer) {
            clearTimeout(el._clickDelayTimer);
            el._clickDelayTimer = null;
        }
    });

    if (direction === 1) {
        // Próximo: Desliza para esquerda
        // O elemento que estava escondido na esquerda (-1) vai para a direita (5)
        const wrappingElement = carouselElements.shift();

        // Removemos a transição para ele "pular" instantaneamente para a ponta sem voar pela tela
        wrappingElement.classList.add('no-transition');

        // Atualiza o conteúdo para o item sequencial após o último
        const lastElement = carouselElements[carouselElements.length - 1];
        const newDataIndex = getWrappedIndex(parseInt(lastElement.dataset.dataIndex) + 1);

        wrappingElement.dataset.dataIndex = newDataIndex;
        wrappingElement.style.cursor = 'default';
        wrappingElement._clickUnlocked = false;
        wrappingElement._hoverStartTime = 0;
        wrappingElement.classList.remove('is-clickable');

        const data = cartazesData[newDataIndex] || (window.configImg?.paginaInicial?.cartazes?.[newDataIndex]) || {};
        const imgSrc = data.imagemSrc || data.caminho || '';
        const imgAlt = data.titulo || data.alt || `Evento ${newDataIndex + 1}`;
        wrappingElement.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
        wrappingElement.onclick = (e) => {
            if (e) e.stopPropagation();

            const clickDelay = getClickDelayMs();
            const tempoDecorrido = wrappingElement._hoverStartTime ? (Date.now() - wrappingElement._hoverStartTime) : 0;
            const liberado = wrappingElement._clickUnlocked === true || (wrappingElement.classList.contains('is-hovered') && tempoDecorrido >= clickDelay);

            if (!liberado) {
                console.log(`[Carrossel] Clique bloqueado: aguarde ${(clickDelay / 1000).toFixed(1)}s com o cartaz em foco para ativar o redirecionamento.`);
                return;
            }

            const currentIdx = parseInt(wrappingElement.dataset.dataIndex, 10);
            aoClicarNoCartaz(currentIdx + 1);
        };

        // Coloca no fim do array
        carouselElements.push(wrappingElement);

        // Atualiza as posições de todos
        updateClasses();

        // Devolve a transição após o render (pulo instantâneo)
        setTimeout(() => {
            wrappingElement.classList.remove('no-transition');
        }, 50); // Timeout pequeno para garantir o repaint

    } else {
        // Anterior: Desliza para direita
        // O elemento escondido na direita (5) vai para a esquerda (-1)
        const wrappingElement = carouselElements.pop();

        wrappingElement.classList.add('no-transition');

        const firstElement = carouselElements[0];
        const newDataIndex = getWrappedIndex(parseInt(firstElement.dataset.dataIndex) - 1);

        wrappingElement.dataset.dataIndex = newDataIndex;
        wrappingElement.style.cursor = 'default';
        wrappingElement._clickUnlocked = false;
        wrappingElement._hoverStartTime = 0;
        wrappingElement.classList.remove('is-clickable');

        const data = cartazesData[newDataIndex] || (window.configImg?.paginaInicial?.cartazes?.[newDataIndex]) || {};
        const imgSrc = data.imagemSrc || data.caminho || '';
        const imgAlt = data.titulo || data.alt || `Evento ${newDataIndex + 1}`;
        wrappingElement.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}">`;
        wrappingElement.onclick = (e) => {
            if (e) e.stopPropagation();

            const clickDelay = getClickDelayMs();
            const tempoDecorrido = wrappingElement._hoverStartTime ? (Date.now() - wrappingElement._hoverStartTime) : 0;
            const liberado = wrappingElement._clickUnlocked === true || (wrappingElement.classList.contains('is-hovered') && tempoDecorrido >= clickDelay);

            if (!liberado) {
                console.log(`[Carrossel] Clique bloqueado: aguarde ${(clickDelay / 1000).toFixed(1)}s com o cartaz em foco para ativar o redirecionamento.`);
                return;
            }

            const currentIdx = parseInt(wrappingElement.dataset.dataIndex, 10);
            aoClicarNoCartaz(currentIdx + 1);
        };

        // Coloca no início do array
        carouselElements.unshift(wrappingElement);

        updateClasses();

        setTimeout(() => {
            wrappingElement.classList.remove('no-transition');
        }, 50);
    }
}

// ==========================================================================
// STUBS DE EVENTOS
// ==========================================================================

/**
 * Navegação e Ação de Clique no Menu
 */
function aoClicarMenu(nome, sectionId) {
    console.log(`Menu clicado: ${nome} (seção: ${sectionId || 'indefinida'})`);

    // Identifica o alvo da seção com base no ID explícito ou no rótulo do item
    const targetId = sectionId || (
        (nome === 'Sobre nós' || nome === 'Sobre nos') ? 'sobre-nos' :
            (nome === 'Eventos' || nome === 'Últimos eventos') ? 'ultimos-eventos' :
                null
    );

    if (targetId) {
        // Se o mobile estiver travado na Hero, libera a navegação antes de rolar
        if (typeof window.unlockMobileNavigation === 'function') {
            window.unlockMobileNavigation();
        }

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
            return;
        } else if (targetId === 'sobre-nos') {
            window.location.href = 'sobre-nos.html';
            return;
        }
    }
    // Para 'Projetos', 'Agentes culturais' e 'Transparência', mantém o comportamento de placeholder/stub
}

/**
 * Ação de Clique no Cartaz: redireciona para a URL configurada no config.img.js
 * @param {number} id - ID do cartaz do array cartazesData (1-based index)
 */
function aoClicarNoCartaz(id) {
    // 1. Busca dinamicamente no config.img.js (fonte da verdade de configuração)
    const cartazesConfig = window.configImg?.paginaInicial?.cartazes;
    let link = "";

    if (Array.isArray(cartazesConfig)) {
        const itemConfig = cartazesConfig[id - 1] || cartazesConfig.find((c, i) => (i + 1) === id);
        if (itemConfig && itemConfig.link) {
            link = itemConfig.link;
        }
    }

    // 2. Fallback para cartazesData caso não localize no configImg
    if (!link && Array.isArray(cartazesData)) {
        const item = cartazesData.find(c => c.id === id);
        if (item && item.link) {
            link = item.link;
        }
    }

    // 3. Redirecionamento se houver URL válida
    if (link && typeof link === "string" && link.trim() !== "") {
        const urlFinal = link.trim();
        window.location.href = urlFinal;
        return;
    }

    console.log(`Cartaz clicado: ID ${id} (sem link configurado)`);
    // TODO: Adicionar lógica para direcionar para uma página do evento
}


// Exporta explicitamente para o escopo global (usado pelos onclick inline do HTML)
window.moverCarrossel = moverCarrossel;
window.initCarousel = initCarousel;
window.aoClicarMenu = aoClicarMenu;
window.aoClicarNoCartaz = aoClicarNoCartaz;
window.applyEventosConfig = applyEventosConfig;
window.applyLogoConfig = applyLogoConfig;
window.applyTitleConfig = applyTitleConfig;

// Inicialização ao carregar
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initCarousel();
        loadEventosConfiguration();
    });
} else {
    initCarousel();
    loadEventosConfiguration();
}
