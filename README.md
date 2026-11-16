# Bel Intimma — tienda web

Catálogo de ropa interior y pijamas con pedido por WhatsApp.
Es una página estática (HTML, CSS y JavaScript, sin instalar nada): se puede subir gratis a Netlify o GitHub Pages.

```
index.html                      La página
css/styles.css                  Estilos (colores, tipografías, diseño)
css/fuentes.css                 Tipografías (alojadas en el sitio, carpeta fonts/)
js/config.js                    ← Datos de la tienda: WhatsApp, redes, medios de pago
js/productos.js                 ← Catálogo: acá agregás, editás y sacás productos
js/dibujos.js                   Ilustraciones de los productos sin foto
js/app.js                       Funcionamiento (carrito, filtros, WhatsApp, validaciones)
js/seda.js                      Fondo 3D de seda del inicio
js/vendor/three-seda.min.js     Three.js (alojado en el sitio)
img/productos/                  ← Fotos de los productos
scripts/limpiar_fotos.py        ← Borra EXIF/GPS de las fotos
scripts/preparar_publicacion.py ← Arma la carpeta publicar/ para Netlify
_headers, netlify.toml          Seguridad y configuración de Netlify
SECURITY.md                     Seguridad: qué está protegido y checklist de cuentas
DESIGN.md                       Sistema de diseño (colores, tipografías y criterios)
```

---

## 1. Antes de publicar (una sola vez)

Abrí `js/config.js` y cambiá:

- **`whatsapp`**: tu número con el formato `549` + código de área sin el 0 + número sin el 15.
  Por ejemplo, para 11 1234-5678 → `"5491112345678"`.
  Mientras no lo cambies, el botón de enviar pedido avisa que falta el número.
- **`mediosDePago`**, **`entregas`** y **`avisos`**: revisá que digan lo que realmente ofrecés.
- **`descuentoTransferencia`**: si hacés descuento por transferencia, poné el número (ej. `10`).
  Se muestra solo en cada producto y en el total. Con `0` no aparece.

Revisá también en `index.html` la **guía de talles** y las **preguntas frecuentes** (cambios, envíos).
Las medidas de la tabla son orientativas: ajustalas a las de tus prendas.

---

## 2. Cómo agregar un producto

1. Guardá las fotos en `img/productos/`. Recomendado: verticales (4:5, por ejemplo 1200 × 1500 px),
   en `.jpg` o `.webp`. Usá nombres sin espacios ni tildes: `conjunto-lila-1.jpg`, `conjunto-lila-2.jpg`.
2. **Limpiá las fotos** (borra la ubicación GPS y los datos del celular, y las achica para la web):
   ```bash
   python3 scripts/limpiar_fotos.py
   ```
   La primera vez instalá Pillow con `pip install pillow`. Más detalles en `SECURITY.md`.
3. Abrí `js/productos.js`, copiá un bloque completo (desde `{` hasta `},`) y pegalo debajo.
4. Cambiá los datos:

```js
{
  id: "conjunto-lila",                 // único, sin espacios ni tildes
  nombre: "Conjunto Lila",
  categoria: "sin-aro",                // "sin-aro", "con-aro" o "pijamas"
  precio: 18900,                       // sin puntos ni $
  precioAntes: null,                   // o 21000 para mostrarlo tachado
  talles: ["S", "M", "L"],
  colores: ["Lila", "Negro"],
  fotos: ["img/productos/conjunto-lila-1.jpg", "img/productos/conjunto-lila-2.jpg"],
  descripcion: "Bralette de encaje con breteles regulables y bombacha colaless.",
  etiqueta: "Nuevo",                   // "Nuevo", "Últimos", "Oferta" o ""
  disponible: true
},
```

5. Guardá y recargá la página.

**Atajos útiles**

- **Sin stock:** `disponible: false` lo oculta sin borrarlo.
- **Orden:** los productos aparecen en el mismo orden que en el archivo. Lo nuevo, arriba.
- **Segunda foto:** en la computadora se muestra al pasar el mouse; en el celular, deslizando dentro de la ficha.
- **Colores:** los nombres comunes (rosa, negro, blanco, lila, nude, bordó…) muestran su circulito de color
  automáticamente. Si escribís "Blanco y rosa", se ve mitad y mitad.
