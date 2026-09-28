const SCALE = 20;
const ROOM = { width: 60, depth: 40 };
const SVG_NS = "http://www.w3.org/2000/svg";

const FIXTURE_TYPES = {
  gondola: {
    name: "Double-sided gondola", short: "Gondola", category: "Merchandising", width: 8, depth: 3,
    color: "#dbeadf", accent: "#638e72", preview: "gondola", linear: f => f.width * 2, bays: f => Math.max(1, Math.round(f.width / 4)) * 2
  },
  wall: {
    name: "Wall merchandising bay", short: "Wall bay", category: "Merchandising", width: 4, depth: 1.5,
    color: "#e5e0f1", accent: "#7f6aa7", preview: "wall", linear: f => f.width, bays: f => Math.max(1, Math.round(f.width / 4))
  },
  fourway: {
    name: "Four-way apparel rack", short: "4-way rack", category: "Apparel", width: 4, depth: 4,
    color: "#d9eaf2", accent: "#57829b", preview: "fourway", linear: () => 0, bays: () => 0
  },
  round: {
    name: "Round apparel rack", short: "Round rack", category: "Apparel", width: 4, depth: 4,
    color: "#f2e2d6", accent: "#ad7957", preview: "round", linear: () => 0, bays: () => 0
  },
  table: {
    name: "Nesting display table", short: "Display table", category: "Apparel", width: 6, depth: 3,
    color: "#f4e6bd", accent: "#a58935", preview: "table", linear: () => 0, bays: () => 0
  },
  checkout: {
    name: "Checkout counter", short: "Checkout", category: "Service", width: 6, depth: 3,
    color: "#d9e7e6", accent: "#487f7b", preview: "checkout", linear: () => 0, bays: () => 0
  },
  queue: {
    name: "Managed queue", short: "Queue", category: "Service", width: 10, depth: 4,
    color: "#f5dddd", accent: "#a85f60", preview: "queue", linear: () => 0, bays: () => 0
  },
  service: {
    name: "Service / pickup desk", short: "Service desk", category: "Service", width: 8, depth: 3,
    color: "#dce5ec", accent: "#526f83", preview: "service", linear: () => 0, bays: () => 0
  }
};

const state = {
  fixtures: [],
  selectedIds: [],
  selectedId: null,
  zoom: 1,
  history: [],
  historyIndex: -1,
  interaction: null
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  Object.assign(els, {
    library: document.getElementById("fixtureLibrary"),
    layer: document.getElementById("fixtureLayer"),
    svg: document.getElementById("storeSvg"),
    scroll: document.getElementById("canvasScroll"),
    zoomWrap: document.getElementById("canvasZoom"),
    hint: document.getElementById("canvasHint"),
    empty: document.getElementById("emptySelection"),
    selectionMessage: document.getElementById("selectionMessage"),
    form: document.getElementById("fixtureForm"),
    label: document.getElementById("labelInput"),
    width: document.getElementById("widthInput"),
    depth: document.getElementById("depthInput"),
    x: document.getElementById("xInput"),
    y: document.getElementById("yInput"),
    rotation: document.getElementById("rotationInput"),
    rotationRange: document.getElementById("rotationRange"),
    typeName: document.getElementById("typeName"),
    typeSwatch: document.getElementById("typeSwatch"),
    tallyBody: document.getElementById("tallyBody"),
    tallyTotal: document.getElementById("tallyTotal"),
    coverage: document.getElementById("coverageValue"),
    bays: document.getElementById("bayValue"),
    undo: document.getElementById("undoBtn"),
    redo: document.getElementById("redoBtn"),
    rotate: document.getElementById("rotateBtn"),
    duplicate: document.getElementById("duplicateBtn"),
    delete: document.getElementById("deleteBtn"),
    snap: document.getElementById("snapToggle"),
    snapSize: document.getElementById("snapSize"),
    zoomLabel: document.getElementById("zoomLabel"),
    toast: document.getElementById("toast"),
    saveState: document.getElementById("saveState")
  });

  renderLibrary();
  bindControls();
  const saved = loadSavedPlan();
  state.fixtures = saved ?? sampleFixtures();
  state.history = [serializeFixtures()];
  state.historyIndex = 0;
  render();
});

