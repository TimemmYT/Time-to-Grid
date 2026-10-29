/* =========================================================
   TIME TO GRID - host.jsx
   Cote hote : AE = calque repere vectoriel / PPRO = overlay PNG
   ========================================================= */

var TTG_LAYER = "TIME TO GRID";
var TTG_BIN = "TIME TO GRID";

/* ------------------- AFTER EFFECTS ------------------- */

function TTG_getComp() {
  var c = app.project.activeItem;
  if (c && c instanceof CompItem) return c;
  return null;
}

function TTG_findAELayer(comp) {
  for (var i = 1; i <= comp.numLayers; i++) {
    if (comp.layer(i).name === TTG_LAYER) return comp.layer(i);
  }
  return null;
}

function TTG_buildAE(payloadStr) {
  try {
    var comp = TTG_getComp();
    if (!comp) return "Ouvre une composition d'abord";
    var data = JSON.parse(payloadStr);
    var W = comp.width, H = comp.height;
    var alpha = data.opacity;

    app.beginUndoGroup("Time to Grid");

    var old = TTG_findAELayer(comp);
    if (old) { old.locked = false; old.remove(); }

    var layer = comp.layers.addShape();
    layer.name = TTG_LAYER;
    layer.guideLayer = true;      // jamais rendu a l'export
    layer.label = 0;              // sans couleur d'etiquette
    layer.moveToBeginning();

    var contents = layer.property("ADBE Root Vectors Group");

    function px(nx) { return (nx - 0.5) * W; }
    function py(ny) { return (ny - 0.5) * H; }

    // rectangles (safe zones)
    for (var r = 0; r < data.rects.length; r++) {
      var rc = data.rects[r];
      var grp = contents.addProperty("ADBE Vector Group");
      grp.name = rc.fill ? "ZONE" : "CADRE";
      var vg = grp.property("ADBE Vectors Group");
      var rect = vg.addProperty("ADBE Vector Shape - Rect");
      rect.property("ADBE Vector Rect Size").setValue([rc.w * W, rc.h * H]);
      rect.property("ADBE Vector Rect Position").setValue([
        px(rc.x + rc.w / 2), py(rc.y + rc.h / 2)
      ]);
      if (rc.fill) {
        var fill = vg.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
        fill.property("ADBE Vector Fill Opacity").setValue(rc.solid ? Math.min(100, alpha + 15) : alpha * 0.28);
      } else {
        var st = vg.addProperty("ADBE Vector Graphic - Stroke");
        st.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
        st.property("ADBE Vector Stroke Width").setValue(Math.max(2, W / 540));
        st.property("ADBE Vector Stroke Opacity").setValue(alpha);
        var dash = st.property("Dashes");
        try { dash.addProperty("ADBE Vector Stroke Dash 1").setValue(W / 60); } catch (e) {}
      }
    }

    // lignes de grille
    for (var l = 0; l < data.lines.length; l++) {
      var ln = data.lines[l];
      var g2 = contents.addProperty("ADBE Vector Group");
      g2.name = "LIGNE";
      var vg2 = g2.property("ADBE Vectors Group");
      var pathProp = vg2.addProperty("ADBE Vector Shape - Group");
      var shape = new Shape();
      shape.vertices = [[px(ln.x1), py(ln.y1)], [px(ln.x2), py(ln.y2)]];
      shape.closed = false;
      pathProp.property("ADBE Vector Shape").setValue(shape);
      var st2 = vg2.addProperty("ADBE Vector Graphic - Stroke");
      st2.property("ADBE Vector Stroke Color").setValue([1, 1, 1]);
      st2.property("ADBE Vector Stroke Width").setValue(Math.max(2, W / 540));
      st2.property("ADBE Vector Stroke Opacity").setValue(alpha);
    }

    layer.locked = true;
    app.endUndoGroup();
    return "ok";
  } catch (err) {
    try { app.endUndoGroup(); } catch (e2) {}
    return err.toString();
  }
}

function TTG_toggleAE() {
  var comp = TTG_getComp();
  if (!comp) return "none";
  var layer = TTG_findAELayer(comp);
  if (!layer) return "none";
  layer.locked = false;
  layer.enabled = !layer.enabled;
  layer.locked = true;
  return layer.enabled ? "on" : "off";
}

function TTG_clearAE() {
  var comp = TTG_getComp();
  if (!comp) return "none";
  var layer = TTG_findAELayer(comp);
  if (!layer) return "none";
  app.beginUndoGroup("Time to Grid - Effacer");
  layer.locked = false;
  layer.remove();
  app.endUndoGroup();
  return "ok";
}

/* ------------------- PREMIERE PRO ------------------- */

function TTG_getSeqInfo() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "{}";
    var s = seq.getSettings();
    return '{"w":' + s.videoFrameWidth + ',"h":' + s.videoFrameHeight + '}';
  } catch (e) { return "{}"; }
}

function TTG_getBin() {
  var root = app.project.rootItem;
  for (var i = 0; i < root.children.numItems; i++) {
    if (root.children[i].name === TTG_BIN) return root.children[i];
  }
  return root.createBin(TTG_BIN);
}

function TTG_placePPRO(filePath) {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "Aucune sequence active";

    // retirer les anciens overlays d'abord
    TTG_clearPPRO();

    var bin = TTG_getBin();
    app.project.importFiles([filePath], true, bin, false);

    var item = null;
    for (var i = bin.children.numItems - 1; i >= 0; i--) {
      if (bin.children[i].name.indexOf("TTG_overlay") === 0) { item = bin.children[i]; break; }
    }
    if (!item) return "Import PNG echoue";

    // piste video la plus haute ; en creer une si occupee
    var tracks = seq.videoTracks;
    var top = tracks[tracks.numTracks - 1];
    if (top.clips.numItems > 0) {
      try {
        app.enableQE();
        qe.project.getActiveSequence().addTracks(1, tracks.numTracks, 0, 0, 0);
        tracks = app.project.activeSequence.videoTracks;
        top = tracks[tracks.numTracks - 1];
      } catch (eq) { /* on posera sur la piste du haut existante */ }
    }

    top.overwriteClip(item, 0);

    // etendre le clip sur toute la sequence si possible
    try {
      var clip = top.clips[top.clips.numItems - 1];
      clip.end = seq.end;
    } catch (e2) {}

    return "ok";
  } catch (err) {
    return err.toString();
  }
}

function TTG_findOverlayTrack() {
  var seq = app.project.activeSequence;
  if (!seq) return null;
  for (var t = seq.videoTracks.numTracks - 1; t >= 0; t--) {
    var tr = seq.videoTracks[t];
    for (var c = 0; c < tr.clips.numItems; c++) {
      if (tr.clips[c].name.indexOf("TTG_overlay") === 0) return { track: tr, index: t };
    }
  }
  return null;
}

function TTG_togglePPRO() {
  var found = TTG_findOverlayTrack();
  if (!found) return "none";
  var muted = found.track.isMuted();
  found.track.setMute(muted ? 0 : 1);
  return muted ? "on" : "off";
}

function TTG_clearPPRO() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return "none";
    var removed = false;
    for (var t = 0; t < seq.videoTracks.numTracks; t++) {
      var tr = seq.videoTracks[t];
      for (var c = tr.clips.numItems - 1; c >= 0; c--) {
        var clip = tr.clips[c];
        if (clip.name.indexOf("TTG_overlay") === 0) {
          try { clip.remove(false, false); removed = true; } catch (e) {}
        }
      }
      if (tr.isMuted()) tr.setMute(0);
    }
    return removed ? "ok" : "none";
  } catch (err) { return err.toString(); }
}
