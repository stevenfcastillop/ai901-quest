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
  const MINIONS = [["Duendecillo", "👺"], ["Babosa de datos", "🐛"], ["Araña de red", "🕷️"], ["Serpiente binaria", "🐍"],
    ["Escorpión de bugs", "🦂"], ["Murciélago latente", "🦇"], ["Lobo de ruido", "🐺"], ["Jabalí de tokens", "🐗"],
    ["Zombi sin contexto", "🧟"], ["Virus travieso", "🦠"]];
  const NPC = {
    1: { n: "Maestra Lúmina", ico: "🧝‍♀️" },
    2: { n: "Ingeniera Forja", ico: "👩‍🔧" },
  };
  const GREET = ["¡Acércate, aventurero! Hoy aprenderás algo poderoso.", "Escucha con atención: esto saldrá en el examen.",
    "Prepárate. Al terminar mi lección, un enemigo pondrá a prueba lo aprendido.", "Cada lección te acerca a la certificación. ¡Empecemos!"];
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
    { id: "potion", ico: "🧪", n: "Poción", d: "Recupera 1 corazón en una batalla contra un guardián.", price: 30 },
    { id: "fifty", ico: "🎯", n: "Pergamino 50/50", d: "Elimina la mitad de las opciones incorrectas de una pregunta.", price: 20 },
    { id: "shield", ico: "🛡️", n: "Escudo", d: "Bloquea el daño de un fallo en una batalla.", price: 40 },
  ];
  const KIND = { teoria: "📘 Teoría", laboratorio: "🧪 Laboratorio", evaluacion: "📝 Evaluación", resumen: "🏁 Resumen" };

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
  const TOTAL_UNITS = DATA.reduce((s, m) => s + m.units.length, 0);

  // Glosario único (cartas coleccionables). Cada carta se asigna a una unidad de su módulo para garantizar que se pueda conseguir.
  const GLOSS = (() => {
    const seen = new Map();
    DATA.forEach((m) => (m.glossary || []).forEach((g, gi) => {
      const k = g.en.toLowerCase().trim();
      if (!seen.has(k)) seen.set(k, Object.assign({ k, mods: [m.id], unit: m.units[gi % m.units.length].id }, g));
      else if (!seen.get(k).mods.includes(m.id)) seen.get(k).mods.push(m.id);
    }));
    return [...seen.values()].sort((a, b) => a.es.localeCompare(b.es, "es"));
  })();

  /* ---------------- state ---------------- */
  const fresh = () => ({
    v: 1, name: "", avatar: "🧙", xp: 0, coins: 20, items: { potion: 1, fifty: 1, shield: 0 },
    units: {}, boss: {}, answered: {}, review: {}, exams: [], loot: {}, ach: {},
    daily: { last: "", n: 0 }, bestCombo: 0, mastered: 0,
    settings: { en: true, free: false, sound: true, timer: true },
  });
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw), f = fresh();
        const s = Object.assign(f, d);
        s.settings = Object.assign(fresh().settings, d.settings || {});
        s.daily = Object.assign({ last: "", n: 0 }, d.daily || {});
        return s;
      }
    } catch (e) { /* almacenamiento no disponible */ }
    return fresh();
  }
  function save() {
    checkAch();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
    hud();
  }

  const level = () => Math.floor(Math.sqrt(S.xp / 60)) + 1;
  const xpFor = (l) => (l - 1) * (l - 1) * 60;
  const maxHearts = () => Math.min(3 + Math.floor((level() - 1) / 3), 6);

  function gain(xp, coins, why) {
    const before = level();
    S.xp += xp; S.coins += coins || 0;
    save();
    if (level() > before) { SFX.level(); toast(`⭐ ¡Subiste al nivel ${level()}!` + (maxHearts() > 3 ? ` Corazones máx.: ${maxHearts()}` : "")); }
    else if (why) toast(why);
  }

  const dayStr = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  function touchDay() {
    const today = dayStr(new Date());
    if (S.daily.last === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.daily.n = S.daily.last === dayStr(y) ? S.daily.n + 1 : 1;
    S.daily.last = today;
    if (S.daily.n > 1) toast(`🔥 ¡Racha de ${S.daily.n} días estudiando!`);
  }

  function record(q, ok) {
    touchDay();
    const a = S.answered[q._key] || (S.answered[q._key] = { ok: 0, ko: 0 });
    if (ok) a.ok++; else a.ko++;
    if (!ok) S.review[q._key] = { streak: 0, t: Date.now() };
  }

  /* ---------------- logros ---------------- */
  const doneUnits = () => Object.keys(S.units).filter((k) => UNIT[k] && S.units[k].done).length;
  const bossesWon = (p) => DATA.filter((m) => (!p || m.path === p) && S.boss[m.id] && S.boss[m.id].won).length;
  const totalOk = () => Object.values(S.answered).reduce((s, a) => s + a.ok, 0);
  const lootCount = () => GLOSS.filter((g) => S.loot[g.k]).length;
  const ACH = [
    { id: "u1", ico: "📘", n: "Primeros pasos", d: "Completa tu primera unidad", t: () => doneUnits() >= 1 },
    { id: "u25", ico: "📚", n: "Estudiante aplicado", d: "Completa 25 unidades", t: () => doneUnits() >= 25 },
    { id: "uall", ico: "🎓", n: "Erudito", d: `Completa las ${TOTAL_UNITS} unidades`, t: () => doneUnits() >= TOTAL_UNITS },
    { id: "b1", ico: "⚔️", n: "Cazador de guardianes", d: "Derrota a tu primer guardián", t: () => bossesWon() >= 1 },
    { id: "r1", ico: "🌲", n: "Señor de los Conceptos", d: "Derrota a todos los guardianes de la Ruta 1", t: () => bossesWon(1) >= DATA.filter((m) => m.path === 1).length },
    { id: "r2", ico: "🏯", n: "Arquitecto de Foundry", d: "Derrota a todos los guardianes de la Ruta 2", t: () => bossesWon(2) >= DATA.filter((m) => m.path === 2).length },
    { id: "c5", ico: "🔥", n: "En racha", d: "Consigue un combo de 5 aciertos", t: () => S.bestCombo >= 5 },
    { id: "c10", ico: "☄️", n: "Imparable", d: "Consigue un combo de 10 aciertos", t: () => S.bestCombo >= 10 },
    { id: "q100", ico: "🎯", n: "Centenario", d: "Acierta 100 preguntas", t: () => totalOk() >= 100 },
    { id: "q500", ico: "🏹", n: "Tirador experto", d: "Acierta 500 preguntas", t: () => totalOk() >= 500 },
    { id: "rev10", ico: "🌸", n: "Sin olvido", d: "Domina 10 preguntas en el Templo del Repaso", t: () => S.mastered >= 10 },
    { id: "card50", ico: "🃏", n: "Coleccionista", d: "Reúne 50 cartas", t: () => lootCount() >= 50 },
    { id: "cardall", ico: "💎", n: "Colección completa", d: "Reúne todas las cartas del glosario", t: () => GLOSS.length > 0 && lootCount() >= GLOSS.length },
    { id: "d3", ico: "📅", n: "Constancia", d: "Estudia 3 días seguidos", t: () => S.daily.n >= 3 },
    { id: "d7", ico: "🗓️", n: "Hábito de hierro", d: "Estudia 7 días seguidos", t: () => S.daily.n >= 7 },
    { id: "ex", ico: "🏰", n: "Conquistador de la torre", d: "Aprueba un simulacro", t: () => S.exams.some((e) => e.score >= 700) },
    { id: "ex9", ico: "👑", n: "Listo para el examen", d: "Saca 900 o más en un simulacro de 45 preguntas o más", t: () => S.exams.some((e) => e.score >= 900 && e.n >= 45) },
  ];
  function checkAch() {
    if (!S.name) return;
    ACH.forEach((a) => {
      if (!S.ach[a.id] && a.t()) { S.ach[a.id] = Date.now(); toast(`🏆 Logro desbloqueado: ${a.ico} ${a.n}`); SFX.level(); }
    });
  }

  /* ---------------- sonido (sintetizado, sin archivos) ---------------- */
  const SFX = (() => {
    let ctx;
    const on = () => S.settings.sound !== false;
    function tone(f, dur, type, vol, slide, delay) {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const t = ctx.currentTime + (delay || 0);
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type || "square"; o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
        g.gain.setValueAtTime(vol || 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
      } catch (e) { /* sin audio */ }
    }
    const play = (fn) => (...a) => on() && fn(...a);
    return {
      hit: play(() => { tone(220, 0.08, "square", 0.07, 0.5); tone(660, 0.1, "triangle", 0.05, 1.5, 0.05); }),
      crit: play(() => { tone(330, 0.08, "square", 0.08, 0.5); [784, 988, 1318].forEach((f, i) => tone(f, 0.12, "triangle", 0.06, 1, 0.06 + i * 0.06)); }),
      miss: play(() => { tone(180, 0.25, "sawtooth", 0.07, 0.4); }),
      coin: play(() => { tone(988, 0.06, "square", 0.04); tone(1318, 0.12, "square", 0.04, 1, 0.06); }),
      loot: play(() => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.1, "triangle", 0.05, 1, i * 0.07)); }),
      level: play(() => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.14, "square", 0.045, 1, i * 0.09)); }),
      win: play(() => { [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "square", 0.05, 1, i * 0.11)); }),
      lose: play(() => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, "sawtooth", 0.05, 0.9, i * 0.18)); }),
      blip: play(() => tone(660, 0.03, "square", 0.025)),
      tick: play(() => tone(1200, 0.02, "square", 0.02)),
    };
  })();

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

  const toastQ = [];
  let toastBusy = false;
  function toast(msg) { toastQ.push(msg); if (!toastBusy) nextToast(); }
  function nextToast() {
    const t = $("#toast"), m = toastQ.shift();
    if (!m) { toastBusy = false; return; }
    toastBusy = true; t.textContent = m; t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); setTimeout(nextToast, 320); }, 2300);
  }

  // Temporizadores y listeners que hay que limpiar al cambiar de vista.
  let disposers = [];
  const onLeave = (fn) => disposers.push(fn);

  function unitDone(uid) { return !!(S.units[uid] && S.units[uid].done); }
  function modProgress(m) {
    const d = m.units.filter((u) => unitDone(u.id)).length;
    return { done: d + (S.boss[m.id] && S.boss[m.id].won ? 1 : 0), total: m.units.length + 1, units: d };
  }
  function unlocked(m) {
    if (S.settings.free || m.order === 1) return true;
    const prev = DATA.find((x) => x.path === m.path && x.order === m.order - 1);
    return !prev || !!(S.boss[prev.id] && S.boss[prev.id].won);
  }
  function minionFor(u) { const i = (parseInt(u._mod.slice(1), 10) * 3 + u._n) % MINIONS.length; return MINIONS[i]; }

  /* ---------------- HUD / routing ---------------- */
  function hud() {
    const l = level(), cur = xpFor(l), nxt = xpFor(l + 1);
    const pct = Math.round(((S.xp - cur) / (nxt - cur)) * 100);
    $("#hud").innerHTML =
      `<span class="chip">${S.avatar} ${esc(S.name || "Aventurero")}</span>` +
      `<span class="chip">Nv ${l}<span class="xpbar"><i style="width:${pct}%"></i></span></span>` +
      `<span class="chip">🪙 ${S.coins}</span>` +
      (S.daily.n ? `<span class="chip" title="Días seguidos estudiando">🔥 ${S.daily.n}</span>` : "") +
      `<span class="chip" title="Pociones / 50-50 / Escudos">🧪${S.items.potion} 🎯${S.items.fifty} 🛡️${S.items.shield}</span>`;
    const n = Object.keys(S.review).filter((k) => Q[k]).length;
    const b = $("#reviewBadge"); b.hidden = !n; b.textContent = n;
    document.body.classList.toggle("no-en", !S.settings.en);
  }

  function go(view, arg) {
    disposers.forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
    disposers = [];
    document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.go === view));
    window.scrollTo(0, 0);
    if (!S.name && view !== "title") view = "title";
    $("#topbar").hidden = view === "title";
    (VIEWS[view] || VIEWS.map)(arg);
    hud();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (b) { e.preventDefault(); SFX.blip(); go(b.dataset.go, b.dataset.arg); }
  });

  /* ---------------- arena de combate ---------------- */
  // cfg: {foe, ico, hp (aciertos necesarios), hearts (número o null), crits (bool: el crítico hace más daño)}
  function Arena(cfg) {
    const st = { max: cfg.hp * 100, hp: cfg.hp * 100, hearts: cfg.hearts, combo: 0, shield: false };
    const el = h(`<div class="arena">
      <div class="fighter hero"><div class="sprite">${S.avatar}</div><div class="name">${esc(S.name)}</div>
        <div class="hearts"></div><div class="combo"></div></div>
      <div class="vs">VS</div>
      <div class="fighter foe"><div class="sprite">${cfg.ico}</div><div class="name">${esc(cfg.foe)}</div>
        <div class="hp"><i></i></div><small class="hpt muted"></small></div></div>`);
    const draw = () => {
      $(".foe .hp i", el).style.width = (st.hp / st.max) * 100 + "%";
      $(".hpt", el).textContent = st.hp > 0 ? `${st.hp}/${st.max} PV` : "¡Derrotado!";
      $(".foe .sprite", el).classList.toggle("down", st.hp <= 0);
      $(".hearts", el).innerHTML = st.hearts == null ? "" :
        "❤️".repeat(Math.max(0, st.hearts)) + "🖤".repeat(Math.max(0, maxHearts() - st.hearts)) + (st.shield ? " 🛡️" : "");
      $(".combo", el).innerHTML = st.combo >= 2 ? `<span class="combo-chip">🔥 COMBO x${st.combo}</span>` : "";
    };
    const float = (who, text, cls) => {
      const sp = $(`.${who} .sprite`, el);
      const f = h(`<span class="float ${cls || ""}">${text}</span>`);
      sp.parentElement.appendChild(f);
      setTimeout(() => f.remove(), 1100);
    };
    const anim = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
    st.el = el;
    st.draw = draw;
    st.strike = (ok) => {
      if (ok) {
        st.combo++;
        if (st.combo > S.bestCombo) S.bestCombo = st.combo;
        const crit = st.combo >= 3;
        const dmg = crit && cfg.crits ? 150 : 100;
        if (st.hp <= 0) { float("foe", "+1 🪙 remate", "bonus"); S.coins += 1; SFX.coin(); }
        else {
          st.hp = Math.max(0, st.hp - dmg);
          float("foe", crit ? `¡CRÍTICO! -${dmg}` : `-${dmg}`, crit ? "crit" : "");
          crit ? SFX.crit() : SFX.hit();
          if (crit) { S.coins += 1; }
        }
        anim($(".foe .sprite", el), "hit");
      } else {
        st.combo = 0;
        if (st.hearts != null) {
          if (st.shield) { st.shield = false; float("hero", "🛡️ ¡Bloqueado!", "bonus"); }
          else { st.hearts--; float("hero", "-❤️", "dmg"); }
        } else float("hero", "¡Auch!", "dmg");
        SFX.miss();
        anim(el, "shake"); anim(el, "hurt");
      }
      draw();
    };
    draw();
    return st;
  }

  /* ---------------- question widget ---------------- */
  // opts: {game, silent, timed, hint, onAnswer(ok), onNext(ok), nextLabel, label, allowFifty}
  function questionUI(q, opts) {
    const game = !!opts.game;
    const box = h(`<div class="qbox ${game ? "game" : ""}"></div>`);
    const objName = OBJ[q.obj] ? OBJ[q.obj].n : "";
    const mech = game ? {
      mc: "⚔️ Ataque: elige la respuesta correcta",
      tf: "🛡️ ¡Bloquea el ataque! ¿Verdadero o falso?",
      multi: "🎒 Prepara tu mochila: elige todas las correctas",
      match: "🔮 Conecta las runas: toca una de la izquierda y luego su pareja",
      order: "✨ Lanza el hechizo: toca los pasos en el orden correcto",
    }[q.type] : "";
    box.innerHTML = `<div class="qhead">${opts.label || ""}<span class="tag" title="Área de la guía de estudio">${q.obj} · ${esc(objName)}</span>
      ${!game && q.type === "multi" ? '<span class="tag">Selección múltiple</span>' : ""}</div>
      ${mech ? `<div class="mech">${mech}</div>` : ""}
      <div class="qtext">${fmt(q.q)}</div><div class="timer-bar" hidden><i></i></div><div class="body"></div><div class="fb"></div><div class="qactions"></div>`;
    const body = $(".body", box), acts = $(".qactions", box), fb = $(".fb", box);
    let answered = false, getResult, revealFn, timerId = null;
    const check = h(`<button class="btn">${game ? { multi: "🎒 ¡Partir!", match: "🔮 Activar runas", order: "✨ Lanzar hechizo" }[q.type] || "Comprobar" : "Comprobar"}</button>`);
    let autoSubmit = false;

    if (q.type === "mc" || q.type === "multi" || q.type === "tf") {
      let items;
      if (q.type === "tf") items = [{ t: "Verdadero", v: true }, { t: "Falso", v: false }];
      else items = shuffle(q.options.map((t, i) => ({ t, i })));
      const correct = (it) => (q.type === "tf" ? it.v === q.answer : q.type === "mc" ? it.i === q.answer : q.answers.includes(it.i));
      const wrap = h(`<div class="opts ${q.type === "tf" && game ? "tf-game" : ""}"></div>`);
      const sel = new Set();
      autoSubmit = game && q.type !== "multi";
      const bagInfo = game && q.type === "multi" ? h(`<div class="bag">🎒 En la mochila: <b>0</b></div>`) : null;
      items.forEach((it, idx) => {
        const key = q.type === "tf" && game ? (it.v ? "✅" : "❌") : q.type === "multi" && game ? "▫️" : String.fromCharCode(65 + idx);
        const b = h(`<button class="opt"><span class="k">${key}</span><span>${fmt(it.t)}</span></button>`);
        it.el = b;
        b.onclick = () => {
          if (answered || b.classList.contains("gone")) return;
          SFX.blip();
          if (q.type === "multi") {
            sel.has(it) ? sel.delete(it) : sel.add(it); b.classList.toggle("sel");
            if (game) { $(".k", b).textContent = sel.has(it) ? "🎒" : "▫️"; $("b", bagInfo).textContent = sel.size; }
          } else { sel.clear(); sel.add(it); items.forEach((x) => x.el.classList.toggle("sel", x === it)); }
          check.disabled = !sel.size;
          if (autoSubmit) submit();
        };
        wrap.appendChild(b);
      });
      body.appendChild(wrap);
      if (bagInfo) body.appendChild(bagInfo);
      check.disabled = true;
      getResult = () => {
        if (!sel.size) return false;
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
    } else if (q.type === "match" && game) {
      // Runas: tocar izquierda y luego derecha; se dibujan líneas.
      const lefts = shuffle(q.pairs.map((p, i) => ({ t: p[0], ans: p[1], i })));
      const rights = shuffle(q.pairs.map((p) => p[1]));
      const COLORS = ["#f6c453", "#6aa9ff", "#b48cff", "#4fd18b", "#ff9b6b", "#7fd1ff"];
      const wrap = h(`<div class="runes"><div class="rcol L"></div><svg class="links"></svg><div class="rcol R"></div></div>`);
      const links = new Map(); // leftIdx -> rightIdx
      let selL = null;
      const lb = lefts.map((l, i) => { const b = h(`<button class="rune">${fmt(l.t)}</button>`); b.onclick = () => tapL(i); $(".L", wrap).appendChild(b); return b; });
      const rb = rights.map((r, j) => { const b = h(`<button class="rune">${fmt(r)}</button>`); b.onclick = () => tapR(j); $(".R", wrap).appendChild(b); return b; });
      const tapL = (i) => { if (answered) return; SFX.blip(); if (links.has(i)) links.delete(i); selL = selL === i ? null : i; paint(); };
      const tapR = (j) => {
        if (answered || selL == null) { if (!answered) toast("Primero toca una runa de la izquierda"); return; }
        SFX.tick();
        for (const [k, v] of links) if (v === j) links.delete(k);
        links.set(selL, j); selL = null; paint();
      };
      const colorOf = new Map();
      const paint = (reveal) => {
        let c = 0; colorOf.clear();
        [...links.keys()].sort((a, b) => a - b).forEach((k) => colorOf.set(k, COLORS[c++ % COLORS.length]));
        lb.forEach((b, i) => { b.classList.toggle("sel", selL === i); b.style.borderColor = colorOf.get(i) || ""; });
        rb.forEach((b, j) => { let col = ""; for (const [k, v] of links) if (v === j) col = colorOf.get(k); b.style.borderColor = col; });
        const svg = $("svg", wrap), r0 = wrap.getBoundingClientRect();
        svg.setAttribute("viewBox", `0 0 ${r0.width} ${r0.height}`);
        svg.innerHTML = [...links].map(([i, j]) => {
          const a = lb[i].getBoundingClientRect(), b = rb[j].getBoundingClientRect();
          const x1 = a.right - r0.left, y1 = a.top + a.height / 2 - r0.top, x2 = b.left - r0.left, y2 = b.top + b.height / 2 - r0.top;
          const ok = rights[j] === lefts[i].ans;
          const col = reveal ? (ok ? "#4fd18b" : "#ff6b6b") : colorOf.get(i);
          return `<path d="M${x1} ${y1} C ${x1 + 30} ${y1}, ${x2 - 30} ${y2}, ${x2} ${y2}" stroke="${col}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        }).join("");
        check.disabled = links.size !== lefts.length;
      };
      body.appendChild(wrap);
      requestAnimationFrame(() => paint());
      const ro = new ResizeObserver(() => paint(answered));
      ro.observe(wrap); onLeave(() => ro.disconnect());
      check.disabled = true;
      getResult = () => lefts.every((l, i) => links.has(i) && rights[links.get(i)] === l.ans);
      revealFn = () => {
        paint(true);
        lb.forEach((b, i) => { b.disabled = true; b.classList.add(links.has(i) && rights[links.get(i)] === lefts[i].ans ? "ok" : "ko"); });
        rb.forEach((b) => (b.disabled = true));
        if (!getResult()) body.insertAdjacentHTML("beforeend", `<div class="muted" style="margin-top:10px"><b>Parejas correctas:</b><ul>${q.pairs.map((p) => `<li>${fmt(p[0])} → ${fmt(p[1])}</li>`).join("")}</ul></div>`);
      };
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
    } else if (q.type === "order" && game) {
      // Hechizo: tocar los pasos en orden para colocarlos en los sellos.
      const pool = shuffle(q.items.map((t) => ({ t })));
      const slots = [];
      const wrap = h(`<div class="spell"><div class="slots"></div><div class="pool"></div></div>`);
      const draw = (reveal) => {
        $(".slots", wrap).innerHTML = "";
        q.items.forEach((_, i) => {
          const it = slots[i];
          const b = h(`<button class="slot ${it ? "filled" : ""}"><span class="k">${i + 1}</span><span>${it ? fmt(it.t) : "<span class='muted'>— vacío —</span>"}</span></button>`);
          if (reveal && it) b.classList.add(it.t === q.items[i] ? "ok" : "ko");
          b.disabled = !it || answered;
          b.onclick = () => { slots.splice(i, 1); SFX.blip(); draw(); };
          $(".slots", wrap).appendChild(b);
        });
        $(".pool", wrap).innerHTML = "";
        pool.filter((it) => !slots.includes(it)).forEach((it) => {
          const b = h(`<button class="rune">${fmt(it.t)}</button>`);
          b.disabled = answered;
          b.onclick = () => { slots.push(it); SFX.tick(); draw(); };
          $(".pool", wrap).appendChild(b);
        });
        check.disabled = slots.length !== q.items.length;
      };
      body.appendChild(wrap); draw();
      check.disabled = true;
      getResult = () => slots.length === q.items.length && slots.every((it, i) => it.t === q.items[i]);
      revealFn = () => {
        draw(true);
        if (!getResult()) body.insertAdjacentHTML("beforeend", `<div class="muted" style="margin-top:8px"><b>Orden correcto:</b><ol>${q.items.map((x) => `<li>${fmt(x)}</li>`).join("")}</ol></div>`);
      };
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

    function submit(timeout) {
      if (answered) return;
      answered = true;
      if (timerId) { clearInterval(timerId); timerId = null; }
      const ok = !timeout && getResult();
      check.remove();
      if (opts.silent) {
        body.querySelectorAll("button, select").forEach((e) => (e.disabled = true));
        fb.innerHTML = `<p class="muted">Respuesta registrada.</p>`;
      } else {
        revealFn();
        const title = game ? (ok ? "💥 ¡Golpe certero!" : timeout ? "⏰ ¡Demasiado lento! El ataque te alcanza" : "💢 ¡Te han dado!") : ok ? "✅ ¡Correcto!" : "❌ Incorrecto";
        const hint = !ok && opts.hint ? `<div class="npc-hint"><span class="p">${opts.hint.ico}</span><div><b>${esc(opts.hint.n)}:</b> «${fmt(opts.hint.text)}»</div></div>` : "";
        fb.innerHTML = `<div class="feedback ${ok ? "ok" : "ko"}"><h4>${title}</h4>${fmt(q.explain)}</div>${hint}`;
      }
      const next = h(`<button class="btn">${opts.nextLabel || "Continuar ➜"}</button>`);
      next.onclick = () => { SFX.blip(); opts.onNext && opts.onNext(ok); };
      acts.appendChild(next);
      opts.onAnswer && opts.onAnswer(ok);
      setTimeout(() => { next.focus({ preventScroll: true }); fb.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 50);
    }
    check.onclick = () => submit();
    if (!autoSubmit) acts.appendChild(check);

    // Temporizador para V/F en combate.
    if (game && opts.timed && q.type === "tf" && S.settings.timer !== false) {
      const words = plain(q.q).split(/\s+/).length;
      const total = Math.min(35, Math.max(12, 8 + words * 0.4)) * 1000, start = Date.now();
      const bar = $(".timer-bar", box); bar.hidden = false;
      timerId = setInterval(() => {
        const left = total - (Date.now() - start);
        $("i", bar).style.width = Math.max(0, (left / total) * 100) + "%";
        bar.classList.toggle("low", left < 4000);
        if (left <= 0) submit(true);
      }, 100);
      onLeave(() => timerId && clearInterval(timerId));
    }
    box.useFifty = () => { if (!answered && opts.fifty) { opts.fifty(); return true; } return false; };
    box.canFifty = () => !answered && !!opts.fifty;
    return box;
  }

  // Serie de preguntas en combate. cfg: {questions, title, back, foe, ico, hpNeed, hearts, crits, onAnswer, onFinish(res, arena), xpEach, coinsEach, hint}
  function fightRun(cfg) {
    const qs = cfg.questions, res = [];
    const arena = Arena({ foe: cfg.foe, ico: cfg.ico, hp: cfg.hpNeed || Math.ceil(qs.length * 0.6), hearts: cfg.hearts == null ? null : cfg.hearts, crits: cfg.crits });
    let i = 0;
    const step = () => {
      app.innerHTML = "";
      if (cfg.back) app.appendChild(h(`<button class="back" data-go="${cfg.back[0]}" data-arg="${cfg.back[1] || ""}">← ${esc(cfg.back[2] || "Volver")}</button>`));
      app.appendChild(h(`<h2 style="margin:0 0 10px">${fmt(cfg.title)}</h2>`));
      app.appendChild(arena.el);
      if (cfg.extra) app.appendChild(cfg.extra(arena, () => ui));
      const dots = h(`<div class="progress-dots"></div>`);
      qs.forEach((_, k) => dots.appendChild(h(`<i class="${k < i ? (res[k] ? "ok" : "ko") : k === i ? "cur" : ""}"></i>`)));
      app.appendChild(dots);
      const panel = h(`<div class="panel"></div>`);
      const q = qs[i];
      const ui = questionUI(q, {
        game: true, timed: true, allowFifty: !!cfg.allowFifty, hint: cfg.hint,
        label: `<span class="tag">Turno ${i + 1}/${qs.length}</span>`,
        nextLabel: "Continuar ➜",
        onAnswer: (ok) => {
          res[i] = ok;
          arena.strike(ok);
          cfg.onAnswer ? cfg.onAnswer(q, ok, arena) : record(q, ok);
          if (ok && cfg.xpEach) gain(cfg.xpEach, cfg.coinsEach || 0); else save();
        },
        onNext: () => {
          i++;
          if (cfg.stop && cfg.stop(arena, i)) return cfg.onFinish(res, arena);
          if (i < qs.length) step(); else cfg.onFinish(res, arena);
        },
      });
      panel.appendChild(ui);
      app.appendChild(panel);
      if (cfg.afterRender) cfg.afterRender(arena, ui);
    };
    step();
  }

  /* ---------------- views ---------------- */
  const VIEWS = {};

  VIEWS.title = () => {
    let av = S.avatar;
    app.innerHTML = `<div class="title-screen">
      <div style="font-size:64px" class="bob">🏰⚔️🐉</div>
      <h1>AI-901 QUEST</h1>
      <p class="sub">Recorre los <b>15 módulos</b> de las 2 rutas de aprendizaje de Microsoft para el examen
      <b>AI-901: Microsoft Azure AI Fundamentals</b>. Escucha a los maestros, vence a sus esbirros, colecciona cartas y derrota al guardián de cada zona.</p>
      <div class="panel" style="max-width:520px;margin:0 auto">
        <label for="nm"><b>Nombre de tu héroe</b></label><br>
        <input id="nm" type="text" maxlength="20" value="${esc(S.name)}" placeholder="Ej.: Ada" style="width:100%;margin:8px 0">
        <div><b>Elige tu avatar</b></div>
        <div class="avatars">${AVATARS.map((a) => `<button data-av="${a}" class="${a === av ? "on" : ""}">${a}</button>`).join("")}</div>
        <button class="btn" id="start">¡Comenzar la aventura!</button>
      </div>
    </div>`;
    app.querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => { SFX.blip(); av = b.dataset.av; app.querySelectorAll("[data-av]").forEach((x) => x.classList.toggle("on", x === b)); }));
    $("#start").onclick = () => {
      const n = $("#nm").value.trim();
      if (!n) { toast("Escribe un nombre para tu héroe"); $("#nm").focus(); return; }
      S.name = n; S.avatar = av; SFX.win(); save(); go("map");
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
      const current = !lock && !won;
      return `<g class="node ${lock ? "locked" : ""} ${current ? "current" : ""}" tabindex="0" role="button" data-mod="${m.id}" aria-label="Módulo ${m.order}: ${esc(m.title)}">
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
    app.innerHTML = `<div class="map-head">
        <div class="hero-card"><div class="av">${S.avatar}</div><div><h2 style="margin:0">${esc(S.name)}</h2>
        <div class="muted">Nivel ${level()} · ${bossesWon()}/${DATA.length} guardianes · 🃏 ${lootCount()}/${GLOSS.length} cartas</div></div></div>
        <div class="spacer"></div>
        <button class="btn sec" data-go="review">⛩️ Repaso de errores</button>
        <button class="btn" data-go="exam">🏰 Simulacro de examen</button>
      </div>
      <div class="regions">${[1, 2].map((p) => `<section class="region ${REGIONS[p].cls}">
        <header>RUTA ${p} · ${REGIONS[p].name}<small>${esc(REGIONS[p].en)}</small></header>${regionSVG(p)}</section>`).join("")}</div>
      ${S.settings.free ? "" : `<p class="muted">🔒 Cada zona se desbloquea al derrotar al guardián de la anterior. Puedes activar el <a href="#" data-go="settings">modo libre</a> en Ajustes.</p>`}`;
    app.querySelectorAll(".node").forEach((n) => {
      const open = () => { const m = MOD[n.dataset.mod]; if (!unlocked(m)) { SFX.miss(); toast("🔒 Derrota primero al guardián de la zona anterior"); return; } SFX.blip(); go("zone", m.id); };
      n.addEventListener("click", open);
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  };

  VIEWS.zone = (mid) => {
    const m = MOD[mid]; if (!m) return go("map");
    const pr = modProgress(m), bs = S.boss[m.id] || {};
    const boss = BOSSES[m.id] || ["Guardián", "👾"];
    const allUnits = pr.units === m.units.length;
    const npc = NPC[m.path];
    app.innerHTML = `<button class="back" data-go="map">← Mapa</button>
      <div class="panel"><div class="zone-hero"><div class="big">${ICONS[m.id] || "⭐"}</div>
        <div style="flex:1;min-width:240px"><div class="muted">Ruta ${m.path} · Módulo ${m.order}</div>
        <h2>${esc(m.title)}</h2><div class="muted">${esc(m.titleEn)}</div></div>
        <div style="min-width:160px"><div class="bar"><i style="width:${(pr.done / pr.total) * 100}%"></i></div>
        <small class="muted">${pr.done}/${pr.total} completado</small></div></div>
        <div class="npc-hint" style="margin-top:14px"><span class="p">${npc.ico}</span><div><b>${npc.n}:</b> «${m.summary ? fmt(m.summary) : "Te guiaré por esta zona."}»</div></div>
        ${m.objectives && m.objectives.length ? `<details style="margin-top:10px"><summary><b>Objetivos de aprendizaje</b></summary><ul>${m.objectives.map((o) => `<li>${fmt(o)}</li>`).join("")}</ul></details>` : ""}
        <p class="muted" style="margin-bottom:0">📎 Módulo original: <a href="${esc(m.url)}" target="_blank" rel="noopener">Microsoft Learn</a></p>
      </div>
      <div class="units">${m.units.map((u) => {
        const st = S.units[u.id] || {};
        const mi = minionFor(u);
        return `<button class="unit-row ${st.done ? "done" : ""}" data-go="unit" data-arg="${u.id}">
          <span class="n">${st.done ? "✓" : u._n}</span><span class="t"><b>${esc(u.title)}</b><small>${esc(u.titleEn || "")} · <span class="kind">${KIND[u.kind] || ""}</span></small></span>
          <span class="muted" title="Esbirro de la unidad">${st.done ? `${st.correct}/${st.total} ✔` : mi[1]}</span></button>`;
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

  /* ---------------- teoría: escenas ---------------- */
  function blockHTML(b) {
    switch (b.type) {
      case "h": return `<h3>${fmt(b.text)}</h3>`;
      case "p": return `<p>${fmt(b.text)}</p>`;
      case "list": return `<ul>${(b.items || []).map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>`;
      case "table": return `<div class="tablewrap"><table><thead><tr>${b.head.map((x) => `<th>${fmt(x)}</th>`).join("")}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((x) => `<td>${fmt(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "code": return `<pre><code>${esc(b.text)}</code></pre>`;
      case "tip": return `<div class="callout"><b class="k">💡 Clave para el examen</b>${fmt(b.text)}</div>`;
      case "example": return `<div class="callout ex"><b class="k">🔍 Ejemplo</b>${fmt(b.text)}</div>`;
      default: return "";
    }
  }
  const theoryHTML = (blocks) => blocks.map(blockHTML).join("");
  const blockText = (b) => b.type === "list" ? (b.items || []).join(" ") : b.type === "table" ? b.head.concat(...b.rows).join(" ") : b.text || "";
  const blockWeight = (b) => b.type === "code" || b.type === "table" ? 450 : plain(blockText(b)).length;

  // Divide la teoría en escenas: una por subtítulo, y parte las muy largas.
  function scenesOf(u) {
    const scenes = [];
    let cur = null;
    const push = () => { if (cur && cur.blocks.length) scenes.push(cur); };
    (u.theory || []).forEach((b) => {
      if (b.type === "h") { push(); cur = { title: plain(b.text), blocks: [] }; return; }
      if (!cur) cur = { title: u.title, blocks: [] };
      const w = cur.blocks.reduce((s, x) => s + blockWeight(x), 0);
      if (cur.blocks.length >= 4 || (cur.blocks.length && w + blockWeight(b) > 1100)) { push(); cur = { title: cur.title + " (cont.)", blocks: [] }; }
      cur.blocks.push(b);
    });
    push();
    if (!scenes.length) scenes.push({ title: u.title, blocks: [{ type: "p", text: "Esta unidad no tiene teoría." }] });
    return scenes;
  }
  // Relevancia pregunta↔escena por palabras clave compartidas, ponderadas por lo poco comunes que son entre escenas.
  const STOP = new Set("para como esta este estos estas pero sobre entre cada donde cuando desde hasta tiene tienen puede pueden debe hace hacer otro otra otros otras todo todos toda todas solo también tambien porque aunque mismo misma según segun cual cuál cuales sino más mucho muy siempre forma parte través traves ejemplo usar uso usando permite permiten caso casos tipo tipos manera respuesta correcta opción opcion verdadero falso siguiente siguientes afirmación afirmacion relaciona elige cuál qué que una uno unos unas los las del con por sus ese esa eso ello ellos ellas the and for with from that this".split(" "));
  const norm = (s) => plain(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const tokens = (s) => new Set((norm(s).match(/[a-z0-9]{4,}/g) || []).filter((w) => !STOP.has(w)).map((w) => w.replace(/(es|s)$/, "")));
  function qText(q) {
    return [q.q, q.explain, ...(q.options || []), ...(q.items || []), ...((q.pairs || []).flat())].join(" ");
  }
  function placeQuestions(scenes, ex) {
    const after = scenes.map(() => []);
    const st = scenes.map((s) => tokens(s.title + " " + s.blocks.map(blockText).join(" ")));
    const df = {};
    st.forEach((set) => set.forEach((w) => (df[w] = (df[w] || 0) + 1)));
    ex.forEach((q, i) => {
      const qt = tokens(qText(q));
      const scores = st.map((set) => { let sc = 0; qt.forEach((w) => { if (set.has(w)) sc += Math.log(1 + scenes.length / df[w]); }); return sc; });
      const max = Math.max(...scores);
      // La primera escena que casi iguala a la mejor (donde se explica el concepto). Sin coincidencias: al final.
      after[max <= 0 ? scenes.length - 1 : scores.findIndex((s) => s >= 0.75 * max)].push(q);
    });
    return after;
  }
  window.__ai901 = { scenesOf, placeQuestions, UNIT };

  function sceneHint(scene, npc) {
    const tip = scene.blocks.find((b) => b.type === "tip") || scene.blocks.find((b) => b.type === "p");
    return tip ? { ico: npc.ico, n: npc.n, text: tip.text } : null;
  }
  function lootFor(scene) {
    const txt = plain(scene.blocks.map(blockText).join(" ")).toLowerCase();
    return GLOSS.filter((g) => !S.loot[g.k] && ((g.en.length > 2 && txt.includes(g.en.toLowerCase())) || (g.es.length > 3 && txt.includes(g.es.toLowerCase()))));
  }
  function grantLoot(list) {
    list.forEach((g) => (S.loot[g.k] = Date.now()));
    if (list.length) SFX.loot();
    return list;
  }

  // Efecto máquina de escribir sobre los nodos de texto de un elemento.
  function typewrite(el, done) {
    const nodes = [];
    const walk = (n) => n.childNodes.forEach((c) => { if (c.nodeType === 3) { nodes.push([c, c.textContent]); c.textContent = ""; } else walk(c); });
    walk(el);
    let ni = 0, ci = 0, stopped = false;
    const id = setInterval(() => {
      let budget = 3;
      while (budget-- > 0 && ni < nodes.length) {
        const [n, full] = nodes[ni];
        ci++; n.textContent = full.slice(0, ci);
        if (ci >= full.length) { ni++; ci = 0; }
      }
      if (ni >= nodes.length) finish();
    }, 16);
    function finish() { if (stopped) return; stopped = true; clearInterval(id); nodes.forEach(([n, full]) => (n.textContent = full)); done && done(); }
    onLeave(() => clearInterval(id));
    return finish;
  }

  VIEWS.unit = (uid) => {
    const u = UNIT[uid]; if (!u) return go("map");
    const m = MOD[u._mod], npc = NPC[m.path], st = S.units[uid] || {};
    const mi = minionFor(u);
    const scenes = scenesOf(u);
    const ex = u.exercises || [];
    app.innerHTML = `<button class="back" data-go="zone" data-arg="${m.id}">← ${esc(m.title)}</button>
      <div class="panel unit-intro">
        <div class="muted">Módulo ${m.order} · Unidad ${u._n}/${m.units.length} · <span class="kind">${KIND[u.kind] || ""}</span></div>
        <h2>${esc(u.title)}</h2><div class="muted">${esc(u.titleEn || "")}</div>
        <div class="dialog intro"><div class="npc"><div class="portrait bob">${npc.ico}</div><b>${npc.n}</b></div>
          <div class="bubble"><p>${GREET[(u._n + m.order) % GREET.length]}</p>
          <p>La lección tiene <b>${scenes.length} escenas</b>. Por el camino te atacará un <b>${mi[1]} ${mi[0]}</b> con <b>${ex.length} preguntas</b>.</p></div></div>
        <div class="row" style="margin-top:14px">
          <button class="btn" id="startExp">▶ ${st.done ? "Repetir la lección" : "Comenzar la lección"}</button>
          ${st.done ? `<button class="btn sec" id="onlyFight">⚔️ Solo combate</button>` : ""}
          <button class="btn sec" id="scroll">📜 Pergamino completo</button>
        </div>
        ${st.done ? `<p class="muted" style="margin-bottom:0">Mejor resultado: ${st.correct}/${st.total}</p>` : ""}
      </div>`;
    $("#startExp").onclick = () => expedition(u);
    $("#scroll").onclick = () => scrollView(u);
    const of = $("#onlyFight");
    if (of) of.onclick = () => fightRun({
      questions: shuffle(ex), title: `Combate · ${u.title}`, back: ["unit", u.id, "Volver a la unidad"],
      foe: mi[0], ico: mi[1], crits: false, xpEach: 2, coinsEach: 1,
      onFinish: (res) => unitEnd(u, res, false, []),
    });
  };

  function scrollView(u) {
    const m = MOD[u._mod];
    app.innerHTML = `<button class="back" data-go="unit" data-arg="${u.id}">← Volver a la unidad</button>
      <article class="panel theory"><div class="muted">📜 Pergamino completo · Módulo ${m.order} · Unidad ${u._n}</div>
      <h2>${esc(u.title)}</h2><div class="muted">${esc(u.titleEn || "")}</div>${theoryHTML(u.theory || [])}
      <p class="muted" style="margin-top:24px">📎 Unidad original: <a href="${esc(u.url || m.url)}" target="_blank" rel="noopener">Microsoft Learn</a></p></article>`;
    window.scrollTo(0, 0);
  }

  function expedition(u) {
    const m = MOD[u._mod], npc = NPC[m.path], mi = minionFor(u);
    const first = !(S.units[u.id] && S.units[u.id].done);
    const scenes = scenesOf(u), ex = u.exercises || [];
    // Coloca cada pregunta justo después de la escena que trata su contenido.
    const after = placeQuestions(scenes, ex);
    const steps = [];
    scenes.forEach((s, k) => { steps.push({ t: "scene", s, k }); after[k].forEach((q) => steps.push({ t: "fight", q, s })); });
    const arena = Arena({ foe: mi[0], ico: mi[1], hp: Math.max(1, Math.ceil(ex.length * 0.6)), hearts: null, crits: false });
    const res = [], looted = [];
    let si = 0, fightN = 0;

    const track = () => `<div class="track">${steps.map((s, k) => `<i class="${s.t} ${k < si ? "done" : k === si ? "cur" : ""}" title="${s.t === "scene" ? "Escena" : "Combate"}">${s.t === "scene" ? "📜" : "⚔️"}</i>`).join("")}</div>`;
    const header = () => `<button class="back" data-go="unit" data-arg="${u.id}">← Salir de la lección</button>
      <div class="row" style="margin-bottom:8px"><b>${esc(u.title)}</b><span class="spacer"></span><button class="linkbtn" id="scrollBtn">📜 Pergamino</button></div>${track()}`;

    const next = () => { si++; si < steps.length ? render() : finish(); };
    const render = () => {
      disposers.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); disposers = [];
      const step = steps[si];
      app.innerHTML = header();
      $("#scrollBtn").onclick = () => scrollView(u);
      window.scrollTo({ top: 0 });
      if (step.t === "scene") renderScene(step); else renderFight(step);
    };

    function renderScene(step) {
      const sc = step.s;
      const dlg = h(`<div class="dialog"><div class="npc"><div class="portrait talk">${npc.ico}</div><b>${npc.n}</b></div>
        <div class="bubble"><div class="scene-title">Escena ${step.k + 1}/${scenes.length} · ${esc(sc.title)}</div><div class="blocks"></div><div class="loot"></div></div></div>`);
      const actions = h(`<div class="row" style="margin-top:12px"><span class="muted small">Toca el cuadro o pulsa Enter para avanzar</span><span class="spacer"></span><button class="btn" id="adv">▶ Continuar</button></div>`);
      app.appendChild(dlg); app.appendChild(actions);
      const blocksEl = $(".blocks", dlg), adv = $("#adv", actions);
      let bi = 0, typing = null;
      const revealNext = () => {
        if (typing) { typing(); return; }
        if (bi >= sc.blocks.length) return leave();
        const b = sc.blocks[bi++];
        const node = h(`<div class="blk">${blockHTML(b)}</div>`);
        blocksEl.appendChild(node);
        SFX.tick();
        $(".portrait", dlg).classList.add("talk");
        if (["p", "list", "tip", "example"].includes(b.type)) typing = typewrite(node, () => { typing = null; $(".portrait", dlg).classList.remove("talk"); afterReveal(); });
        else { $(".portrait", dlg).classList.remove("talk"); afterReveal(); }
        node.scrollIntoView({ block: "nearest", behavior: "smooth" });
      };
      const afterReveal = () => {
        if (bi < sc.blocks.length) return;
        const drops = grantLoot(lootFor(sc));
        looted.push(...drops);
        if (drops.length) {
          $(".loot", dlg).innerHTML = `<div class="loot-title">🃏 ¡Botín! Nuevas cartas para tu colección:</div>` +
            drops.map((g) => `<span class="card-chip">${esc(g.es)} <span class="en">${esc(g.en)}</span></span>`).join("");
          save();
        }
        const nxt = steps[si + 1];
        adv.textContent = !nxt ? "🏁 Terminar" : nxt.t === "fight" ? `⚔️ ¡Llega un ${mi[0]}!` : "Siguiente escena ➜";
      };
      const leave = () => { SFX.blip(); next(); };
      adv.onclick = revealNext;
      $(".bubble", dlg).onclick = (e) => { if (!e.target.closest("a")) revealNext(); };
      const key = (e) => { if (e.key === "Enter" && !e.target.closest("input,select,textarea")) { e.preventDefault(); revealNext(); } };
      document.addEventListener("keydown", key); onLeave(() => document.removeEventListener("keydown", key));
      revealNext();
    }

    function renderFight(step) {
      fightN++;
      app.appendChild(h(`<p class="encounter">${arena.hp > 0 ? `¡${mi[1]} ${esc(mi[0])} te ataca! (combate ${fightN}/${ex.length})` : `${mi[1]} ${esc(mi[0])} está derrotado: ¡remátalo para ganar monedas! (combate ${fightN}/${ex.length})`}</p>`));
      app.appendChild(arena.el);
      const panel = h(`<div class="panel"></div>`);
      const q = step.q;
      panel.appendChild(questionUI(q, {
        game: true, timed: true, hint: sceneHint(step.s, npc),
        nextLabel: steps[si + 1] ? "Seguir ➜" : "🏁 Terminar",
        onAnswer: (ok) => {
          res.push(ok); arena.strike(ok); record(q, ok);
          if (ok) gain(first ? 5 : 2, first ? 3 : 1); else save();
        },
        onNext: () => next(),
      }));
      app.appendChild(panel);
    }

    function finish() { unitEnd(u, res, first, looted, arena); }
    render();
  }

  function unitEnd(u, res, first, looted, arena) {
    const m = MOD[u._mod], idx = m.units.indexOf(u), next = m.units[idx + 1], mi = minionFor(u);
    const c = res.filter(Boolean).length, n = res.length;
    const prev = S.units[u.id] || {};
    S.units[u.id] = Object.assign(prev, { read: true, done: true, correct: Math.max(c, prev.correct || 0), total: n });
    // Cartas garantizadas de la unidad.
    const extra = grantLoot(GLOSS.filter((g) => g.unit === u.id && !S.loot[g.k]));
    const allLoot = (looted || []).concat(extra);
    if (first) gain(10, 0); else save();
    const won = arena ? arena.hp <= 0 : n ? c / n >= 0.6 : true;
    won ? SFX.win() : SFX.lose();
    app.innerHTML = `<div class="panel result" style="text-align:center;max-width:620px;margin:0 auto">
      <div class="big-emoji">${won ? "🏆" : "💨"}</div>
      <h2>${won ? `¡Has derrotado al ${esc(mi[0])}!` : `El ${esc(mi[0])} ha huido…`}</h2>
      <p class="score-big ${won ? "pass" : "fail"}">${c}/${n}</p>
      <p>${first ? "+10 XP por completar la lección" : "Lección repasada"}${c < n ? " · Los fallos fueron al ⛩️ Templo del Repaso." : ""}</p>
      ${allLoot.length ? `<div class="loot" style="justify-content:center"><div class="loot-title">🃏 Cartas obtenidas en esta lección</div>${allLoot.map((g) => `<span class="card-chip">${esc(g.es)} <span class="en">${esc(g.en)}</span></span>`).join("")}</div>` : ""}
      <div class="row" style="justify-content:center;margin-top:14px">
        <button class="btn sec" data-go="unit" data-arg="${u.id}">Repetir</button>
        ${next ? `<button class="btn" data-go="unit" data-arg="${next.id}">Siguiente unidad →</button>` : `<button class="btn" data-go="zone" data-arg="${m.id}">Ir al guardián ☠</button>`}
      </div></div>`;
  }

  /* ---------------- guardián ---------------- */
  VIEWS.battle = (mid) => {
    const m = MOD[mid]; if (!m) return go("map");
    const qs = shuffle(m.boss || []);
    if (!qs.length) { app.innerHTML = "<p>Este módulo no tiene guardián.</p>"; return; }
    const [bname, bico] = BOSSES[m.id] || ["Guardián", "👾"];
    const need = Math.ceil(qs.length * 0.7);
    let correct = 0;
    fightRun({
      questions: qs, title: `☠ ${esc(bname)}`, back: ["zone", m.id, "Huir del combate"],
      foe: bname, ico: bico, hpNeed: need, hearts: maxHearts(), crits: true, allowFifty: true,
      extra: (arena, getUI) => {
        const bar = h(`<div class="row powerups" style="margin-bottom:12px">
          <button class="btn sec" data-p="potion">🧪 Poción (${S.items.potion})</button>
          <button class="btn sec" data-p="fifty">🎯 50/50 (${S.items.fifty})</button>
          <button class="btn sec" data-p="shield">🛡️ Escudo (${S.items.shield})</button></div>`);
        const refresh = () => {
          const [p, f, s] = bar.querySelectorAll("button");
          p.textContent = `🧪 Poción (${S.items.potion})`; p.disabled = !(S.items.potion && arena.hearts < maxHearts());
          f.textContent = `🎯 50/50 (${S.items.fifty})`; f.disabled = !S.items.fifty;
          s.textContent = `🛡️ Escudo (${S.items.shield})`; s.disabled = !(S.items.shield && !arena.shield);
        };
        bar.onclick = (e) => {
          const b = e.target.closest("[data-p]"); if (!b) return;
          const p = b.dataset.p;
          if (p === "potion" && S.items.potion && arena.hearts < maxHearts()) { S.items.potion--; arena.hearts++; SFX.loot(); toast("🧪 +1 corazón"); }
          else if (p === "shield" && S.items.shield && !arena.shield) { S.items.shield--; arena.shield = true; SFX.loot(); toast("🛡️ Escudo activo"); }
          else if (p === "fifty" && S.items.fifty) { const ui = getUI(); if (ui && ui.canFifty() && ui.useFifty()) { S.items.fifty--; SFX.blip(); } else toast("No se puede usar en esta pregunta"); }
          arena.draw(); save(); refresh();
        };
        refresh();
        return bar;
      },
      onAnswer: (q, ok) => { record(q, ok); if (ok) { correct++; S.coins += 2; SFX.coin(); } },
      stop: (arena) => arena.hp <= 0 || arena.hearts <= 0,
      onFinish: (res, arena) => {
        const won = arena.hp <= 0;
        const prev = S.boss[m.id] || {};
        const first = won && !prev.won;
        S.boss[m.id] = { won: !!(prev.won || won), best: Math.max(prev.best || 0, correct) };
        save();
        if (won) gain(first ? 60 : 15, first ? 25 : 5);
        won ? SFX.win() : SFX.lose();
        const nextMod = DATA.find((x) => x.path === m.path && x.order === m.order + 1);
        app.innerHTML = `<div class="panel result" style="text-align:center;max-width:600px;margin:0 auto">
          <div class="big-emoji">${won ? "👑" : "💀"}</div>
          <h2>${won ? `¡Has derrotado a ${esc(bname)}!` : `${esc(bname)} te ha vencido…`}</h2>
          <p class="score-big ${won ? "pass" : "fail"}">${correct}/${res.length}</p>
          <p class="muted">${won ? (first ? "+60 XP · +25 🪙" + (nextMod ? " · ¡Nueva zona desbloqueada!" : "") + " · Añadido a tu bestiario" : "+15 XP · +5 🪙") : "Repasa la teoría y los errores en el Templo del Repaso, y vuelve a intentarlo."}</p>
          <div class="row" style="justify-content:center">
            <button class="btn sec" data-go="zone" data-arg="${m.id}">Volver a la zona</button>
            ${won ? (nextMod ? `<button class="btn" data-go="zone" data-arg="${nextMod.id}">Siguiente zona →</button>` : `<button class="btn" data-go="map">Al mapa</button>`) : `<button class="btn" data-go="battle" data-arg="${m.id}">Reintentar ⚔️</button>`}
          </div></div>`;
      },
    });
    toast(`¡${bname} aparece! Quítale ${need * 100} PV antes de quedarte sin corazones.`);
  };

  /* ---------------- repaso ---------------- */
  VIEWS.review = () => {
    const keys = Object.keys(S.review).filter((k) => Q[k]);
    const byMod = {};
    keys.forEach((k) => { (byMod[Q[k]._mod] = byMod[Q[k]._mod] || []).push(k); });
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">⛩️ Templo del Repaso</h2>
      <p>Aquí habita el <b>👻 Espíritu del Olvido</b>, que se alimenta de las preguntas que has fallado. Una pregunta queda libre cuando la aciertas <b>2 veces seguidas</b>.</p>
      ${keys.length ? `<p><b>${keys.length}</b> preguntas atrapadas.</p>
        <div class="row"><button class="btn" id="revAll">Combatir (${Math.min(10, keys.length)} preguntas)</button></div>
        <h3>Por módulo</h3><div class="grid g3">${Object.keys(byMod).sort().map((mid) => `<button class="unit-row" data-rev="${mid}"><span class="n">${ICONS[mid]}</span><span class="t"><b>${esc(MOD[mid].title)}</b><small>${byMod[mid].length} pendientes</small></span></button>`).join("")}</div>`
        : `<p style="font-size:40px;margin:0">🌸</p><p>No tienes errores pendientes. ¡Sigue explorando el mapa!</p>`}
      </div>`;
    const run = (ks) => fightRun({
      questions: shuffle(ks).slice(0, 10).map((k) => Q[k]), title: "⛩️ Templo del Repaso", back: ["review", "", "Templo del Repaso"],
      foe: "Espíritu del Olvido", ico: "👻", crits: false,
      onAnswer: (q, ok) => {
        touchDay();
        const a = S.answered[q._key] || (S.answered[q._key] = { ok: 0, ko: 0 });
        ok ? a.ok++ : a.ko++;
        const r = S.review[q._key];
        if (ok) { if (r) { r.streak++; if (r.streak >= 2) { delete S.review[q._key]; S.mastered++; toast("🌸 ¡Pregunta liberada del olvido!"); } } S.xp += 3; S.coins += 1; }
        else S.review[q._key] = { streak: 0, t: Date.now() };
      },
      onFinish: (res) => {
        const c = res.filter(Boolean).length;
        (c / res.length >= 0.6 ? SFX.win : SFX.lose)();
        app.innerHTML = `<div class="panel result" style="text-align:center;max-width:520px;margin:0 auto"><div class="big-emoji">⛩️</div>
          <h2>Sesión de repaso terminada</h2><p class="score-big ${c / res.length >= 0.7 ? "pass" : "fail"}">${c}/${res.length}</p>
          <button class="btn" data-go="review">Volver al templo</button></div>`;
      },
    });
    const ra = $("#revAll"); if (ra) ra.onclick = () => run(keys);
    app.querySelectorAll("[data-rev]").forEach((b) => (b.onclick = () => run(byMod[b.dataset.rev])));
  };

  /* ---------------- biblioteca ---------------- */
  VIEWS.library = (tab) => {
    const G = GLOSS;
    tab = tab || "glossary";
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">📖 Biblioteca</h2>
      <div class="row"><button class="btn ${tab === "glossary" ? "" : "sec"}" data-go="library" data-arg="glossary">Glosario (${G.length})</button>
      <button class="btn ${tab === "cards" ? "" : "sec"}" data-go="library" data-arg="cards">Fichas de memoria</button>
      <button class="btn ${tab === "collection" ? "" : "sec"}" data-go="library" data-arg="collection">🃏 Colección (${lootCount()}/${G.length})</button></div></div>
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
    } else if (tab === "collection") {
      lib.innerHTML = `<p>Consigues cartas leyendo las escenas de cada lección y completando unidades. ¡Colecciónalas todas!</p>
        <div class="row">${modSel}</div><div class="cards-grid" id="cg"></div>`;
      const draw = () => {
        const mf = $("#gm").value;
        $("#cg").innerHTML = G.filter((g) => !mf || g.mods.includes(mf)).map((g) => S.loot[g.k]
          ? `<div class="tcard got" title="${esc(plain(g.def))}"><div class="ci">${ICONS[g.mods[0]]}</div><b>${esc(g.es)}</b><span class="en">${esc(g.en)}</span></div>`
          : `<div class="tcard"><div class="ci">❓</div><b>???</b><span class="muted small">${ICONS[g.mods[0]]} ${esc(MOD[g.mods[0]].title)}</span></div>`).join("");
      };
      $("#gm").onchange = draw; draw();
    } else {
      lib.innerHTML = `<div class="row">${modSel}<select id="gside"><option value="es">Frente: español</option><option value="en">Frente: inglés</option><option value="def">Frente: definición</option></select></div><div id="fc"></div>`;
      let deck = [], idx = 0, known = 0;
      const build = () => { const mf = $("#gm").value; deck = shuffle(G.filter((g) => !mf || g.mods.includes(mf))); idx = 0; known = 0; card(); };
      const card = () => {
        const fc = $("#fc");
        if (!deck.length) { fc.innerHTML = `<p class="muted">No hay fichas.</p>`; return; }
        if (idx >= deck.length) { fc.innerHTML = `<div style="text-align:center"><h3>¡Mazo terminado!</h3><p>Sabías ${known} de ${deck.length}.</p><button class="btn" id="again">Barajar de nuevo</button></div>`; $("#again").onclick = build; SFX.win(); return; }
        const g = deck[idx], side = $("#gside").value;
        const front = side === "es" ? `<h3>${esc(g.es)}</h3>` : side === "en" ? `<h3>${esc(g.en)}</h3>` : `<p>${fmt(g.def)}</p>`;
        fc.innerHTML = `<p class="muted" style="text-align:center">Ficha ${idx + 1}/${deck.length} · toca la ficha para girarla</p>
          <div class="flash" id="flash"><div class="inner"><div class="face">${front}</div>
          <div class="face back-f"><h3>${esc(g.es)}</h3><p class="term"><span class="en">${esc(g.en)}</span></p><p>${fmt(g.def)}</p></div></div></div>
          <div class="row" style="justify-content:center"><button class="btn sec" id="nok">🔁 Repasar</button><button class="btn" id="ok">✔ Lo sé</button></div>`;
        $("#flash").onclick = () => { SFX.blip(); $("#flash").classList.toggle("flip"); };
        $("#ok").onclick = () => { SFX.coin(); known++; idx++; card(); };
        $("#nok").onclick = () => { deck.push(g); idx++; card(); };
      };
      $("#gm").onchange = build; $("#gside").onchange = card; build();
    }
  };

  /* ---------------- tienda ---------------- */
  VIEWS.shop = () => {
    app.innerHTML = `<div class="panel"><h2 style="margin-top:0">🛒 Tienda del Mercader</h2>
      <p>Tienes <b>🪙 ${S.coins}</b>. Ganas monedas acertando preguntas, encadenando críticos y derrotando guardianes.</p>
      <div class="grid g3">${SHOP.map((it) => `<div class="panel" style="text-align:center"><div style="font-size:44px">${it.ico}</div><h3 style="margin:6px 0">${it.n}</h3>
        <p class="muted">${it.d}</p><p>En inventario: <b>${S.items[it.id] || 0}</b></p>
        <button class="btn" data-buy="${it.id}" ${S.coins < it.price ? "disabled" : ""}>Comprar · 🪙 ${it.price}</button></div>`).join("")}</div></div>`;
    app.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
      const it = SHOP.find((x) => x.id === b.dataset.buy);
      if (S.coins < it.price) return;
      S.coins -= it.price; S.items[it.id] = (S.items[it.id] || 0) + 1; SFX.coin(); save(); toast(`${it.ico} ¡${it.n} comprado!`); VIEWS.shop();
    }));
  };

  /* ---------------- progreso ---------------- */
  function objStats() {
    const st = {};
    Object.keys(OBJ).forEach((k) => (st[k] = { ok: 0, tot: 0, bank: 0 }));
    ALLQ.forEach((q) => { if (st[q.obj]) st[q.obj].bank++; });
    Object.entries(S.answered).forEach(([k, a]) => { const q = Q[k]; if (q && st[q.obj]) { st[q.obj].ok += a.ok; st[q.obj].tot += a.ok + a.ko; } });
    return st;
  }
  VIEWS.progress = () => {
    const os = objStats();
    let ok = 0, tot = 0; Object.values(os).forEach((o) => { ok += o.ok; tot += o.tot; });
    const lastExam = S.exams[S.exams.length - 1];
    const color = (p) => (p >= 0.8 ? "var(--green)" : p >= 0.6 ? "var(--gold)" : "var(--red)");
    app.innerHTML = `<div class="grid g3">
        <div class="panel stat"><div class="muted">Unidades</div><div class="v">${doneUnits()}/${TOTAL_UNITS}</div></div>
        <div class="panel stat"><div class="muted">Guardianes</div><div class="v">${bossesWon()}/${DATA.length}</div></div>
        <div class="panel stat"><div class="muted">Precisión global</div><div class="v">${tot ? Math.round((ok / tot) * 100) : 0}%</div></div>
        <div class="panel stat"><div class="muted">Último simulacro</div><div class="v">${lastExam ? lastExam.score : "—"}</div></div>
        <div class="panel stat"><div class="muted">Racha de días</div><div class="v">🔥 ${S.daily.n}</div></div>
        <div class="panel stat"><div class="muted">Mejor combo</div><div class="v">x${S.bestCombo}</div></div>
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
      <div class="panel"><h3 style="margin-top:0">🏆 Logros (${Object.keys(S.ach).length}/${ACH.length})</h3>
        <div class="ach-grid">${ACH.map((a) => `<div class="ach ${S.ach[a.id] ? "got" : ""}"><span class="ai">${S.ach[a.id] ? a.ico : "🔒"}</span><div><b>${a.n}</b><br><small class="muted">${a.d}</small></div></div>`).join("")}</div>
      </div>
      <div class="panel"><h3 style="margin-top:0">📕 Bestiario de guardianes</h3>
        <div class="cards-grid">${DATA.map((m) => { const [n, i] = BOSSES[m.id] || ["Guardián", "👾"]; const b = S.boss[m.id];
          return b && b.won ? `<div class="tcard got"><div class="ci">${i}</div><b>${esc(n)}</b><span class="muted small">${ICONS[m.id]} Mejor: ${b.best}/${(m.boss || []).length}</span></div>`
            : `<div class="tcard"><div class="ci sil">${i}</div><b>???</b><span class="muted small">${ICONS[m.id]} Módulo ${m.order} · Ruta ${m.path}</span></div>`; }).join("")}</div>
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

  /* ---------------- simulacro (formato examen, sin mecánicas de juego) ---------------- */
  VIEWS.exam = () => {
    const bank = ALLQ.length;
    app.innerHTML = `<div class="panel" style="max-width:720px"><h2 style="margin-top:0">🏰 Torre del Examen</h2>
      <p>Simulacro del examen <b>AI-901</b>: preguntas al azar de los 15 módulos, repartidas según el peso de la guía de estudio
      (<b>${GROUPS.A.w}</b> conceptos de IA · <b>${GROUPS.B.w}</b> implementación con Microsoft Foundry). Aquí no hay combates: el formato es como el del examen real y no verás la solución hasta el final.</p>
      <p>Puntuación de 0 a 1000; para aprobar necesitas <b>700</b>. (La puntuación real de Microsoft no es un porcentaje lineal: esto es una aproximación).</p>
      <div class="row"><label>Preguntas: <select id="en"><option>20</option><option selected>45</option><option>60</option></select></label>
      <label>Tiempo: <select id="et"><option value="20">20 min</option><option value="45" selected>45 min</option><option value="60">60 min</option><option value="0">Sin límite</option></select></label></div>
      <p class="muted">Banco disponible: ${bank} preguntas.</p>
      <button class="btn" id="go" ${bank ? "" : "disabled"}>Entrar en la torre</button></div>`;
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
      clearInterval(timer);
      const c = res.filter(Boolean).length;
      const score = Math.round((c / qs.length) * 1000);
      const by = {};
      qs.forEach((q, k) => { const o = (by[q.obj] = by[q.obj] || { ok: 0, n: 0 }); o.n++; if (res[k]) o.ok++; });
      qs.forEach((q, k) => record(q, !!res[k]));
      S.exams.push({ date: Date.now(), n: qs.length, correct: c, score });
      save();
      if (score >= 700) { gain(100, 40); SFX.win(); } else SFX.lose();
      app.innerHTML = `<div class="panel" style="text-align:center"><div class="big-emoji">${score >= 700 ? "🎓" : "📚"}</div>
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
    onLeave(() => clearInterval(timer));
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

  /* ---------------- ajustes ---------------- */
  VIEWS.settings = () => {
    app.innerHTML = `<div class="panel" style="max-width:720px"><h2 style="margin-top:0">⚙️ Ajustes</h2>
      <p><label><input type="checkbox" id="sEn" ${S.settings.en ? "checked" : ""}> Mostrar los términos en inglés junto al español</label></p>
      <p><label><input type="checkbox" id="sSound" ${S.settings.sound !== false ? "checked" : ""}> Sonidos</label></p>
      <p><label><input type="checkbox" id="sTimer" ${S.settings.timer !== false ? "checked" : ""}> Tiempo límite en las preguntas de verdadero/falso de los combates</label></p>
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
    $("#sSound").onchange = (e) => { S.settings.sound = e.target.checked; save(); SFX.coin(); };
    $("#sTimer").onchange = (e) => { S.settings.timer = e.target.checked; save(); };
    $("#sFree").onchange = (e) => { S.settings.free = e.target.checked; save(); };
    $("#sSave").onclick = () => { const n = $("#sName").value.trim(); if (n) S.name = n; S.avatar = $("#sAv").value; save(); toast("Guardado"); };
    $("#exp").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 1)], { type: "application/json" }));
      a.download = "ai901-quest-progreso.json"; a.click();
    };
    $("#imp").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => {
        try {
          const d = JSON.parse(t); if (d.v !== 1) throw 0;
          S = Object.assign(fresh(), d); S.settings = Object.assign(fresh().settings, d.settings || {}); S.daily = Object.assign({ last: "", n: 0 }, d.daily || {});
          save(); toast("Progreso importado"); go("map");
        } catch (_) { toast("Archivo no válido"); }
      });
    };
    $("#reset").onclick = () => { if (confirm("¿Seguro? Se borrará todo tu progreso.")) { S = fresh(); save(); go("title"); } };
  };

  go(S.name ? "map" : "title");
})();