- **Producto sin fotos:** si dejás `fotos: []`, se muestra una ilustración según la categoría.
- **Nueva categoría (ej. bodies):** agregala en `categorias` dentro de `js/config.js` y usá su `id` en los productos.

> Si después de editar la página aparece en blanco, casi siempre falta una coma `,` entre productos o
> una comilla `"` sin cerrar. Abrí la consola del navegador (F12) y te dice la línea.
>
> Si un producto no aparece, mirá la consola: la página revisa cada producto y avisa qué dato está mal
> (id con espacios, precio con puntos, categoría que no existe, foto fuera de `img/`, etc.).

---

## 3. Links para compartir en Instagram y TikTok

- Página principal: `https://tu-sitio.netlify.app/`
- Una categoría: `https://tu-sitio.netlify.app/?categoria=pijamas`
- Un producto: `https://tu-sitio.netlify.app/#producto=conjunto-lila`
  (también lo copia el botón **Compartir** de cada producto)

Ideal para el sticker de link en las historias: la clienta cae directo en la prenda.

---

## 4. Cómo publicarla

**Recomendado: Netlify.** Es el único de los dos que aplica todos los headers de seguridad
(ver `SECURITY.md`).

### Opción A: Netlify conectado a GitHub (la mejor: se actualiza sola)

1. En <https://app.netlify.com> → *Add new site → Import an existing project → GitHub* → elegí `bel.intima`.
2. Netlify lee `netlify.toml` solo: no cambies nada y tocá *Deploy*.
3. En *Site configuration → Change site name* poné, por ejemplo, `belintimma`.
4. **Para actualizar:** hacé commit y push; Netlify publica en un minuto.
   Si alguna foto tiene metadatos, la publicación se frena y te avisa cuál limpiar.

### Opción B: Netlify Drop (sin conectar GitHub)

1. Ejecutá `python3 scripts/preparar_publicacion.py`. Arma la carpeta **`publicar/`** solo con los
   archivos de la página (y revisa las fotos).
2. Entrá a <https://app.netlify.com/drop> y arrastrá **la carpeta `publicar/`**.
   No arrastres la carpeta del proyecto entera: incluiría el historial de git, notas y archivos personales.
3. **Para actualizar:** volvé a ejecutar el script y arrastrá `publicar/` en *Deploys*.

### Opción C: GitHub Pages

1. Subí este repositorio a GitHub (`git push`).
2. En el repositorio: *Settings → Pages → Build and deployment → Source: Deploy from a branch*,
   elegí la rama `main` y la carpeta `/ (root)`. Guardá.
3. En uno o dos minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Marcá **Enforce HTTPS** en esa misma pantalla.
5. **Para actualizar:** hacé commit y push de los cambios; se publica solo.

> GitHub Pages no permite configurar headers: la protección contra XSS (CSP) funciona igual porque
> también está en el `<meta>` de `index.html`, pero no hay protección contra que otro sitio muestre
> el tuyo dentro de un marco (clickjacking). Por eso conviene Netlify.

### Probarla en tu compu antes de subir

```bash
python3 -m http.server 8000
# y abrí http://localhost:8000
```

Con doble clic en `index.html` también abre y el carrito funciona, pero el navegador bloquea las
fuentes y el fondo 3D cuando la página se abre como archivo: se ve con una tipografía genérica.
Publicada se ve completa.

---

## Qué incluye

- Catálogo con filtros por categoría y círculos tipo "destacados" de Instagram.
- Ficha de cada producto con fotos deslizables, talle, color, cantidad y link propio para compartir.
- Pedido que se guarda en el celular aunque la clienta cierre la página.
- Envío del pedido por WhatsApp con el detalle de prendas, talles, colores, total, nombre, entrega y forma de pago.
- Barra fija con el total en el celular, opción para deshacer al quitar una prenda, y validación de nombre, talle y color.
- Guía de talles, pagos y entregas, preguntas frecuentes y links a Instagram y TikTok.
- Fondo 3D de papel de seda que reacciona al cursor/dedo y al scroll, y tarjetas con inclinación 3D.
- Segura: sin datos de terceros (fuentes y librerías alojadas en el sitio), validación de todo lo que
  se muestra, headers de seguridad y fotos sin metadatos. Ver `SECURITY.md`.
- Accesible: navegación con teclado, foco visible, contrastes AA y respeto por "reducir movimiento".
