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
        this.setupIntersectionObserver();
    }

    render() {
        // Gerar os botões do menu com base na array
        const navHtml = this.menuItems.map(item => `
            <button class="nav-link" data-section="${item.sectionId}" onclick="window.aoClicarMenu('${item.label}')">
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
        // Opções do observer: disparar quando a seção estiver 50% visível
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
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
customElements.define('nav-menu', NavMenu);