function renderLibrary() {
  let currentCategory = "";
  els.library.innerHTML = "";
  Object.entries(FIXTURE_TYPES).forEach(([key, type]) => {
    if (type.category !== currentCategory) {
      currentCategory = type.category;
      const category = document.createElement("p");
      category.className = "fixture-category";
      category.textContent = currentCategory;
      els.library.appendChild(category);
    }
    const card = document.createElement("div");
    card.className = "fixture-card";
    card.draggable = true;
    card.dataset.type = key;
    card.title = `Drag ${type.name} onto the floor`;
    card.innerHTML = `
      <div class="fixture-preview ${type.preview}" style="background:${type.color};color:${type.accent}"></div>
      <div class="fixture-copy"><strong>${type.short}</strong><small>${formatFeet(type.width)} × ${formatFeet(type.depth)}</small></div>
      <button class="add-fixture" type="button" aria-label="Add ${type.name}">+</button>`;
    card.querySelector("button").addEventListener("click", () => addFixture(key));
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/fixture-type", key);
      e.dataTransfer.effectAllowed = "copy";
    });
    els.library.appendChild(card);
  });
}

function bindControls() {
  els.svg.addEventListener("pointerdown", onCanvasPointerDown);
  els.svg.addEventListener("pointermove", onCanvasPointerMove);
  els.svg.addEventListener("pointerup", endInteraction);
  els.svg.addEventListener("pointercancel", endInteraction);
  els.svg.addEventListener("dragover", e => { e.preventDefault(); els.scroll.classList.add("drop-active"); });
  els.svg.addEventListener("dragleave", () => els.scroll.classList.remove("drop-active"));
  els.svg.addEventListener("drop", e => {
    e.preventDefault();
    els.scroll.classList.remove("drop-active");
    const type = e.dataTransfer.getData("text/fixture-type");
    if (!FIXTURE_TYPES[type]) return;
    const point = clientToSvg(e.clientX, e.clientY);
    addFixture(type, point.x / SCALE, point.y / SCALE);
  });

  els.rotate.addEventListener("click", rotateSelected);
  els.duplicate.addEventListener("click", duplicateSelected);
  els.delete.addEventListener("click", deleteSelected);
  document.getElementById("inspectorDuplicate").addEventListener("click", duplicateSelected);
  document.getElementById("inspectorDelete").addEventListener("click", deleteSelected);
  els.undo.addEventListener("click", undo);
  els.redo.addEventListener("click", redo);
  document.getElementById("zoomInBtn").addEventListener("click", () => setZoom(state.zoom + .25));
  document.getElementById("zoomOutBtn").addEventListener("click", () => setZoom(state.zoom - .25));
  document.getElementById("loadSampleBtn").addEventListener("click", () => {
    state.fixtures = sampleFixtures(); setSelection([]); commit("Sample layout loaded"); render();
  });
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!state.fixtures.length) return;
    state.fixtures = []; setSelection([]); commit("Floor cleared"); render();
  });

  const fieldMap = [
    [els.label, "label", v => v.trim() || "Fixture"],
    [els.width, "width", parseDimension],
    [els.depth, "depth", parseDimension],
    [els.x, "x", v => clamp(Number(v), 0, ROOM.width)],
    [els.y, "y", v => clamp(Number(v), 0, ROOM.depth)],
    [els.rotation, "rotation", v => normalizeAngle(Number(v))]
  ];
  fieldMap.forEach(([input, prop, parse]) => {
    input.addEventListener("change", () => updateSelected(prop, parse(input.value), true));
  });
  els.rotationRange.addEventListener("input", () => updateSelected("rotation", Number(els.rotationRange.value), false));
  els.rotationRange.addEventListener("change", () => commit("Rotation updated"));

  document.addEventListener("keydown", e => {
    const editing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || "");
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
    if (editing) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault(); setSelection(state.fixtures.map(f => f.id)); render(); return;
    }
    if (e.key === "Escape" && selectedFixtures().length) { setSelection([]); render(); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && selectedFixtures().length) { e.preventDefault(); deleteSelected(); }
    if (e.key.toLowerCase() === "r" && selectedFixtures().length) { e.preventDefault(); rotateSelected(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedFixtures().length) { e.preventDefault(); duplicateSelected(); }
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && selectedFixtures().length) {
      e.preventDefault();
      const step = e.shiftKey ? .25 : getSnap();
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      const count = moveSelectedBy(dx, dy);
      commit(count > 1 ? `${count} fixtures moved` : "Fixture moved"); render();
    }
  });
}

