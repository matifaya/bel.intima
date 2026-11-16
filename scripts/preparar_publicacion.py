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
     categorías, contacto, talles, preguntas) en un solo archivo, js/datos.js.
  3. Copia la lista blanca de archivos de la página y el panel ya compilado
     (panel/dist/ -> admin/).

Para ver la página en tu compu:
    python3 scripts/preparar_publicacion.py
    python3 -m http.server 8000 -d publicar

No necesita instalar nada (solo Python 3).
"""

import json
import re
import shutil
import struct
import sys
import unicodedata
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


def armar_datos() -> str:
    tienda = leer_json(DATOS / "tienda.json", {})
    tienda["categorias"] = [
        {"id": ident, "nombre": d.get("nombre"), "corto": d.get("corto"), "dibujo": d.get("dibujo")}
        for ident, d in leer_carpeta("categorias")
    ]
    talles = leer_json(DATOS / "talles.json", {})
    tienda["talles"] = {"nota": talles.get("nota"), "tablas": talles.get("tablas")}
    tienda["preguntas"] = leer_json(DATOS / "preguntas.json", {}).get("preguntas")

    productos = []
    for ident, d in leer_carpeta("productos"):
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
            "talles": d.get("talles"),
            "colores": d.get("colores"),
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
