/* Ilustraciones en línea fina, en el estilo del avatar de @bel.intimma.
   Se usan en el hero y como imagen de los productos que todavía no tienen foto.
   Todos los trazos usan pathLength="1" para poder "dibujarse" con CSS. */

(function () {
  const p = (d, extra = "") => `<path pathLength="1" d="${d}" ${extra}/>`;
  const punteado = (d) => `<path class="trazo-encaje" d="${d}"/>`;

  // Desplaza un grupo dentro del lienzo
  const grupo = (x, y, contenido, escala = 1) =>
    `<g transform="translate(${x} ${y}) scale(${escala})">${contenido}</g>`;

  const mono = (x, y) => [
    p(`M${x} ${y} C${x - 8} ${y - 8} ${x - 14} ${y} ${x - 1} ${y + 2}`),
    p(`M${x} ${y} C${x + 8} ${y - 8} ${x + 14} ${y} ${x + 1} ${y + 2}`),
    p(`M${x - 1} ${y + 2} L${x - 5} ${y + 12}`),
    p(`M${x + 1} ${y + 2} L${x + 5} ${y + 12}`)
  ].join("");

  // Corpiño con aro (balconette): 200 x 125
  const conAro = [
    p("M58 6 L52 62"), p("M142 6 L148 62"),
    p("M30 92 C36 74 46 66 52 64 C70 60 88 72 98 84"),
    p("M170 92 C164 74 154 66 148 64 C130 60 112 72 102 84"),
    p("M30 92 C42 118 84 122 100 104"),
    p("M170 92 C158 118 116 122 100 104"),
    p("M98 84 L100 104 L102 84"),
    p("M30 92 L12 98 L15 114 L42 113"),
    p("M170 92 L188 98 L185 114 L158 113"),
    punteado("M35 94 C41 79 49 72 55 70 C70 67 86 77 95 88"),
    punteado("M165 94 C159 79 151 72 145 70 C130 67 114 77 105 88"),
    p("M60 63 C65 82 70 100 73 116"),
    p("M140 63 C135 82 130 100 127 116"),
    mono(100, 84)
  ].join("");

  // Bralette sin aro (triángulo): 200 x 125
  const sinAro = [
    p("M66 6 L70 40"), p("M134 6 L130 40"),
    p("M70 40 C56 60 44 80 36 97"),
    p("M70 40 C82 60 92 78 98 93"),
    p("M130 40 C144 60 156 80 164 97"),
    p("M130 40 C118 60 108 78 102 93"),
    p("M30 98 Q100 114 170 98"),
    p("M28 112 Q100 128 172 112"),
    p("M30 98 L28 112"), p("M170 98 L172 112"),
    punteado("M70 50 C60 66 51 81 45 93"),
    punteado("M70 50 C79 66 87 79 92 90"),
    punteado("M130 50 C140 66 149 81 155 93"),
    punteado("M130 50 C121 66 113 79 108 90"),
    punteado("M34 105 Q100 121 166 105"),
    mono(100, 96)
  ].join("");

  // Bombacha: 200 x 95
  const bombacha = [
    p("M48 10 Q100 22 152 10"),
    p("M48 10 L56 34"), p("M152 10 L144 34"),
    p("M56 34 C76 40 92 56 94 86"),
    p("M144 34 C124 40 108 56 106 86"),
    p("M94 86 Q100 88 106 86"),
    punteado("M51 17 Q100 29 149 17"),
    punteado("M61 40 C78 46 89 60 91 82"),
    punteado("M139 40 C122 46 111 60 109 82"),
    mono(100, 18)
  ].join("");

  // Pijama: camisa + short, 200 x 235
  const pijama = [
    p("M80 10 L54 18 L28 44 L44 60 L56 50 L56 140 L144 140 L144 50 L156 60 L172 44 L146 18 L120 10"),
    p("M80 10 Q100 20 120 10"),
    p("M80 10 L72 28 L88 38 L100 52"),
    p("M120 10 L128 28 L112 38 L100 52"),
    p("M100 52 L100 140"),
    p("M66 68 h18 v15 q-9 5 -18 0 z"),
    punteado("M32 42 L47 57"), punteado("M168 42 L153 57"),
    punteado("M59 134 L141 134"),
    '<circle class="boton" cx="104" cy="66" r="1.8"/>',
    '<circle class="boton" cx="104" cy="86" r="1.8"/>',
    '<circle class="boton" cx="104" cy="106" r="1.8"/>',
    '<circle class="boton" cx="104" cy="126" r="1.8"/>',
    p("M62 152 L138 152 L146 224 L108 226 L100 184 L92 226 L54 224 Z"),
    p("M62 160 L138 160"),
    punteado("M56 217 L92 219"), punteado("M108 219 L144 217"),
    mono(100, 156)
  ].join("");

  const svg = (viewBox, contenido, clase = "") =>
    `<svg class="dibujo ${clase}" viewBox="${viewBox}" fill="none" focusable="false" aria-hidden="true">${contenido}</svg>`;

  window.DIBUJOS = {
    // Para tarjetas de producto (proporción 4:5)
    "con-aro": () => svg("0 0 200 250", grupo(0, 22, conAro) + grupo(20, 152, bombacha, 0.8)),
    "sin-aro": () => svg("0 0 200 250", grupo(0, 22, sinAro) + grupo(20, 152, bombacha, 0.8)),
    "pijama": () => svg("0 0 200 250", grupo(0, 8, pijama)),

    // Composición del avatar: corpiño, @usuario, bombacha
    avatar: (usuario) =>
      svg(
        "0 0 300 300",
        grupo(50, 40, conAro) +
          `<text class="avatar__usuario" x="150" y="186" text-anchor="middle">@${usuario}</text>` +
          grupo(70, 204, bombacha, 0.8),
        "dibujo--avatar"
      ),

    vacio: () => svg("0 0 200 130", sinAro, "dibujo--chico")
  };
})();
