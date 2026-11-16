#!/usr/bin/env python3
"""
Arma la carpeta "publicar/" con SOLO los archivos que forman parte de la página,
lista para subir a Netlify (arrastrándola a app.netlify.com/drop).

    python3 scripts/preparar_publicacion.py

Netlify también lo ejecuta solo cuando el sitio está conectado al repo de GitHub
(ver netlify.toml).

Antes de copiar, revisa que:
  - ninguna foto tenga metadatos (EXIF, ubicación GPS, XMP, comentarios);
  - el número de WhatsApp esté cargado en js/config.js.
Si una foto tiene metadatos, se frena: no se publica nada hasta limpiarla con
    python3 scripts/limpiar_fotos.py

No necesita instalar nada (solo Python 3).
"""

import re
import shutil
import struct
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "publicar"

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


def revisar_config() -> None:
    config = (RAIZ / "js" / "config.js").read_text(encoding="utf-8")
    numero = re.search(r'whatsapp:\s*"([^"]*)"', config)
    if not numero or not re.fullmatch(r"\d{10,15}", numero.group(1)):
        print("  ! Aviso: el número de WhatsApp de js/config.js todavía no está cargado.")


def main() -> int:
    print("Revisando fotos...")
    if not revisar_fotos():
        print("\nHay fotos con metadatos (pueden incluir la ubicación donde se sacaron).")
        print("Limpialas con:  python3 scripts/limpiar_fotos.py   y volvé a ejecutar este script.")
        return 1
    revisar_config()

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

    print(f"\nListo: {copiados} archivos en {DESTINO.relative_to(RAIZ)}/")
    print("Para Netlify Drop: arrastrá esa carpeta a https://app.netlify.com/drop")
    return 0


if __name__ == "__main__":
    sys.exit(main())