function addFixture(typeKey, x = ROOM.width / 2, y = ROOM.depth / 2) {
  const type = FIXTURE_TYPES[typeKey];
  const count = state.fixtures.filter(f => f.type === typeKey).length + 1;
  const offset = ((state.fixtures.length % 5) - 2) * .75;
  const fixture = {
    id: makeId(), type: typeKey, label: `${type.short} ${count}`,
    width: type.width, depth: type.depth,
    x: snap(x + (arguments.length < 2 ? offset : 0)), y: snap(y + (arguments.length < 2 ? offset : 0)), rotation: 0
  };
  constrainFixture(fixture);
  state.fixtures.push(fixture);
  setSelection([fixture.id], fixture.id);
  commit(`${type.short} added`);
  render();
}

function sampleFixtures() {
  const items = [
    ["wall", "New arrivals", 8, 1.5, 6, 1.5, 0],
    ["wall", "Seasonal wall", 12, 1.5, 18, 1.5, 0],
    ["wall", "Core wall", 16, 1.5, 34, 1.5, 0],
    ["wall", "Accessories", 10, 1.5, 51, 1.5, 0],
    ["gondola", "Gondola A", 12, 3, 14, 13, 0],
    ["gondola", "Gondola B", 12, 3, 14, 20, 0],
    ["gondola", "Gondola C", 12, 3, 14, 27, 0],
    ["fourway", "Feature rack", 4, 4, 31, 12, 0],
    ["round", "Promo rack", 4, 4, 38, 12, 0],
    ["table", "Feature table", 6, 3, 34.5, 20, 0],
    ["fourway", "Apparel rack 1", 4, 4, 31, 28, 0],
    ["fourway", "Apparel rack 2", 4, 4, 39, 28, 0],
    ["service", "Pickup", 8, 3, 52, 8, 90],
    ["checkout", "Checkout", 7, 3, 49, 32, 0],
    ["queue", "Queue", 9, 4, 49, 26, 0]
  ];
  return items.map(([type, label, width, depth, x, y, rotation]) => ({ id: makeId(), type, label, width, depth, x, y, rotation }));
}

function render() {
  renderCanvas();
  renderInspector();
  renderTally();
  updateToolbar();
  savePlan();
}

function renderCanvas() {
  els.layer.innerHTML = "";
  state.fixtures.forEach(fixture => els.layer.appendChild(createFixtureGroup(fixture)));
}

function createFixtureGroup(f) {
  const type = FIXTURE_TYPES[f.type];
  const w = f.width * SCALE;
  const d = f.depth * SCALE;
  const g = svgEl("g", {
    class: `fixture${isSelected(f.id) ? " selected" : ""}${f.id === state.selectedId ? " primary" : ""}`,
    "data-id": f.id,
    transform: `translate(${f.x * SCALE} ${f.y * SCALE}) rotate(${f.rotation})`,
    tabindex: "0",
    role: "button",
    "aria-label": `${f.label}, ${formatFeet(f.width)} by ${formatFeet(f.depth)}`
  });

  const shape = fixtureShape(f, type, w, d);
  shape.forEach(node => g.appendChild(node));

  const label = svgEl("text", { class: "fixture-label", x: 0, y: 0 });
  label.textContent = truncateLabel(f.label, f.width);
  g.appendChild(label);

  const dim = svgEl("text", { class: "dimension-label", x: 0, y: d / 2 + 10 });
  dim.textContent = `${formatFeet(f.width)} × ${formatFeet(f.depth)}`;
  g.appendChild(dim);

  g.appendChild(svgEl("rect", { class: "selection-outline", x: -w/2 - 4, y: -d/2 - 4, width: w + 8, height: d + 8, rx: 3 }));
  [[-w/2,-d/2,"nw"],[w/2,-d/2,"ne"],[w/2,d/2,"se"],[-w/2,d/2,"sw"]].forEach(([x,y,h]) => {
    g.appendChild(svgEl("rect", { class: "resize-handle", "data-handle": h, x: x-5, y: y-5, width: 10, height: 10, rx: 2 }));
  });
  g.appendChild(svgEl("line", { class: "rotation-stem", x1: 0, y1: -d/2-4, x2: 0, y2: -d/2-25 }));
  g.appendChild(svgEl("circle", { class: "rotation-handle", "data-rotate-handle": "true", cx: 0, cy: -d/2-28, r: 7 }));
  return g;
}

