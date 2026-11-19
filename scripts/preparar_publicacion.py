#!/usr/bin/env python3
"""
Arma la carpeta "publicar/" con SOLO los archivos que forman parte de la página.

    python3 scripts/preparar_publicacion.py

Netlify lo ejecuta solo en cada publicación (ver netlify.toml), después de
compilar el panel de administración.

Qué hace:
  1. Revisa que ninguna foto tenga metadatos (EXIF, ubicación GPS, XMP, comentarios).
     Si encuentra una, frena: no se publica nada hasta limpiarla con
         python3 scripts/limpiar_fotos.py
  2. Junta los datos que se editan desde el panel (carpeta datos/: productos,
     categorías, contacto, talles, preguntas, textos) en un solo archivo, js/datos.js.
  3. Escribe en index.html los textos de la página (los {{seccion.clave}}), así se
     ven bien desde el primer momento y en Google. Si falta alguno, frena.
  4. Copia la lista blanca de archivos de la página y el panel ya compilado
     (panel/dist/ -> admin/).

Para ver la página en tu compu:
    python3 scripts/preparar_publicacion.py
    python3 -m http.server 8000 -d publicar

No necesita instalar nada (solo Python 3).
"""

import html
import json
import re
import shutil
import struct
import sys
import unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "publicar"
DATOS = RAIZ / "datos"
PANEL = RAIZ / "panel" / "dist"

# Lista blanca: solo esto se publica. Todo lo demás (README, DESIGN.md, scripts,
# .git, capturas, originales) queda afuera.
ARCHIVOS = ["index.html", "_headers"]
CARPETAS = {
    "css": {".css"},
    "js": {".js", ".txt"},
    "fonts": {".woff2", ".txt"},
    "img": {".svg", ".jpg", ".jpeg", ".png", ".webp", ".avif"},
}
FOTOS = {".jpg", ".jpeg", ".png", ".webp"}


def metadatos_jpeg(datos: bytes) -> list[str]:
    hallados, i = [], 2
    while i + 4 <= len(datos) and datos[i] == 0xFF:
        marca = datos[i + 1]
        if marca in (0xD9, 0xDA):  # fin de imagen / comienzo de los píxeles
            break
        largo = struct.unpack(">H", datos[i + 2:i + 4])[0]
        bloque = datos[i + 4:i + 2 + largo]
        if marca == 0xE1 and bloque.startswith(b"Exif\x00\x00"):
            hallados.append("EXIF")
            if b"GPS" in bloque:
                hallados.append("posible GPS")
        elif marca == 0xE1 and bloque.startswith(b"http://ns.adobe.com/xap"):
            hallados.append("XMP")
        elif marca == 0xED:
            hallados.append("IPTC/Photoshop")
        elif marca == 0xFE:
            hallados.append("comentario")
        i += 2 + largo
    return hallados


def metadatos_png(datos: bytes) -> list[str]:
    hallados, i = [], 8
    while i + 8 <= len(datos):
        largo, tipo = struct.unpack(">I4s", datos[i:i + 8])
        if tipo == b"eXIf":
            hallados.append("EXIF")
        elif tipo in (b"tEXt", b"iTXt", b"zTXt"):
            hallados.append("texto")
        elif tipo == b"IEND":
            break
        i += 12 + largo
    return hallados


def metadatos_webp(datos: bytes) -> list[str]:
    hallados, i = [], 12
    while i + 8 <= len(datos):
        tipo, largo = struct.unpack("<4sI", datos[i:i + 8])
        if tipo == b"EXIF":
            hallados.append("EXIF")
        elif tipo == b"XMP ":
            hallados.append("XMP")
        i += 8 + largo + (largo & 1)
    return hallados


def metadatos(ruta: Path) -> list[str]:
    datos = ruta.read_bytes()
    if datos[:2] == b"\xff\xd8":
        return metadatos_jpeg(datos)
    if datos[:8] == b"\x89PNG\r\n\x1a\n":
        return metadatos_png(datos)
    if datos[:4] == b"RIFF" and datos[8:12] == b"WEBP":
        return metadatos_webp(datos)
    return []


def revisar_fotos() -> bool:
    ok = True
    for foto in sorted((RAIZ / "img").rglob("*")):
        if foto.suffix.lower() in FOTOS:
            hallados = metadatos(foto)
            if hallados:
                ok = False
                print(f"  ✗ {foto.relative_to(RAIZ)} tiene {', '.join(dict.fromkeys(hallados))}")
    return ok


# ---------------------------------------------------------------------------
# Datos del panel -> js/datos.js
# Acá solo se juntan y ordenan. La validación fuerte (tipos, largos, rutas de
# fotos) la hace js/app.js en el navegador, que descarta lo que no cumple.
# ---------------------------------------------------------------------------

def a_id(texto) -> str:
    """'Conjunto Ámbar' -> 'conjunto-ambar' (minúsculas, números y guiones)."""
    s = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:60].strip("-")


