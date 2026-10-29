/* =========================================================
   TIME TO GRID - main.js
   Grilles + safe zones reseaux sociaux pour AE & Premiere
   ========================================================= */

var cs = new CSInterface();
var HOST = cs.getApplicationID(); // "AEFT" ou "PPRO"
var isAE = HOST === "AEFT";

/* ---------- ETAT ---------- */
var state = {
  platform: "none",       // none | reels | tiktok | shorts
  igBorders: false,       // bandes noires zone d'affichage Insta
  igFeed: false,          // cadre 4:5
  grid: "none",           // none | thirds | center | quarters | golden | diag | custom
  rows: 3,
  cols: 3,
  opacity: 60,            // %
  visible: true
};

/* ---------- SAFE ZONES (coordonnees normalisees 0-1, base 1080x1920) ----------
   margins = zones couvertes par l'UI de l'app (a eviter)               */
var PLATFORMS = {
  reels: {
    label: "INSTAGRAM REELS",
    margins: { top: 0.055, bottom: 0.135, left: 0.02, right: 0.105 },
    display: { top: 0.031, bottom: 0.031 } // bandes noires : zone d'affichage reelle
  },
  tiktok: {
    label: "TIKTOK",
    margins: { top: 0.065, bottom: 0.17, left: 0.02, right: 0.115 }
  },
  shorts: {
    label: "YOUTUBE SHORTS",
    margins: { top: 0.05, bottom: 0.12, left: 0.02, right: 0.105 }
  }
};

/* =========================================================
   GEOMETRIE : genere lignes + rectangles selon l'etat
   Tout est normalise (0-1), converti a l'echelle au dessin
   ========================================================= */
function buildGeometry() {
  var lines = [];  // {x1,y1,x2,y2}
  var rects = [];  // {x,y,w,h, fill:true/false}
  var g = state.grid;

  function vline(x) { lines.push({ x1: x, y1: 0, x2: x, y2: 1 }); }
  function hline(y) { lines.push({ x1: 0, y1: y, x2: 1, y2: y }); }

  if (g === "thirds") { vline(1/3); vline(2/3); hline(1/3); hline(2/3); }
  else if (g === "center") { vline(0.5); hline(0.5); }
  else if (g === "quarters") { vline(0.25); vline(0.5); vline(0.75); hline(0.25); hline(0.5); hline(0.75); }
  else if (g === "golden") { vline(0.382); vline(0.618); hline(0.382); hline(0.618); }
  else if (g === "diag") {
    lines.push({ x1: 0, y1: 0, x2: 1, y2: 1 });
    lines.push({ x1: 1, y1: 0, x2: 0, y2: 1 });
  }
  else if (g === "custom") {
    for (var c = 1; c < state.cols; c++) vline(c / state.cols);
    for (var r = 1; r < state.rows; r++) hline(r / state.rows);
  }

  var p = PLATFORMS[state.platform];
  if (p) {
    var m = p.margins;
    if (m.top)    rects.push({ x: 0, y: 0, w: 1, h: m.top, fill: true });
    if (m.bottom) rects.push({ x: 0, y: 1 - m.bottom, w: 1, h: m.bottom, fill: true });
    if (m.left)   rects.push({ x: 0, y: m.top, w: m.left, h: 1 - m.top - m.bottom, fill: true });
    if (m.right)  rects.push({ x: 1 - m.right, y: m.top, w: m.right, h: 1 - m.top - m.bottom, fill: true });

    if (state.platform === "reels" && state.igBorders && p.display) {
      rects.push({ x: 0, y: 0, w: 1, h: p.display.top, fill: true, solid: true });
      rects.push({ x: 0, y: 1 - p.display.bottom, w: 1, h: p.display.bottom, fill: true, solid: true });
    }
    if (state.platform === "reels" && state.igFeed) {
      // cadre 4:5 centre (1080x1350 sur 1080x1920)
      var fh = (1080 * 5 / 4) / 1920; // ~0.7031
      rects.push({ x: 0, y: (1 - fh) / 2, w: 1, h: fh, fill: false });
    }
  }
  return { lines: lines, rects: rects };
}

