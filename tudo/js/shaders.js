const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform sampler2D uTrail;

// Duas texturas para o fade do carrossel
uniform sampler2D uTextureA;   // imagem atual
uniform sampler2D uTextureB;   // próxima imagem
uniform float     uTransition; // 0.0 = só A, 1.0 = só B
uniform float     uHasB;       // 1.0 se há uma segunda imagem válida, senão 0.0

// Controles globais
uniform float uMotionMagnitude;
uniform float uImageAspectA;
uniform float uImageAspectB;
uniform float uBlurIntensity;
uniform float uTintIntensity;
uniform float uGrainIntensity;
uniform float uShimmerSpeed;
uniform float uShimmerStrength;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float paperGrain(vec2 uv, float intensity) {
    float v = 0.0;
    float amp = 1.0;
    vec2 p = uv * 900.0;
    float totalAmp = 0.0;
    for (int i = 0; i < 4; i++) {
        v += amp * vnoise(p);
        totalAmp += amp;
        p *= 2.2;
        amp *= 0.45;
    }
    v = v / totalAmp;
    return (v - 0.5) * intensity;
}

vec4 getBlurredTexture(sampler2D tex, vec2 uv, float intensity) {
    if (intensity <= 0.0) {
        return texture2D(tex, uv);
    }
    vec4 sum = vec4(0.0);
    float totalWeight = 0.0;
    float n = hash(uv * 12.34 + uTime);
    vec2 step = (intensity * 0.001) / uResolution;

    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            float fx = float(x);
            float fy = float(y);
            float weight = 1.0 - (abs(fx) + abs(fy)) * 0.2;
            if (weight > 0.0) {
                vec2 offset = vec2(fx + (n - 0.5), fy + (fract(n * 10.0) - 0.5));
                vec2 sampleUv = uv + offset * step * 10.0;
                sampleUv = clamp(sampleUv, 0.002, 0.998);
                sum += texture2D(tex, sampleUv) * weight;
                totalWeight += weight;
            }
        }
    }
    return sum / totalWeight;
}

