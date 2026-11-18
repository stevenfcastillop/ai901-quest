/* AI-901 Quest — motor del juego (sin dependencias). */
(function () {
  "use strict";

  const DATA = (window.AI901_DATA || []).slice().sort((a, b) => a.path - b.path || a.order - b.order);
  const SAVE_KEY = "ai901quest.v1";

  const ICONS = {
    m01: "🧠", m02: "✨", m03: "📝", m04: "🗣️", m05: "👁️", m06: "📄", m07: "📚",
    m08: "☁️", m09: "🤖", m10: "🔤", m11: "🎙️", m12: "🖼️", m13: "🗂️", m14: "🔎", m15: "📞",
  };
  const BOSSES = {
    m01: ["Gólem del Sesgo", "🗿"], m02: ["Alucinador Errante", "👻"], m03: ["Hidra de Tokens", "🐉"],
    m04: ["Banshee del Ruido", "🦇"], m05: ["Cíclope Borroso", "👹"], m06: ["Escriba Caótico", "📜"],
    m07: ["Bibliotecario Olvidadizo", "🦉"], m08: ["Señor de las Suscripciones", "🧙"],
    m09: ["Agente Rebelde", "🦾"], m10: ["Kraken del Sentimiento", "🐙"], m11: ["Eco Infinito", "🌀"],
    m12: ["Mimo de Píxeles", "🎭"], m13: ["Archivero Sombrío", "🗃️"], m14: ["Oráculo sin Fuentes", "🔮"],
    m15: ["Operador Fantasma", "☎️"],
  };
  const REGIONS = {
    1: { name: "Reino de los Conceptos", en: "AI concepts for developers and technology professionals", cls: "r1" },
    2: { name: "Ciudadela Foundry", en: "Get started with AI applications and agents on Azure", cls: "r2" },
  };
  const OBJ = {
    A1: { n: "IA responsable", g: "A" },
    A2: { n: "Componentes y configuración de modelos", g: "A" },
    A3: { n: "Cargas de trabajo de IA", g: "A" },
    B1: { n: "Apps y agentes generativos con Foundry", g: "B" },
    B2: { n: "Texto y voz con Foundry", g: "B" },
    B3: { n: "Visión y generación de imágenes", g: "B" },
    B4: { n: "Extracción de información (Content Understanding)", g: "B" },
  };
  const GROUPS = {
    A: { n: "Identificar conceptos y capacidades de IA", w: "40–45%", share: 0.42 },
    B: { n: "Implementar soluciones de IA con Microsoft Foundry", w: "55–60%", share: 0.58 },
  };
  const AVATARS = ["🧙", "🧝", "🦸", "🥷", "🧑‍🚀", "🤖", "🐱", "🦊"];
  const SHOP = [
    { id: "potion", ico: "🧪", n: "Poción", d: "Recupera 1 corazón en una batalla.", price: 30 },
    { id: "fifty", ico: "🎯", n: "Pergamino 50/50", d: "Elimina la mitad de las opciones incorrectas de una pregunta.", price: 20 },
    { id: "shield", ico: "🛡️", n: "Escudo", d: "Bloquea el daño de un fallo en una batalla.", price: 40 },
  ];

  /* ---------------- index ---------------- */
  const MOD = {}, UNIT = {}, Q = {};
  DATA.forEach((m) => {
    MOD[m.id] = m;
    m.units.forEach((u, ui) => {
      u._mod = m.id; u._n = ui + 1;
      UNIT[u.id] = u;
      (u.exercises || []).forEach((q, i) => { const k = u.id + "#" + i; q._key = k; q._mod = m.id; q._unit = u.id; Q[k] = q; });
    });
    (m.boss || []).forEach((q, i) => { const k = m.id + "#b" + i; q._key = k; q._mod = m.id; Q[k] = q; });
  });
  const ALLQ = Object.values(Q);

  /* ---------------- state ---------------- */
  const fresh = () => ({
    v: 1, name: "", avatar: "🧙", xp: 0, coins: 20, items: { potion: 1, fifty: 1, shield: 0 },
    units: {}, boss: {}, answered: {}, review: {}, exams: [], streakBest: 0,
    settings: { en: true, free: false },
  });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { /* almacenamiento no disponible */ }
    return fresh();
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } hud(); }

  const level = () => Math.floor(Math.sqrt(S.xp / 60)) + 1;
  const xpFor = (l) => (l - 1) * (l - 1) * 60;
  const maxHearts = () => Math.min(3 + Math.floor((level() - 1) / 3), 6);

  function gain(xp, coins, why) {
    const before = level();
    S.xp += xp; S.coins += coins || 0;
    save();
    if (level() > before) toast(`⭐ ¡Subiste al nivel ${level()}!` + (maxHearts() > 3 ? ` Corazones máx.: ${maxHearts()}` : ""));
    else if (why) toast(why);
  }

  function record(q, ok) {
    const a = S.answered[q._key] || (S.answered[q._key] = { ok: 0, ko: 0 });
    if (ok) a.ok++; else a.ko++;
    if (!ok) S.review[q._key] = { streak: 0, t: Date.now() };
  }

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmt(s) {
    let h = esc(s == null ? "" : s);
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\{\{([^{}|]+)\|([^{}]+)\}\}/g, '<span class="term">$1<span class="en" title="Término en inglés">$2</span></span>');
    return h;
  }
  const plain = (s) => String(s || "").replace(/\{\{([^{}|]+)\|([^{}]+)\}\}/g, "$1 ($2)").replace(/\*\*|`/g, "");
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function h(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

  function unitDone(uid) { return !!(S.units[uid] && S.units[uid].done); }
  function modProgress(m) {
    const d = m.units.filter((u) => unitDone(u.id)).length;
    const total = m.units.length + 1;
    return { done: d + (S.boss[m.id] && S.boss[m.id].won ? 1 : 0), total, units: d };
  }
  function unlocked(m) {
    if (S.settings.free || m.order === 1) return true;
    const prev = DATA.find((x) => x.path === m.path && x.order === m.order - 1);
    return !prev || !!(S.boss[prev.id] && S.boss[prev.id].won);
  }

  /* ---------------- HUD / routing ---------------- */
  function hud() {
    const l = level(), cur = xpFor(l), nxt = xpFor(l + 1);
    const pct = Math.round(((S.xp - cur) / (nxt - cur)) * 100);
    $("#hud").innerHTML =
      `<span class="chip">${S.avatar} ${esc(S.name || "Aventurero")}</span>` +
      `<span class="chip">Nv ${l}<span class="xpbar"><i style="width:${pct}%"></i></span></span>` +
      `<span class="chip">🪙 ${S.coins}</span>` +
      `<span class="chip" title="Pociones / 50-50 / Escudos">🧪${S.items.potion} 🎯${S.items.fifty} 🛡️${S.items.shield}</span>`;
    const n = Object.keys(S.review).filter((k) => Q[k]).length;
    const b = $("#reviewBadge"); b.hidden = !n; b.textContent = n;
    document.body.classList.toggle("no-en", !S.settings.en);
  }

  let cleanup = null;
  function go(view, arg) {
    if (cleanup) { cleanup(); cleanup = null; }
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.go === view));
    window.scrollTo(0, 0);
    if (!S.name && view !== "title") view = "title";
    $("#topbar").hidden = view === "title";
    (VIEWS[view] || VIEWS.map)(arg);
    hud();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) { e.preventDefault(); go(b.dataset.go, b.dataset.arg); }
  });

  /* ---------------- question widget ---------------- */
  // opts: {onAnswer(ok), allowFifty, label, nextLabel, onNext}
  function questionUI(q, opts) {
    const box = h(`<div class="qbox"></div>`);
    const objName = OBJ[q.obj] ? OBJ[q.obj].n : "";
    box.innerHTML = `<div class="qhead">${opts.label || ""}<span class="tag" title="Área de la guía de estudio">${q.obj} · ${esc(objName)}</span>
      ${q.type === "multi" ? '<span class="tag">Selección múltiple</span>' : ""}</div>
      <div class="qtext">${fmt(q.q)}</div><div class="body"></div><div class="fb"></div><div class="qactions"></div>`;
    const body = $(".body", box), acts = $(".qactions", box), fb = $(".fb", box);
    let answered = false, getResult, revealFn;
    const check = h(`<button class="btn">Comprobar</button>`);

    if (q.type === "mc" || q.type === "multi" || q.type === "tf") {
      let items;
      if (q.type === "tf") items = [{ t: "Verdadero", v: true }, { t: "Falso", v: false }];
      else items = shuffle(q.options.map((t, i) => ({ t, i })));
      const correct = (it) => (q.type === "tf" ? it.v === q.answer : q.type === "mc" ? it.i === q.answer : q.answers.includes(it.i));
      const wrap = h(`<div class="opts"></div>`);
      const sel = new Set();
      items.forEach((it, idx) => {
        const b = h(`<button class="opt"><span class="k">${String.fromCharCode(65 + idx)}</span><span>${fmt(it.t)}</span></button>`);
        it.el = b;
        b.onclick = () => {
          if (answered || b.classList.contains("gone")) return;
          if (q.type === "multi") { sel.has(it) ? sel.delete(it) : sel.add(it); b.classList.toggle("sel"); }
          else { sel.clear(); sel.add(it); items.forEach((x) => x.el.classList.toggle("sel", x === it)); }
          check.disabled = !sel.size;
        };
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      check.disabled = true;
      getResult = () => {
        if (q.type === "multi") return items.every((it) => correct(it) === sel.has(it));
        return correct([...sel][0]);
      };
      revealFn = () => items.forEach((it) => { if (correct(it)) it.el.classList.add("ok"); else if (sel.has(it)) it.el.classList.add("ko"); it.el.disabled = true; });
      if (opts.allowFifty && q.type !== "tf") {
        opts.fifty = () => {
          const wrong = shuffle(items.filter((it) => !correct(it) && !it.el.classList.contains("gone")));
          wrong.slice(0, Math.max(1, Math.floor(wrong.length / 2))).forEach((it) => { it.el.classList.add("gone"); sel.delete(it); it.el.classList.remove("sel"); });
          check.disabled = !sel.size;
        };
      }
    } else if (q.type === "match") {
      const rights = shuffle(q.pairs.map((p) => p[1]));
      const rows = q.pairs.map((p) => {
        const r = h(`<div class="match-row"><div>${fmt(p[0])}</div><select><option value="">— Elige —</option>${rights.map((x, i) => `<option value="${i}">${esc(plain(x))}</option>`).join("")}</select></div>`);
        body.appendChild(r);
        return { r, p, s: $("select", r) };
      });
      body.classList.add("opts");
      rows.forEach((x) => (x.s.onchange = () => (check.disabled = rows.some((y) => !y.s.value))));
      check.disabled = true;
      const ok = (x) => x.s.value !== "" && rights[+x.s.value] === x.p[1];
      getResult = () => rows.every(ok);
      revealFn = () => rows.forEach((x) => {
        x.r.classList.add(ok(x) ? "ok" : "ko"); x.s.disabled = true;
        if (!ok(x)) x.r.insertAdjacentHTML("beforeend", `<div class="muted" style="grid-column:1/-1">✔ ${fmt(x.p[1])}</div>`);
      });
    } else if (q.type === "order") {
      let cur = shuffle(q.items);
      if (cur.every((x, i) => x === q.items[i]) && cur.length > 1) cur.push(cur.shift());
      const list = h(`<div class="opts"></div>`);
      const draw = (reveal) => {
        list.innerHTML = "";
        cur.forEach((t, i) => {
          const r = h(`<div class="order-item"><span class="k tag">${i + 1}</span><span class="t">${fmt(t)}</span>
            <button aria-label="Subir" ${i === 0 || reveal ? "disabled" : ""}>▲</button><button aria-label="Bajar" ${i === cur.length - 1 || reveal ? "disabled" : ""}>▼</button></div>`);
          const [up, dn] = r.querySelectorAll("button");
          up.onclick = () => { [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; draw(); };
          dn.onclick = () => { [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]]; draw(); };
          if (reveal) r.classList.add(t === q.items[i] ? "ok" : "ko");
          list.appendChild(r);
        });
      };
      draw();
      body.appendChild(h(`<p class="muted" style="margin:0 0 8px">Ordena con ▲ ▼</p>`));
      body.appendChild(list);
      getResult = () => cur.every((x, i) => x === q.items[i]);
      revealFn = () => {
        draw(true);
        if (!getResult()) list.insertAdjacentHTML("afterend", `<div class="muted" style="margin-top:8px"><b>Orden correcto:</b><ol>${q.items.map((x) => `<li>${fmt(x)}</li>`).join("")}</ol></div>`);
      };
    }

    check.onclick = () => {
      if (answered) return;
      answered = true;
      const ok = getResult();
      check.remove();
      if (opts.silent) {
        body.querySelectorAll("button, select").forEach((e) => (e.disabled = true));
        fb.innerHTML = `<p class="muted">Respuesta registrada.</p>`;
      } else {
        revealFn();
        fb.innerHTML = `<div class="feedback ${ok ? "ok" : "ko"}"><h4>${ok ? "✅ ¡Correcto!" : "❌ Incorrecto"}</h4>${fmt(q.explain)}</div>`;
      }
      const next = h(`<button class="btn">${opts.nextLabel || "Continuar ➜"}</button>`);
      next.onclick = () => opts.onNext && opts.onNext(ok);
      acts.appendChild(next);
      opts.onAnswer && opts.onAnswer(ok);
      next.focus();
    };
    acts.appendChild(check);
    box.useFifty = () => { if (!answered && opts.fifty) { opts.fifty(); return true; } return false; };
    box.canFifty = () => !answered && !!opts.fifty;
    return box;
  }

  // Ejecuta una serie de preguntas. cfg: {questions, title, back, onFinish(results), xpEach, coinsEach}
  function quizRun(cfg) {
    const qs = cfg.questions, res = [];
    let i = 0;
    const step = () => {
      app.innerHTML = "";
      const wrap = h(`<div></div>`);
      if (cfg.back) wrap.appendChild(h(`<button class="back" data-go="${cfg.back[0]}" data-arg="${cfg.back[1] || ""}">← ${esc(cfg.back[2] || "Volver")}</button>`));
      wrap.appendChild(h(`<h2 style="margin:0 0 10px">${fmt(cfg.title)}</h2>`));
      const dots = h(`<div class="progress-dots"></div>`);
      qs.forEach((_, k) => dots.appendChild(h(`<i class="${k < i ? (res[k] ? "ok" : "ko") : k === i ? "cur" : ""}"></i>`)));
      wrap.appendChild(dots);
      const panel = h(`<div class="panel"></div>`);
      const q = qs[i];
      const ui = questionUI(q, {
        label: `<span class="tag">Pregunta ${i + 1}/${qs.length}</span>`,
        nextLabel: i === qs.length - 1 ? "Terminar ➜" : "Siguiente ➜",
        onAnswer: (ok) => { res[i] = ok; cfg.onAnswer ? cfg.onAnswer(q, ok) : record(q, ok); if (ok && cfg.xpEach) gain(cfg.xpEach, cfg.coinsEach || 0); save(); },
        onNext: () => { i++; if (i < qs.length) step(); else cfg.onFinish(res); },
      });
      panel.appendChild(ui);
      wrap.appendChild(panel);
      app.appendChild(wrap);
    };
    step();
  }

  /* ---------------- views ---------------- */
  const VIEWS = {};

  VIEWS.title = () => {
    let av = S.avatar;
    app.innerHTML = `<div class="title-screen">
      <div style="font-size:64px">🏰⚔️🐉</div>
      <h1>AI-901 QUEST</h1>
      <p class="sub">Recorre los <b>15 módulos</b> de las 2 rutas de aprendizaje de Microsoft para el examen
      <b>AI-901: Microsoft Azure AI Fundamentals</b>. Lee la teoría de cada unidad, supera sus desafíos y derrota al guardián de cada zona.</p>
      <div class="panel" style="max-width:520px;margin:0 auto">
        <label for="nm"><b>Nombre de tu héroe</b></label><br>
        <input id="nm" type="text" maxlength="20" value="${esc(S.name)}" placeholder="Ej.: Ada" style="width:100%;margin:8px 0">
        <div><b>Elige tu avatar</b></div>
        <div class="avatars">${AVATARS.map((a) => `<button data-av="${a}" class="${a === av ? "on" : ""}">${a}</button>`).join("")}</div>
        <button class="btn" id="start">¡Comenzar la aventura!</button>
      </div>
      ${DATA.length < 15 ? `<p class="muted">Contenido cargado: ${DATA.length} de 15 módulos.</p>` : ""}
    </div>`;
    app.querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => { av = b.dataset.av; app.querySelectorAll("[data-av]").forEach((x) => x.classList.toggle("on", x === b)); }));
    $("#start").onclick = () => {
      const n = $("#nm").value.trim();
      if (!n) { toast("Escribe un nombre para tu héroe"); $("#nm").focus(); return; }
      S.name = n; S.avatar = av; save(); go("map");
    };
  };

  function regionSVG(path) {
    const mods = DATA.filter((m) => m.path === path);
    const W = 420, stepY = 128, H = 80 + mods.length * stepY;
    const pts = mods.map((m, i) => ({ m, x: i % 2 ? W * 0.66 : W * 0.34, y: 70 + i * stepY }));
    let d = "";
    pts.forEach((p, i) => { d += i ? ` S ${p.x + (i % 2 ? 60 : -60)} ${p.y - stepY / 2} ${p.x} ${p.y}` : `M ${p.x} ${p.y}`; });
    const deco = path === 1 ? ["🌲", "🌳", "🍄", "🌲", "⛰️", "🌳", "🌲", "🌾"] : ["🏯", "⚙️", "🗼", "🏭", "⚙️", "🏰", "🛰️", "🏯", "⚙️"];
    let dec = "";
    for (let i = 0; i < mods.length + 1; i++) dec += `<text x="${i % 2 ? 40 : W - 40}" y="${60 + i * stepY}" font-size="28" opacity=".35" text-anchor="middle">${deco[i % deco.length]}</text>`;
    const nodes = pts.map((p) => {
      const m = p.m, pr = modProgress(m), lock = !unlocked(m), won = S.boss[m.id] && S.boss[m.id].won;
      const frac = pr.done / pr.total, R = 40, C = 2 * Math.PI * (R + 7);
      const col = won ? "var(--gold)" : path === 1 ? "var(--r1)" : "var(--r2)";
      return `<g class="node ${lock ? "locked" : ""}" tabindex="0" role="button" data-mod="${m.id}" aria-label="Módulo ${m.order}: ${esc(m.title)}">
        <circle cx="${p.x}" cy="${p.y}" r="${R + 7}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="6"/>
        <circle cx="${p.x}" cy="${p.y}" r="${R + 7}" fill="none" stroke="var(--green)" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${C * frac} ${C}" transform="rotate(-90 ${p.x} ${p.y})"/>
        <circle class="base" cx="${p.x}" cy="${p.y}" r="${R}" fill="var(--panel2)" stroke="${col}"/>
        <text class="ico" x="${p.x}" y="${p.y + 2}">${lock ? "🔒" : ICONS[m.id] || "⭐"}</text>
        ${won ? `<text x="${p.x + 32}" y="${p.y - 30}" font-size="22">👑</text>` : ""}
        <text class="lbl" x="${p.x}" y="${p.y + R + 26}">${m.order}. ${esc(shortTitle(m.title))}</text>
      </g>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${REGIONS[path].name}">
      ${dec}<path d="${d}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="16" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#5a5f8a" stroke-width="8" stroke-dasharray="2 14" stroke-linecap="round"/>${nodes}</svg>`;
  }
  function shortTitle(t) {
    const s = t.replace(/^(Introducción a( los| la| el)?|Primeros pasos con( la| el)?|Comenzar con|Introducción al)\s+/i, "");
    const c = s.charAt(0).toUpperCase() + s.slice(1);
    return c.length > 24 ? c.slice(0, 22).trim() + "…" : c;
  }

  VIEWS.map = () => {
    const doneMods = DATA.filter((m) => S.boss[m.id] && S.boss[m.id].won).length;
    app.innerHTML = `<div class="map-head">
        <div class="hero-card"><div class="av">${S.avatar}</div><div><h2 style="margin:0">${esc(S.name)}</h2>
        <div class="muted">Nivel ${level()} · ${doneMods}/${DATA.length} guardianes derrotados</div></div></div>
        <div class="spacer"></div>
        <button class="btn sec" data-go="review">⛩️ Repaso de errores</button>
        <button class="btn" data-go="exam">🏰 Simulacro de examen</button>
      </div>
      <div class="regions">${[1, 2].map((p) => `<section class="region ${REGIONS[p].cls}">
        <header>RUTA ${p} · ${REGIONS[p].name}<small>${esc(REGIONS[p].en)}</small></header>${regionSVG(p)}</section>`).join("")}</div>
      ${S.settings.free ? "" : `<p class="muted">🔒 Cada zona se desbloquea al derrotar al guardián de la anterior. Puedes activar el <a href="#" data-go="settings">modo libre</a> en Ajustes.</p>`}`;
    app.querySelectorAll(".node").forEach((n) => {
      const open = () => { const m = MOD[n.dataset.mod]; if (!unlocked(m)) { toast("🔒 Derrota primero al guardián de la zona anterior"); return; } go("zone", m.id); };
      n.addEventListener("click", open);
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  };

  const KIND = { teoria: "📘 Teoría", laboratorio: "🧪 Laboratorio", evaluacion: "📝 Evaluación", resumen: "🏁 Resumen" };

  VIEWS.zone = (mid) => {
    const m = MOD[mid]; if (!m) return go("map");
    const pr = modProgress(m), bs = S.boss[m.id] || {};
    const boss = BOSSES[m.id] || ["Guardián", "👾"];
    const allUnits = pr.units === m.units.length;
    app.innerHTML = `<button class="back" data-go="map">← Mapa</button>
      <div class="panel"><div class="zone-hero"><div class="big">${ICONS[m.id] || "⭐"}</div>
        <div style="flex:1;min-width:240px"><div class="muted">Ruta ${m.path} · Módulo ${m.order}</div>
        <h2>${esc(m.title)}</h2><div class="muted">${esc(m.titleEn)}</div></div>
        <div style="min-width:160px"><div class="bar"><i style="width:${(pr.done / pr.total) * 100}%"></i></div>
        <small class="muted">${pr.done}/${pr.total} completado</small></div></div>
        ${m.summary ? `<p>${fmt(m.summary)}</p>` : ""}
        ${m.objectives && m.objectives.length ? `<details><summary><b>Objetivos de aprendizaje</b></summary><ul>${m.objectives.map((o) => `<li>${fmt(o)}</li>`).join("")}</ul></details>` : ""}
        <p class="muted" style="margin-bottom:0">📎 Módulo original: <a href="${esc(m.url)}" target="_blank" rel="noopener">Microsoft Learn</a></p>
      </div>
      <div class="units">${m.units.map((u) => {
        const st = S.units[u.id] || {};
        return `<button class="unit-row ${st.done ? "done" : ""}" data-go="unit" data-arg="${u.id}">
          <span class="n">${st.done ? "✓" : u._n}</span><span class="t"><b>${esc(u.title)}</b><small>${esc(u.titleEn || "")} · <span class="kind">${KIND[u.kind] || ""}</span></small></span>
          <span class="muted">${st.done ? `${st.correct}/${st.total} ✔` : st.read ? "Leída" : ""}</span></button>`;
      }).join("")}
        <button class="unit-row boss-row" id="bossBtn"><span class="n">☠</span>
          <span class="t"><b>Guardián: ${boss[1]} ${esc(boss[0])}</b><small>${(m.boss || []).length} preguntas de todo el módulo · ${bs.won ? `👑 Derrotado (mejor: ${bs.best}/${(m.boss || []).length})` : allUnits ? "¡Listo para el combate!" : "Recomendado: completa antes todas las unidades"}</small></span>
          <span>⚔️</span></button>
      </div>`;
    $("#bossBtn").onclick = () => {
      if (!allUnits && !confirm("Aún no has completado todas las unidades. ¿Quieres enfrentarte al guardián igualmente?")) return;
      go("battle", m.id);
    };
  };

  function theoryHTML(blocks) {
    return blocks.map((b) => {
      switch (b.type) {
        case "h": return `<h3>${fmt(b.text)}</h3>`;
        case "p": return `<p>${fmt(b.text)}</p>`;
        case "list": return `<ul>${(b.items || []).map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>`;
        case "table": return `<table><thead><tr>${b.head.map((x) => `<th>${fmt(x)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((x) => `<td>${fmt(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
        case "code": return `<pre><code>${esc(b.text)}</code></pre>`;
        case "tip": return `<div class="callout"><b class="k">💡 Clave para el examen</b>${fmt(b.text)}</div>`;
        case "example": return `<div class="callout ex"><b class="k">🔍 Ejemplo</b>${fmt(b.text)}</div>`;
        default: return "";
      }
    }).join("");
  }

  VIEWS.unit = (uid) => {
    const u = UNIT[uid]; if (!u) return go("map");
    const m = MOD[u._mod], idx = m.units.indexOf(u);
    const prev = m.units[idx - 1], next = m.units[idx + 1];
    const st = S.units[uid] || {};
    app.innerHTML = `<button class="back" data-go="zone" data-arg="${m.id}">← ${esc(m.title)}</button>
      <article class="panel theory">
        <div class="muted">Módulo ${m.order} · Unidad ${u._n}/${m.units.length} · <span class="kind">${KIND[u.kind] || ""}</span></div>
        <h2>${esc(u.title)}</h2><div class="muted">${esc(u.titleEn || "")}</div>
        ${theoryHTML(u.theory || [])}
        <p class="muted" style="margin-top:24px">📎 Unidad original: <a href="${esc(u.url || m.url)}" target="_blank" rel="noopener">Microsoft Learn</a></p>
      </article>
      <div class="row" style="margin-top:16px">
        ${prev ? `<button class="btn sec" data-go="unit" data-arg="${prev.id}">← Anterior</button>` : ""}
        <div class="spacer"></div>
        <button class="btn" id="challenge">⚔️ ${st.done ? "Repetir desafío" : "Ir al desafío"} (${(u.exercises || []).length})</button>
        ${next && st.done ? `<button class="btn sec" data-go="unit" data-arg="${next.id}">Siguiente →</button>` : ""}
      </div>`;
    if (!st.read) { S.units[uid] = Object.assign(st, { read: true }); gain(10, 0, "📘 +10 XP por estudiar la unidad"); }
    $("#challenge").onclick = () => {
      const first = !st.done;
      quizRun({
        questions: u.exercises || [], title: `Desafío · ${u.title}`, back: ["unit", u.id, "Volver a la teoría"],
        xpEach: first ? 5 : 2, coinsEach: first ? 3 : 1,
        onFinish: (res) => {
          const c = res.filter(Boolean).length;
          const prevBest = st.correct || 0;
          S.units[uid] = Object.assign(S.units[uid] || {}, { read: true, done: true, correct: Math.max(c, prevBest), total: res.length });
          save();
          app.innerHTML = `<div class="panel" style="text-align:center;max-width:560px;margin:0 auto">
            <div style="font-size:54px">${c === res.length ? "🏆" : c >= res.length / 2 ? "🎉" : "💪"}</div>
            <h2>Desafío completado</h2><p class="score-big ${c / res.length >= 0.7 ? "pass" : "fail"}">${c}/${res.length}</p>
            ${c < res.length ? `<p class="muted">Las preguntas falladas se han enviado al ⛩️ Templo del Repaso.</p>` : ""}
            <div class="row" style="justify-content:center">
              <button class="btn sec" data-go="unit" data-arg="${u.id}">Releer teoría</button>
              ${next ? `<button class="btn" data-go="unit" data-arg="${next.id}">Siguiente unidad →</button>` : `<button class="btn" data-go="zone" data-arg="${m.id}">Ir al guardián ☠</button>`}
            </div></div>`;
        },
      });
    };
  };

  /* ---------------- boss battle ---------------- */
  VIEWS.battle = (mid) => {
    const m = MOD[mid]; if (!m) return go("map");
    const qs = shuffle(m.boss || []);
    const [bname, bico] = BOSSES[m.id] || ["Guardián", "👾"];
    const need = Math.ceil(qs.length * 0.7);
    let hp = need, hearts = maxHearts(), i = 0, correct = 0, shield = false, streak = 0;
    const draw = (msg) => {
      app.innerHTML = `<button class="back" data-go="zone" data-arg="${m.id}">← Huir del combate</button>
        <div class="arena">
          <div class="fighter" id="heroF"><div class="sprite">${S.avatar}</div><div class="name">${esc(S.name)}</div>
            <div class="hearts">${"❤️".repeat(hearts)}${"🖤".repeat(Math.max(0, maxHearts() - hearts))}${shield ? " 🛡️" : ""}</div></div>
          <div class="vs">VS</div>
          <div class="fighter" id="bossF"><div class="sprite">${bico}</div><div class="name">${esc(bname)}</div>
            <div class="hp"><i style="width:${(hp / need) * 100}%"></i></div><small class="muted">${hp}/${need} PV</small></div>
        </div>
        ${msg ? `<p style="text-align:center;font-weight:800">${msg}</p>` : ""}
        <div class="row powerups" style="margin-bottom:12px">
          <button class="btn sec" id="pPotion" ${S.items.potion && hearts < maxHearts() ? "" : "disabled"}>🧪 Poción (${S.items.potion})</button>
          <button class="btn sec" id="pFifty" ${S.items.fifty ? "" : "disabled"}>🎯 50/50 (${S.items.fifty})</button>
          <button class="btn sec" id="pShield" ${S.items.shield && !shield ? "" : "disabled"}>🛡️ Escudo (${S.items.shield})</button>
          <span class="spacer"></span><span class="tag">Pregunta ${i + 1}/${qs.length}</span>
        </div>
        <div class="panel" id="qp"></div>`;
      const q = qs[i];
      const ui = questionUI(q, {
        allowFifty: true,
        nextLabel: "Continuar ➜",
        onAnswer: (ok) => {
          record(q, ok);
          if (ok) {
            correct++; hp--; streak++; S.coins += 2;
            $("#bossF .sprite").classList.add("hit");
          } else {
            streak = 0;
            if (shield) { shield = false; } else { hearts--; }
            $("#heroF .sprite").classList.add("shake");
          }
          save();
        },
        onNext: () => {
          i++;
          if (hp <= 0) return end(true);
          if (hearts <= 0 || i >= qs.length) return end(false);
          draw(streak >= 3 ? `🔥 ¡Racha de ${streak}!` : "");
        },
      });
      $("#qp").appendChild(ui);
      $("#pPotion").onclick = () => { if (S.items.potion && hearts < maxHearts()) { S.items.potion--; hearts++; save(); refreshHearts(); toast("🧪 +1 corazón"); } };
      $("#pShield").onclick = () => { if (S.items.shield && !shield) { S.items.shield--; shield = true; save(); refreshHearts(); toast("🛡️ Escudo activo"); } };
      $("#pFifty").onclick = () => { if (S.items.fifty && ui.canFifty() && ui.useFifty()) { S.items.fifty--; save(); $("#pFifty").disabled = true; } else toast("No se puede usar en esta pregunta"); };
      function refreshHearts() {
        $("#heroF .hearts").textContent = "❤️".repeat(hearts) + "🖤".repeat(Math.max(0, maxHearts() - hearts)) + (shield ? " 🛡️" : "");
        $("#pPotion").disabled = !(S.items.potion && hearts < maxHearts());
        $("#pPotion").textContent = `🧪 Poción (${S.items.potion})`;
        $("#pShield").disabled = !(S.items.shield && !shield);
        $("#pShield").textContent = `🛡️ Escudo (${S.items.shield})`;
      }
    };
    const end = (won) => {
      const prev = S.boss[m.id] || {};
      const first = won && !prev.won;
      S.boss[m.id] = { won: !!(prev.won || won), best: Math.max(prev.best || 0, correct) };
      save();
      if (won) gain(first ? 60 : 15, first ? 25 : 5);
      const nextMod = DATA.find((x) => x.path === m.path && x.order === m.order + 1);
      app.innerHTML = `<div class="panel" style="text-align:center;max-width:600px;margin:0 auto">
        <div style="font-size:70px">${won ? "👑" : "💀"}</div>
        <h2>${won ? `¡Has derrotado a ${esc(bname)}!` : `${esc(bname)} te ha vencido…`}</h2>
        <p class="score-big ${won ? "pass" : "fail"}">${correct}/${qs.length}</p>
        <p class="muted">${won ? (first ? "+60 XP · +25 🪙" + (nextMod ? " · ¡Nueva zona desbloqueada!" : "") : "+15 XP · +5 🪙") : "Repasa la teoría y los errores en el Templo del Repaso, y vuelve a intentarlo."}</p>
        <div class="row" style="justify-content:center">
          <button class="btn sec" data-go="zone" data-arg="${m.id}">Volver a la zona</button>
          ${won ? (nextMod ? `<button class="btn" data-go="zone" data-arg="${nextMod.id}">Siguiente zona →</button>` : `<button class="btn" data-go="map">Al mapa</button>`) : `<button class="btn" data-go="battle" data-arg="${m.id}">Reintentar ⚔️</button>`}
        </div></div>`;
    };
    if (!qs.length) { app.innerHTML = "<p>Este módulo no tiene guardián.</p>"; return; }
    draw("¡Un guardián salvaje aparece! Necesitas acertar " + need + " preguntas.");
  };

  /* ---------------- review ---------------- */
  VIEWS.review = () => {
    const keys = Object.keys(S.review).filter((k) => Q[k]);
    const byMod = {};
    keys.forEach((k) => { (byMod[Q[k]._mod] = byMod[Q[k]._mod] || []).push(k); });
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">⛩️ Templo del Repaso</h2>
      <p>Aquí vuelven las preguntas que has fallado. Una pregunta sale del templo cuando la aciertas <b>2 veces seguidas</b>.</p>
      ${keys.length ? `<p><b>${keys.length}</b> preguntas pendientes.</p>
        <div class="row"><button class="btn" id="revAll">Repasar ${Math.min(10, keys.length)} preguntas</button></div>
        <h3>Por módulo</h3><div class="grid g3">${Object.keys(byMod).sort().map((mid) => `<button class="unit-row" data-rev="${mid}"><span class="n">${ICONS[mid]}</span><span class="t"><b>${esc(MOD[mid].title)}</b><small>${byMod[mid].length} pendientes</small></span></button>`).join("")}</div>`
        : `<p style="font-size:40px;margin:0">🌸</p><p>No tienes errores pendientes. ¡Sigue explorando el mapa!</p>`}
      </div>`;
    const run = (ks) => quizRun({
      questions: shuffle(ks).slice(0, 10).map((k) => Q[k]), title: "Repaso de errores", back: ["review", "", "Templo del Repaso"],
      onAnswer: (q, ok) => {
        const a = S.answered[q._key] || (S.answered[q._key] = { ok: 0, ko: 0 });
        ok ? a.ok++ : a.ko++;
        const r = S.review[q._key];
        if (ok) { if (r) { r.streak++; if (r.streak >= 2) { delete S.review[q._key]; toast("🌸 ¡Pregunta dominada!"); } } gain(3, 1); }
        else S.review[q._key] = { streak: 0, t: Date.now() };
        save();
      },
      onFinish: (res) => {
        const c = res.filter(Boolean).length;
        app.innerHTML = `<div class="panel" style="text-align:center;max-width:520px;margin:0 auto"><div style="font-size:54px">⛩️</div>
          <h2>Sesión de repaso terminada</h2><p class="score-big ${c / res.length >= 0.7 ? "pass" : "fail"}">${c}/${res.length}</p>
          <button class="btn" data-go="review">Volver al templo</button></div>`;
      },
    });
    const ra = $("#revAll"); if (ra) ra.onclick = () => run(keys);
    app.querySelectorAll("[data-rev]").forEach((b) => (b.onclick = () => run(byMod[b.dataset.rev])));
  };

  /* ---------------- library ---------------- */
  function glossary() {
    const seen = new Map();
    DATA.forEach((m) => (m.glossary || []).forEach((g) => {
      const k = g.en.toLowerCase().trim();
      if (!seen.has(k)) seen.set(k, Object.assign({ mods: [m.id] }, g));
      else if (!seen.get(k).mods.includes(m.id)) seen.get(k).mods.push(m.id);
    }));
    return [...seen.values()].sort((a, b) => a.es.localeCompare(b.es, "es"));
  }
  VIEWS.library = (tab) => {
    const G = glossary();
    tab = tab || "glossary";
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">📖 Biblioteca</h2>
      <div class="row"><button class="btn ${tab === "glossary" ? "" : "sec"}" data-go="library" data-arg="glossary">Glosario (${G.length})</button>
      <button class="btn ${tab === "cards" ? "" : "sec"}" data-go="library" data-arg="cards">Fichas de memoria</button></div></div>
      <div class="panel" id="lib"></div>`;
    const lib = $("#lib");
    const modSel = `<select id="gm"><option value="">Todos los módulos</option>${DATA.map((m) => `<option value="${m.id}">${m.order}. ${esc(m.title)} (Ruta ${m.path})</option>`).join("")}</select>`;
    if (tab === "glossary") {
      lib.innerHTML = `<div class="row"><input type="search" id="gq" placeholder="Buscar en español o inglés…" style="flex:1;min-width:200px">${modSel}</div><div id="gl" style="margin-top:10px"></div>`;
      const draw = () => {
        const q = $("#gq").value.toLowerCase().trim(), mf = $("#gm").value;
        const list = G.filter((g) => (!mf || g.mods.includes(mf)) && (!q || (g.es + " " + g.en + " " + g.def).toLowerCase().includes(q)));
        $("#gl").innerHTML = list.length ? list.map((g) => `<div class="gloss-item"><b>${esc(g.es)}</b> <span class="term"><span class="en">${esc(g.en)}</span></span>
          <span class="muted" style="font-size:13px">· ${g.mods.map((x) => ICONS[x]).join(" ")}</span><div>${fmt(g.def)}</div></div>`).join("") : `<p class="muted">Sin resultados.</p>`;
      };
      $("#gq").oninput = draw; $("#gm").onchange = draw; draw();
    } else {
      lib.innerHTML = `<div class="row">${modSel}<select id="gside"><option value="es">Frente: español</option><option value="en">Frente: inglés</option><option value="def">Frente: definición</option></select></div><div id="fc"></div>`;
      let deck = [], idx = 0, known = 0;
      const build = () => { const mf = $("#gm").value; deck = shuffle(G.filter((g) => !mf || g.mods.includes(mf))); idx = 0; known = 0; card(); };
      const card = () => {
        const fc = $("#fc");
        if (!deck.length) { fc.innerHTML = `<p class="muted">No hay fichas.</p>`; return; }
        if (idx >= deck.length) { fc.innerHTML = `<div style="text-align:center"><h3>¡Mazo terminado!</h3><p>Sabías ${known} de ${deck.length}.</p><button class="btn" id="again">Barajar de nuevo</button></div>`; $("#again").onclick = build; return; }
        const g = deck[idx], side = $("#gside").value;
        const front = side === "es" ? `<h3>${esc(g.es)}</h3>` : side === "en" ? `<h3>${esc(g.en)}</h3>` : `<p>${fmt(g.def)}</p>`;
        fc.innerHTML = `<p class="muted" style="text-align:center">Ficha ${idx + 1}/${deck.length} · toca la ficha para girarla</p>
          <div class="flash" id="flash"><div class="inner"><div class="face">${front}</div>
          <div class="face back-f"><h3>${esc(g.es)}</h3><p class="term"><span class="en">${esc(g.en)}</span></p><p>${fmt(g.def)}</p></div></div></div>
          <div class="row" style="justify-content:center"><button class="btn sec" id="nok">🔁 Repasar</button><button class="btn" id="ok">✔ Lo sé</button></div>`;
        $("#flash").onclick = () => $("#flash").classList.toggle("flip");
        $("#ok").onclick = () => { known++; idx++; card(); };
        $("#nok").onclick = () => { deck.push(g); idx++; card(); };
      };
      $("#gm").onchange = build; $("#gside").onchange = card; build();
    }
  };

  /* ---------------- shop ---------------- */
  VIEWS.shop = () => {
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">🛒 Tienda del Mercader</h2>
      <p>Tienes <b>🪙 ${S.coins}</b>. Ganas monedas acertando preguntas y derrotando guardianes.</p>
      <div class="grid g3">${SHOP.map((it) => `<div class="panel" style="text-align:center"><div style="font-size:44px">${it.ico}</div><h3 style="margin:6px 0">${it.n}</h3>
        <p class="muted">${it.d}</p><p>En inventario: <b>${S.items[it.id] || 0}</b></p>
        <button class="btn" data-buy="${it.id}" ${S.coins < it.price ? "disabled" : ""}>Comprar · 🪙 ${it.price}</button></div>`).join("")}</div></div>`;
    app.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
      const it = SHOP.find((x) => x.id === b.dataset.buy);
      if (S.coins < it.price) return;
      S.coins -= it.price; S.items[it.id] = (S.items[it.id] || 0) + 1; save(); toast(`${it.ico} ¡${it.n} comprado!`); VIEWS.shop();
    }));
  };

  /* ---------------- progress ---------------- */
  function objStats() {
    const st = {};
    Object.keys(OBJ).forEach((k) => (st[k] = { ok: 0, tot: 0, bank: 0 }));
    ALLQ.forEach((q) => { if (st[q.obj]) st[q.obj].bank++; });
    Object.entries(S.answered).forEach(([k, a]) => { const q = Q[k]; if (q && st[q.obj]) { st[q.obj].ok += a.ok; st[q.obj].tot += a.ok + a.ko; } });
    return st;
  }
  VIEWS.progress = () => {
    const totalUnits = DATA.reduce((s, m) => s + m.units.length, 0);
    const doneUnits = Object.values(S.units).filter((u) => u.done).length;
    const bosses = DATA.filter((m) => S.boss[m.id] && S.boss[m.id].won).length;
    const os = objStats();
    let ok = 0, tot = 0; Object.values(os).forEach((o) => { ok += o.ok; tot += o.tot; });
    const lastExam = S.exams[S.exams.length - 1];
    const color = (p) => (p >= 0.8 ? "var(--green)" : p >= 0.6 ? "var(--gold)" : "var(--red)");
    app.innerHTML = `<div class="grid g3">
        <div class="panel stat"><div class="muted">Unidades</div><div class="v">${doneUnits}/${totalUnits}</div></div>
        <div class="panel stat"><div class="muted">Guardianes</div><div class="v">${bosses}/${DATA.length}</div></div>
        <div class="panel stat"><div class="muted">Precisión global</div><div class="v">${tot ? Math.round((ok / tot) * 100) : 0}%</div></div>
        <div class="panel stat"><div class="muted">Último simulacro</div><div class="v">${lastExam ? lastExam.score : "—"}</div></div>
      </div>
      <div class="panel"><h3 style="margin-top:0">Por área de la guía de estudio AI-901</h3>
        ${["A", "B"].map((g) => `<h4 style="margin-bottom:4px">${GROUPS[g].n} <span class="tag">${GROUPS[g].w} del examen</span></h4>
          ${Object.entries(OBJ).filter(([, o]) => o.g === g).map(([k, o]) => {
            const s = os[k], p = s.tot ? s.ok / s.tot : 0;
            return `<div class="mod-line"><span class="tag">${k}</span><span>${o.n}<br><small class="muted">${s.tot} respuestas · ${s.bank} preguntas en el juego</small></span>
              <span class="hide-sm"><span class="bar"><i style="width:${p * 100}%;background:${color(p)}"></i></span></span><b>${s.tot ? Math.round(p * 100) + "%" : "—"}</b></div>`;
          }).join("")}`).join("")}
        <p class="muted">Verde ≥ 80 %, amarillo ≥ 60 %, rojo &lt; 60 %. Prioriza las áreas en rojo.</p>
      </div>
      <div class="panel"><h3 style="margin-top:0">Por módulo</h3>
        ${[1, 2].map((p) => `<h4 style="margin-bottom:4px">Ruta ${p}: ${REGIONS[p].name}</h4>` + DATA.filter((m) => m.path === p).map((m) => {
          const pr = modProgress(m), b = S.boss[m.id];
          return `<div class="mod-line"><span>${ICONS[m.id]}</span><a href="#" data-go="zone" data-arg="${m.id}">${m.order}. ${esc(m.title)}</a>
            <span class="hide-sm"><span class="bar"><i style="width:${(pr.done / pr.total) * 100}%"></i></span></span><span>${pr.units}/${m.units.length} ${b && b.won ? "👑" : ""}</span></div>`;
        }).join("")).join("")}
      </div>
      ${S.exams.length ? `<div class="panel"><h3 style="margin-top:0">Historial de simulacros</h3>${S.exams.slice().reverse().map((e) => `<div class="mod-line" style="grid-template-columns:1fr auto auto"><span>${new Date(e.date).toLocaleString("es")}</span><span>${e.correct}/${e.n}</span><b style="color:${e.score >= 700 ? "var(--green)" : "var(--red)"}">${e.score}</b></div>`).join("")}</div>` : ""}`;
  };

  /* ---------------- exam ---------------- */
  VIEWS.exam = () => {
    const bank = ALLQ.length;
    app.innerHTML = `<div class="panel" style="max-width:720px"><h2 style="margin-top:0">🏰 Torre del Examen</h2>
      <p>Simulacro del examen <b>AI-901</b>: preguntas al azar de los 15 módulos, repartidas según el peso de la guía de estudio
      (<b>${GROUPS.A.w}</b> conceptos de IA · <b>${GROUPS.B.w}</b> implementación con Microsoft Foundry). No verás la solución hasta el final.</p>
      <p>Puntuación de 0 a 1000; para aprobar necesitas <b>700</b>. (La puntuación real de Microsoft no es un porcentaje lineal: esto es una aproximación).</p>
      <div class="row"><label>Preguntas: <select id="en"><option>20</option><option selected>45</option><option>60</option></select></label>
      <label>Tiempo: <select id="et"><option value="20">20 min</option><option value="45" selected>45 min</option><option value="60">60 min</option><option value="0">Sin límite</option></select></label></div>
      <p class="muted">Banco disponible: ${bank} preguntas.</p>
      <button class="btn" id="go" ${bank ? "" : "disabled"}>Entrar en la torre ⚔️</button></div>`;
    $("#go").onclick = () => startExam(+$("#en").value, +$("#et").value);
  };
  function pickExam(n) {
    const byG = { A: shuffle(ALLQ.filter((q) => OBJ[q.obj] && OBJ[q.obj].g === "A")), B: shuffle(ALLQ.filter((q) => OBJ[q.obj] && OBJ[q.obj].g === "B")) };
    const nA = Math.min(byG.A.length, Math.round(n * GROUPS.A.share));
    const nB = Math.min(byG.B.length, n - nA);
    let out = byG.A.slice(0, nA).concat(byG.B.slice(0, nB));
    if (out.length < n) out = out.concat(shuffle(ALLQ.filter((q) => !out.includes(q))).slice(0, n - out.length));
    return shuffle(out);
  }
  function startExam(n, mins) {
    const qs = pickExam(n), res = [];
    const end = mins ? Date.now() + mins * 60000 : 0;
    let i = 0, timer;
    const finish = () => {
      clearInterval(timer); cleanup = null;
      const c = res.filter(Boolean).length;
      const score = Math.round((c / qs.length) * 1000);
      const by = {};
      qs.forEach((q, k) => { const o = (by[q.obj] = by[q.obj] || { ok: 0, n: 0 }); o.n++; if (res[k]) o.ok++; });
      qs.forEach((q, k) => record(q, !!res[k]));
      S.exams.push({ date: Date.now(), n: qs.length, correct: c, score });
      save();
      if (score >= 700) gain(100, 40);
      app.innerHTML = `<div class="panel" style="text-align:center"><div style="font-size:60px">${score >= 700 ? "🎓" : "📚"}</div>
        <h2>${score >= 700 ? "¡Aprobado!" : "Aún no…"}</h2><div class="score-big ${score >= 700 ? "pass" : "fail"}">${score}</div>
        <p>${c}/${qs.length} correctas · aprobado con 700 ${score >= 700 ? "· +100 XP · +40 🪙" : ""}</p></div>
        <div class="panel"><h3 style="margin-top:0">Resultado por área</h3>${Object.keys(OBJ).filter((k) => by[k]).map((k) => {
          const p = by[k].ok / by[k].n;
          return `<div class="mod-line" style="grid-template-columns:40px 1fr 120px 60px"><span class="tag">${k}</span><span>${OBJ[k].n}</span><span class="bar"><i style="width:${p * 100}%;background:${p >= 0.7 ? "var(--green)" : "var(--red)"}"></i></span><b>${by[k].ok}/${by[k].n}</b></div>`;
        }).join("")}</div>
        <div class="panel"><h3 style="margin-top:0">Revisión de preguntas</h3><p class="muted">Las falladas se han añadido al Templo del Repaso.</p>
        ${qs.map((q, k) => `<details style="margin:8px 0"><summary>${res[k] ? "✅" : "❌"} ${k + 1}. ${esc(plain(q.q)).slice(0, 140)}</summary>
          <div style="padding:8px 0 0 24px"><p><b>Respuesta correcta:</b> ${answerText(q)}</p><p class="muted">${fmt(q.explain)}</p>
          <small class="muted">${MOD[q._mod].title}</small></div></details>`).join("")}
        <div class="row"><button class="btn" data-go="exam">Otro simulacro</button><button class="btn sec" data-go="review">Ir al repaso</button></div></div>`;
    };
    const step = () => {
      app.innerHTML = `<div class="row" style="margin-bottom:10px"><h2 style="margin:0">🏰 Simulacro AI-901</h2><span class="spacer"></span>
        <span class="tag">Pregunta ${i + 1}/${qs.length}</span>${end ? `<span class="timer" id="tm"></span>` : ""}
        <button class="btn sec" id="quit">Entregar</button></div><div class="panel" id="qp"></div>`;
      // En el simulacro no se muestra la corrección hasta el final (silent).
      const ui = questionUI(qs[i], {
        silent: true,
        nextLabel: i === qs.length - 1 ? "Ver resultado ➜" : "Siguiente ➜",
        onAnswer: (ok) => { res[i] = ok; },
        onNext: () => { i++; i < qs.length ? step() : finish(); },
      });
      ui.querySelector(".qactions .btn").textContent = "Responder";
      $("#qp").appendChild(ui);
      $("#quit").onclick = () => { if (confirm("¿Entregar el examen ahora? Las preguntas sin responder cuentan como falladas.")) finish(); };
      tick();
    };
    const tick = () => {
      const t = $("#tm"); if (!t || !end) return;
      const left = Math.max(0, end - Date.now());
      t.textContent = "⏳ " + Math.floor(left / 60000) + ":" + String(Math.floor((left % 60000) / 1000)).padStart(2, "0");
      t.classList.toggle("low", left < 5 * 60000);
      if (!left) { toast("⏰ ¡Tiempo agotado!"); finish(); }
    };
    if (end) timer = setInterval(tick, 1000);
    cleanup = () => clearInterval(timer);
    step();
  }
  function answerText(q) {
    switch (q.type) {
      case "mc": return fmt(q.options[q.answer]);
      case "multi": return q.answers.map((i) => fmt(q.options[i])).join(" · ");
      case "tf": return q.answer ? "Verdadero" : "Falso";
      case "match": return q.pairs.map((p) => `${fmt(p[0])} → ${fmt(p[1])}`).join("; ");
      case "order": return q.items.map((x, i) => `${i + 1}) ${fmt(x)}`).join(" ");
      default: return "";
    }
  }

  /* ---------------- settings ---------------- */
  VIEWS.settings = () => {
    app.innerHTML = `<div class="panel" style="max-width:720px"><h2 style="margin-top:0">⚙️ Ajustes</h2>
      <p><label><input type="checkbox" id="sEn" ${S.settings.en ? "checked" : ""}> Mostrar los términos en inglés junto al español</label></p>
      <p><label><input type="checkbox" id="sFree" ${S.settings.free ? "checked" : ""}> Modo libre: desbloquear todas las zonas</label></p>
      <h3>Héroe</h3><div class="row"><input type="text" id="sName" value="${esc(S.name)}" maxlength="20">
        <select id="sAv">${AVATARS.map((a) => `<option ${a === S.avatar ? "selected" : ""}>${a}</option>`).join("")}</select>
        <button class="btn sec" id="sSave">Guardar</button></div>
      <h3>Copia de seguridad</h3>
      <p class="muted">El progreso se guarda en este navegador. Exporta una copia para pasarlo a otro equipo.</p>
      <div class="row"><button class="btn sec" id="exp">⬇️ Exportar progreso</button>
        <label class="btn sec">⬆️ Importar progreso<input type="file" id="imp" accept=".json" hidden></label>
        <button class="btn danger" id="reset">Borrar todo el progreso</button></div>
      <h3>Acerca del contenido</h3>
      <p class="muted">Basado en la guía de estudio del examen AI-901 (habilidades medidas desde el 15 de abril de 2026) y en las rutas
      <i>AI concepts for developers and technology professionals</i> y <i>Get started with AI applications and agents on Azure</i> de Microsoft Learn.
      La teoría está resumida y explicada con otras palabras; cada unidad enlaza a su original. Las preguntas son de práctica, no del examen real.</p></div>`;
    $("#sEn").onchange = (e) => { S.settings.en = e.target.checked; save(); };
    $("#sFree").onchange = (e) => { S.settings.free = e.target.checked; save(); };
    $("#sSave").onclick = () => { const n = $("#sName").value.trim(); if (n) S.name = n; S.avatar = $("#sAv").value; save(); toast("Guardado"); };
    $("#exp").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }));
      a.download = "ai901-quest-progreso.json"; a.click();
    };
    $("#imp").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { try { const d = JSON.parse(t); if (d.v !== 1) throw 0; S = Object.assign(fresh(), d); save(); toast("Progreso importado"); go("map"); } catch (_) { toast("Archivo no válido"); } });
    };
    $("#reset").onclick = () => { if (confirm("¿Seguro? Se borrará todo tu progreso.")) { S = fresh(); save(); go("title"); } };
  };

  go(S.name ? "map" : "title");
})();
