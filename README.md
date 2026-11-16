# Bel Intimma — tienda web

Catálogo de ropa interior y pijamas con pedido por WhatsApp, y un **panel de administración**
para cambiar productos, precios, fotos y textos desde el celular, sin programar.

- Página: <https://belintimma.netlify.app>
- Panel: <https://belintimma.netlify.app/admin/>
- **Guía del panel para la dueña:** [`GUIA-PANEL.md`](GUIA-PANEL.md)

```
index.html                      La página
css/                            Estilos y tipografías (alojadas en el sitio, carpeta fonts/)
js/app.js                       Funcionamiento (carrito, filtros, WhatsApp, validaciones)
js/dibujos.js                   Ilustraciones de los productos sin foto
js/seda.js, js/vendor/          Fondo 3D de seda del inicio (Three.js alojado en el sitio)
datos/                          ← Lo que se edita desde el panel (archivos JSON)
  productos/*.json                un archivo por producto
  categorias/*.json               un archivo por categoría
  tienda.json                     WhatsApp, redes, textos del inicio, pagos, entregas, avisos
  talles.json, preguntas.json     guía de talles y preguntas frecuentes
img/productos/                  ← Fotos de los productos (las sube el panel)
panel/                          Panel de administración (Sveltia CMS) y su configuración
  public/config.yml               ← Qué campos tiene el panel y cómo se guardan
scripts/preparar_publicacion.py Arma publicar/: junta datos/ en js/datos.js y revisa las fotos
scripts/limpiar_fotos.py        Borra EXIF/GPS de fotos subidas a mano
_headers, netlify.toml          Seguridad y configuración de Netlify
SECURITY.md                     Seguridad: qué está protegido y checklist de cuentas
DESIGN.md                       Sistema de diseño
```

---

## Cómo funciona

```
 Panel (/admin/)  ──guarda──▶  GitHub (datos/ e img/)  ──avisa──▶  Netlify
                                                                     │ compila el panel
                                                                     │ junta datos/ → js/datos.js
                                                                     │ revisa las fotos
                                                                     ▼
                                                       belintimma.netlify.app (1–2 min)
```