void main() {
    vec2 uvCorrected = vec2(vUv.x, 1.0 - vUv.y);

    // Cover dinâmico A
    float screenAspect = uResolution.x / uResolution.y;
    vec2 uvBaseA = uvCorrected;
    if (screenAspect > uImageAspectA) {
        uvBaseA.y = (uvCorrected.y - 0.5) * (uImageAspectA / screenAspect) + 0.5;
    } else {
        uvBaseA.x = (uvCorrected.x - 0.5) * (screenAspect / uImageAspectA) + 0.5;
    }
    uvBaseA = clamp(uvBaseA, 0.0, 1.0);

    // Cover dinâmico B
    vec2 uvBaseB = uvCorrected;
    if (uHasB > 0.5) {
        if (screenAspect > uImageAspectB) {
            uvBaseB.y = (uvCorrected.y - 0.5) * (uImageAspectB / screenAspect) + 0.5;
        } else {
            uvBaseB.x = (uvCorrected.x - 0.5) * (screenAspect / uImageAspectB) + 0.5;
        }
        uvBaseB = clamp(uvBaseB, 0.0, 1.0);
    }

    // Animação ping-pong de 22s
    float tempoLoop = mod(uTime, 22.0);
    float t = tempoLoop < 11.0 ? tempoLoop : 22.0 - tempoLoop;

    float zoomAtual = 1.0;
    float posX = 0.0;
    float posY = 0.0;

    if (t < 1.0) {
        zoomAtual = 1.0; posX = 0.0; posY = 0.0;
    } else if (t < 5.0) {
        float p = smoothstep(1.0, 5.0, t);
        zoomAtual = mix(1.0, 1.25, p);
        posX = mix(0.0, 0.285, p);
        posY = mix(0.0, 0.03, p);
    } else if (t < 8.0) {
        float p = smoothstep(5.0, 8.0, t);
        zoomAtual = 1.25;
        posX = mix(0.285, -0.35, p);
        posY = mix(0.03, 0.0, p);
    } else {
        float p = smoothstep(8.0, 11.0, t);
        zoomAtual = mix(1.25, 1.0, p);
        posX = mix(-0.35, 0.0, p);
        posY = 0.0;
    }

    // Aplica magnitude global
    zoomAtual = mix(1.0, zoomAtual, uMotionMagnitude);
    posX *= uMotionMagnitude;
    posY *= uMotionMagnitude;

    vec2 centeredUvA = uvBaseA - 0.5;
    centeredUvA = centeredUvA / zoomAtual;
    centeredUvA = centeredUvA + 0.5;
    vec2 animatedUvA = centeredUvA + vec2(posX, -posY);
    animatedUvA = clamp(animatedUvA, 0.001, 0.999);

    vec2 centeredUvB = uvBaseB - 0.5;
    centeredUvB = centeredUvB / zoomAtual;
    centeredUvB = centeredUvB + 0.5;
    vec2 animatedUvB = centeredUvB + vec2(posX, -posY);
    animatedUvB = clamp(animatedUvB, 0.001, 0.999);

    // Trail do mouse
    float trailVal = texture2D(uTrail, vec2(vUv.x, 1.0 - vUv.y)).r;

    // Amostra A (blur + original)
    vec4 originalA = texture2D(uTextureA, animatedUvA);
    vec4 blurredA  = getBlurredTexture(uTextureA, animatedUvA, uBlurIntensity);

    // Amostra B apenas se existir
    vec4 originalB = originalA;
    vec4 blurredB  = blurredA;
    if (uHasB > 0.5) {
        originalB = texture2D(uTextureB, animatedUvB);
        blurredB  = getBlurredTexture(uTextureB, animatedUvB, uBlurIntensity);
    }

    // Mix do carrossel (fade entre A e B)
    vec4 original = mix(originalA, originalB, uTransition);
    vec4 blurred  = mix(blurredA,  blurredB,  uTransition);

    // Filtro terroso + grão
    vec3 C_brown  = vec3(0.541, 0.353, 0.184);
    vec3 C_tinted = mix(blurred.rgb, C_brown, uTintIntensity);

    float grain = paperGrain(vUv, uGrainIntensity);
    grain += (hash(vUv * 300.0 + floor(uTime * uShimmerSpeed)) - 0.5)
             * uShimmerStrength * uMotionMagnitude;

    vec3 C_effect = C_tinted + grain;
    vec3 finalColor = mix(C_effect, original.rgb, trailVal);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// ============================================================
// SHADERS DEDICADOS: SEÇÃO ÚLTIMOS EVENTOS
// Fundo estático com casa.png, desfoque e filtro terroso (SEM grão de areia)
// ============================================================
const EVENTOS_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const EVENTOS_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;

uniform vec2      uResolution;       // Tamanho do canvas
uniform vec2      uScreenResolution; // Resolução da viewport (para paralaxe fixa)
uniform sampler2D uTexture;          // Imagem casa.png
uniform float     uImageAspect;      // Aspect ratio da imagem casa.png
uniform float     uBlurIntensity;    // Intensidade do desfoque multi-amostras
uniform float     uTintIntensity;    // Mistura com a cor terrosa

// Desfoque multi-amostras (getBlurredTexture) para suavizar detalhes da imagem casa.png
vec4 getBlurredTexture(sampler2D tex, vec2 uv, float intensity) {
    if (intensity <= 0.0) {
        return texture2D(tex, uv);
    }
    vec4 sum = vec4(0.0);
    float totalWeight = 0.0;
    vec2 step = (intensity * 0.001) / uScreenResolution;

    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            float fx = float(x);
            float fy = float(y);
            float weight = 1.0 - (abs(fx) + abs(fy)) * 0.2;
            if (weight > 0.0) {
                vec2 offset = vec2(fx, fy);
                vec2 sampleUv = uv + offset * step * 10.0;
                sampleUv = clamp(sampleUv, 0.002, 0.998);
                sum += texture2D(tex, sampleUv) * weight;
                totalWeight += weight;
            }
        }
    }
    return sum / totalWeight;
}

void main() {
    // Mapeamento em coordenadas da viewport para efeito fixo/estático (background-attachment: fixed)
    vec2 screenCoord = gl_FragCoord.xy / uScreenResolution;
    vec2 uvCorrected = vec2(screenCoord.x, 1.0 - screenCoord.y);

    // Cover estático mantendo proporção da imagem casa.png na tela
    float screenAspect = uScreenResolution.x / uScreenResolution.y;
    vec2 uvCover = uvCorrected;
    if (screenAspect > uImageAspect) {
        uvCover.y = (uvCorrected.y - 0.5) * (uImageAspect / screenAspect) + 0.5;
    } else {
        uvCover.x = (uvCorrected.x - 0.5) * (screenAspect / uImageAspect) + 0.5;
    }
    uvCover = clamp(uvCover, 0.001, 0.999);

    // 1. Aplica desfoque multi-amostras na imagem casa.png
    vec4 blurred = getBlurredTexture(uTexture, uvCover, uBlurIntensity);

    // 2. Cor terrosa aquecida padronizada em vetor RGB
    vec3 C_brown = vec3(0.541, 0.353, 0.184);

    // 3. Aplica a mistura (blend) entre imagem desfocada e a cor terrosa através de uTintIntensity
    vec3 C_tinted = mix(blurred.rgb, C_brown, uTintIntensity);

    // 4. Sem ruído procedural de grão (paperGrain / FBM noise / uGrainIntensity removidos)
    gl_FragColor = vec4(C_tinted, 1.0);
}
`;