function fixtureShape(f, type, w, d) {
  const nodes = [];
  const baseAttrs = { class: "fixture-body", fill: type.color, stroke: type.accent };
  if (f.type === "round") {
    nodes.push(svgEl("ellipse", { ...baseAttrs, cx: 0, cy: 0, rx: w/2, ry: d/2 }));
    nodes.push(svgEl("ellipse", { class: "fixture-detail", cx: 0, cy: 0, rx: Math.max(4,w/2-7), ry: Math.max(4,d/2-7) }));
    nodes.push(svgEl("circle", { class: "fixture-detail filled", cx: 0, cy: 0, r: 4 }));
  } else if (f.type === "fourway") {
    nodes.push(svgEl("rect", { ...baseAttrs, x: -w/2, y: -d/2, width: w, height: d, rx: Math.min(12,d/4) }));
    nodes.push(svgEl("path", { class: "fixture-detail", d: `M${-w*.32} ${-d*.32}L${w*.32} ${d*.32}M${w*.32} ${-d*.32}L${-w*.32} ${d*.32}M0 ${-d*.42}V${d*.42}M${-w*.42} 0H${w*.42}` }));
  } else if (f.type === "queue") {
    nodes.push(svgEl("rect", { ...baseAttrs, x: -w/2, y: -d/2, width: w, height: d, rx: 5, "stroke-dasharray": "7 4", "fill-opacity": ".72" }));
    const posts = [[-w*.38,-d*.25],[0,-d*.25],[w*.38,-d*.25],[-w*.38,d*.25],[0,d*.25],[w*.38,d*.25]];
    posts.forEach(([x,y]) => nodes.push(svgEl("circle", { class: "fixture-detail filled", cx:x, cy:y, r:3 })));
  } else if (f.type === "checkout") {
    nodes.push(svgEl("rect", { ...baseAttrs, x: -w/2, y: -d/2, width: w, height: d, rx: 5 }));
    nodes.push(svgEl("rect", { class: "fixture-detail filled", x: w/2-22, y: -d/2+7, width: 14, height: 12, rx: 2 }));
    nodes.push(svgEl("path", { class: "fixture-detail", d: `M${-w/2+12} ${-d/2+10}H${w/2-30}M${-w/2+12} ${d/2-10}H${w/2-12}` }));
  } else if (f.type === "service") {
    nodes.push(svgEl("rect", { ...baseAttrs, x: -w/2, y: -d/2, width: w, height: d, rx: 4 }));
    nodes.push(svgEl("rect", { class: "fixture-detail filled", x: -w*.24, y: -d*.22, width: w*.48, height: d*.44, rx: 2 }));
  } else {
    nodes.push(svgEl("rect", { ...baseAttrs, x: -w/2, y: -d/2, width: w, height: d, rx: f.type === "table" ? 5 : 2 }));
    if (f.type === "gondola") {
      nodes.push(svgEl("line", { class: "fixture-detail", x1: -w/2+7, y1: 0, x2: w/2-7, y2: 0 }));
      nodes.push(svgEl("line", { class: "fixture-detail", x1: -w/2+5, y1: -d/2+4, x2: -w/2+5, y2: d/2-4 }));
      nodes.push(svgEl("line", { class: "fixture-detail", x1: w/2-5, y1: -d/2+4, x2: w/2-5, y2: d/2-4 }));
      for (let x = -w/2 + 4*SCALE; x < w/2; x += 4*SCALE) nodes.push(svgEl("line", { class: "fixture-detail", x1:x, y1:-d/2, x2:x, y2:d/2 }));
    }
    if (f.type === "wall") {
      nodes.push(svgEl("line", { class: "fixture-detail", x1: -w/2, y1: -d/2+4, x2: w/2, y2: -d/2+4, "stroke-width": 3 }));
      for (let x = -w/2 + 4*SCALE; x < w/2; x += 4*SCALE) nodes.push(svgEl("line", { class: "fixture-detail", x1:x, y1:-d/2, x2:x, y2:d/2 }));
    }
    if (f.type === "table") nodes.push(svgEl("rect", { class: "fixture-detail", x:-w*.39, y:-d*.29, width:w*.78, height:d*.58, rx:3 }));
  }
  return nodes;
}

