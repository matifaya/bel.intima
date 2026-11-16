#!/usr/bin/env python3
"""
Limpia los metadatos de las fotos de productos (EXIF, ubicación GPS, modelo de
celular, fecha, XMP, comentarios) y las deja listas para la web.

Uso (desde la carpeta del proyecto):

    python3 scripts/limpiar_fotos.py              # limpia todas las fotos de img/productos/
    python3 scripts/limpiar_fotos.py --verificar  # solo revisa, no cambia nada
    python3 scripts/limpiar_fotos.py otra/carpeta # limpia otra carpeta

Qué hace con cada foto (.jpg, .jpeg, .png, .webp):
  1. La gira según la orientación que guardó el celular (para que no quede de costado).
  2. La achica si mide más de 1600 px de alto o de ancho (la web no necesita más).
  3. La vuelve a guardar SIN metadatos. Solo conserva el perfil de color.
  4. Comprueba que el archivo final ya no tenga EXIF ni GPS.

Necesita Pillow:  pip install pillow
(Las fotos .heic de iPhone no se pueden leer: exportalas como JPG primero.)
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta instalar Pillow. Ejecutá:  pip install pillow")

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
LADO_MAXIMO = 1600
CLAVES_PRIVADAS = ("xmp", "XML:com.adobe.xmp", "comment", "photoshop", "iptc")


def metadatos(ruta: Path) -> list[str]:
    """Devuelve qué metadatos sensibles tiene la imagen (lista vacía = limpia)."""
    hallados = []
    with Image.open(ruta) as im:
        exif = im.getexif()
        if exif:
            hallados.append(f"EXIF ({len(exif)} campos)")
            if exif.get_ifd(0x8825):  # bloque GPS
                hallados.append("UBICACIÓN GPS")
        for clave in CLAVES_PRIVADAS:
            if clave in im.info:
                hallados.append(clave.upper())
        # Bloques de texto de PNG (pueden traer autor, software, etc.)
        textos = [k for k in getattr(im, "text", {}) or {}]
        if textos:
            hallados.append("texto PNG: " + ", ".join(textos))
    return hallados


def limpiar(ruta: Path) -> None:
    with Image.open(ruta) as original:
        icc = original.info.get("icc_profile")
        im = ImageOps.exif_transpose(original)  # aplica la rotación antes de borrar el EXIF
        im.thumbnail((LADO_MAXIMO, LADO_MAXIMO), Image.Resampling.LANCZOS)
        im.info = {}  # descarta todo lo que venía del archivo

        formato = ruta.suffix.lower()
        opciones = {"icc_profile": icc} if icc else {}
        temporal = ruta.with_name(ruta.name + ".tmp")
        if formato in (".jpg", ".jpeg"):
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            im.save(temporal, "JPEG", quality=84, optimize=True, progressive=True, **opciones)
        elif formato == ".webp":
            im.save(temporal, "WEBP", quality=82, method=6, **opciones)
        else:  # .png
            im.save(temporal, "PNG", optimize=True, **opciones)
    temporal.replace(ruta)


def main() -> int:
    parser = argparse.ArgumentParser(description="Limpia metadatos (EXIF/GPS) de las fotos.")
    parser.add_argument("carpeta", nargs="?", default="img/productos", help="carpeta con las fotos")
    parser.add_argument("--verificar", action="store_true", help="solo revisar, sin modificar")
    args = parser.parse_args()

    carpeta = Path(args.carpeta)
    if not carpeta.is_dir():
        print(f"No existe la carpeta {carpeta}")
        return 1

    fotos = sorted(p for p in carpeta.rglob("*") if p.suffix.lower() in EXTENSIONES)
    if not fotos:
        print(f"No hay fotos en {carpeta}/")
        return 0

    con_problemas = 0
    for foto in fotos:
        try:
            antes = metadatos(foto)
            if args.verificar:
                if antes:
                    con_problemas += 1
                    print(f"  ✗ {foto}: tiene {', '.join(antes)}")
                else:
                    print(f"  ✓ {foto}")
                continue
            limpiar(foto)
            despues = metadatos(foto)
            if despues:
                con_problemas += 1
                print(f"  ✗ {foto}: no se pudo limpiar ({', '.join(despues)})")
            else:
                quitado = f" (se quitó: {', '.join(antes)})" if antes else ""
                print(f"  ✓ {foto}{quitado}")
        except Exception as error:  # foto dañada o formato no soportado
            con_problemas += 1
            print(f"  ✗ {foto}: no se pudo abrir ({error})")

    if con_problemas:
        accion = "Ejecutá  python3 scripts/limpiar_fotos.py  para limpiarlas." if args.verificar else ""
        print(f"\n{con_problemas} foto(s) con problemas. {accion}")
        return 1
    print(f"\nListo: {len(fotos)} foto(s) sin metadatos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
