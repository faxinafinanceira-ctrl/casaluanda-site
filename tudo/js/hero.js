/**
 * Casa Luanda — Módulo da Seção Hero
 * Gerencia a renderização, carregamento de configurações externas (YAML)
 * e animações de fade de entrada e transição coordenada por scroll.
 */
(function () {
  "use strict";

  // Fallback seguro caso o arquivo de configuração não esteja acessível (ex: protocolo file:// ou erro de rede)
  const DEFAULT_CONFIG = {
    hero: {
      animation: {
        fadeDurationMs: 1400,
        fadeDelayMs: 300,
        scrollDistancePx: 450,
        scrollTranslateYPx: -60,
        scrollMinOpacity: 0.0
      }
    }
  };

  let heroConfig = Object.assign({}, DEFAULT_CONFIG.hero.animation);
  let heroTitleElement = null;
  let hasAnimatedIn = false;

  /**
   * Parser minimalista e resiliente de YAML em tempo de execução (zero dependências)
   * Processa estruturas aninhadas, chaves, valores numéricos e booleanos.
   */
  function parseSimpleYAML(text) {
    const result = {};
    const lines = text.split(/\r?\n/);
    const stack = [{ indent: -1, obj: result }];

    for (let rawLine of lines) {
      // Ignora comentários e linhas em branco
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
  window.parseSimpleYAML = parseSimpleYAML;

  function deepMerge(target, ...sources) {
    for (const source of sources) {
      if (!source || typeof source !== "object") continue;
      for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
          if (!target[key] || typeof target[key] !== "object") {
            target[key] = {};
          }
          deepMerge(target[key], source[key]);
        } else if (source[key] !== undefined) {
          target[key] = source[key];
        }
      }
    }
    return target;
  }
  window.deepMergeConfig = deepMerge;

  /**
   * Carrega a configuração externa (JSON e/ou YAML) sem cache
   */
  async function loadConfiguration() {
    const cb = "?_t=" + Date.now();
    let jsonConfig = null;
    let yamlConfig = null;
    let jsonTime = 0;
    let yamlTime = 0;

    try {
      const jsonRes = await fetch("config/panel.config.JSON" + cb, { cache: "no-store" });
      if (jsonRes.ok) {
        const jsonText = await jsonRes.text();
        jsonConfig = JSON.parse(jsonText.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "").replace(/,\s*([\]}])/g, '$1'));
        const lm = jsonRes.headers.get("Last-Modified");
        if (lm) jsonTime = new Date(lm).getTime();
      }
    } catch (eJson) {}

    try {
      const yamlRes = await fetch("config/panel.config.yaml" + cb, { cache: "no-store" });
      if (yamlRes.ok) {
        const yamlText = await yamlRes.text();
        yamlConfig = parseSimpleYAML(yamlText);
        const lm = yamlRes.headers.get("Last-Modified");
        if (lm) yamlTime = new Date(lm).getTime();
      }
    } catch (eYaml) {}

    if (jsonConfig && yamlConfig) {
      // Mescla respeitando o arquivo editado mais recentemente
      window.APP_CONFIG = yamlTime > jsonTime
        ? deepMerge({}, jsonConfig, yamlConfig)
        : deepMerge({}, yamlConfig, jsonConfig);
      console.log("[Hero] Configurações unificadas (JSON + YAML):", window.APP_CONFIG);
    } else if (yamlConfig) {
      window.APP_CONFIG = yamlConfig;
      console.log("[Hero] Configuração carregada de panel.config.yaml:", yamlConfig);
    } else if (jsonConfig) {
      window.APP_CONFIG = jsonConfig;
      console.log("[Hero] Configuração carregada de panel.config.JSON:", jsonConfig);
    } else {
      window.APP_CONFIG = window.APP_CONFIG || DEFAULT_CONFIG;
    }

    if (window.APP_CONFIG && window.APP_CONFIG.hero && window.APP_CONFIG.hero.animation) {
      heroConfig = Object.assign({}, DEFAULT_CONFIG.hero.animation, window.APP_CONFIG.hero.animation);
    }
    if (typeof window.applyEventosConfig === "function") {
      window.applyEventosConfig();
    }
  }

  /**
   * Executa a animação de fade suave de entrada do título
   */
  function triggerHeroFadeIn() {
    if (hasAnimatedIn || !heroTitleElement) return;
    hasAnimatedIn = true;

    const delay = heroConfig.fadeDelayMs ?? 300;
    const duration = heroConfig.fadeDurationMs ?? 1400;

    setTimeout(() => {
      heroTitleElement.style.transition = "opacity " + duration + "ms cubic-bezier(0.22, 1, 0.36, 1), transform " + duration + "ms cubic-bezier(0.22, 1, 0.36, 1)";
      heroTitleElement.style.opacity = "1";
      heroTitleElement.style.transform = "translate(-50%, -50%)";

      // Após a conclusão da transição de entrada, desativa a transição fixa para permitir sincronia 60fps com o scroll
      setTimeout(() => {
        if (heroTitleElement) {
          heroTitleElement.style.transition = "none";
          initScrollIntegration();
        }
        window.__heroExperienceFinished = true;
        window.dispatchEvent(new CustomEvent("heroExperienceFinished"));
      }, duration);
    }, delay);
  }

  /**
   * Integração coordenada do título com o scroll da Hero
   */
  function initScrollIntegration() {
    function handleScroll(scrollY) {
      if (!heroTitleElement) return;

      const distance = heroConfig.scrollDistancePx || 450;
      const translateYMax = heroConfig.scrollTranslateYPx ?? -60;
      const minOpacity = heroConfig.scrollMinOpacity ?? 0.0;

      const progress = Math.min(Math.max(scrollY / distance, 0), 1);
      const currentOpacity = 1 - progress * (1 - minOpacity);
      const currentTranslateY = progress * translateYMax;

      heroTitleElement.style.opacity = currentOpacity.toFixed(3);
      heroTitleElement.style.transform = "translate(-50%, calc(-50% + " + currentTranslateY.toFixed(1) + "px))";

      if (currentOpacity <= 0.02) {
        heroTitleElement.style.visibility = "hidden";
        heroTitleElement.style.pointerEvents = "none";
      } else {
        heroTitleElement.style.visibility = "visible";
        heroTitleElement.style.pointerEvents = "auto";
      }
    }

    window.addEventListener(
      "scroll",
      () => {
        handleScroll(window.scrollY || window.pageYOffset || 0);
      },
      { passive: true }
    );

    // Ajuste inicial caso o documento já esteja rolado
    handleScroll(window.scrollY || window.pageYOffset || 0);
  }

  /**
   * Inicialização do componente Hero
   */
  async function initHero() {
    heroTitleElement = document.getElementById("heroTitle") || document.querySelector(".hero-title");
    if (!heroTitleElement) return;

    // Estado inicial: invisível até o término do preloader
    heroTitleElement.style.opacity = "0";

    await loadConfiguration();

    // Se o preloader já finalizou antes deste script executar
    if (window.__preloaderFinished || !document.getElementById("preloader")) {
      triggerHeroFadeIn();
    } else {
      // Ouve evento disparado pelo pre.js ao término do preloader
      window.addEventListener("preloaderFinished", () => {
        triggerHeroFadeIn();
      }, { once: true });

      // Fallback de contingência caso o preloader seja interrompido
      setTimeout(() => {
        if (!hasAnimatedIn) {
          triggerHeroFadeIn();
        }
      }, 5000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHero);
  } else {
    initHero();
  }
})();