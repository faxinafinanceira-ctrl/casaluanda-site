'use strict';

/**
 * Lógica da Página de Transparência - Casa Luanda
 * Conexão do menu de navegação com index.html e páginas irmãs
 * Integração com painel centralizado de configurações (config/panel.config.JSON)
 * Filtros de documentos, acordeão orçamentário e cópia rápida de dados institucionais
 */

// Estado global de configurações da página de transparência
const defaultTransparenciaConfig = {
    layout: {
        maxWidthPx: 1200,
        marginTopMultiplier: 2,
        paddingRem: 2.0,
        paddingMobileRem: 1.0
    },
    accordion: {
        transitionDurationMs: 350,
        startOpen: false
    },
    documents: {
        defaultFilter: 'todos',
        defaultYear: 'todos',
        transitionDurationMs: 250
    },
    feedback: {
        copyFeedbackDurationMs: 2200,
        enableQuickCopy: true
    }
};

let activeConfig = { ...defaultTransparenciaConfig };

/**
 * Carrega e aplica os parâmetros externalizados de config/panel.config.JSON
 */
async function carregarConfiguracaoTransparencia() {
    try {
        const resposta = await fetch('config/panel.config.JSON?_t=' + Date.now(), { cache: 'no-store' });
        if (!resposta.ok) return;
        const config = await resposta.json();

        const root = document.documentElement;

        // 1. Configuração do Logotipo do Cabeçalho
        if (config.header && config.header.logo) {
            const logo = config.header.logo;
            if (logo.widthPx) root.style.setProperty('--header-logo-width', `${logo.widthPx}px`);
            if (logo.heightPx) root.style.setProperty('--header-logo-height', `${logo.heightPx}px`);
        }

        // 2. Configuração do Título da Seção Transparência
        if (config.transparencia && config.transparencia.title) {
            const titleConf = config.transparencia.title;
            if (typeof titleConf.marginTopRem === 'number') {
                root.style.setProperty('--transparencia-title-margin-top', `${titleConf.marginTopRem}rem`);
            }
            if (typeof titleConf.marginTopTabletRem === 'number') {
                root.style.setProperty('--transparencia-title-margin-top-tablet', `${titleConf.marginTopTabletRem}rem`);
            }
            if (typeof titleConf.marginTopMobileRem === 'number') {
                root.style.setProperty('--transparencia-title-margin-top-mobile', `${titleConf.marginTopMobileRem}rem`);
            }
            if (typeof titleConf.letterSpacingEm === 'number') {
                root.style.setProperty('--transparencia-title-letter-spacing', `${titleConf.letterSpacingEm}em`);
            }

            const glowEnabled = (titleConf.glowEnabled !== false);
            const intensity = (typeof titleConf.glowIntensity === 'number' && titleConf.glowIntensity >= 0)
                ? titleConf.glowIntensity
                : 1.0;

            const textShadow = (glowEnabled && intensity > 0)
                ? [
                    `0 0 50px rgba(255, 255, 255, ${Math.min(1, 1.0 * intensity).toFixed(2)})`,
                    `0 0 100px rgba(255, 240, 200, ${Math.min(1, 1.0 * intensity).toFixed(2)})`,
                    `0 0 150px rgba(255, 240, 200, ${Math.min(1, 0.9 * intensity).toFixed(2)})`,
                    `0 0 250px rgba(255, 240, 200, ${Math.min(1, 0.8 * intensity).toFixed(2)})`,
                    `0 0 350px rgba(255, 240, 200, ${Math.min(1, 0.7 * intensity).toFixed(2)})`
                ].join(', ')
                : 'none';

            root.style.setProperty('--transparencia-title-text-shadow', textShadow);
        }

        // 3. Configurações de Layout do Módulo de Transparência
        if (config.transparencia && config.transparencia.layout) {
            const layout = config.transparencia.layout;
            if (typeof layout.maxWidthPx === 'number') {
                root.style.setProperty('--transparencia-max-width', `${layout.maxWidthPx}px`);
                activeConfig.layout.maxWidthPx = layout.maxWidthPx;
            }
            if (typeof layout.marginTopMultiplier === 'number') {
                root.style.setProperty('--transparencia-margin-multiplier', layout.marginTopMultiplier);
                activeConfig.layout.marginTopMultiplier = layout.marginTopMultiplier;
            }
            if (typeof layout.paddingRem === 'number') {
                root.style.setProperty('--transparencia-padding-x', `${layout.paddingRem}rem`);
                activeConfig.layout.paddingRem = layout.paddingRem;
            }
        }

        // 4. Configurações do Accordion Financeiro
        if (config.transparencia && config.transparencia.accordion) {
            const acc = config.transparencia.accordion;
            if (typeof acc.transitionDurationMs === 'number') {
                root.style.setProperty('--transparencia-accordion-duration', `${acc.transitionDurationMs}ms`);
                activeConfig.accordion.transitionDurationMs = acc.transitionDurationMs;
            }
            if (typeof acc.startOpen === 'boolean') {
                activeConfig.accordion.startOpen = acc.startOpen;
                aplicarEstadoInicialAccordion(acc.startOpen);
            }
        }

        // 5. Configurações dos Documentos e Busca
        if (config.transparencia && config.transparencia.documents) {
            const docs = config.transparencia.documents;
            if (docs.defaultFilter) activeConfig.documents.defaultFilter = docs.defaultFilter;
            if (docs.defaultYear) activeConfig.documents.defaultYear = docs.defaultYear;
            if (typeof docs.transitionDurationMs === 'number') {
                activeConfig.documents.transitionDurationMs = docs.transitionDurationMs;
            }
        }

        // 6. Configurações de Feedback e Cópia Rápida
        if (config.transparencia && config.transparencia.feedback) {
            const fb = config.transparencia.feedback;
            if (typeof fb.copyFeedbackDurationMs === 'number') {
                activeConfig.feedback.copyFeedbackDurationMs = fb.copyFeedbackDurationMs;
            }
            if (typeof fb.enableQuickCopy === 'boolean') {
                activeConfig.feedback.enableQuickCopy = fb.enableQuickCopy;
                ajustarBotoesCopia(fb.enableQuickCopy);
            }
        }

    } catch (e) {
        // Fallback silencioso mantendo as variáveis oficiais
        console.warn('Transparência: utilizando configurações padrão internas.', e);
    }
}

