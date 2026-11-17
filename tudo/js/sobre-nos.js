/* ==========================================================================
   Nova Seção: Sobre Nós - Lógica, Interações e Integração de Configuração
   Casa Luanda
   ========================================================================== */

(function () {
    'use strict';

    // Parser simples para YAML no navegador caso hero.js não esteja presente
    function parseSimpleYAML(text) {
        const result = {};
        const lines = text.split(/\r?\n/);
        const stack = [{ indent: -1, obj: result }];

        for (let rawLine of lines) {
            const lineWithoutComment = rawLine.replace(/#.*$/, "");
            if (!lineWithoutComment.trim()) continue;

            const indent = rawLine.search(/\S/);
            const trimmed = lineWithoutComment.trim();

            const colonIndex = trimmed.indexOf(":");
            if (colonIndex === -1) continue;

            const key = trimmed.slice(0, colonIndex).trim();
            const rawVal = trimmed.slice(colonIndex + 1).trim();

            while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
                stack.pop();
            }

            const parent = stack[stack.length - 1].obj;

            if (rawVal === "") {
                const newObj = {};
                parent[key] = newObj;
                stack.push({ indent: indent, obj: newObj });
            } else {
                let val = rawVal;
                if (val === "true") val = true;
                else if (val === "false") val = false;
                else if (val === "null") val = null;
                else if (!isNaN(Number(val))) val = Number(val);
                else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                parent[key] = val;
            }
        }
        return result;
    }
    if (typeof window.parseSimpleYAML !== 'function') {
        window.parseSimpleYAML = parseSimpleYAML;
    }

    // Fusão profunda recursiva de objetos de configuração
    function deepMergeConfig(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (source && typeof source === 'object' && !Array.isArray(source)) {
            for (const key of Object.keys(source)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                        target[key] = {};
                    }
                    deepMergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return deepMergeConfig(target, ...sources);
    }
    if (typeof window.deepMergeConfig !== 'function') {
        window.deepMergeConfig = deepMergeConfig;
    }

    // Valores padrão de configuração baseados nas convenções institucionais
    const DEFAULT_SOBRE_CONFIG = {
        card: {
            widthPercent: 94,
            borderRadiusPx: 50,
            borderRadiusMobilePx: 24,
            marginBottomVh: 0,
            minHeightVh: 65,
            minHeightMobileVh: 60,
            paddingRem: 3.0,
            paddingMobileRem: 1.5
        },
        title: {
            glowEnabled: true,
            glowIntensity: 1.0,
            letterSpacingEm: 0.015
        },
        scroll: {
            wheelIsolation: true,
            indicatorEnabled: true,
            bounceAnimation: true,
            fadeOnEnd: true,
            stepScrollPx: 180
        },
        editorial: {
            marcaMaxWidthPx: 280,
            marcaMaxWidthMobilePx: 200,
            columnsGapRem: 3.0,
            bodyLineHeight: 1.75,
            paragraphMarginBottomRem: 1.25
        }
    };

    let sobreConfig = JSON.parse(JSON.stringify(DEFAULT_SOBRE_CONFIG));

    /**
     * Aplica o tamanho do logotipo centralizado nas configurações do header (80px padrão)
     */
    function applyLogoConfig() {
        const rawLogo = (window.APP_CONFIG && (
            (window.APP_CONFIG.header && window.APP_CONFIG.header.logo) ||
            window.APP_CONFIG.logo
        )) || {};

        const rawWidth = rawLogo.widthPx ?? rawLogo.width ?? 80;
        const rawHeight = rawLogo.heightPx ?? rawLogo.height ?? 80;

        const widthStr = typeof rawWidth === 'number' ? `${rawWidth}px` : String(rawWidth);
        const heightStr = typeof rawHeight === 'number' ? `${rawHeight}px` : String(rawHeight);

        document.documentElement.style.setProperty('--header-logo-width', widthStr);
        document.documentElement.style.setProperty('--header-logo-height', heightStr);

        const logoImgs = document.querySelectorAll('.header-logo img, header.eventos-header img, header img[src*="logo.png"]');
        logoImgs.forEach(img => {
            img.style.setProperty('width', widthStr, 'important');
            img.style.setProperty('height', heightStr, 'important');
            img.style.setProperty('max-width', 'none', 'important');
            img.style.setProperty('max-height', 'none', 'important');
        });
    }

    if (typeof window.applyLogoConfig !== 'function') {
        window.applyLogoConfig = applyLogoConfig;
    }

    /**
     * Aplica os parâmetros visuais e dimensionais externalizados via CSS Variables
     */
    function applySobreConfig() {
        const sec = document.getElementById('sobre-nos');
        const rawSobre = (window.APP_CONFIG && window.APP_CONFIG.sobreNos) || {};

        sobreConfig = {
            card: Object.assign({}, DEFAULT_SOBRE_CONFIG.card, rawSobre.card || {}),
            title: Object.assign({}, DEFAULT_SOBRE_CONFIG.title, rawSobre.title || {}),
            scroll: Object.assign({}, DEFAULT_SOBRE_CONFIG.scroll, rawSobre.scroll || {}),
            editorial: Object.assign({}, DEFAULT_SOBRE_CONFIG.editorial, rawSobre.editorial || {})
        };

        const root = document.documentElement;

        // 1. Dimensões do Card Branco (.sobrenos-card)
        const cardWidth = typeof sobreConfig.card.widthPercent === 'number' ? `${sobreConfig.card.widthPercent}%` : '94%';
        const cardRadius = typeof sobreConfig.card.borderRadiusPx === 'number' ? `${sobreConfig.card.borderRadiusPx}px` : '50px';
        const cardRadiusMobile = typeof sobreConfig.card.borderRadiusMobilePx === 'number' ? `${sobreConfig.card.borderRadiusMobilePx}px` : '24px';
        const cardPadding = typeof sobreConfig.card.paddingRem === 'number' ? `${sobreConfig.card.paddingRem}rem ${sobreConfig.card.paddingRem * 1.33}rem` : '3rem 4rem';
        const cardPaddingMobile = typeof sobreConfig.card.paddingMobileRem === 'number' ? `${sobreConfig.card.paddingMobileRem}rem ${sobreConfig.card.paddingMobileRem * 1.33}rem` : '1.5rem 2rem';
        const cardMarginBottom = typeof sobreConfig.card.marginBottomVh === 'number' ? `${sobreConfig.card.marginBottomVh}vh` : '0px';
        const cardMinHeight = typeof sobreConfig.card.minHeightVh === 'number' ? `${sobreConfig.card.minHeightVh}vh` : '65vh';
        const cardMinHeightMobile = typeof sobreConfig.card.minHeightMobileVh === 'number' ? `${sobreConfig.card.minHeightMobileVh}vh` : '60vh';

        root.style.setProperty('--sobre-card-width', cardWidth);
        root.style.setProperty('--sobre-card-radius', cardRadius);
        root.style.setProperty('--sobre-card-radius-mobile', cardRadiusMobile);
        root.style.setProperty('--sobre-card-padding', cardPadding);
        root.style.setProperty('--sobre-card-padding-mobile', cardPaddingMobile);
        root.style.setProperty('--sobre-card-margin-bottom', cardMarginBottom);
        root.style.setProperty('--sobre-card-min-height', cardMinHeight);
        root.style.setProperty('--sobre-card-min-height-mobile', cardMinHeightMobile);

        if (sec) {
            sec.style.setProperty('--sobre-card-width', cardWidth);
            sec.style.setProperty('--sobre-card-radius', cardRadius);
            sec.style.setProperty('--sobre-card-radius-mobile', cardRadiusMobile);
            sec.style.setProperty('--sobre-card-padding', cardPadding);
            sec.style.setProperty('--sobre-card-padding-mobile', cardPaddingMobile);
            sec.style.setProperty('--sobre-card-margin-bottom', cardMarginBottom);
            sec.style.setProperty('--sobre-card-min-height', cardMinHeight);
            sec.style.setProperty('--sobre-card-min-height-mobile', cardMinHeightMobile);
        }

        const cards = document.querySelectorAll('.sobrenos-card, .sobre-card');
        cards.forEach(card => {
            card.style.setProperty('--sobre-card-width', cardWidth);
            card.style.setProperty('--sobre-card-radius', cardRadius);
            card.style.setProperty('--sobre-card-margin-bottom', '0px');
            card.style.setProperty('min-height', '0px', 'important');
        });

        // 2. Parâmetros de Título (Glow difuso multi-camadas e espaçamento entre letras)
        const glowEnabled = (sobreConfig.title.glowEnabled !== false);
        const intensity = (typeof sobreConfig.title.glowIntensity === 'number' && sobreConfig.title.glowIntensity >= 0)
            ? sobreConfig.title.glowIntensity
            : 1.0;
        const letterSpacing = (typeof sobreConfig.title.letterSpacingEm === 'number')
            ? `${sobreConfig.title.letterSpacingEm}em`
            : (sobreConfig.title.letterSpacing || '0.015em');

        const titleShadow = (glowEnabled && intensity > 0)
            ? [
                `0 0 50px rgba(255, 255, 255, ${Math.min(1, 1.0 * intensity).toFixed(2)})`,
                `0 0 100px rgba(255, 240, 200, ${Math.min(1, 1.0 * intensity).toFixed(2)})`,
                `0 0 150px rgba(255, 240, 200, ${Math.min(1, 0.9 * intensity).toFixed(2)})`,
                `0 0 250px rgba(255, 240, 200, ${Math.min(1, 0.8 * intensity).toFixed(2)})`,
                `0 0 350px rgba(255, 240, 200, ${Math.min(1, 0.7 * intensity).toFixed(2)})`
            ].join(', ')
            : 'none';

        root.style.setProperty('--sobre-title-letter-spacing', letterSpacing);
        root.style.setProperty('--sobre-title-text-shadow', titleShadow);

        const titleEls = document.querySelectorAll('.sobre-title');
        titleEls.forEach(el => {
            el.style.setProperty('letter-spacing', letterSpacing);
            el.style.setProperty('text-shadow', titleShadow);
        });

        // 3. Aplicação do Logo de Cabeçalho (80px padronizado)
        if (typeof window.applyLogoConfig === 'function') {
            window.applyLogoConfig();
        }

        // 4. Configuração visual da barra e botão de rolagem
        const downBtn = document.getElementById('sobreScrollDownBtn');
        const scrollbarEl = document.getElementById('sobreScrollbar');

        if (scrollbarEl) {
            scrollbarEl.style.display = (sobreConfig.scroll.indicatorEnabled !== false) ? 'flex' : 'none';
        }

        if (downBtn) {
            if (sobreConfig.scroll.bounceAnimation !== false) {
                downBtn.classList.add('bounce');
            } else {
                downBtn.classList.remove('bounce');
            }
        }

        // 5. Parâmetros da diagramação editorial interna e imagem institucional
        const editorial = sobreConfig.editorial || DEFAULT_SOBRE_CONFIG.editorial;
        const marcaMaxWidth = typeof editorial.marcaMaxWidthPx === 'number' ? `${editorial.marcaMaxWidthPx}px` : '280px';
        const marcaMaxWidthMobile = typeof editorial.marcaMaxWidthMobilePx === 'number' ? `${editorial.marcaMaxWidthMobilePx}px` : '200px';
        const columnsGap = typeof editorial.columnsGapRem === 'number' ? `${editorial.columnsGapRem}rem` : '3rem';
        const bodyLineHeight = typeof editorial.bodyLineHeight === 'number' ? String(editorial.bodyLineHeight) : '1.75';
        const pMarginBottom = typeof editorial.paragraphMarginBottomRem === 'number' ? `${editorial.paragraphMarginBottomRem}rem` : '1.25rem';

        root.style.setProperty('--sobre-marca-max-width', marcaMaxWidth);
        root.style.setProperty('--sobre-marca-max-width-mobile', marcaMaxWidthMobile);
        root.style.setProperty('--sobre-editorial-gap', columnsGap);
        root.style.setProperty('--sobre-body-line-height', bodyLineHeight);
        root.style.setProperty('--sobre-p-margin-bottom', pMarginBottom);

        if (sec) {
            sec.style.setProperty('--sobre-marca-max-width', marcaMaxWidth);
            sec.style.setProperty('--sobre-marca-max-width-mobile', marcaMaxWidthMobile);
            sec.style.setProperty('--sobre-editorial-gap', columnsGap);
            sec.style.setProperty('--sobre-body-line-height', bodyLineHeight);
            sec.style.setProperty('--sobre-p-margin-bottom', pMarginBottom);
        }

        // 6. Aplica imagens vinculadas
        applySobreImages();

        // 7. Atualiza geometria do scrollbar
        updateScrollbarMetrics();
    }

    /**
     * Vincula as imagens de config.img.js registradas na chave paginaSobre
     */
    function applySobreImages() {
        const config = window.configImg || (typeof configImg !== 'undefined' ? configImg : null);
        if (!config) return;

        const sobreImgs = config.paginaSobre || {};
        const fallbackImgs = config.paginaInicial || {};

        const sec = document.getElementById('sobre-nos');
        if (!sec) return;

        // Imagem de Fundo (qmos.png)
        const bgImg = sec.querySelector('.sobre-bg-image, [data-img="fundo"]');
        const bgData = sobreImgs.fundo || fallbackImgs.fundo;
        if (bgImg && bgData && bgData.caminho) {
            bgImg.src = bgData.caminho;
            if (bgData.alt) bgImg.alt = bgData.alt;
        }

        // Logotipo do cabeçalho
        const logoImg = sec.querySelector('.header-logo img, [data-img="logo"]');
        if (logoImg) {
            const logoData = sobreImgs.logo || fallbackImgs.logo;
            if (logoData && logoData.caminho) {
                logoImg.src = logoData.caminho;
                if (logoData.alt) logoImg.alt = logoData.alt;
            }
        }

        // Imagem Institucional da Marca (marca.png) no card Sobre Nós
        const marcaImg = sec.querySelector('.sobre-marca-img, [data-img="marca"]');
        if (marcaImg) {
            const marcaData = sobreImgs.marca || fallbackImgs.marca;
            if (marcaData && marcaData.caminho) {
                marcaImg.src = marcaData.caminho;
                if (marcaData.alt) marcaImg.alt = marcaData.alt;
            }
        }
    }

    /**
     * Carrega a configuração centralizada de panel.config.JSON / panel.config.yaml
     */
    async function loadSobreConfiguration() {
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

        applySobreConfig();
    }

    /**
     * Atualiza as dimensões e o posicionamento do cursor (thumb) da barra customizada
     */
    function updateScrollbarMetrics() {
        const content = document.getElementById('sobreCardContent');
        const track = document.getElementById('sobreScrollTrack');
        const thumb = document.getElementById('sobreScrollThumb');
        const downBtn = document.getElementById('sobreScrollDownBtn');

        if (!content || !track || !thumb) return;

        const clientH = content.clientHeight;
        const scrollH = content.scrollHeight;
        const scrollT = content.scrollTop;
        const trackH = track.clientHeight;

        if (trackH <= 0 || clientH <= 0) return;

        // Se houver overflow real de conteúdo
        if (scrollH > clientH + 1) {
            const ratio = clientH / scrollH;
            const thumbH = Math.max(28, Math.round(trackH * ratio));
            const maxScroll = scrollH - clientH;
            const scrollFraction = maxScroll > 0 ? (scrollT / maxScroll) : 0;
            const maxThumbTop = Math.max(0, trackH - thumbH);
            const thumbTop = Math.min(maxThumbTop, Math.round(scrollFraction * maxThumbTop));

            thumb.style.height = `${thumbH}px`;
            thumb.style.top = `${thumbTop}px`;
            thumb.style.display = 'block';

            // Marcador de final do conteúdo
            if (downBtn && sobreConfig.scroll.fadeOnEnd !== false) {
                const isNearEnd = (scrollT + clientH) >= (scrollH - 12);
                if (isNearEnd) {
                    downBtn.classList.add('at-end');
                } else {
                    downBtn.classList.remove('at-end');
                }
            }
        } else {
            // Estado inicial de mockup
            const mockThumbH = Math.min(60, Math.round(trackH * 0.25));
            thumb.style.height = `${mockThumbH}px`;
            thumb.style.top = '0px';
            thumb.style.display = 'block';

            if (downBtn) {
                downBtn.classList.remove('at-end');
            }
        }
    }

    /**
     * Inicializa a interatividade da barra de rolagem customizada e do indicador
     */
    function initCustomScrollbar() {
        const content = document.getElementById('sobreCardContent');
        const track = document.getElementById('sobreScrollTrack');
        const thumb = document.getElementById('sobreScrollThumb');
        const downBtn = document.getElementById('sobreScrollDownBtn');
        const card = document.getElementById('sobreCard') || document.querySelector('.sobrenos-card');

        if (!content || !track || !thumb) return;

        // 0. Isolamento Dinâmico de Rolagem (Mouse Hover / Wheel Isolation)
        if (card && !card._wheelBound) {
            card._wheelBound = true;

            // Intercepta a rolagem da roda do mouse exclusivamente dentro do card
            card.addEventListener('wheel', (e) => {
                if (sobreConfig.scroll.wheelIsolation === false) return;

                const delta = e.deltaY;
                const isAtTop = content.scrollTop <= 0;
                const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;

                // Se estiver rolando dentro dos limites do conteúdo, impede o scroll da página externa
                if ((delta < 0 && !isAtTop) || (delta > 0 && !isAtBottom)) {
                    e.preventDefault();
                    e.stopPropagation();
                    content.scrollTop += delta;
                    updateScrollbarMetrics();
                    requestAnimationFrame(updateScrollbarMetrics);
                }
            }, { passive: false });

            // Foco e feedback visual no card ativo
            card.addEventListener('mouseenter', () => {
                card.classList.add('is-hovered');
                // persist revealed state
                card.classList.add('is-revealed');
                const content = document.getElementById('sobreCardContent');
                if (content) {
                    content.classList.add('is-revealed');
                }
            });

            // Liberação total do fluxo global ao sair do card
            card.addEventListener('mouseleave', () => {
                card.classList.remove('is-hovered');
            });
        }

        // 1. Sincronização ao rolar o conteúdo textual
        content.addEventListener('scroll', () => {
            requestAnimationFrame(updateScrollbarMetrics);
        }, { passive: true });

        // 2. Clique no botão de seta para baixo
        if (downBtn) {
            downBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const step = (typeof sobreConfig.scroll.stepScrollPx === 'number')
                    ? sobreConfig.scroll.stepScrollPx
                    : 180;

                content.scrollBy({
                    top: step,
                    behavior: 'smooth'
                });
            });
        }

        // 3. Arrastar o cursor (Thumb Dragging) com suporte a Mouse e Touch
        let isDragging = false;
        let startY = 0;
        let startScrollTop = 0;

        function startDrag(clientY) {
            isDragging = true;
            startY = clientY;
            startScrollTop = content.scrollTop;
            thumb.classList.add('is-dragging');
            document.body.style.userSelect = 'none';
        }

        function moveDrag(clientY) {
            if (!isDragging) return;
            const deltaY = clientY - startY;
            const trackH = track.clientHeight;
            const thumbH = thumb.offsetHeight;
            const maxThumbTop = trackH - thumbH;
            const maxScroll = content.scrollHeight - content.clientHeight;

            if (maxThumbTop > 0 && maxScroll > 0) {
                const scrollDelta = (deltaY / maxThumbTop) * maxScroll;
                content.scrollTop = startScrollTop + scrollDelta;
                updateScrollbarMetrics();
            }
        }

        function endDrag() {
            if (!isDragging) return;
            isDragging = false;
            thumb.classList.remove('is-dragging');
            document.body.style.userSelect = '';
        }

        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startDrag(e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                moveDrag(e.clientY);
            }
        });

        window.addEventListener('mouseup', endDrag);

        // Suporte para dispositivos com Touch
        thumb.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                e.stopPropagation();
                startDrag(e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length > 0) {
                moveDrag(e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', endDrag);
        window.addEventListener('touchcancel', endDrag);

        // 4. Clique na trilha (Track) para salto proporcional
        track.addEventListener('click', (e) => {
            if (e.target === thumb || thumb.contains(e.target)) return;
            const rect = track.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const trackH = rect.height;
            const thumbH = thumb.offsetHeight;
            const maxScroll = content.scrollHeight - content.clientHeight;

            if (trackH > 0 && maxScroll > 0) {
                const targetFraction = Math.max(0, Math.min(1, (clickY - thumbH / 2) / (trackH - thumbH)));
                content.scrollTo({
                    top: targetFraction * maxScroll,
                    behavior: 'smooth'
                });
            }
        });

        // 5. Ajuste no redimensionamento da janela
        window.addEventListener('resize', () => {
            requestAnimationFrame(updateScrollbarMetrics);
        });

        // Observa alterações de dimensões do card e do conteúdo interno
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver(() => {
                requestAnimationFrame(updateScrollbarMetrics);
            });
            ro.observe(content);
            if (content.firstElementChild) {
                ro.observe(content.firstElementChild);
            }
            const cardEl = document.getElementById('sobreCard');
            if (cardEl) {
                ro.observe(cardEl);
            }
            ro.observe(track);
        }

        // Eventos adicionais para sincronização após carregamento de imagens e fontes
        window.addEventListener('load', () => {
            requestAnimationFrame(updateScrollbarMetrics);
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                requestAnimationFrame(updateScrollbarMetrics);
            });
        }
        const marcaImg = document.querySelector('.sobre-marca-img');
        if (marcaImg) {
            if (marcaImg.complete) {
                requestAnimationFrame(updateScrollbarMetrics);
            } else {
                marcaImg.addEventListener('load', () => requestAnimationFrame(updateScrollbarMetrics));
            }
        }

        updateScrollbarMetrics();
    }

    // Exporta utilitários para integração global
    window.applySobreConfig = applySobreConfig;
    window.loadSobreConfiguration = loadSobreConfiguration;
    window.updateScrollbarMetrics = updateScrollbarMetrics;

    // Inicialização ao carregar o DOM com verificações de métricas em múltiplos estágios
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initCustomScrollbar();
            loadSobreConfiguration();
            setTimeout(updateScrollbarMetrics, 60);
            setTimeout(updateScrollbarMetrics, 300);
        });
    } else {
        initCustomScrollbar();
        loadSobreConfiguration();
        setTimeout(updateScrollbarMetrics, 60);
        setTimeout(updateScrollbarMetrics, 300);
    }
})();
