const configImg = {
  paginaInicial: {
    logo: {
      caminho: "tudo/obts/logo.png",
      link: "",
      alt: "Logo Casa Luanda"
    },
    setaAnterior: {
      caminho: "tudo/obts/setadireita.svg",
      link: "",
      alt: ""
    },
    setaProximo: {
      caminho: "tudo/obts/setadireita.svg",
      link: "",
      alt: ""
    },
    setaAbaixo: {
      caminho: "tudo/obts/setaparabaixo.svg",
      link: "",
      alt: "Rolar para o conteúdo"
    },
    cartazes: [
      {
        caminho: "tudo/obts/indice1.jpg",
        link: "https://www.instagram.com/p/DfXQCdOEu67/?img_index=1",
        alt: "Evento 1"
      },
      {
        caminho: "tudo/obts/indice2.jpg",
        link: "https://www.instagram.com/p/DfXQCdOEu67/?img_index=1",
        alt: "Evento 2"
      },
      {
        caminho: "tudo/obts/indice3.jpg",
        link: "https://www.instagram.com/p/DfXQCdOEu67/?img_index=1",
        alt: "Evento 3"
      },
      {
        caminho: "tudo/obts/indice4.jpg",
        link: "https://www.instagram.com/p/DfXQCdOEu67/?img_index=1",
        alt: "Evento 4"
      },
      {
        caminho: "tudo/obts/indice5.jpg",
        link: "https://www.instagram.com/p/DfXQCdOEu67/?img_index=1",
        alt: "Evento 5"
      }
    ]
  },
  paginaEventos: {
    fundo: {
      caminho: "tudo/obts/casa.png",
      caminhoMobile: "tudo/obts/mb.casa.png",
      link: "",
      alt: "Fundo ilustrado da seção Últimos Eventos"
    }
  },
  paginaSobre: {
    fundo: {
      caminho: "tudo/obts/qmos.png",
      caminhoMobile: "tudo/obts/mb.qmos.png",
      link: "",
      alt: "Fundo ilustrado da seção Sobre Nós"
    },
    logo: {
      caminho: "tudo/obts/logo.png",
      link: "",
      alt: "Logo Casa Luanda"
    },
    marca: {
      caminho: "tudo/obts/marca.png",
      link: "",
      alt: "Marca Institucional Casa Luanda"
    },
    setaScroll: {
      caminho: "tudo/obts/setaparabaixo.svg",
      link: "",
      alt: "Indicador de rolagem do card"
    }
  },
  paginaContato: {}
};

if (typeof window !== "undefined") {
  window.configImg = configImg;
  window.CONFIG_IMG = configImg;
}