/**
 * Ajusta visibilidade dos botões de cópia rápida conforme feature flag
 */
function ajustarBotoesCopia(habilitado) {
    const copyBtns = document.querySelectorAll('.tp-copy-btn');
    copyBtns.forEach(btn => {
        btn.style.display = habilitado ? 'inline-flex' : 'none';
    });
}

/**
 * Aplica estado inicial ao acordeão financeiro
 */
function aplicarEstadoInicialAccordion(deveAbrir) {
    const container = document.getElementById('accordionFinanceiro');
    const trigger = document.getElementById('accordionTrigger');
    const panel = document.getElementById('accordionPanel');
    if (!container || !trigger || !panel) return;

    if (deveAbrir) {
        container.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
    } else {
        container.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '0px';
    }
}

/**
 * Inicialização do Accordion Sanfonado de Dados Orçamentários
 */
function inicializarAccordion() {
    const container = document.getElementById('accordionFinanceiro');
    const trigger = document.getElementById('accordionTrigger');
    const panel = document.getElementById('accordionPanel');

    if (!container || !trigger || !panel) return;

    trigger.addEventListener('click', () => {
        const isOpen = container.classList.contains('is-open');
        if (isOpen) {
            container.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
            panel.style.maxHeight = '0px';
        } else {
            container.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            panel.style.maxHeight = panel.scrollHeight + 'px';
        }
    });

    // Recalcula max-height em caso de redimensionamento de tela
    window.addEventListener('resize', () => {
        if (container.classList.contains('is-open')) {
            panel.style.maxHeight = panel.scrollHeight + 'px';
        }
    });
}

/**
 * Inicialização dos Filtros e Campo de Busca do Repositório de Documentos
 */
