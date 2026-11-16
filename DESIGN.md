# Bel Intimma — sistema de diseño

## Objetivo y público
Emprendimiento de ropa interior y pijamas de Gral. San Martín (Buenos Aires).
La mayoría de las visitas llegan desde la bio de Instagram/TikTok, en el celular.
El trabajo de la página: que alguien vea una prenda, elija talle y color, y mande
el pedido por WhatsApp en menos de un minuto.

## Concepto: "la cajita de regalo"
Abrir una compra de lencería se parece a abrir un regalo: papel de seda rosa,
un moñito, una ilustración delicada. La página toma tres elementos que ya existen
en la marca y los lleva a escala:

1. **El avatar circular de Instagram** (lencería dibujada en línea fina + `@bel.intimma`
   espaciado) se vuelve el hero, en grande, y se dibuja solo al cargar.
2. **Los destacados de Instagram** (círculos rosas) se vuelven la navegación por
   categorías: quien viene de Instagram ya sabe usarlos.
3. **El borde festoneado del encaje** separa los bloques rosas. Es el único recurso
   decorativo que se repite.

Todo lo demás queda quieto y prolijo.

## Color
| Token          | Hex       | Uso |
|----------------|-----------|-----|
| `--rosa-bel`   | `#FFBEE1` | Rosa de la marca (avatar). Bloques destacados, fondos de ilustración |
| `--rosa-seda`  | `#FFF3F8` | Fondo general (rosa casi blanco, no crema) |
| `--rosa-velo`  | `#FFE0EF` | Superficies secundarias: tarjetas, chips, inputs |
| `--ciruela`    | `#4A2A3A` | Texto principal (11.5:1 sobre seda, 8.1:1 sobre rosa-bel) |
| `--malva`      | `#6E4A5C` | Texto secundario (≥ 5:1 en todos los fondos) |
| `--fucsia`     | `#C2276F` | Acción principal (texto blanco 5.5:1). Sale de los destacados |
| `--encaje`     | `#C99AB0` | Trazos de ilustración, bordes. Solo decorativo |

## Tipografía
- **Bodoni Moda**: display. Alto contraste, de moda y lencería; italic espaciado en
  minúscula para el logotipo, como en el avatar.
- **Jost**: texto e interfaz. Geométrica, de la familia de Futura, pareja clásica de
  Bodoni en moda.
- Escala (1.25): 13 · 15 · 17 · 21 · 26 · 33 · 41 · 52 · 64 px (fluida con `clamp`).
- Nada de etiquetas en mayúsculas sostenidas ni palabras sueltas resaltadas en los títulos.

## Layout
Mobile primero, todo alineado a la izquierda salvo el hero (composición centrada,
como el avatar).

```
celular                         escritorio
┌──────────────────┐            ┌──────────────────────────────────────┐
│ aviso            │            │ aviso                                │
│ ☰ bel.intimma  👜│            │ bel.intimma   catálogo talles …   👜 │
│ ┌──────────────┐ │            │ ┌─────────────────┬────────────────┐ │
│ │   ( avatar ) │ │            │ │ título          │   ( avatar )   │ │
│ │ título       │ │            │ │ texto + botón   │   dibujándose  │ │
│ │ [ver catál.] │ │            │ └─────────────────┴────────────────┘ │
│ └~~festón~~~~~~┘ │            │ ~~~~~~~~~~~~~~~~~festón~~~~~~~~~~~~~~ │
│ ○ ○ ○ ○ ○ →      │            │      ○    ○    ○    ○    ○          │
│ [chips filtro]   │            │ [chips]                     n prod. │
│ ▢ ▢              │            │ ▢ ▢ ▢ ▢                              │
│ ▢ ▢              │            │ ▢ ▢ ▢ ▢                              │
│ cómo comprar 1-2-3│           │ cómo comprar (3 pasos reales)        │
│ talles / pagos   │            │ talles | pagos y envíos              │
│ preguntas        │            │ preguntas                            │
│ [barra pedido]   │            │                                      │
└──────────────────┘            └──────────────────────────────────────┘
```

## 3D: papel de seda
- **El hero es una tela de satén en WebGL (Three.js, `js/seda.js`).** Pliegues largos en diagonal,
  brillo de satén (especular ancho + fino) y Fresnel en los bordes de cada pliegue.
  Se abulta bajo el cursor o el dedo y se agita y "levanta" al hacer scroll: es el papel de seda
  del regalo que se abre. El avatar queda encima como el sticker que cierra el paquete.
- Carga diferida (después de `load`, en tiempo ocioso), se pausa fuera de pantalla, densidad de píxeles
  limitada en el celular, y si no hay WebGL o CDN queda el fondo rosa liso.
- Un halo claro detrás del texto del hero garantiza el contraste sobre los pliegues oscuros.
- **Tarjetas de producto:** inclinación 3D (máx. ~9°) con un brillo satinado que sigue al mouse.
  Solo con mouse; en el celular no hay inclinación.

## Movimiento
- **Un solo momento orquestado:** al cargar, la seda aparece y el dibujo del avatar se traza (≈1.6 s).
- El resto responde a acciones: el panel del pedido se desliza, el contador de la
  bolsita late al sumar, la ficha del producto sube como hoja en el celular.
- `prefers-reduced-motion` anula todo lo anterior.

## Radios
- Pastillas (999px): botones y chips. Son acciones.
- 20px: fotos de producto y paneles. Son contenido.
- Círculos: categorías (eco de los destacados).