def leer_json(ruta: Path, defecto):
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"  ! Aviso: falta {ruta.relative_to(RAIZ)}")
        return defecto
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        print(f"  ! Aviso: {ruta.relative_to(RAIZ)} está dañado y se ignoró ({error})")
        return defecto
    if not isinstance(datos, type(defecto)):
        print(f"  ! Aviso: {ruta.relative_to(RAIZ)} no tiene el formato esperado y se ignoró")
        return defecto
    return datos


def leer_carpeta(nombre: str) -> list[dict]:
    """Lee una carpeta de entradas (un .json por producto o categoría), en el orden del panel."""
    entradas, vistos = [], set()
    for ruta in sorted((DATOS / nombre).glob("*.json")):
        datos = leer_json(ruta, {})
        base = a_id(ruta.stem)
        if not datos or not base:
            continue
        ident, n = base, 2
        while ident in vistos:  # dos archivos que dan el mismo id
            ident, n = f"{base[:56]}-{n}", n + 1
        vistos.add(ident)
        orden = datos.get("orden")
        clave = orden if isinstance(orden, (int, float)) and not isinstance(orden, bool) else float("inf")
        entradas.append((clave, str(datos.get("nombre", "")).lower(), ident, datos))
    return [(ident, datos) for _, _, ident, datos in sorted(entradas, key=lambda e: e[:2])]


def ruta_foto(valor) -> str:
    # El panel guarda "/img/productos/foto.webp"; la página usa rutas relativas
    return str(valor or "").lstrip("/")


def leer_textos() -> dict:
    """datos/textos/inicio.json -> {"inicio": {...}}; un archivo por sección del panel."""
    return {ruta.stem: leer_json(ruta, {}) for ruta in sorted((DATOS / "textos").glob("*.json"))}


def limpiar_texto(valor) -> str:
    # Igual que texto() en js/app.js: sin caracteres de control y espacios colapsados
    return re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f-\x9f\u2028\u2029]", " ", str(valor))).strip()[:400]


CLAVE = re.compile(r"\{\{([a-z]+)\.([A-Za-z]+)\}\}")


def revisar_textos(textos: dict) -> list[str]:
    """Cada texto que usan index.html y js/app.js tiene que existir en datos/textos/."""
    usadas = set(CLAVE.findall((RAIZ / "index.html").read_text(encoding="utf-8")))
    app = (RAIZ / "js" / "app.js").read_text(encoding="utf-8")
    usadas |= {(s, k) for s, k in re.findall(r'"([a-z]+)\.([A-Za-z]+)"', app) if s in textos}
    faltan = [f"{s}.{k}" for s, k in sorted(usadas) if not isinstance(textos.get(s, {}).get(k), str)]
    pasos = textos.get("pasos", {}).get("lista")
    if not isinstance(pasos, list):
        faltan.append("pasos.lista")
    return faltan


def renderizar_index(tienda: dict, textos: dict) -> str:
    variables = {
        "tienda": str(tienda.get("nombre") or "Bel Intimma"),
        "zona": str(tienda.get("zona") or ""),
        "año": str(date.today().year),
    }

    def escapar(valor) -> str:
        texto = html.escape(limpiar_texto(valor), quote=True)
        # Las {variables} se reemplazan después de escapar, con su valor también escapado
        return re.sub(r"\{(tienda|zona|año)\}", lambda m: html.escape(variables[m.group(1)], quote=True), texto)

    pagina = (RAIZ / "index.html").read_text(encoding="utf-8")
    pagina = CLAVE.sub(lambda m: escapar(textos[m.group(1)][m.group(2)]), pagina)

    avisos = [a for a in tienda.get("avisos") or [] if isinstance(a, str) and a.strip()]
    pagina = pagina.replace("{{@aviso}}", escapar(avisos[0]) if avisos else "")

    pasos = [x for x in textos["pasos"]["lista"] if isinstance(x, dict) and str(x.get("titulo", "")).strip()]
    pagina = pagina.replace("{{@pasos}}", "\n".join(
        f"            <li>\n              <h3>{escapar(x.get('titulo', ''))}</h3>\n"
        f"              <p>{escapar(x.get('texto', ''))}</p>\n            </li>" for x in pasos[:8]))
    if "{{" in pagina:
        raise ValueError("quedó un {{...}} sin reemplazar en index.html")
    return pagina


