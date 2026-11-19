class NavMenu extends HTMLElement {
    constructor() {
        super();
        this.menuItems = [
            { label: 'Eventos', sectionId: 'ultimos-eventos' },
            { label: 'Sobre nós', sectionId: 'sobre-nos' },
            { label: 'Projetos', sectionId: 'projetos' },
            { label: 'Agentes culturais', sectionId: 'agentes-culturais' },
            { label: 'Transparência', sectionId: 'transparencia' }
        ];
    }

    connectedCallback() {
        this.render();
        // Inicializa o estado visual imediatamente com base na seção onde o menu está inserido
        const parentSection = this.closest('section[id]');
        if (parentSection && parentSection.id) {
            this.updateActiveSection(parentSection.id);
        }
        this.setupIntersectionObserver();
    }

    render() {
        // Gerar os botões do menu com base na array
        const navHtml = this.menuItems.map(item => `
            <button class="nav-link" data-section="${item.sectionId}" onclick="window.aoClicarMenu('${item.label}', '${item.sectionId}')">
                ${item.label}
            </button>
        `).join('');

        this.innerHTML = `
            <nav class="header-nav">
                ${navHtml}
            </nav>
        `;
    }

    setupIntersectionObserver() {
        // Opções do observer: disparar quando a seção estiver com pelo menos 40% de visibilidade
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.4
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        // Observa todas as tags <section> da página que possuem id
        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    }

    updateActiveSection(activeSectionId) {
        // Se a seção ativa não for uma que está no menu, e sim a "hero", 
        // talvez não esconda nada ou mostre o comportamento default.
        const buttons = this.querySelectorAll('.nav-link');

        buttons.forEach(button => {
            if (button.dataset.section === activeSectionId) {
                // Esconde completamente o botão correspondente à seção atual
                button.style.display = 'none';
            } else {
                // Garante que os demais botões estejam visíveis
                button.style.display = 'inline-block';
            }
        });
    }
}

// Define o novo Custom Element nativo <nav-menu>
if (!customElements.get('nav-menu')) {
    customElements.define('nav-menu', NavMenu);
}

// Fallback para navegação global entre páginas se não houver manipulador específico carregado
if (typeof window.aoClicarMenu !== 'function') {
    window.aoClicarMenu = function (nome, sectionId) {
        const targetId = sectionId || (
            (nome === 'Sobre nós' || nome === 'Sobre nos') ? 'sobre-nos' :
                (nome === 'Eventos' || nome === 'Últimos eventos') ? 'ultimos-eventos' :
                    (nome === 'Transparência' || nome === 'transparencia') ? 'transparencia' :
                        null
        );

        if (targetId) {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
                return;
            }
            if (targetId === 'sobre-nos') {
                window.location.href = 'sobre-nos.html';
                return;
            }
            if (targetId === 'ultimos-eventos') {
                window.location.href = 'index.html#ultimos-eventos';
                return;
            }
            if (targetId === 'transparencia') {
                window.location.href = 'transparencia.html';
                return;
            }
        }
    };
}