function onCanvasPointerDown(e) {
  const fixtureNode = e.target.closest?.(".fixture");
  if (!fixtureNode) {
    if (!e.shiftKey) setSelection([]);
    render(); return;
  }
  e.preventDefault();
  const id = fixtureNode.dataset.id;
  const handle = e.target.dataset?.handle;
  const isRotate = e.target.dataset?.rotateHandle === "true";
  if (e.shiftKey && !handle && !isRotate) {
    toggleSelection(id);
    render();
    return;
  }
  if (!isSelected(id)) setSelection([id], id);
  else state.selectedId = id;
  const fixture = selectedFixture();
  const point = clientToSvg(e.clientX, e.clientY);
  const original = structuredClone(fixture);
  const originals = structuredClone(selectedFixtures());
  let mode = "drag";
  if (handle) mode = "resize";
  if (isRotate) mode = "rotate";
  state.interaction = { pointerId: e.pointerId, mode, handle, start: point, original, originals, changed: false };
  els.svg.setPointerCapture(e.pointerId);
  render();
}

function onCanvasPointerMove(e) {
  const i = state.interaction;
  if (!i || i.pointerId !== e.pointerId) return;
  const fixture = selectedFixture();
  if (!fixture) return;
  const p = clientToSvg(e.clientX, e.clientY);
  if (i.mode === "drag") {
    const desiredX = snap((p.x - i.start.x) / SCALE);
    const desiredY = snap((p.y - i.start.y) / SCALE);
    const delta = constrainGroupDelta(i.originals, desiredX, desiredY);
    i.originals.forEach(originalFixture => {
      const current = state.fixtures.find(f => f.id === originalFixture.id);
      if (!current) return;
      current.x = cleanNumber(originalFixture.x + delta.x);
      current.y = cleanNumber(originalFixture.y + delta.y);
    });
  } else if (i.mode === "rotate") {
    const angle = Math.atan2(p.y - i.original.y*SCALE, p.x - i.original.x*SCALE) * 180 / Math.PI;
    fixture.rotation = normalizeAngle(snapAngle(angle + 90));
    constrainFixture(fixture);
  } else if (i.mode === "resize") {
    resizeFromHandle(fixture, i.original, i.handle, p);
  }
  i.changed = true;
  render();
}

function endInteraction(e) {
  const i = state.interaction;
  if (!i || i.pointerId !== e.pointerId) return;
  if (els.svg.hasPointerCapture(e.pointerId)) els.svg.releasePointerCapture(e.pointerId);
  state.interaction = null;
  if (i.changed) {
    const count = i.mode === "drag" ? i.originals.length : 1;
    commit(i.mode === "drag" && count > 1 ? `${count} fixtures moved` : i.mode === "drag" ? "Fixture moved" : i.mode === "resize" ? "Fixture resized" : "Fixture rotated");
  }
  render();
}