function inicializarRepositorioDocumentos() {
    const yearButtons = document.querySelectorAll('#yearFilterGroup .tp-filter-btn');
    const categoryButtons = document.querySelectorAll('#categoryFilterGroup .tp-filter-btn');
    const searchInput = document.getElementById('docSearchInput');
    const docItems = document.querySelectorAll('.tp-doc-item');
    const emptyState = document.getElementById('docsEmpty');
    const countBadge = document.getElementById('docsCountBadge');

    let currentYear = activeConfig.documents.defaultYear || 'todos';
    let currentCategory = activeConfig.documents.defaultFilter || 'todos';
    let searchQuery = '';

    function aplicarFiltros() {
        let visibleCount = 0;

        docItems.forEach(item => {
            const itemYear = item.dataset.year || '';
            const itemCategory = item.dataset.category || '';
            const itemText = (item.textContent || '').toLowerCase();

            const matchYear = (currentYear === 'todos' || itemYear === currentYear);
            const matchCategory = (currentCategory === 'todos' || itemCategory === currentCategory);
            const matchSearch = (!searchQuery || itemText.includes(searchQuery));

            if (matchYear && matchCategory && matchSearch) {
                item.style.display = 'flex';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // Atualiza o contador de documentos
        if (countBadge) {
            countBadge.textContent = `${visibleCount} Documento${visibleCount === 1 ? '' : 's'} Disponíve${visibleCount === 1 ? 'l' : 'is'}`;
        }

        // Exibe ou oculta o estado vazio
        if (emptyState) {
            if (visibleCount === 0) {
                emptyState.classList.add('is-visible');
            } else {
                emptyState.classList.remove('is-visible');
            }
        }
    }

    // Eventos dos botões de Ano
    yearButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            yearButtons.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentYear = btn.dataset.year || 'todos';
            aplicarFiltros();
        });
    });

    // Eventos dos botões de Categoria
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentCategory = btn.dataset.category || 'todos';
            aplicarFiltros();
        });
    });

    // Evento de busca textual
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = (e.target.value || '').trim().toLowerCase();
            aplicarFiltros();
        });
    }

    // Executa filtro inicial
    aplicarFiltros();
}

/**
 * Notificação Flutuante Toast e Copiar para Área de Transferência
 */
let toastTimeout = null;

function exibirToast(mensagem) {
    const toast = document.getElementById('tpToast');
    const toastText = document.getElementById('tpToastText');
    if (!toast || !toastText) return;

    toastText.textContent = mensagem;
    toast.classList.add('is-active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('is-active');
    }, activeConfig.feedback.copyFeedbackDurationMs || 2200);
}

function inicializarBotoesCopia() {
    const copyBtns = document.querySelectorAll('.tp-copy-btn');

    copyBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const texto = btn.dataset.copy;
            if (!texto) return;

            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(texto);
                } else {
                    // Fallback para navegadores sem suporte direto ao navigator.clipboard
                    const tempInput = document.createElement('textarea');
                    tempInput.value = texto;
                    tempInput.style.position = 'fixed';
                    tempInput.style.opacity = '0';
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                }
                exibirToast(`Copiado: "${texto}"`);
            } catch (err) {
                exibirToast('Não foi possível copiar automaticamente.');
            }
        });
    });
}

/**
 * Evento Principal DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Garantir ocultação do link da página atual no menu
    const currentSection = 'transparencia';
    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach(btn => {
        if (btn.dataset.section === currentSection) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-block';
        }
    });

    // 2. Garantir dimensões oficiais do Logotipo
    const logoImgs = document.querySelectorAll('.header-logo img');
    logoImgs.forEach(img => {
        if (!img.getAttribute('src')) {
            img.src = 'tudo/obts/logo.png';
        }
    });

    // 3. Aplica parâmetros centralizados do painel de configuração
    carregarConfiguracaoTransparencia();

    // 4. Inicializa interações do módulo de transparência
    inicializarAccordion();
    inicializarRepositorioDocumentos();
    inicializarBotoesCopia();
});

/**
 * Função Global de Roteamento e Navegação do Menu
 * Conecta perfeitamente botões externos com seções do index.html e sobre-nos.html
 */
window.aoClicarMenu = function (nome, sectionId) {
    const rotas = {
        'Eventos': 'index.html#ultimos-eventos',
        'ultimos-eventos': 'index.html#ultimos-eventos',
        'Sobre nós': 'sobre-nos.html',
        'sobre-nos': 'sobre-nos.html',
        'Projetos': 'index.html#projetos',
        'projetos': 'index.html#projetos',
        'Agentes culturais': 'index.html#agentes-culturais',
        'agentes-culturais': 'index.html#agentes-culturais',
        'Transparência': 'transparencia.html',
        'transparencia': 'transparencia.html'
    };

    const destino = rotas[sectionId] || rotas[nome];

    if (destino) {
        window.location.href = destino;
    } else {
        window.location.href = `index.html#${sectionId}`;
    }
};
