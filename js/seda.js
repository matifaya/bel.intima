/* ==========================================================================
   Papel de seda 3D del hero (Three.js)
   --------------------------------------------------------------------------
   Una tela de satén rosa que ondula sola, se abulta donde está el cursor
   (o el dedo) y se "levanta" al hacer scroll, como cuando se abre el papel
   de un regalo.

   - Se carga después de que la página ya se ve (no frena la primera carga).
   - Si el navegador no tiene WebGL, queda el fondo rosa liso de siempre.
   - Con "reducir movimiento" activado, se dibuja una sola vez, quieta.
   - Se pausa cuando el hero no está en pantalla o la pestaña está oculta.
   ========================================================================== */

(function () {
  "use strict";

  // Three.js alojado en el propio sitio (ver el encabezado del archivo para su origen).
  // Se resuelve contra la página, así funciona también si el sitio vive en una subcarpeta
  // (por ejemplo usuario.github.io/bel.intima/).
  const THREE_URL = new URL("js/vendor/three-seda.min.js", document.baseURI).href;

  const hero = document.querySelector("[data-seda]");
  if (!hero) return;

  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = window.matchMedia("(max-width: 700px)").matches;

  // Colores (sRGB 0-1) tomados de los tokens de la marca
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const PALETA = {
    base: hex("#FFC1E0"),   // rosa-bel apenas más claro
    luz: hex("#FFEAF4"),    // brillo del satén
    pliegue: hex("#E68BB7"),// sombra de los pliegues
    borde: hex("#FFE0EF")   // rosa-velo: funde con el festón
  };

  const NOISE = /* glsl */ `
    // Simplex 3D — Ashima Arts / Stefan Gustavson (MIT)
    vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0/7.0;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `;

  const VERTEX = /* glsl */ `
    uniform float uTime;
    uniform vec2  uPointer;
    uniform float uPress;
    uniform float uScroll;
    uniform float uEscala;
    varying vec3  vN;
    varying vec3  vView;
    varying float vH;
    ${NOISE}

    // Altura de la tela: pliegues largos en diagonal (como satén apoyado)
    // deformados por un ruido muy lento, más una ondulación amplia de fondo
    float altura(vec2 q){
      // En pantallas angostas se ven más pliegues (si no, la tela queda "ampliada")
      vec2 p = q * uEscala;
      float t = uTime * 0.22;
      vec2 dir = normalize(vec2(0.82, 0.57));
      float d = dot(p, dir);
      d += snoise(vec3(p * 0.16, t * 0.35)) * 1.6;
      float a = 0.0;
      a += sin(d * 1.15 + t) * 0.20;
      a += sin(d * 2.4 - t * 0.8 + 1.3) * 0.055;
      a += snoise(vec3(p * 0.22, t * 0.5)) * 0.26;
      // Al hacer scroll la seda se agita y se levanta
      a *= 1.0 + uScroll * 1.2;
      a += uScroll * uScroll * (p.y + 2.0) * 0.35;
      // El cursor empuja la tela desde abajo, como una mano bajo la seda
      float r = distance(p, uPointer * uEscala);
      a += exp(-r * r * 1.1) * 0.38 * uPress;
      return a;
    }

    void main(){
      vec3 pos = position;
      float e = 0.025;
      float hc = altura(pos.xy);
      float hx = altura(pos.xy + vec2(e, 0.0));
      float hy = altura(pos.xy + vec2(0.0, e));
      pos.z += hc;
      vec3 n = normalize(vec3(-(hx - hc) / e, -(hy - hc) / e, 1.0));
      vN = normalize(normalMatrix * n);
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      vView = -mv.xyz;
      vH = hc;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const FRAGMENT = /* glsl */ `
    precision highp float;
    uniform vec3 uBase;
    uniform vec3 uLuz;
    uniform vec3 uPliegue;
    uniform vec3 uBorde;
    uniform vec2 uRes;
    uniform float uAparecer;
    varying vec3  vN;
    varying vec3  vView;
    varying float vH;

    void main(){
      vec3 N = normalize(vN);
      vec3 V = normalize(vView);
      vec3 L = normalize(vec3(-0.45, 0.65, 0.75));

      // Difuso envolvente: los pliegues se oscurecen hacia un rosa más profundo
      float dif = dot(N, L) * 0.5 + 0.5;
      vec3 col = mix(uPliegue, uBase, smoothstep(0.24, 0.86, dif));
      col = mix(col, uLuz, smoothstep(0.78, 1.0, dif) * 0.55);

      // Brillo del satén: un lóbulo ancho y uno fino
      vec3 H = normalize(L + V);
      float nh = max(dot(N, H), 0.0);
      col += vec3(1.0, 0.97, 0.985) * (pow(nh, 18.0) * 0.14 + pow(nh, 90.0) * 0.2);

      // Fresnel: el borde de cada pliegue se ilumina, como la seda
      float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      col += uLuz * fr * 0.12;

      // Funde con el festón en el borde inferior
      float y = gl_FragCoord.y / uRes.y;
      col = mix(col, uBorde, smoothstep(0.1, 0.0, y));

      // Grano mínimo para evitar bandas en los degradés
      float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      col += (g - 0.5) * 0.014;

      gl_FragColor = vec4(mix(uBorde, col, uAparecer), 1.0);
    }
  `;

  function soportaWebGL() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      return false;
    }
  }

  async function iniciar() {
    if (!soportaWebGL()) return;
    let THREE;
    try {
      THREE = await import(THREE_URL);
    } catch {
      return; // no se pudo cargar (por ejemplo, abriendo el archivo con doble clic): queda el fondo liso
    }

    const canvas = document.createElement("canvas");
    canvas.className = "seda";
    canvas.setAttribute("aria-hidden", "true");
    hero.prepend(canvas);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !celular, alpha: false, powerPreference: "low-power" });
    } catch {
      canvas.remove();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, celular ? 1.25 : 1.75));

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    camara.position.set(0, 0, 9);

    const segX = celular ? 90 : 170;
    const segY = celular ? 110 : 110;
    const geometria = new THREE.PlaneGeometry(1, 1, segX, segY);
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uPress: { value: 0 },
      uScroll: { value: 0 },
      uEscala: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAparecer: { value: 0 },
      uBase: { value: new THREE.Vector3(...PALETA.base) },
      uLuz: { value: new THREE.Vector3(...PALETA.luz) },
      uPliegue: { value: new THREE.Vector3(...PALETA.pliegue) },
      uBorde: { value: new THREE.Vector3(...PALETA.borde) }
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms });
    const tela = new THREE.Mesh(geometria, material);
    tela.rotation.x = -0.32;
    escena.add(tela);

    // Tamaño: la tela siempre cubre todo el hero, con margen para los bordes
    function medir() {
      const w = hero.clientWidth;
      const h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
      const altoVisible = 2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.position.z;
      const anchoVisible = altoVisible * camara.aspect;
      // La geometría se arma en unidades reales (sin escalar) para que el tamaño
      // de los pliegues sea el mismo en cualquier ancho de pantalla
      tela.geometry.dispose();
      tela.geometry = new THREE.PlaneGeometry(anchoVisible * 1.35, altoVisible * 1.6, segX, segY);
      uniforms.uEscala.value = THREE.MathUtils.clamp(5.5 / anchoVisible, 1, 1.9);
      const px = renderer.getPixelRatio();
      uniforms.uRes.value.set(w * px, h * px);
    }
    medir();

    // Cursor/dedo → punto sobre la tela
    const raycaster = new THREE.Raycaster();
    const plano = new THREE.Plane();
    const punto = new THREE.Vector3();
    const objetivo = new THREE.Vector2(99, 99);
    const ndc = new THREE.Vector2();
    let presionObjetivo = 0;
    let camObjetivoX = 0;
    let camObjetivoY = 0;

    function alMover(e) {
      const r = hero.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camara);
      tela.updateMatrixWorld();
      plano.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1).applyQuaternion(tela.quaternion),
        tela.position
      );
      if (raycaster.ray.intersectPlane(plano, punto)) {
        tela.worldToLocal(punto);
        objetivo.set(punto.x, punto.y);
        presionObjetivo = 1;
      }
      camObjetivoX = ndc.x * 0.25;
      camObjetivoY = ndc.y * 0.15;
    }

    if (!reducido) {
      hero.addEventListener("pointermove", alMover, { passive: true });
      hero.addEventListener("pointerdown", alMover, { passive: true });
      hero.addEventListener("pointerleave", () => { presionObjetivo = 0; camObjetivoX = 0; camObjetivoY = 0; });
    }

    // Progreso del scroll del hero (0 = arriba, 1 = ya pasó)
    function progresoScroll() {
      const r = hero.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / r.height));
    }

    let visible = true;
    let corriendo = false;
    let ultimo = performance.now();
    let tiempo = Math.random() * 100;

    function cuadro(ahora) {
      if (!visible || document.hidden) { corriendo = false; return; }
      const dt = Math.min(0.05, (ahora - ultimo) / 1000);
      ultimo = ahora;
      tiempo += dt;

      const suave = 1 - Math.pow(0.0015, dt); // amortiguado independiente de los fps
      uniforms.uTime.value = tiempo;
      uniforms.uPointer.value.lerp(objetivo, suave * 0.6);
      uniforms.uPress.value += (presionObjetivo - uniforms.uPress.value) * suave * 0.5;
      uniforms.uScroll.value += (progresoScroll() - uniforms.uScroll.value) * suave;
      uniforms.uAparecer.value = Math.min(1, uniforms.uAparecer.value + dt / 1.4);
      camara.position.x += (camObjetivoX - camara.position.x) * suave * 0.4;
      camara.position.y += (camObjetivoY - camara.position.y) * suave * 0.4;
      camara.lookAt(0, 0, 0);

      renderer.render(escena, camara);
      requestAnimationFrame(cuadro);
    }

    function arrancar() {
      if (corriendo || reducido) return;
      corriendo = true;
      ultimo = performance.now();
      requestAnimationFrame(cuadro);
    }

    if (reducido) {
      uniforms.uAparecer.value = 1;
      uniforms.uTime.value = 12;
      renderer.render(escena, camara);
    } else {
      new IntersectionObserver(([entrada]) => {
        visible = entrada.isIntersecting;
        if (visible) arrancar();
      }).observe(hero);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) arrancar(); });
      arrancar();
    }

    let espera;
    new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        medir();
        if (reducido) renderer.render(escena, camara);
      }, 120);
    }).observe(hero);

    hero.classList.add("con-seda");
  }

  // Cargar después de que la página ya está visible
  const cuandoPuedas = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));
  if (document.readyState === "complete") cuandoPuedas(iniciar);
  else window.addEventListener("load", () => cuandoPuedas(iniciar), { once: true });
})();