function resizeFromHandle(fixture, original, handle, worldPoint) {
  const sx = handle.includes("e") ? 1 : -1;
  const sy = handle.includes("s") ? 1 : -1;
  const center = { x: original.x*SCALE, y: original.y*SCALE };
  const localPointer = rotatePoint(worldPoint.x-center.x, worldPoint.y-center.y, -original.rotation);
  const anchor = { x: -sx * original.width*SCALE/2, y: -sy * original.depth*SCALE/2 };
  const minW = 1*SCALE, minD = 1*SCALE;
  const pointerX = sx > 0 ? Math.max(anchor.x+minW, localPointer.x) : Math.min(anchor.x-minW, localPointer.x);
  const pointerY = sy > 0 ? Math.max(anchor.y+minD, localPointer.y) : Math.min(anchor.y-minD, localPointer.y);
  const newW = snap(Math.abs(pointerX-anchor.x)/SCALE);
  const newD = snap(Math.abs(pointerY-anchor.y)/SCALE);
  const localCenter = { x:(pointerX+anchor.x)/2, y:(pointerY+anchor.y)/2 };
  const centerShift = rotatePoint(localCenter.x, localCenter.y, original.rotation);
  fixture.width = parseDimension(newW);
  fixture.depth = parseDimension(newD);
  fixture.x = snap((center.x + centerShift.x)/SCALE);
  fixture.y = snap((center.y + centerShift.y)/SCALE);
  constrainFixture(fixture);
}

function renderInspector() {
  const selection = selectedFixtures();
  const f = selectedFixture();
  const isSingle = selection.length === 1 && Boolean(f);
  els.empty.hidden = isSingle;
  els.form.hidden = !isSingle;
  if (!isSingle) {
    els.selectionMessage.textContent = selection.length > 1
      ? `${selection.length} fixtures selected. Drag any selected fixture to move the group while preserving its spacing.`
      : "Select a fixture on the floor to edit its label, size, position, and rotation. Hold Shift to select multiple fixtures.";
    if (selection.length > 1) els.hint.textContent = `${selection.length} fixtures selected · drag any selected fixture to move together`;
    return;
  }
  const type = FIXTURE_TYPES[f.type];
  els.label.value = f.label;
  els.width.value = cleanNumber(f.width);
  els.depth.value = cleanNumber(f.depth);
  els.x.value = cleanNumber(f.x);
  els.y.value = cleanNumber(f.y);
  els.rotation.value = Math.round(normalizeAngle(f.rotation));
  els.rotationRange.value = Math.round(normalizeAngle(f.rotation));
  els.typeName.textContent = type.name;
  els.typeSwatch.style.background = type.accent;
  els.hint.textContent = `${f.label} · ${formatFeet(f.width)} × ${formatFeet(f.depth)} · ${Math.round(f.rotation)}°`;
}

function renderTally() {
  els.tallyTotal.textContent = state.fixtures.length;
  const coverage = state.fixtures.reduce((sum,f) => sum + f.width*f.depth,0) / (ROOM.width*ROOM.depth) * 100;
  const bays = state.fixtures.reduce((sum,f) => sum + FIXTURE_TYPES[f.type].bays(f),0);
  els.coverage.textContent = `${coverage.toFixed(1)}%`;
  els.bays.textContent = bays;
  if (!state.fixtures.length) {
    els.tallyBody.innerHTML = `<tr class="empty-row"><td colspan="3">No fixtures placed</td></tr>`;
    return;
  }
  const grouped = {};
  state.fixtures.forEach(f => {
    grouped[f.type] ||= { qty:0, linear:0 };
    grouped[f.type].qty += 1;
    grouped[f.type].linear += FIXTURE_TYPES[f.type].linear(f);
  });
  els.tallyBody.innerHTML = Object.entries(grouped).map(([key,val]) => `
    <tr><td>${FIXTURE_TYPES[key].short}</td><td>${val.qty}</td><td>${val.linear ? cleanNumber(val.linear) + "′" : "—"}</td></tr>`).join("");
}

function updateToolbar() {
  const count = selectedFixtures().length;
  const selected = count > 0;
  [els.rotate, els.duplicate, els.delete].forEach(btn => btn.disabled = !selected);
  els.undo.disabled = state.historyIndex <= 0;
  els.redo.disabled = state.historyIndex >= state.history.length - 1;
  if (!selected) els.hint.textContent = "Select a fixture to edit its dimensions";
}

