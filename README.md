# Bel Intimma — tienda web

Catálogo de ropa interior y pijamas con pedido por WhatsApp.
Es una página estática (HTML, CSS y JavaScript, sin instalar nada): se puede subir gratis a Netlify o GitHub Pages.

```
index.html          La página
css/styles.css      Estilos (colores, tipografías, diseño)
js/config.js        ← Datos de la tienda: WhatsApp, redes, medios de pago
js/productos.js     ← Catálogo: acá agregás, editás y sacás productos
js/dibujos.js       Ilustraciones de los productos sin foto
js/app.js           Funcionamiento (carrito, filtros, WhatsApp)
img/productos/      ← Fotos de los productos
DESIGN.md           Sistema de diseño (colores, tipografías y criterios)
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
   en `.jpg` o `.webp`, de menos de 300 KB cada una. Usá nombres sin espacios ni tildes:
   `conjunto-lila-1.jpg`, `conjunto-lila-2.jpg`.
2. Abrí `js/productos.js`, copiá un bloque completo (desde `{` hasta `},`) y pegalo debajo.
3. Cambiá los datos:

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

4. Guardá y recargá la página.

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

---

## 3. Links para compartir en Instagram y TikTok

- Página principal: `https://tu-sitio.netlify.app/`
- Una categoría: `https://tu-sitio.netlify.app/?categoria=pijamas`
- Un producto: `https://tu-sitio.netlify.app/#producto=conjunto-lila`
  (también lo copia el botón **Compartir** de cada producto)

Ideal para el sticker de link en las historias: la clienta cae directo en la prenda.

---

## 4. Cómo publicarla

### Opción A: Netlify Drop (la más fácil, sin cuentas técnicas)

1. Entrá a <https://app.netlify.com/drop> y creá una cuenta gratis.
2. Arrastrá **la carpeta completa del proyecto** a la página.
3. En segundos te da un link (`algo-random.netlify.app`). En *Site configuration → Change site name*
   lo podés cambiar, por ejemplo, a `belintimma.netlify.app`.
4. **Para actualizar** (nuevos productos o precios): entrá al sitio en Netlify → pestaña *Deploys* →
   arrastrá de nuevo la carpeta.

### Opción B: GitHub Pages (si ya usás GitHub)

1. Subí este repositorio a GitHub (`git push`).
2. En el repositorio: *Settings → Pages → Build and deployment → Source: Deploy from a branch*,
   elegí la rama `main` y la carpeta `/ (root)`. Guardá.
3. En uno o dos minutos queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. **Para actualizar:** hacé commit y push de los cambios; se publica solo.

> Tip: con Netlify también podés conectar el repositorio de GitHub (*Add new site → Import from Git*) y cada
> `git push` publica automáticamente.

### Probarla en tu compu antes de subir

Alcanza con hacer doble clic en `index.html`. Para probarla igual que publicada:

```bash
python3 -m http.server 8000
# y abrí http://localhost:8000
```

---

## Qué incluye

- Catálogo con filtros por categoría y círculos tipo "destacados" de Instagram.
- Ficha de cada producto con fotos deslizables, talle, color, cantidad y link propio para compartir.
- Pedido que se guarda en el celular aunque la clienta cierre la página.
- Envío del pedido por WhatsApp con el detalle de prendas, talles, colores, total, nombre, entrega y forma de pago.
- Barra fija con el total en el celular, opción para deshacer al quitar una prenda, y validación de nombre, talle y color.
- Guía de talles, pagos y entregas, preguntas frecuentes y links a Instagram y TikTok.
- Accesible: navegación con teclado, foco visible, contrastes AA y respeto por "reducir movimiento".
