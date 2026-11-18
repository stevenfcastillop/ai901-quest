"""Valida los JSON de módulos y genera js/data.js para el juego.

Uso:  python tools/validar.py            -> valida todo y genera data.js
      python tools/validar.py m03.json   -> valida solo ese archivo (no genera)
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MODS = ROOT / "data" / "modules"
OBJS = {"A1", "A2", "A3", "B1", "B2", "B3", "B4"}
BLOCKS = {"h", "p", "list", "table", "code", "tip", "example"}
KINDS = {"teoria", "laboratorio", "evaluacion", "resumen"}
MARK = re.compile(r"\{\{([^{}|]+)\|([^{}]+)\}\}")


def check_text(s, where, errs):
    if not isinstance(s, str) or not s.strip():
        errs.append(f"{where}: texto vacío")
        return
    if s.count("{{") != s.count("}}"):
        errs.append(f"{where}: marcas {{{{ }}}} desbalanceadas")
    for m in re.finditer(r"\{\{([^}]*)\}\}", s):
        if "|" not in m.group(1):
            errs.append(f"{where}: marca sin '|': {m.group(0)}")


def check_q(q, where, errs):
    t = q.get("type")
    check_text(q.get("q"), where + ".q", errs)
    check_text(q.get("explain"), where + ".explain", errs)
    if q.get("obj") not in OBJS:
        errs.append(f"{where}: obj inválido {q.get('obj')}")
    if t == "mc":
        o = q.get("options", [])
        if not (2 <= len(o) <= 5) or not isinstance(q.get("answer"), int) or not 0 <= q["answer"] < len(o):
            errs.append(f"{where}: mc mal formada")
    elif t == "multi":
        o = q.get("options", [])
        a = q.get("answers", [])
        if len(o) < 3 or not a or any((not isinstance(i, int)) or i >= len(o) for i in a):
            errs.append(f"{where}: multi mal formada")
    elif t == "tf":
        if not isinstance(q.get("answer"), bool):
            errs.append(f"{where}: tf necesita answer booleano")
    elif t == "match":
        p = q.get("pairs", [])
        if len(p) < 2 or any(len(x) != 2 for x in p):
            errs.append(f"{where}: match mal formada")
    elif t == "order":
        if len(q.get("items", [])) < 3:
            errs.append(f"{where}: order necesita >=3 items")
    else:
        errs.append(f"{where}: tipo desconocido {t}")


def validate(path):
    errs = []
    try:
        m = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa
        return None, [f"{path.name}: JSON inválido: {e}"]
    for k in ("id", "path", "order", "title", "titleEn", "url", "units", "boss", "glossary"):
        if k not in m:
            errs.append(f"{path.name}: falta '{k}'")
    for i, u in enumerate(m.get("units", [])):
        w = f"{m.get('id')}.u{i+1}"
        if u.get("kind") not in KINDS:
            errs.append(f"{w}: kind inválido")
        if not u.get("theory"):
            errs.append(f"{w}: sin teoría")
        for j, b in enumerate(u.get("theory", [])):
            if b.get("type") not in BLOCKS:
                errs.append(f"{w}.t{j}: bloque desconocido {b.get('type')}")
            elif b["type"] == "list":
                for it in b.get("items", []):
                    check_text(it, f"{w}.t{j}", errs)
            elif b["type"] == "table":
                if not b.get("head") or not b.get("rows"):
                    errs.append(f"{w}.t{j}: tabla vacía")
            else:
                check_text(b.get("text"), f"{w}.t{j}", errs)
        ex = u.get("exercises", [])
        if len(ex) < 2:
            errs.append(f"{w}: menos de 2 ejercicios")
        for j, q in enumerate(ex):
            check_q(q, f"{w}.e{j+1}", errs)
    if len(m.get("boss", [])) < 8:
        errs.append(f"{m.get('id')}: boss con menos de 8 preguntas")
    for j, q in enumerate(m.get("boss", [])):
        check_q(q, f"{m.get('id')}.boss{j+1}", errs)
    for g in m.get("glossary", []):
        if not all(g.get(k) for k in ("es", "en", "def")):
            errs.append(f"{m.get('id')}: glosario incompleto {g}")
    return m, errs


def main():
    files = [MODS / a for a in sys.argv[1:]] or sorted(MODS.glob("m*.json"))
    mods, total = [], 0
    for f in files:
        m, errs = validate(f)
        nq = 0
        if m:
            nq = sum(len(u.get("exercises", [])) for u in m.get("units", [])) + len(m.get("boss", []))
            mods.append(m)
        total += nq
        print(f"{f.name}: {'OK' if not errs else str(len(errs)) + ' errores'}  ({nq} preguntas)")
        for e in errs[:40]:
            print("   -", e)
        if errs:
            total = -10**9
    if sys.argv[1:]:
        return
    if total < 0:
        print("Hay errores: no se genera data.js")
        sys.exit(1)
    mods.sort(key=lambda m: (m["path"], m["order"]))
    out = ROOT / "js" / "data.js"
    out.parent.mkdir(exist_ok=True)
    out.write_text("window.AI901_DATA = " + json.dumps(mods, ensure_ascii=False) + ";\n", encoding="utf-8")
    print(f"Generado {out} con {len(mods)} módulos y {total} preguntas")


if __name__ == "__main__":
    main()