function updateSelected(prop, value, shouldCommit) {
  const f = selectedFixture();
  if (!f || value === undefined || Number.isNaN(value)) return;
  f[prop] = value;
  if (prop === "rotation") f.rotation = normalizeAngle(value);
  if (["width","depth","x","y","rotation"].includes(prop)) constrainFixture(f);
  if (shouldCommit) commit(`${prop[0].toUpperCase()+prop.slice(1)} updated`);
  render();
}

function rotateSelected() {
  const fixtures = selectedFixtures(); if (!fixtures.length) return;
  fixtures.forEach(f => { f.rotation = normalizeAngle(f.rotation + 90); });
  const delta = constrainGroupDelta(fixtures, 0, 0);
  fixtures.forEach(f => { f.x = cleanNumber(f.x + delta.x); f.y = cleanNumber(f.y + delta.y); });
  commit(fixtures.length > 1 ? `${fixtures.length} fixtures rotated` : "Fixture rotated"); render();
}

function duplicateSelected() {
  const fixtures = selectedFixtures(); if (!fixtures.length) return;
  const primaryIndex = Math.max(0, fixtures.findIndex(f => f.id === state.selectedId));
  const copies = fixtures.map(f => ({ ...structuredClone(f), id: makeId(), label: `${f.label} copy` }));
  const delta = constrainGroupDelta(copies, 2, 2);
  copies.forEach(copy => { copy.x = cleanNumber(copy.x + delta.x); copy.y = cleanNumber(copy.y + delta.y); });
  state.fixtures.push(...copies);
  setSelection(copies.map(copy => copy.id), copies[primaryIndex].id);
  commit(copies.length > 1 ? `${copies.length} fixtures duplicated` : "Fixture duplicated"); render();
}

function deleteSelected() {
  const ids = new Set(state.selectedIds); if (!ids.size) return;
  const count = ids.size;
  state.fixtures = state.fixtures.filter(item => !ids.has(item.id));
  setSelection([]);
  commit(count > 1 ? `${count} fixtures deleted` : "Fixture deleted"); render();
}

function commit(message) {
  const snapshot = serializeFixtures();
  if (snapshot === state.history[state.historyIndex]) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > 50) state.history.shift();
  state.historyIndex = state.history.length - 1;
  showToast(message);
}

function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--; restoreSnapshot(); showToast("Undone");
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex++; restoreSnapshot(); showToast("Redone");
}

function restoreSnapshot() {
  state.fixtures = JSON.parse(state.history[state.historyIndex]);
  normalizeSelection();
  render();
}

function setZoom(value) {
  state.zoom = clamp(value,.5,2);
  els.zoomWrap.style.width = `${state.zoom*100}%`;
  els.zoomLabel.textContent = `${Math.round(state.zoom*100)}%`;
}

