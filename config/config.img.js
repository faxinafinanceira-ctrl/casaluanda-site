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
  paginaEventos: {},
  paginaSobre: {},
  paginaContato: {}
};

if (typeof window !== "undefined") {
  window.configImg = configImg;
  window.CONFIG_IMG = configImg;
}
