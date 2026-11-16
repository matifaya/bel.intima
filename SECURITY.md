# Seguridad — Bel Intimma

La tienda es un sitio estático: no tiene servidor, base de datos, usuarios ni pagos online.
Eso ya la hace muy difícil de atacar. Lo que sigue cubre los riesgos que sí existen y cómo
están resueltos.

---

## Qué está protegido

| Riesgo | Cómo se resolvió |
|---|---|
| **Inyección de código (XSS)** desde el catálogo, la configuración, la URL o el carrito guardado | Todo lo que se muestra se escapa. Además `js/app.js` valida cada dato al cargar: tipos, largos máximos, ids, precios y categorías. Lo que no cumple se descarta y se avisa en la consola (F12). |
| **Fotos con rutas peligrosas** (`javascript:`, `../`, sitios externos) | Solo se aceptan archivos `.jpg/.png/.webp/.avif` dentro de `img/`. |
| **Carrito manipulado** (el localStorage lo puede editar cualquiera en su navegador) | Cada ítem se reconstruye desde el catálogo: solo valen productos que existen, con talles y colores que ese producto tiene, y cantidades de 1 a 20. Lo manipulado se borra. |
| **Mensaje de WhatsApp alterado** | El texto va codificado con `encodeURIComponent`. El total se calcula desde el catálogo al enviar. El nombre y la localidad pierden los saltos de línea y los símbolos de formato (`*`, `_`, `~`, `` ` ``), y tienen largo máximo. Entrega y medio de pago solo aceptan opciones de `config.js`. Hay una pausa contra el doble toque. |
| **Scripts o estilos de terceros** | No hay ninguno: las fuentes (`fonts/`) y Three.js (`js/vendor/`) están alojados en el sitio. La página no hace ningún pedido a otros servidores. |
| **Clickjacking, sniffing, filtración de referrer, permisos del navegador** | Headers de seguridad en `_headers` (Netlify). |
| **HTTPS** | Netlify lo fuerza solo, y el header HSTS hace que el navegador nunca vuelva a usar http. `upgrade-insecure-requests` en la CSP. En GitHub Pages: *Enforce HTTPS*. |
| **Links externos** | Todos con `rel="noopener noreferrer"`. |
| **Metadatos en las fotos** (ubicación GPS de tu casa, modelo de celular, fecha) | `scripts/limpiar_fotos.py` los borra. `scripts/preparar_publicacion.py` (y Netlify al publicar) **frena la publicación** si encuentra una foto con metadatos. |
| **Archivos que no deberían subirse** | `.gitignore` deja afuera claves (`.env`, `*.key`), capturas, originales `.heic`, `logo.webp` y archivos del sistema. Para Netlify solo se publica una lista blanca de archivos (`publicar/`). |
| **Spam en el formulario** | El formulario no envía nada a ningún servidor: solo abre WhatsApp en el celular de la clienta. No hay una casilla que un bot pueda llenar en masa. Igual tiene largo máximo y pausa contra envíos repetidos. |

### La política de contenido (CSP)

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none';
form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests
```

Sin `'unsafe-inline'` ni `'unsafe-eval'`: aunque alguien lograra meter HTML en la página, el navegador
no ejecutaría ningún script ni estilo que no venga de tus propios archivos.

> **Si agregás algo externo** (por ejemplo, un video de YouTube o fotos alojadas en otro sitio), el
> navegador lo va a bloquear. Hay que sumar ese dominio a la CSP en **dos lugares**: `_headers` y
> el `<meta http-equiv="Content-Security-Policy">` de `index.html`.

### Límites que conviene conocer

- **El pedido lo arma el navegador de la clienta.** Nada impide que alguien edite el mensaje en
  WhatsApp antes de mandarlo. **Antes de cobrar, verificá siempre precios y total** contra tu catálogo.
- **Tu número de WhatsApp es público** (está en la página, como en cualquier tienda que vende por
  WhatsApp). Si preferís no exponer tu número personal, usá un número de WhatsApp Business.
- **El mail con el que hacés commits queda visible** en el historial público de GitHub.
  Ver la checklist de GitHub para ocultarlo en los próximos.

---

## Limpiar fotos (EXIF / GPS)

Las fotos del celular guardan dónde y cuándo se sacaron. Si fotografiás en tu casa, la foto publicada
puede mostrar tu dirección.

**Con el script del proyecto** (recomendado):

```bash
pip install pillow                           # solo la primera vez
python3 scripts/limpiar_fotos.py             # limpia img/productos/
python3 scripts/limpiar_fotos.py --verificar # solo revisa
```

Además endereza la foto según cómo la sacaste y la achica a 1600 px.

**Otras formas:**

- **exiftool** (Windows, Mac y Linux): `exiftool -all= -overwrite_original img/productos/*`
- **Windows:** clic derecho en las fotos → *Propiedades* → *Detalles* → *Quitar propiedades e
  información personal* → *Crear una copia con todas las propiedades posibles quitadas*.
- **Mac:** abrí la foto en *Vista Previa* → *Herramientas* → *Mostrar inspector* → pestaña ⓘ →
  *GPS* → *Eliminar información de ubicación*. Para borrar todo, mejor usar el script.
- **iPhone:** al compartir la foto, tocá *Opciones* arriba y desactivá *Ubicación*.
- **Android:** en la app de cámara, desactivá *Etiquetas de ubicación*.

---

## Checklist de seguridad de tus cuentas

Si alguien entra a una de estas cuentas, puede cambiar tu página (precios, número de WhatsApp) sin
que te des cuenta. Es el riesgo más real que tiene la tienda.

### Mail (el más importante: desde ahí se recuperan todas las demás)
- [ ] Verificación en dos pasos (2FA) activada, con app autenticadora o llave de seguridad.
- [ ] Contraseña única y larga (ver "Contraseñas" abajo).
- [ ] Mail y teléfono de recuperación al día.

### GitHub
- [ ] **2FA activado** (*Settings → Password and authentication*). Usá una app autenticadora
      (Google Authenticator, Authy, 2FAS) o una passkey. Evitá SMS.
- [ ] **Códigos de recuperación** descargados y guardados fuera de la compu (en papel o en tu gestor de contraseñas).
- [ ] *Settings → SSH and GPG keys*: borrá las claves de compus que ya no usás (por ejemplo, las del instituto).
- [ ] *Settings → Developer settings → Personal access tokens*: borrá los que no reconozcas.
- [ ] *Settings → Applications*: revisá las apps autorizadas. A Netlify dale acceso **solo al repo `bel.intima`**, no a todos.
- [ ] **Ocultar tu mail:** *Settings → Emails* → activá *Keep my email addresses private* y
      *Block command line pushes that expose my email*. Después, en la compu:
      `git config --global user.email "ID+usuario@users.noreply.github.com"`
      (el valor exacto aparece en esa misma pantalla).
- [ ] En el repo: *Settings → Code security* → activá **Secret scanning** y **Push protection**
      (avisan y frenan si alguna vez subís una clave por error).
- [ ] Si trabajás en compus compartidas (instituto): cerrá sesión de GitHub en el navegador al
      terminar y no guardes la clave SSH en esa compu sin contraseña.

### Netlify
- [ ] **2FA activado** (*User settings → Security*).
- [ ] Iniciá sesión con GitHub *o* con mail+contraseña, pero que esa cuenta tenga 2FA.
- [ ] *Team settings → Members*: que no haya nadie que no corresponda.
- [ ] *Site configuration → Domain management → HTTPS*: certificado activo (Netlify lo hace solo).
- [ ] *Site configuration → Build & deploy*: activá las notificaciones por mail de los deploys,
      así te enterás si alguien publica algo.
- [ ] Si usás Netlify CLI, la carpeta `.netlify/` no se sube (ya está en `.gitignore`).

### Dominio propio (si comprás, por ejemplo, belintimma.com.ar)
- [ ] 2FA en el registrador. Para `.com.ar`, NIC Argentina entra con tu **Clave Fiscal de ARCA**:
      cuidala como una contraseña bancaria.
- [ ] **Renovación automática** activada y mail de contacto al día (si el dominio vence, otra persona lo puede comprar).
- [ ] **Bloqueo de transferencia** (*transfer lock*) activado, si el registrador lo ofrece.
- [ ] DNS apuntando solo a Netlify. Borrá registros viejos que no uses.
- [ ] Opcional: registro **CAA** que permita solo a Let's Encrypt emitir certificados
      (`0 issue "letsencrypt.org"`).
- [ ] Con dominio propio, más adelante podés sumar `; preload` al header
      `Strict-Transport-Security` y registrarlo en hstspreload.org. Hacelo solo cuando estés segura
      de que todo el dominio y sus subdominios van a usar siempre HTTPS.

### Instagram, TikTok y WhatsApp (los canales de venta)
- [ ] 2FA en Instagram y TikTok (*Configuración → Seguridad → Autenticación en dos pasos*).
- [ ] WhatsApp: *Ajustes → Cuenta → Verificación en dos pasos* (PIN de 6 dígitos).
- [ ] Desconfiá de mensajes que piden "verificar tu cuenta" o códigos por SMS: nadie de soporte te los pide.

### Contraseñas
- [ ] Un gestor de contraseñas (Bitwarden es gratis; también sirve el de Google o Apple).
- [ ] Una contraseña distinta por cuenta, de 16+ caracteres, generada por el gestor.
- [ ] Revisá en <https://haveibeenpwned.com> si tu mail apareció en alguna filtración.

---

## Cómo verificar los headers una vez publicada

1. **securityheaders.com**: entrá a <https://securityheaders.com>, pegá la dirección
   (`https://tu-sitio.netlify.app`) y tocá *Scan*. Con Netlify deberías ver **A+** (o como mínimo A) y todos los headers
   en verde: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options,
   X-Content-Type-Options, Referrer-Policy y Permissions-Policy.
2. **Mozilla Observatory**: <https://developer.mozilla.org/en-US/observatory>. Da una nota y explica cada punto.
3. **Desde la terminal:**
   ```bash
   curl -sI https://tu-sitio.netlify.app | grep -iE "content-security|strict-transport|x-frame|x-content|referrer|permissions"
   curl -sI http://tu-sitio.netlify.app | head -3   # tiene que responder 301 hacia https://
   ```
4. **En el navegador:** F12 → pestaña *Red (Network)* → recargá → hacé clic en el documento principal →
   *Encabezados de respuesta*. En la pestaña *Consola* no debería aparecer ningún error que diga
   "Content Security Policy".
5. **Fotos publicadas:** descargá una foto desde la página y subila a un visor de EXIF
   (por ejemplo <https://exif.tools>). No debería mostrar ubicación ni modelo de celular.

> En **GitHub Pages**, securityheaders.com va a marcar que faltan headers, porque esa plataforma no deja
> configurarlos. La CSP y la Referrer-Policy funcionan igual (están en `index.html`), pero
> X-Frame-Options, Permissions-Policy y el resto solo están en Netlify.

### Si cambiás la CSP
Probala con un servidor local (`python3 -m http.server 8000`), recorré la página completa y mirá
que la consola no muestre errores de "Content Security Policy" antes de publicar.