/* =========================================================
   RENDU CANVAS (sert pour l'apercu ET le PNG Premiere)
   ========================================================= */
function renderOverlay(canvas, W, H, forExport) {
  canvas.width = W; canvas.height = H;
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  if (!forExport) { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H); }

  var geo = buildGeometry();
  var alpha = state.opacity / 100;
  var lw = Math.max(1, Math.round(W / 540)); // ~2px en 1080

  // zones remplies
  geo.rects.forEach(function (r) {
    if (r.fill) {
      ctx.fillStyle = r.solid
        ? "rgba(255,255,255," + Math.min(1, alpha + 0.15) + ")"
        : "rgba(255,255,255," + alpha * 0.28 + ")";
      ctx.fillRect(r.x * W, r.y * H, r.w * W, r.h * H);
      if (r.solid) {
        // hachures pour les bandes noires Insta
        ctx.save();
        ctx.beginPath();
        ctx.rect(r.x * W, r.y * H, r.w * W, r.h * H);
        ctx.clip();
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = lw;
        var step = W / 18;
        for (var i = -H; i < W + H; i += step) {
          ctx.beginPath();
          ctx.moveTo(i, r.y * H - 2);
          ctx.lineTo(i + r.h * H, (r.y + r.h) * H + 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    } else {
      ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
      ctx.lineWidth = lw;
      ctx.setLineDash([W / 60, W / 90]);
      ctx.strokeRect(r.x * W, r.y * H, r.w * W, r.h * H);
      ctx.setLineDash([]);
    }
  });

  // lignes de grille
  ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
  ctx.lineWidth = lw;
  geo.lines.forEach(function (l) {
    ctx.beginPath();
    ctx.moveTo(l.x1 * W, l.y1 * H);
    ctx.lineTo(l.x2 * W, l.y2 * H);
    ctx.stroke();
  });
}

function refreshPreview() {
  var cv = document.getElementById("preview");
  renderOverlay(cv, 270, 480, false);
}

/* =========================================================
   APPLIQUER
   ========================================================= */
function apply() {
  var geo = buildGeometry();
  if (geo.lines.length === 0 && geo.rects.length === 0) {
    setStatus("RIEN A APPLIQUER");
    return;
  }
  if (isAE) {
    var payload = JSON.stringify({
      lines: geo.lines,
      rects: geo.rects,
      opacity: state.opacity
    });
    setStatus("APPLICATION...");
    cs.evalScript("TTG_buildAE(" + JSON.stringify(payload) + ")", function (res) {
      setStatus(res === "ok" ? "GRILLE APPLIQUEE (CALQUE REPERE)" : "ERREUR : " + res);
      state.visible = true; updateToggleBtn();
    });
  } else {
    setStatus("LECTURE SEQUENCE...");
    cs.evalScript("TTG_getSeqInfo()", function (res) {
      var info;
      try { info = JSON.parse(res); } catch (e) { setStatus("AUCUNE SEQUENCE ACTIVE"); return; }
      if (!info.w) { setStatus("AUCUNE SEQUENCE ACTIVE"); return; }
      exportPngAndPlace(info);
    });
  }
}

function exportPngAndPlace(info) {
  try {
    var fs = require("fs");
    var pathMod = require("path");
    var os = require("os");

    var dir = pathMod.join(os.homedir(), "Documents", "TimeToGrid");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    var cv = document.createElement("canvas");
    renderOverlay(cv, info.w, info.h, true);
    var data = cv.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
    var file = pathMod.join(dir, "TTG_overlay_" + Date.now() + ".png");
    fs.writeFileSync(file, Buffer.from(data, "base64"));

    setStatus("IMPORT DANS PREMIERE...");
    var esc = file.replace(/\\/g, "\\\\");
    cs.evalScript('TTG_placePPRO("' + esc + '")', function (res) {
      setStatus(res === "ok" ? "OVERLAY POSE SUR LA PISTE DU HAUT" : "ERREUR : " + res);
    });
  } catch (e) {
    setStatus("ERREUR PNG : " + e.message);
  }
}

/* ---------- TOGGLE / CLEAR ---------- */
function toggle() {
  if (isAE) {
    cs.evalScript("TTG_toggleAE()", function (res) {
      if (res === "on" || res === "off") {
        state.visible = res === "on";
        updateToggleBtn();
        setStatus(state.visible ? "GRILLE VISIBLE" : "GRILLE MASQUEE");
      } else setStatus("AUCUNE GRILLE. APPLIQUE D'ABORD.");
    });
  } else {
    cs.evalScript("TTG_togglePPRO()", function (res) {
      if (res === "on" || res === "off") {
        state.visible = res === "on";
        updateToggleBtn();
        setStatus(state.visible ? "OVERLAY ACTIF" : "OVERLAY COUPE");
      } else setStatus("AUCUN OVERLAY. APPLIQUE D'ABORD.");
    });
  }
}

function clearAll() {
  var fn = isAE ? "TTG_clearAE()" : "TTG_clearPPRO()";
  cs.evalScript(fn, function (res) {
    setStatus(res === "ok" ? "TOUT EFFACE" : "RIEN A EFFACER");
    state.visible = true; updateToggleBtn();
  });
}

/* ---------- UI ---------- */
function setStatus(msg) {
  document.getElementById("status").textContent = msg;
}

function updateToggleBtn() {
  var b = document.getElementById("btnToggle");
  b.textContent = state.visible ? "ON" : "OFF";
  b.classList.toggle("off", !state.visible);
}

function selectIn(containerId, attr, value) {
  var buttons = document.querySelectorAll("#" + containerId + " .choice");
  buttons.forEach(function (b) {
    b.classList.toggle("active", b.getAttribute(attr) === value);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("hostBadge").textContent = isAE ? "AE" : "PR";

  // tabs
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      document.getElementById("tab-" + t.dataset.tab).classList.add("active");
    });
  });

  // plateformes
  document.querySelectorAll("#platformChoices .choice").forEach(function (b) {
    b.addEventListener("click", function () {
      state.platform = b.dataset.platform;
      selectIn("platformChoices", "data-platform", state.platform);
      refreshPreview();
    });
  });

  // grilles
  document.querySelectorAll("#gridChoices .choice, #customApply").forEach(function (b) {
    b.addEventListener("click", function () {
      state.grid = b.dataset.grid;
      selectIn("gridChoices", "data-grid", state.grid);
      document.getElementById("customApply").classList.toggle("active", state.grid === "custom");
      refreshPreview();
    });
  });

  // switches
  [["swBorders", "igBorders"], ["swFeed", "igFeed"]].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    el.addEventListener("click", function () {
      state[pair[1]] = !state[pair[1]];
      el.setAttribute("aria-checked", state[pair[1]]);
      refreshPreview();
    });
  });

  // steppers
  document.querySelectorAll(".stepper button").forEach(function (b) {
    b.addEventListener("click", function () {
      var a = b.dataset.step;
      if (a === "cols+") state.cols = Math.min(12, state.cols + 1);
      if (a === "cols-") state.cols = Math.max(2, state.cols - 1);
      if (a === "rows+") state.rows = Math.min(12, state.rows + 1);
      if (a === "rows-") state.rows = Math.max(2, state.rows - 1);
      document.getElementById("colsVal").textContent = state.cols;
      document.getElementById("rowsVal").textContent = state.rows;
      if (state.grid === "custom") refreshPreview();
    });
  });

  // opacite
  var op = document.getElementById("opacity");
  op.addEventListener("input", function () {
    state.opacity = parseInt(op.value, 10);
    document.getElementById("opacityVal").textContent = op.value;
    refreshPreview();
  });

  // quick bar
  document.getElementById("btnApply").addEventListener("click", apply);
  document.getElementById("btnToggle").addEventListener("click", toggle);
  document.getElementById("btnClear").addEventListener("click", clearAll);

  refreshPreview();
  setStatus(isAE ? "PRET / AFTER EFFECTS" : "PRET / PREMIERE PRO");
});
