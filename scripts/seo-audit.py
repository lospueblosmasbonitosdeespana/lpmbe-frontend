#!/usr/bin/env python3
"""
Auditoría SEO automática sobre URLs reales del sitio en producción.

Qué valida (los mismos criterios que Google aplica en el Rich Results Test
sobre el HTML renderizado):
  - Presencia de <title>, <meta description>, <link rel="canonical">.
  - hreflang: al menos 7 idiomas + x-default.
  - og:image y twitter:card (summary_large_image cuando hay imagen).
  - JSON-LD por cada bloque <script type="application/ld+json">:
      * JSON válido
      * @type presente
      * campos obligatorios para cada tipo (NewsArticle, Article, Event,
        TouristAttraction, TouristTrip, BreadcrumbList, VideoObject,
        CollectionPage, ItemList, Organization, WebSite)
      * VideoObject: uploadDate en ISO 8601 completo con zona horaria

Uso:
  python3 frontend/scripts/seo-audit.py              # usa URLs por defecto
  python3 frontend/scripts/seo-audit.py url1 url2    # URLs custom

Requisitos: Python 3 estándar. No necesita dependencias externas.
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from typing import Any
from urllib import request, error

SITE = "https://lospueblosmasbonitosdeespana.org"

# URLs representativas de cada tipo de página del sitio.
DEFAULT_URLS: list[str] = [
    # Home + listados globales
    f"{SITE}/",
    f"{SITE}/pueblos",
    f"{SITE}/actualidad",
    f"{SITE}/actualidad?tipo=noticia",
    f"{SITE}/multiexperiencias",

    # Pueblos (TouristAttraction + VideoObject)
    f"{SITE}/pueblos/albarracin",
    f"{SITE}/pueblos/frigiliana",
    f"{SITE}/pueblos/pedraza",
    f"{SITE}/pueblos/ainsa",
    f"{SITE}/pueblos/cudillero",
    f"{SITE}/pueblos/santillana-del-mar",

    # POIs (TouristAttraction + BreadcrumbList)
    f"{SITE}/pueblos/albarracin/pois/albarracin-cathedral",
    f"{SITE}/pueblos/frigiliana/pois/el-ingenio-s-xvi",
    f"{SITE}/pueblos/pedraza/pois/castillo-museo-zuloaga",

    # Multiexperiencias (TouristTrip + listado por pueblo)
    f"{SITE}/pueblos/ainsa/multiexperiencias",
    f"{SITE}/pueblos/ainsa/experiencias/ainsa-pueblo-de-leyenda",
    f"{SITE}/pueblos/frigiliana/experiencias/miradores-y-adarves",

    # Actualidad por pueblo
    f"{SITE}/pueblos/albarracin/actualidad",

    # Noticia real (NewsArticle + BreadcrumbList)
    f"{SITE}/noticias/beget-camprodon-acogio-este-fin-de-semana-el-ii-encuentro-de-los-pueblos-mas-bonitos-de-los-pirineos",
    # Artículo (Article + BreadcrumbList)
    f"{SITE}/c/beget-acogera-el-ii-encuentro-de-los-pueblos-mas-bonitos-de-los-pirineos-el-18-de-abril",

    # Temáticas con contenido real (CollectionPage/Article + BreadcrumbList)
    f"{SITE}/patrimonio/santillana-del-mar",
    f"{SITE}/naturaleza/santillana-del-mar",
    f"{SITE}/cultura/santillana-del-mar",
    f"{SITE}/en-familia/frigiliana",
    f"{SITE}/naturaleza/alquezar",
    # Temática intencionalmente vacía (debe salir como "noindex intencional")
    f"{SITE}/patrimonio/albarracin",
]

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " \
     "(KHTML, like Gecko) Version/18.0 Safari/605.1.15"

# --------------------------------------------------------------------------- #
# Fetch helpers
# --------------------------------------------------------------------------- #

def fetch(url: str, timeout: int = 30) -> tuple[str, int]:
    try:
        req = request.Request(url, headers={"User-Agent": UA})
        with request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", "replace"), r.status
    except error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", "replace")
        except Exception:
            body = ""
        return body, e.code
    except Exception:
        return "", 0


def first_match(html: str, pattern: str) -> str | None:
    m = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
    return m.group(1) if m else None


def all_matches(html: str, pattern: str) -> list[str]:
    return re.findall(pattern, html, re.DOTALL | re.IGNORECASE)


def parse_json_ld_blocks(html: str) -> list[tuple[dict | list, str | None]]:
    """Devuelve una lista de (bloque_parseado, error_o_None)."""
    blocks = re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        html,
        re.DOTALL | re.IGNORECASE,
    )
    out = []
    for raw in blocks:
        raw = raw.strip()
        try:
            out.append((json.loads(raw), None))
        except json.JSONDecodeError as e:
            out.append(({}, f"JSON inválido: {e}"))
    return out


def get_type(block: Any) -> str | list[str] | None:
    if isinstance(block, dict):
        return block.get("@type")
    return None

# --------------------------------------------------------------------------- #
# Validadores por tipo de schema.org
# --------------------------------------------------------------------------- #

ISO_WITH_TZ = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$"
)

def has_path(obj: Any, path: list[str]) -> bool:
    for key in path:
        if not isinstance(obj, dict) or key not in obj:
            return False
        obj = obj[key]
    return bool(obj)


def validate_jsonld(block: dict) -> list[str]:
    """Aplica los campos obligatorios/recomendados según Google por @type."""
    errs: list[str] = []
    t = block.get("@type")

    # Tipos compuestos (lista de tipos): validamos como el primer tipo principal.
    if isinstance(t, list):
        t_main = t[0] if t else None
    else:
        t_main = t

    if not t_main:
        errs.append("@type ausente")
        return errs

    if t_main == "NewsArticle":
        if not block.get("headline"):
            errs.append("NewsArticle sin headline")
        if not block.get("image"):
            errs.append("NewsArticle sin image (recomendado por Google)")
        if not block.get("datePublished"):
            errs.append("NewsArticle sin datePublished")
        if not has_path(block, ["publisher", "name"]):
            errs.append("NewsArticle sin publisher.name")
    elif t_main == "Article":
        if not block.get("headline"):
            errs.append("Article sin headline")
    elif t_main == "Event":
        if not block.get("name"):
            errs.append("Event sin name")
        if not block.get("startDate"):
            errs.append("Event sin startDate")
        if not block.get("location"):
            errs.append("Event sin location")
    elif t_main in ("TouristAttraction", "TouristTrip"):
        if not block.get("name"):
            errs.append(f"{t_main} sin name")
    elif t_main == "BreadcrumbList":
        items = block.get("itemListElement") or []
        if not items or not isinstance(items, list):
            errs.append("BreadcrumbList sin itemListElement")
        else:
            for i, it in enumerate(items):
                if not isinstance(it, dict):
                    continue
                if "position" not in it:
                    errs.append(f"BreadcrumbList item[{i}] sin position")
                if not it.get("name"):
                    errs.append(f"BreadcrumbList item[{i}] sin name")
                if not it.get("item"):
                    errs.append(f"BreadcrumbList item[{i}] sin item (URL)")
    elif t_main == "CollectionPage":
        if not block.get("name"):
            errs.append("CollectionPage sin name")
    elif t_main == "ItemList":
        if not block.get("itemListElement"):
            errs.append("ItemList sin itemListElement")
    elif t_main == "Organization":
        if not block.get("name"):
            errs.append("Organization sin name")
        if not block.get("url"):
            errs.append("Organization sin url")
    elif t_main == "WebSite":
        if not block.get("name"):
            errs.append("WebSite sin name")
        if not block.get("url"):
            errs.append("WebSite sin url")
    elif t_main == "VideoObject":
        if not block.get("name"):
            errs.append("VideoObject sin name")
        if not block.get("thumbnailUrl"):
            errs.append("VideoObject sin thumbnailUrl")
        upload = block.get("uploadDate")
        if not upload:
            errs.append("VideoObject sin uploadDate")
        elif not ISO_WITH_TZ.match(str(upload)):
            errs.append(
                f"VideoObject uploadDate={upload!r} no es ISO 8601 con zona horaria"
            )
    # Otros tipos (FAQPage, HowTo, Place, etc): no se validan aquí.
    return errs

# --------------------------------------------------------------------------- #
# Auditoría por página
# --------------------------------------------------------------------------- #

@dataclass
class PageReport:
    url: str
    status: int = 0
    title: str | None = None
    description: str | None = None
    canonical: str | None = None
    og_image: str | None = None
    twitter_card: str | None = None
    twitter_image: str | None = None
    hreflang_count: int = 0
    noindex: bool = False
    jsonld_types: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def audit(url: str) -> PageReport:
    rep = PageReport(url=url)
    html, status = fetch(url)
    rep.status = status

    if status == 0 or not html:
        rep.errors.append("sin respuesta del servidor")
        return rep
    if status >= 400:
        rep.errors.append(f"status HTTP {status}")
        return rep

    rep.title = first_match(html, r"<title[^>]*>(.*?)</title>")
    rep.description = first_match(html, r'<meta name="description" content="(.*?)"')
    rep.canonical = first_match(html, r'<link rel="canonical" href="(.*?)"')
    rep.og_image = first_match(html, r'<meta property="og:image" content="(.*?)"')
    rep.twitter_card = first_match(html, r'<meta name="twitter:card" content="(.*?)"')
    rep.twitter_image = first_match(html, r'<meta name="twitter:image" content="(.*?)"')
    rep.hreflang_count = len(all_matches(html, r'hrefLang="([^"]+)"'))

    robots = first_match(html, r'<meta name="robots" content="(.*?)"') or ""
    rep.noindex = "noindex" in robots.lower()

    if not rep.title:
        rep.errors.append("falta <title>")

    # Si la página es intencionalmente noindex, no exigimos canonical, hreflang
    # ni og:image: es contenido vacío que no queremos en el índice.
    if rep.noindex:
        rep.warnings.append("noindex intencional (contenido vacío)")
    else:
        if not rep.description:
            rep.warnings.append("falta meta description")
        if not rep.canonical:
            rep.errors.append("falta canonical")
        if rep.hreflang_count < 8:
            rep.warnings.append(f"hreflang={rep.hreflang_count} (esperado 8)")
        if not rep.og_image:
            rep.warnings.append("falta og:image")
        if rep.og_image and rep.twitter_card != "summary_large_image":
            rep.warnings.append(
                f"hay og:image pero twitter:card={rep.twitter_card!r} (deberia ser summary_large_image)"
            )
        if rep.og_image and not rep.twitter_image:
            rep.warnings.append("falta twitter:image aunque hay og:image")

    for idx, (block, err) in enumerate(parse_json_ld_blocks(html)):
        if err:
            rep.errors.append(f"JSON-LD[{idx}]: {err}")
            continue
        if isinstance(block, list):
            for j, sub in enumerate(block):
                t = get_type(sub) or "?"
                rep.jsonld_types.append(str(t))
                for e in validate_jsonld(sub if isinstance(sub, dict) else {}):
                    rep.errors.append(f"JSON-LD[{idx}.{j}] {e}")
        else:
            t = get_type(block) or "?"
            rep.jsonld_types.append(str(t))
            for e in validate_jsonld(block):
                rep.errors.append(f"JSON-LD[{idx}] {e}")

    return rep


# --------------------------------------------------------------------------- #
# Render del informe
# --------------------------------------------------------------------------- #

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def render(rep: PageReport) -> None:
    if rep.errors:
        icon = f"{RED}✗{RESET}"
        status_label = f"{RED}{len(rep.errors)} errores{RESET}"
    elif rep.noindex:
        icon = f"{DIM}·{RESET}"
        status_label = f"{DIM}noindex intencional{RESET}"
    elif rep.warnings:
        icon = f"{YELLOW}!{RESET}"
        status_label = f"{YELLOW}{len(rep.warnings)} avisos{RESET}"
    else:
        icon = f"{GREEN}✓{RESET}"
        status_label = f"{GREEN}OK{RESET}"

    print(f"\n{icon} {BOLD}{rep.url}{RESET}  [{rep.status}]  {status_label}")
    if not rep.title and not rep.canonical:
        return
    print(f"   title:     {(rep.title or '')[:110]}")
    print(f"   canonical: {rep.canonical}")
    print(f"   hreflang:  {rep.hreflang_count}")
    print(f"   og:image:  {'✓' if rep.og_image else '—'}   twitter:{rep.twitter_card!r}")
    print(f"   JSON-LD:   {rep.jsonld_types}")
    for e in rep.errors:
        print(f"   {RED}✗ {e}{RESET}")
    for w in rep.warnings:
        print(f"   {YELLOW}! {w}{RESET}")


def main(argv: list[str]) -> int:
    urls = argv[1:] if len(argv) > 1 else DEFAULT_URLS
    reports: list[PageReport] = []
    print(f"{BOLD}Auditoría SEO de {len(urls)} URLs…{RESET}")
    for u in urls:
        reports.append(audit(u))

    for r in reports:
        render(r)

    total = len(reports)
    errs = sum(1 for r in reports if r.errors)
    noidx = sum(1 for r in reports if not r.errors and r.noindex)
    warns = sum(1 for r in reports if not r.errors and not r.noindex and r.warnings)
    ok = sum(1 for r in reports if not r.errors and not r.noindex and not r.warnings)
    print(f"\n{BOLD}Resumen{RESET}")
    print(f"  Total:               {total}")
    print(f"  {GREEN}OK:                  {ok}{RESET}")
    print(f"  {YELLOW}Avisos menores:      {warns}{RESET}")
    print(f"  {DIM}Noindex intencional: {noidx}{RESET}")
    print(f"  {RED}Errores:             {errs}{RESET}")

    # Ranking de schemas emitidos
    from collections import Counter
    schema_counts = Counter()
    for r in reports:
        for t in r.jsonld_types:
            schema_counts[t] += 1
    print(f"\n{BOLD}Schemas emitidos (recuento){RESET}")
    for t, n in schema_counts.most_common():
        print(f"  {t:20s} {n}")

    return 0 if errs == 0 else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
