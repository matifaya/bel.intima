/* ==========================================================================
   Bel Intimma — lógica de la tienda
   No hace falta editar este archivo para cargar productos:
   usá js/productos.js y js/config.js.
   ========================================================================== */

(function () {
  "use strict";

  const T = window.TIENDA;
  const PRODUCTOS = (window.PRODUCTOS || []).filter((p) => p && p.disponible !== false);
  const D = window.DIBUJOS;

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CLAVE_CARRITO = "bel-intimma-pedido";
  const ICONO_MENOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>';
  const ICONO_MAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>';

  /* ---------- utilidades ---------- */

  const escapar = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const formato = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const precio = (n) => formato.format(n).replace(/\s/g, "");

  const conDescuento = (n) => Math.round((n * (100 - T.descuentoTransferencia)) / 100);

  const categoria = (id) => T.categorias.find((c) => c.id === id);

  const COLORES = {
    rosa: "#F6A9C8", "rosa bebe": "#FCD3E4", "rosa viejo": "#D598A8", "rosa estampado": "#F5B3CF",
    negro: "#2B2226", blanco: "#FFFFFF", lila: "#C9A8E2", celeste: "#A9D2EE", bordo: "#7A1F3D",
    nude: "#E6C3A8", rojo: "#C8233A", champagne: "#EAD6B3", gris: "#B9B2B6", verde: "#9CC9A8",
    amarillo: "#F3DE8A", azul: "#3E5A99", beige: "#E8D7C3", fucsia: "#D63384", violeta: "#8E5BB5"
  };
  const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  function colorDe(nombre) {
    const n = sinTildes(nombre);
    if (COLORES[n]) return COLORES[n];
    const partes = n.split(/\s+y\s+/);
    if (partes.length === 2 && COLORES[partes[0]] && COLORES[partes[1]]) {
      return `linear-gradient(135deg, ${COLORES[partes[0]]} 50%, ${COLORES[partes[1]]} 50%)`;
    }
    const clave = Object.keys(COLORES).find((k) => n.startsWith(k));
    return clave ? COLORES[clave] : "#E9D5DF";
  }

  const linkWhatsApp = (texto) =>
    `https://wa.me/${String(T.whatsapp).replace(/\D/g, "")}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
  const whatsappConfigurado = () => /^\d{10,15}$/.test(String(T.whatsapp));

  function media(producto, { clase = "", conSegunda = false, carga = "lazy" } = {}) {
    const fotos = producto.fotos || [];
    if (fotos.length) {
      let html = `<img class="${clase}" src="${escapar(fotos[0])}" alt="${escapar(producto.nombre)}" width="800" height="1000" loading="${carga}" decoding="async">`;
      if (conSegunda && fotos[1]) {
        html += `<img class="foto-2" src="${escapar(fotos[1])}" alt="" width="800" height="1000" loading="lazy" decoding="async">`;
      }
      return html;
    }
    const cat = categoria(producto.categoria);
    const dibujo = D[(cat && cat.dibujo) || "sin-aro"] || D["sin-aro"];
    return dibujo();
  }

  /* ---------- estado ---------- */

  const estado = {
    filtro: "todos",
    carrito: cargarCarrito(),
    productoAbierto: null,
    abiertoDesdeAdentro: false,
    ignorarHash: false,
    saliendoPorLink: false
  };

  function cargarCarrito() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO) || "[]");
      return datos.filter((i) => PRODUCTOS.some((p) => p.id === i.id) && i.cantidad > 0);
    } catch {
      return [];
    }
  }
  function guardarCarrito() {
    try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(estado.carrito)); } catch { /* modo privado */ }
  }

  /* ---------- avisos, links y datos de config ---------- */

  function iniciarAvisos() {
    const el = $("[data-avisos]");
    const avisos = T.avisos || [];
    if (!el || !avisos.length) return;
    el.textContent = avisos[0];
    if (avisos.length < 2) return;
    let i = 0;
    let pausa = false;
    el.parentElement.addEventListener("pointerenter", () => (pausa = true));
    el.parentElement.addEventListener("pointerleave", () => (pausa = false));
    setInterval(() => {
      if (pausa || document.hidden) return;
      i = (i + 1) % avisos.length;
      if (movimientoReducido) { el.textContent = avisos[i]; return; }
      el.classList.add("oculto");
      setTimeout(() => { el.textContent = avisos[i]; el.classList.remove("oculto"); }, 300);
    }, 4500);
  }

  function iniciarLinks() {
    $$('[data-link="whatsapp"]').forEach((a) => (a.href = linkWhatsApp("Hola Bel Intimma! Quería hacer una consulta.")));
    $$('[data-link="instagram"]').forEach((a) => (a.href = `https://www.instagram.com/${T.instagram}/`));
    $$('[data-link="tiktok"]').forEach((a) => (a.href = `https://www.tiktok.com/@${T.tiktok}`));
    $$("[data-zona]").forEach((el) => (el.textContent = T.zona));
    $$("[data-anio]").forEach((el) => (el.textContent = new Date().getFullYear()));

    $("[data-medios]").innerHTML = T.mediosDePago.map((m) => `<li>${escapar(m)}</li>`).join("");
    if (T.descuentoTransferencia > 0) {
      const nota = $("[data-nota-descuento]");
      nota.textContent = `Pagando con transferencia o efectivo tenés ${T.descuentoTransferencia}% de descuento.`;
      nota.hidden = false;
    }
  }

  /* ---------- hero: el avatar que se dibuja ---------- */

  function iniciarAvatar() {
    const cont = $("[data-avatar]");
    if (!cont) return;
    cont.innerHTML = D.avatar(T.instagram);
    const svg = $("svg", cont);
    $$("path[pathLength]", svg).forEach((p, i) => p.style.setProperty("--i", i));
    if (!movimientoReducido) svg.classList.add("trazando");
  }

  /* ---------- destacados y filtros ---------- */

  const ICONOS = {
    talles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h18v6H3z"/><path d="M7 9v3M11 9v2M15 9v3M19 9v2"/></svg>',
    pagos: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h3"/></svg>',
    preguntas: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c4.97 0 9-3.58 9-8s-4.03-8-9-8-9 3.58-9 8c0 1.9.75 3.64 2 5l-1 3 3.5-1.3c1.4.84 3.04 1.3 4.5 1.3Z"/><path d="M10 10a2 2 0 1 1 2.7 1.9c-.4.15-.7.55-.7 1v.3M12 15.5v.01"/></svg>'
  };

  function iniciarDestacados() {
    const lista = $("[data-destacados]");
    const cats = T.categorias.map(
      (c) => `<li><button class="destacado" type="button" data-filtrar="${escapar(c.id)}" aria-pressed="false">
        <span class="destacado__circulo">${(D[c.dibujo] || D["sin-aro"])()}</span>
        <span>${escapar(c.corto || c.nombre)}</span></button></li>`
    );
    const extras = [
      ["#talles", "Talles", ICONOS.talles],
      ["#pagos", "Pagos", ICONOS.pagos],
      ["#preguntas", "Preguntas", ICONOS.preguntas]
    ].map(([href, txt, icono]) => `<li><a class="destacado" href="${href}"><span class="destacado__circulo">${icono}</span><span>${txt}</span></a></li>`);
    lista.innerHTML = cats.concat(extras).join("");

    $("[data-filtros]").innerHTML = [{ id: "todos", nombre: "Todo" }]
      .concat(T.categorias)
      .map((c) => `<button class="chip" type="button" data-filtrar="${escapar(c.id)}" aria-pressed="${c.id === "todos"}">${escapar(c.nombre)}</button>`)
      .join("");

    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filtrar]");
      if (!b) return;
      filtrar(b.dataset.filtrar);
      if (b.classList.contains("destacado")) {
        $("#catalogo").scrollIntoView({ behavior: movimientoReducido ? "auto" : "smooth" });
      }
    });
  }

  function filtrar(id, { alternar = true } = {}) {
    // Tocar de nuevo el destacado activo vuelve a mostrar todo
    estado.filtro = alternar && estado.filtro === id && id !== "todos" ? "todos" : id;
    const url = new URL(location.href);
    if (estado.filtro === "todos") url.searchParams.delete("categoria");
    else url.searchParams.set("categoria", estado.filtro);
    history.replaceState(history.state, "", url);
    $$("[data-filtrar]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtrar === estado.filtro)));
    renderGrilla(true);
  }

  /* ---------- catálogo ---------- */

  function tarjeta(p, i) {
    const cat = categoria(p.categoria);
    const etiqueta = p.etiqueta
      ? `<span class="tarjeta__etiqueta${/oferta|sale|%/i.test(p.etiqueta) ? " tarjeta__etiqueta--oferta" : ""}">${escapar(p.etiqueta)}</span>`
      : "";
    const colores = (p.colores || []);
    const muestras = colores.length
      ? `<span class="muestras" aria-hidden="true">${colores.slice(0, 5).map((c) => `<span class="muestra" style="--c:${colorDe(c)}"></span>`).join("")}</span>
         <span class="solo-lector">Colores: ${escapar(colores.join(", "))}.</span>`
      : "<span></span>";
    const talles = (p.talles || []).length ? `<span class="tarjeta__talles">${escapar(p.talles[0])} al ${escapar(p.talles[p.talles.length - 1])}</span>` : "";
    return `<li class="tarjeta" data-cat="${escapar(p.categoria)}" style="--i:${i}">
      <div class="tarjeta__media">${etiqueta}${media(p, { conSegunda: true })}</div>
      <div class="tarjeta__info">
        <h3 class="tarjeta__nombre"><a class="tarjeta__abrir" href="#producto=${encodeURIComponent(p.id)}">${escapar(p.nombre)}</a></h3>
        ${bloquePrecio(p)}
        <div class="tarjeta__pie">${muestras}${p.talles && p.talles.length > 1 ? talles : ""}</div>
      </div>
      <span class="solo-lector">${escapar(cat ? cat.nombre : "")}</span>
    </li>`;
  }

  function bloquePrecio(p) {
    const antes = p.precioAntes ? `<s class="precio__antes"><span class="solo-lector">Antes </span>${precio(p.precioAntes)}</s>` : "";
    const transf = T.descuentoTransferencia > 0
      ? `<span class="precio__transferencia">${precio(conDescuento(p.precio))} con transferencia</span>` : "";
    return `<p class="precio"><span class="precio__actual">${precio(p.precio)}</span>${antes}${transf}</p>`;
  }

  function renderGrilla(animar = false) {
    const lista = estado.filtro === "todos" ? PRODUCTOS : PRODUCTOS.filter((p) => p.categoria === estado.filtro);
    const grilla = $("[data-grilla]");
    grilla.innerHTML = lista.map(tarjeta).join("");
    if (animar && !movimientoReducido) $$(".tarjeta", grilla).forEach((t) => t.classList.add("entra"));
    $("[data-vacia]").hidden = lista.length > 0;
    $("[data-cantidad]").textContent = `${lista.length} ${lista.length === 1 ? "producto" : "productos"}`;
  }

  /* ---------- diálogos ---------- */

  const dialogo = (nombre) => $(`[data-dialogo="${nombre}"]`);

  function abrir(nombre) {
    const d = dialogo(nombre);
    if (!d || d.open) return;
    $$("dialog[open]").forEach((o) => o !== d && o.close());
    d.showModal();
  }

  function iniciarDialogos() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-abrir]");
      if (b) abrir(b.dataset.abrir);
    });

    $$("dialog.hoja").forEach((d) => {
      // Cerrar tocando afuera
      d.addEventListener("click", (e) => {
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        const afuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        if (afuera) d.close();
      });
    });

    // En el menú, los links cierran el menú antes de navegar
    $$("a", dialogo("menu")).forEach((a) => a.addEventListener("click", () => dialogo("menu").close()));

    $("[data-ir-catalogo]").addEventListener("click", () => {
      dialogo("pedido").close();
      $("#catalogo").scrollIntoView({ behavior: movimientoReducido ? "auto" : "smooth" });
    });
  }

  /* ---------- ficha de producto (con link propio: #producto=id) ---------- */

  function abrirProducto(id) {
    const p = PRODUCTOS.find((x) => x.id === id);
    if (!p) return false;
    estado.productoAbierto = p;
    const cat = categoria(p.categoria);
    const fotos = p.fotos && p.fotos.length ? p.fotos : [null];
    const galeria = fotos
      .map((f, i) => (f
        ? `<img src="${escapar(f)}" alt="${escapar(p.nombre)}${fotos.length > 1 ? `, foto ${i + 1} de ${fotos.length}` : ""}" width="800" height="1000" ${i ? 'loading="lazy"' : ""}>`
        : media(p)))
      .join("");
    const puntos = fotos.length > 1 ? `<div class="ficha__puntos" aria-hidden="true">${fotos.map((_, i) => `<span class="${i ? "" : "activo"}"></span>`).join("")}</div>` : "";

    const grupo = (nombre, titulo, opciones, extra = "", conMuestra = false) => {
      if (!opciones || !opciones.length) return "";
      const unica = opciones.length === 1;
      return `<fieldset class="selector" data-selector="${nombre}">
        <legend><span>${titulo}</span>${extra}</legend>
        <div class="selector__opciones">
          ${opciones.map((o) => `<label class="opcion"><input type="radio" name="${nombre}" value="${escapar(o)}" ${unica ? "checked" : ""}>
            <span>${conMuestra ? `<i class="muestra" style="--c:${colorDe(o)}" aria-hidden="true"></i>` : ""}${escapar(o)}</span></label>`).join("")}
        </div>
        <p class="selector__error" id="error-${nombre}" hidden>Elegí ${nombre === "talle" ? "un talle" : "un color"} para sumarlo.</p>
      </fieldset>`;
    };

    $("[data-ficha]").innerHTML = `
      <div class="ficha__media">
        <div class="ficha__galeria" ${fotos.length > 1 ? 'tabindex="0" aria-label="Fotos del producto, deslizá para ver más"' : ""}>${galeria}</div>
        ${puntos}
      </div>
      <div class="ficha__lado">
        <div class="ficha__cuerpo">
          <div>
            <p class="ficha__cat">${escapar(cat ? cat.nombre : "")}</p>
            <h2 class="ficha__nombre" id="ficha-nombre">${escapar(p.nombre)}</h2>
          </div>
          ${bloquePrecio(p)}
          ${p.descripcion ? `<p class="ficha__desc">${escapar(p.descripcion)}</p>` : ""}
          ${grupo("talle", "Talle", p.talles, '<a href="#talles" data-salir>Guía de talles</a>')}
          ${grupo("color", "Color", p.colores, "", true)}
        </div>
        <div class="ficha__comprar">
          <div class="cantidad" role="group" aria-label="Cantidad">
            <button type="button" data-cant="-1" aria-label="Restar uno" disabled>${ICONO_MENOS}</button>
            <output data-cant-valor aria-live="polite">1</output>
            <button type="button" data-cant="1" aria-label="Sumar uno">${ICONO_MAS}</button>
          </div>
          <button class="btn btn--principal" type="button" data-agregar>Agregar al pedido</button>
        </div>
        <div class="ficha__extra">
          <button class="link-btn" type="button" data-compartir>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12a3 3 0 1 1 0-.01M15 6.5 9.8 10.5M15 17.5l-5.2-4M18 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM18 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/></svg>
            Compartir
          </button>
          <a class="link-btn" target="_blank" rel="noopener" href="${linkWhatsApp(`Hola Bel Intimma! Quería consultar por el ${p.nombre}.`)}">
            Consultar por WhatsApp
          </a>
        </div>
      </div>`;

    const ficha = $("[data-ficha]");
    let cantidad = 1;
    const valor = $("[data-cant-valor]", ficha);
    const menos = $('[data-cant="-1"]', ficha);
    $$("[data-cant]", ficha).forEach((b) => b.addEventListener("click", () => {
      cantidad = Math.max(1, Math.min(20, cantidad + Number(b.dataset.cant)));
      valor.textContent = cantidad;
      menos.disabled = cantidad === 1;
    }));

    $$(".selector input", ficha).forEach((input) => input.addEventListener("change", () => {
      const sel = input.closest(".selector");
      sel.classList.remove("con-error");
      $(".selector__error", sel).hidden = true;
    }));

    $("[data-agregar]", ficha).addEventListener("click", () => {
      const elegido = (nombre) => {
        const sel = $(`[data-selector="${nombre}"]`, ficha);
        if (!sel) return "";
        const marcado = $("input:checked", sel);
        if (marcado) return marcado.value;
        sel.classList.add("con-error");
        $(".selector__error", sel).hidden = false;
        return null;
      };
      const talle = elegido("talle");
      const color = elegido("color");
      if (talle === null || color === null) {
        const primerError = $(".selector.con-error", ficha);
        if (primerError) {
          primerError.scrollIntoView({ behavior: movimientoReducido ? "auto" : "smooth", block: "center" });
          $("input", primerError).focus({ preventScroll: true });
        }
        return;
      }
      agregar(p, talle, color, cantidad);
      cerrarProducto();
      const detalle = [talle && `talle ${talle}`, color].filter(Boolean).join(", ");
      mostrarTostada(`Agregado al pedido: ${p.nombre}${detalle ? ` (${detalle})` : ""}`);
    });

    $("[data-compartir]", ficha).addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#producto=${encodeURIComponent(p.id)}`;
      try {
        if (navigator.share) await navigator.share({ title: p.nombre, text: `${p.nombre} en Bel Intimma`, url });
        else { await navigator.clipboard.writeText(url); mostrarTostada("Link copiado", false); }
      } catch { /* la persona canceló */ }
    });

    $$("[data-salir]", ficha).forEach((a) => a.addEventListener("click", () => {
      estado.saliendoPorLink = true;
      dialogo("producto").close();
    }));

    // Puntos de la galería
    const gal = $(".ficha__galeria", ficha);
    const dots = $$(".ficha__puntos span", ficha);
    if (dots.length) {
      gal.addEventListener("scroll", () => {
        const i = Math.round(gal.scrollLeft / gal.clientWidth);
        dots.forEach((d, j) => d.classList.toggle("activo", i === j));
      }, { passive: true });
    }

    abrir("producto");
    gal.scrollLeft = 0;
    dialogo("producto").scrollTop = 0;
    return true;
  }

  function cerrarProducto() {
    dialogo("producto").close();
  }

  function iniciarRutas() {
    const d = dialogo("producto");
    d.addEventListener("close", () => {
      estado.productoAbierto = null;
      if (!location.hash.startsWith("#producto=")) return;
      if (estado.saliendoPorLink) {
        estado.saliendoPorLink = false;
        history.replaceState(null, "", location.pathname + location.search);
      } else if (estado.abiertoDesdeAdentro) {
        // Volver atrás deja el historial limpio: el botón "atrás" del celular cierra la ficha
        estado.ignorarHash = true;
        history.back();
      } else {
        history.replaceState(null, "", location.pathname + location.search);
      }
      estado.abiertoDesdeAdentro = false;
    });

    window.addEventListener("hashchange", () => {
      if (estado.ignorarHash) { estado.ignorarHash = false; return; }
      const h = location.hash;
      if (h.startsWith("#producto=")) {
        estado.abiertoDesdeAdentro = true;
        abrirProducto(decodeURIComponent(h.slice(10)));
        return;
      }
      if (d.open) d.close();
    });

    // Si alguien entra con un link a un producto (ej. desde una historia)
    if (location.hash.startsWith("#producto=")) {
      const ok = abrirProducto(decodeURIComponent(location.hash.slice(10)));
      if (!ok) history.replaceState(null, "", location.pathname + location.search);
    }
  }

  /* ---------- pedido ---------- */

  const claveItem = (id, talle, color) => [id, talle, color].join("|");
  const productoDe = (item) => PRODUCTOS.find((p) => p.id === item.id);
  const totalUnidades = () => estado.carrito.reduce((s, i) => s + i.cantidad, 0);
  const total = () => estado.carrito.reduce((s, i) => s + (productoDe(i)?.precio || 0) * i.cantidad, 0);

  function agregar(p, talle, color, cantidad) {
    const clave = claveItem(p.id, talle, color);
    const existente = estado.carrito.find((i) => i.clave === clave);
    if (existente) existente.cantidad = Math.min(20, existente.cantidad + cantidad);
    else estado.carrito.push({ clave, id: p.id, talle, color, cantidad });
    guardarCarrito();
    renderPedido();
    const cuenta = $("[data-cuenta]");
    cuenta.classList.remove("late");
    void cuenta.offsetWidth;
    cuenta.classList.add("late");
  }

  function renderPedido() {
    const n = totalUnidades();
    const cuenta = $("[data-cuenta]");
    cuenta.textContent = n;
    cuenta.classList.toggle("tiene", n > 0);
    $(".bolsa").setAttribute("aria-label", `Tu pedido, ${n} ${n === 1 ? "prenda" : "prendas"}`);

    const barra = $("[data-barra]");
    barra.hidden = n === 0;
    document.body.classList.toggle("con-barra", n > 0);
    $("[data-barra-cantidad]").textContent = `${n} ${n === 1 ? "prenda" : "prendas"}`;
    $("[data-barra-total]").textContent = precio(total());

    $("[data-pedido-vacio]").hidden = n > 0;
    $("[data-pedido-lleno]").hidden = n === 0;
    $("[data-total]").textContent = precio(total());

    const notaTotal = $("[data-total-nota]");
    if (T.descuentoTransferencia > 0 && n > 0) {
      notaTotal.textContent = `Con transferencia o efectivo: ${precio(conDescuento(total()))}`;
      notaTotal.hidden = false;
    } else notaTotal.hidden = true;

    $("[data-items]").innerHTML = estado.carrito.map((i) => {
      const p = productoDe(i);
      const detalle = [i.talle && `Talle ${i.talle}`, i.color].filter(Boolean).join(", ");
      return `<li class="item" data-clave="${escapar(i.clave)}">
        <div class="item__img">${media(p)}</div>
        <div>
          <p class="item__nombre">${escapar(p.nombre)}</p>
          <p class="item__detalle">${escapar(detalle)}</p>
          <div class="item__acciones">
            <div class="cantidad cantidad--chica" role="group" aria-label="Cantidad de ${escapar(p.nombre)}">
              <button type="button" data-item-cant="-1" aria-label="Restar uno">${ICONO_MENOS}</button>
              <output aria-live="polite">${i.cantidad}</output>
              <button type="button" data-item-cant="1" aria-label="Sumar uno" ${i.cantidad >= 20 ? "disabled" : ""}>${ICONO_MAS}</button>
            </div>
            <button class="link-btn item__quitar" type="button" data-quitar>Quitar</button>
          </div>
        </div>
        <p class="item__precio">${precio(p.precio * i.cantidad)}</p>
      </li>`;
    }).join("");
  }

  function iniciarPedido() {
    $("[data-dibujo-vacio]").innerHTML = D.vacio();

    $("[data-items]").addEventListener("click", (e) => {
      const li = e.target.closest(".item");
      if (!li) return;
      const item = estado.carrito.find((i) => i.clave === li.dataset.clave);
      if (!item) return;
      const b = e.target.closest("button");
      if (!b) return;
      let foco = null;
      if (b.hasAttribute("data-quitar")) {
        const posicion = estado.carrito.indexOf(item);
        estado.carrito = estado.carrito.filter((i) => i !== item);
        ultimoQuitado = { item, posicion };
        mostrarTostada(`Quitaste ${productoDe(item).nombre}`, "deshacer");
      } else if (b.dataset.itemCant) {
        item.cantidad += Number(b.dataset.itemCant);
        if (item.cantidad <= 0) estado.carrito = estado.carrito.filter((i) => i !== item);
        else foco = `[data-clave="${CSS.escape(item.clave)}"] [data-item-cant="${b.dataset.itemCant}"]`;
      }
      guardarCarrito();
      renderPedido();
      // Mantener el foco en un lugar lógico después de redibujar
      const destino = (foco && $(foco)) || $("[data-items] button") || $("[data-ir-catalogo]");
      if (destino && !destino.disabled) destino.focus();
    });

    // Entrega y pago
    $("[data-opciones-entrega]").innerHTML = T.entregas.map((o, i) =>
      `<label class="opcion"><input type="radio" name="entrega" value="${escapar(o.id)}" ${i === 0 ? "checked" : ""}><span>${escapar(o.nombre)}</span></label>`).join("");
    $("[data-select-pago]").innerHTML = T.mediosDePago.map((m) => `<option>${escapar(m)}</option>`).join("");

    const form = $("[data-form-pedido]");
    const campoDir = $("[data-campo-direccion]");
    form.addEventListener("change", (e) => {
      if (e.target.name !== "entrega") return;
      const opcion = T.entregas.find((o) => o.id === e.target.value);
      campoDir.hidden = !(opcion && opcion.pideDireccion);
    });

    const nombre = $("#p-nombre");
    const errorNombre = $("#p-nombre-error");
    nombre.addEventListener("input", () => {
      if (nombre.value.trim()) { nombre.removeAttribute("aria-invalid"); errorNombre.hidden = true; }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!nombre.value.trim()) {
        nombre.setAttribute("aria-invalid", "true");
        nombre.setAttribute("aria-describedby", "p-nombre-error");
        errorNombre.hidden = false;
        nombre.focus();
        return;
      }
      if (!whatsappConfigurado()) {
        mostrarTostada("Falta cargar el número de WhatsApp en js/config.js", false);
        return;
      }
      const datos = new FormData(form);
      const entrega = T.entregas.find((o) => o.id === datos.get("entrega"));
      const zona = String(datos.get("zona") || "").trim();

      const lineas = estado.carrito.map((i) => {
        const p = productoDe(i);
        const detalle = [i.talle && `talle ${i.talle}`, i.color].filter(Boolean).join(", ");
        return `• ${i.cantidad} x ${p.nombre}${detalle ? ` (${detalle})` : ""}: ${precio(p.precio * i.cantidad)}`;
      });
      const msg = [
        `Hola ${T.nombre}! Quiero hacer este pedido:`,
        "",
        ...lineas,
        "",
        `*Total: ${precio(total())}*`,
        "",
        `Nombre: ${nombre.value.trim()}`,
        `Entrega: ${entrega ? entrega.nombre : ""}${entrega && entrega.pideDireccion && zona ? ` (${zona})` : ""}`,
        `Pago: ${datos.get("pago")}`
      ].join("\n");

      window.open(linkWhatsApp(msg), "_blank", "noopener");
      $("[data-enviado]").hidden = false;
    });

    $("[data-vaciar]").addEventListener("click", () => {
      estado.carrito = [];
      guardarCarrito();
      renderPedido();
      $("[data-enviado]").hidden = true;
      $("[data-ir-catalogo]").focus();
    });
  }

  /* ---------- tostada ---------- */

  let temporizador;
  let ultimoQuitado = null;
  function mostrarTostada(texto, accion = true) {
    const t = $("[data-tostada]");
    const boton = accion === "deshacer"
      ? '<button type="button" data-deshacer>Deshacer</button>'
      : accion ? '<button type="button" data-abrir="pedido">Ver pedido</button>' : "";
    // Un diálogo modal deja inerte todo lo de afuera: el aviso tiene que vivir adentro
    const contenedor = $("dialog[open]") || document.body;
    if (t.parentElement !== contenedor) contenedor.appendChild(t);
    t.innerHTML = `<span>${escapar(texto)}</span>${boton}`;
    t.classList.add("visible");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => t.classList.remove("visible"), accion === "deshacer" ? 6000 : 3200);
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-deshacer]") || !ultimoQuitado) return;
    const { item, posicion } = ultimoQuitado;
    estado.carrito.splice(Math.min(posicion, estado.carrito.length), 0, item);
    ultimoQuitado = null;
    guardarCarrito();
    renderPedido();
    $("[data-tostada]").classList.remove("visible");
  });

  /* ---------- cabecera ---------- */

  function iniciarCabecera() {
    const cab = $("[data-cabecera]");
    const actualizar = () => cab.classList.toggle("con-borde", window.scrollY > 40);
    window.addEventListener("scroll", actualizar, { passive: true });
    actualizar();
  }

  /* ---------- arranque ---------- */

  iniciarAvisos();
  iniciarLinks();
  iniciarAvatar();
  iniciarDestacados();
  const categoriaInicial = new URLSearchParams(location.search).get("categoria");
  if (categoriaInicial && categoria(categoriaInicial)) filtrar(categoriaInicial, { alternar: false });
  else renderGrilla();
  iniciarDialogos();
  iniciarPedido();
  renderPedido();
  iniciarCabecera();
  iniciarRutas();

  if (!whatsappConfigurado()) {
    console.warn("[Bel Intimma] Cargá el número de WhatsApp en js/config.js para recibir pedidos.");
  }
})();