- El panel es [Sveltia CMS](https://sveltiacms.app), un editor de código abierto que corre en el
  navegador. No hay servidor ni base de datos propios: cada vez que la dueña toca **Guardar**, el
  panel hace un commit en este repositorio con su cuenta de GitHub, y Netlify vuelve a publicar.
- Todo queda en el historial de git: se puede ver quién cambió qué y volver atrás cualquier cambio.
- Las fotos se convierten **en el celular, antes de subirse**: pasan a WebP, se achican a 1600 px y
  pierden los metadatos (ubicación GPS, modelo del celular, fecha). Las de iPhone (HEIC) también.

---

## 1. Activar el panel (una sola vez)

Lo hace quien administra el repositorio (la cuenta `matifaya`).

### a. Darle acceso a la dueña

1. Ella se crea una cuenta gratis en <https://github.com/signup> y **activa la verificación en dos
   pasos** (*Settings → Password and authentication*). Ver `SECURITY.md`.
2. En el repositorio: *Settings → Collaborators → Add people* → su usuario → rol **Write**.
3. Ella acepta la invitación que le llega por mail.

Solo pueden entrar al panel las cuentas con permiso de escritura en el repositorio. Cualquier otra
persona que abra `/admin/` ve la pantalla de inicio de sesión y nada más.

### b. Conectar el inicio de sesión con GitHub (OAuth de Netlify)

1. Entrá a <https://github.com/settings/applications/new> y completá:
   - **Application name:** `Panel Bel Intimma`
   - **Homepage URL:** `https://belintimma.netlify.app`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
2. *Register application*. Copiá el **Client ID**, tocá *Generate a new client secret* y copiá el
   **Client Secret** (se muestra una sola vez).
3. En Netlify: <https://app.netlify.com/projects/belintimma> → *Project configuration* →
   *Security* (o *Access & security*) → **OAuth** → *Install provider* → **GitHub** → pegá los dos
   valores → *Install*.
4. Probalo: abrí <https://belintimma.netlify.app/admin/> → **Iniciar sesión con GitHub**.

> El *Client Secret* va **solo** en Netlify. No lo pegues en el repositorio, en chats ni en mails.
> Si se filtra, generá otro en la misma página de GitHub y actualizalo en Netlify.

**Alternativa sin OAuth:** en el panel, *Iniciar sesión con un token de acceso*. El panel muestra el
link para crear el token en GitHub con los permisos justos. Es más técnico; conviene el OAuth.

---

## 2. Editar desde el panel

Ver [`GUIA-PANEL.md`](GUIA-PANEL.md). Resumen:

| En el panel | Qué cambia en la página |
|---|---|
| **Productos** | Catálogo: nombre, categoría, precio, precio anterior (tachado), fotos, talles, colores, descripción, etiqueta, mostrar/ocultar. Se arrastran para cambiar el orden. |
| **Categorías** | Filtros y círculos de arriba. Nombre, nombre corto y dibujo. |
| **Datos de la tienda → Contacto, pagos y entregas** | WhatsApp, Instagram, TikTok, zona, título y texto del inicio, avisos de la franja, descuento, medios de pago, formas de entrega. |
| **Datos de la tienda → Guía de talles** | Las tablas de talles. |
| **Datos de la tienda → Preguntas frecuentes** | Las preguntas y respuestas. Sin preguntas, la sección no se muestra. |

Lo que no está en el panel (diseño, colores, "Cómo comprar", textos de redes) se cambia en
`index.html` y `css/`.

---

## 3. Editar a mano (para quien programa)

Los archivos de `datos/` son JSON comunes. Se pueden editar con cualquier editor y subir con git:
el panel y la página leen lo mismo. Un producto (`datos/productos/conjunto-lila.json`; el nombre del
archivo es el id que se usa en el link):

```json
{
  "nombre": "Conjunto Lila",
  "categoria": "sin-aro",
  "precio": 18900,
  "precioAntes": 21000,
  "fotos": ["/img/productos/conjunto-lila-1.webp"],
  "talles": ["S", "M", "L"],
  "colores": ["Lila", "Negro"],
  "descripcion": "Bralette de encaje con breteles regulables y bombacha colaless.",
  "etiqueta": "Nuevo",
  "disponible": true,
  "orden": 1
}
```

- `categoria` es el nombre de un archivo de `datos/categorias/` (sin `.json`).
- `orden` lo maneja el panel al arrastrar. Sin `orden`, el producto va al final.
- Si subís fotos a mano, **limpialas antes**: `python3 scripts/limpiar_fotos.py` (ver `SECURITY.md`).
  La publicación se frena si encuentra una foto con metadatos.
- `js/app.js` valida todo al cargar (tipos, largos, rutas de fotos, categorías). Lo que no cumple se
  descarta y se avisa en la consola del navegador (F12).

---

## 4. Links para compartir en Instagram y TikTok

- Página principal: `https://belintimma.netlify.app/`
- Una categoría: `https://belintimma.netlify.app/?categoria=pijamas`
- Un producto: `https://belintimma.netlify.app/#producto=conjunto-lila`
  (también lo copia el botón **Compartir** de cada producto)

Ideal para el sticker de link en las historias: la clienta cae directo en la prenda.

---

## 5. Publicación

El sitio está en Netlify conectado a este repositorio (rama `main`). Cada commit, ya sea del panel o
hecho a mano, se publica solo en 1 o 2 minutos. Netlify ejecuta lo que dice `netlify.toml`:

```bash
npm ci --prefix panel                    # instala el panel con las versiones exactas del lockfile
npm run build --prefix panel             # compila el panel en panel/dist/
python3 scripts/preparar_publicacion.py  # arma publicar/ (página + datos.js + admin/)
```

Si una publicación falla (por ejemplo, una foto con metadatos subida a mano), la página sigue
mostrando la versión anterior. Activá los avisos por mail en Netlify (*Project configuration →
Notifications*) para enterarte.

> **GitHub Pages ya no sirve tal cual:** la página necesita el paso de armado (`js/datos.js` se
> genera desde `datos/`) y el panel necesita el OAuth de Netlify.

### Probarla en tu compu

```bash
cd panel && npm ci && npm run build && cd ..   # solo si querés probar también el panel
python3 scripts/preparar_publicacion.py
python3 -m http.server 8000 -d publicar
# y abrí http://localhost:8000  (panel: http://localhost:8000/admin/)
```

En `localhost` el panel ofrece *Trabajar con un repositorio local* (Chrome o Edge): edita los archivos
de esta carpeta directamente, sin GitHub. Sirve para probar cambios en `panel/public/config.yml`.

### Actualizar el panel

El panel tiene la versión fijada en `panel/package.json` y `panel/package-lock.json` (no se descarga
nada de CDNs). Dependabot (`.github/dependabot.yml`) abre un pull request por semana cuando hay
versión nueva de Sveltia CMS o de Vite. Revisá que Netlify publique bien la vista previa del pull
request y hacé merge. A mano:

```bash
cd panel && npm install @sveltia/cms@latest --save-exact && npm run build
```

---

## Qué incluye

- Catálogo con filtros por categoría y círculos tipo "destacados" de Instagram.
- Ficha de cada producto con fotos deslizables, talle, color, cantidad y link propio para compartir.
- Pedido que se guarda en el celular aunque la clienta cierre la página.
- Envío del pedido por WhatsApp con el detalle de prendas, talles, colores, total, nombre, entrega y forma de pago.
- Barra fija con el total en el celular, opción para deshacer al quitar una prenda, y validación de nombre, talle y color.
- Guía de talles, pagos y entregas, preguntas frecuentes y links a Instagram y TikTok.
- Fondo 3D de papel de seda que reacciona al cursor/dedo y al scroll, y tarjetas con inclinación 3D.
- Panel de administración en español, usable desde el celular, con historial de cambios.
- Segura: sin datos de terceros en la página, validación de todo lo que se muestra, headers de
  seguridad, fotos sin metadatos y panel que solo habla con GitHub. Ver `SECURITY.md`.
- Accesible: navegación con teclado, foco visible, contrastes AA y respeto por "reducir movimiento".