function selectedFixtures() {
  const ids = new Set(state.selectedIds);
  return state.fixtures.filter(f => ids.has(f.id));
}
function selectedFixture() { return state.fixtures.find(f => f.id === state.selectedId && isSelected(f.id)) || null; }
function isSelected(id) { return state.selectedIds.includes(id); }
function setSelection(ids, primaryId = ids.at(-1) || null) {
  const available = new Set(state.fixtures.map(f => f.id));
  state.selectedIds = [...new Set(ids)].filter(id => available.has(id));
  state.selectedId = state.selectedIds.includes(primaryId) ? primaryId : state.selectedIds.at(-1) || null;
}
function toggleSelection(id) {
  if (isSelected(id)) setSelection(state.selectedIds.filter(selectedId => selectedId !== id));
  else setSelection([...state.selectedIds, id], id);
}
function normalizeSelection() { setSelection(state.selectedIds, state.selectedId); }
function serializeFixtures() { return JSON.stringify(state.fixtures); }
function makeId() { return `fx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function clamp(value,min,max) { return Math.min(max,Math.max(min,value)); }
function normalizeAngle(value) { return ((value % 360) + 360) % 360; }
function rotatePoint(x,y,degrees) { const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r); return {x:x*c-y*s,y:x*s+y*c}; }
function getSnap() { return els.snap?.checked ? Number(els.snapSize.value) : .05; }
function snap(value) { const step=getSnap(); return Math.round(value/step)*step; }
function snapAngle(value) { return els.snap?.checked ? Math.round(value/15)*15 : value; }
function cleanNumber(value) { return Number(Number(value).toFixed(2)); }
function parseDimension(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(1, cleanNumber(parsed)) : 1; }
function formatFeet(value) { const feet=Math.floor(value); const inches=Math.round((value-feet)*12); return inches ? `${feet}′ ${inches}″` : `${feet}′`; }
function truncateLabel(label,width) { const max=Math.max(8,Math.floor(width*2.2)); return label.length>max ? label.slice(0,max-1)+"…" : label; }
function svgEl(tag,attrs={}) { const el=document.createElementNS(SVG_NS,tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v))); return el; }

function getRotatedHalfExtents(f) {
  const radians = normalizeAngle(f.rotation || 0) * Math.PI / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return {
    x: cleanNumber((f.width * cosine + f.depth * sine) / 2),
    y: cleanNumber((f.width * sine + f.depth * cosine) / 2)
  };
}

function constrainFixture(f) {
  f.width = parseDimension(f.width);
  f.depth = parseDimension(f.depth);
  const halfExtents = getRotatedHalfExtents(f);
  f.x = cleanNumber(constrainCenter(f.x, halfExtents.x, ROOM.width));
  f.y = cleanNumber(constrainCenter(f.y, halfExtents.y, ROOM.depth));
}

function constrainGroupDelta(fixtures, desiredX, desiredY) {
  if (!fixtures.length) return { x: 0, y: 0 };
  const bounds = fixtures.reduce((result, fixture) => {
    const halfExtents = getRotatedHalfExtents(fixture);
    result.minX = Math.min(result.minX, fixture.x - halfExtents.x);
    result.maxX = Math.max(result.maxX, fixture.x + halfExtents.x);
    result.minY = Math.min(result.minY, fixture.y - halfExtents.y);
    result.maxY = Math.max(result.maxY, fixture.y + halfExtents.y);
    return result;
  }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  return {
    x: cleanNumber(constrainGroupAxis(bounds.minX, bounds.maxX, ROOM.width, desiredX)),
    y: cleanNumber(constrainGroupAxis(bounds.minY, bounds.maxY, ROOM.depth, desiredY))
  };
}

function constrainGroupAxis(minimum, maximum, roomSize, desiredDelta) {
  if (maximum - minimum >= roomSize) return roomSize / 2 - (minimum + maximum) / 2;
  return clamp(desiredDelta, -minimum, roomSize - maximum);
}

function moveSelectedBy(desiredX, desiredY) {
  const fixtures = selectedFixtures();
  const delta = constrainGroupDelta(fixtures, desiredX, desiredY);
  fixtures.forEach(fixture => {
    fixture.x = cleanNumber(fixture.x + delta.x);
    fixture.y = cleanNumber(fixture.y + delta.y);
  });
  return fixtures.length;
}

function constrainCenter(value, halfExtent, roomSize) {
  if (halfExtent * 2 >= roomSize) return roomSize / 2;
  return clamp(value, halfExtent, roomSize-halfExtent);
}

function clientToSvg(clientX,clientY) {
  const point=els.svg.createSVGPoint(); point.x=clientX; point.y=clientY;
  return point.matrixTransform(els.svg.getScreenCTM().inverse());
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer); els.toast.textContent=message; els.toast.classList.add("show");
  toastTimer=setTimeout(()=>els.toast.classList.remove("show"),1400);
}

function savePlan() {
  try {
    localStorage.setItem("retail-layout-studio-plan", serializeFixtures());
    if (els.saveState) els.saveState.innerHTML = "<i></i> Saved locally";
  } catch (_) {
    if (els.saveState) els.saveState.textContent = "Session only";
  }
}

function loadSavedPlan() {
  try {
    const raw=localStorage.getItem("retail-layout-studio-plan");
    if (!raw) return null;
    const parsed=JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(f=>!FIXTURE_TYPES[f.type])) return null;
    return parsed;
  } catch (_) { return null; }
}