def armar_datos() -> str:
    tienda = leer_json(DATOS / "tienda.json", {})
    tienda["categorias"] = [
        {"id": ident, "nombre": d.get("nombre"), "corto": d.get("corto"), "dibujo": d.get("dibujo")}
        for ident, d in leer_carpeta("categorias")
    ]
    talles = leer_json(DATOS / "talles.json", {})
    tienda["talles"] = {"nota": talles.get("nota"), "tablas": talles.get("tablas")}
    tienda["preguntas"] = leer_json(DATOS / "preguntas.json", {}).get("preguntas")
    tienda["textos"] = leer_textos()

    productos = []
    for ident, d in leer_carpeta("productos"):
        colores = d.get("colores") if isinstance(d.get("colores"), list) else []
        nombres_talles = {t.get("talle") if isinstance(t, dict) else t for t in d.get("talles") or []} if isinstance(d.get("talles"), list) else set()
        for c in colores:
            for t in (c.get("tallesAgotados") or []) if isinstance(c, dict) and isinstance(c.get("tallesAgotados"), list) else []:
                if t not in nombres_talles:
                    print(f"  ! Aviso: {ident}, color {c.get('color')}: el talle sin stock «{t}» no está en «Talles» y se ignora")
        fotos = [ruta_foto(f) for f in d.get("fotos") or [] if isinstance(f, str)] if isinstance(d.get("fotos"), list) else []
        for foto in fotos:
            if not (RAIZ / foto).is_file():
                print(f"  ! Aviso: {ident} usa la foto {foto}, que no existe")
        productos.append({
            "id": ident,
            "nombre": d.get("nombre"),
            "categoria": a_id(d.get("categoria")),
            "precio": d.get("precio"),
            "precioAntes": d.get("precioAntes"),
            # El panel guarda [{"talle": "M", "agotado": false}, ...]; también acepta ["M", ...]
            "talles": [t.get("talle") if isinstance(t, dict) else t for t in d.get("talles") or []]
                       if isinstance(d.get("talles"), list) else [],
            "tallesAgotados": [t.get("talle") for t in d.get("talles") or []
                               if isinstance(t, dict) and t.get("agotado") is True]
                              if isinstance(d.get("talles"), list) else [],
            # Colores: [{"color": "Negro", "agotado": false, "tallesAgotados": ["M"]}, ...] o ["Negro", ...]
            "colores": [c.get("color") if isinstance(c, dict) else c for c in colores],
            "coloresAgotados": [c.get("color") for c in colores if isinstance(c, dict) and c.get("agotado") is True],
            "sinStockPorColor": {
                c.get("color"): [t for t in c.get("tallesAgotados") or [] if isinstance(t, str)]
                for c in colores
                if isinstance(c, dict) and isinstance(c.get("color"), str) and isinstance(c.get("tallesAgotados"), list)
                and c.get("tallesAgotados")
            },
            "fotos": fotos,
            "descripcion": d.get("descripcion"),
            "etiqueta": d.get("etiqueta"),
            "disponible": d.get("disponible", True) is not False,
        })

    if not re.fullmatch(r"\d{10,15}", str(tienda.get("whatsapp", ""))):
        print("  ! Aviso: el número de WhatsApp todavía no está cargado (Panel → Datos de la tienda).")
    visibles = sum(p["disponible"] for p in productos)
    print(f"  {len(productos)} productos ({visibles} visibles), {len(tienda['categorias'])} categorías")

    a_js = lambda v: json.dumps(v, ensure_ascii=False, indent=1)
    return (
        "/* Archivo generado por scripts/preparar_publicacion.py a partir de datos/.\n"
        "   No se edita a mano: los cambios se hacen desde el panel (/admin/). */\n"
        f"window.TIENDA = {a_js(tienda)};\n"
        f"window.PRODUCTOS = {a_js(productos)};\n"
    )


def main() -> int:
    print("Revisando fotos...")
    if not revisar_fotos():
        print("\nHay fotos con metadatos (pueden incluir la ubicación donde se sacaron).")
        print("Limpialas con:  python3 scripts/limpiar_fotos.py   y volvé a ejecutar este script.")
        return 1
    print("Juntando los datos del panel...")
    datos_js = armar_datos()
    tienda = leer_json(DATOS / "tienda.json", {})
    textos = leer_textos()
    faltan = revisar_textos(textos)
    if faltan:
        print("\nFaltan textos en datos/textos/ (agregalos en el panel o en el archivo):")
        for clave in faltan:
            print(f"  ✗ {clave}")
        return 1
    pagina = renderizar_index(tienda, textos)

    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir()

    copiados = 0
    for nombre in ARCHIVOS:
        shutil.copy2(RAIZ / nombre, DESTINO / nombre)
        copiados += 1
    for carpeta, extensiones in CARPETAS.items():
        for archivo in sorted((RAIZ / carpeta).rglob("*")):
            if archivo.is_file() and archivo.suffix.lower() in extensiones and not archivo.name.startswith("."):
                destino = DESTINO / archivo.relative_to(RAIZ)
                destino.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(archivo, destino)
                copiados += 1

    (DESTINO / "js" / "datos.js").write_text(datos_js, encoding="utf-8")
    (DESTINO / "index.html").write_text(pagina, encoding="utf-8")
    copiados += 1

    if (PANEL / "index.html").is_file():
        shutil.copytree(PANEL, DESTINO / "admin")
        print("  Panel de administración incluido en admin/")
    else:
        print("  ! El panel no está compilado (panel/dist/): se publica sin /admin/.")
        print("    Para compilarlo: cd panel && npm ci && npm run build")

    print(f"\nListo: {copiados} archivos de la página en {DESTINO.relative_to(RAIZ)}/")
    print("Para verla: python3 -m http.server 8000 -d publicar")
    return 0


if __name__ == "__main__":
    sys.exit(main())
