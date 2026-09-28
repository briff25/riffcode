const SCALE = 20;
const DEFAULT_ROOM = { width: 60, depth: 40 };
const SVG_NS = "http://www.w3.org/2000/svg";
const PLAN_LIBRARY_KEY = "retail-layout-creator-2-plans-v1";
const LEGACY_PLAN_KEY = "retail-layout-creator-2-plan";
const PROJECT_FORMAT = "retail-layout-studio";

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
  room: { ...DEFAULT_ROOM },
  plans: [],
  currentPlanId: null,
  planName: "Concept plan A",
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
    saveState: document.getElementById("saveState"),
    planTitle: document.getElementById("planTitle"),
    roomSummary: document.getElementById("roomSummary"),
    workingArea: document.getElementById("workingArea"),
    floorRect: document.getElementById("floorRect"),
    gridRect: document.getElementById("gridRect"),
    wallOutline: document.getElementById("wallOutline"),
    entranceMask: document.getElementById("entranceMask"),
    entranceDoors: document.getElementById("entranceDoors"),
    entranceLabel: document.getElementById("entranceLabel"),
    scaleLegend: document.getElementById("scaleLegend"),
    floorDialog: document.getElementById("floorDialog"),
    floorForm: document.getElementById("floorForm"),
    floorPreset: document.getElementById("floorPreset"),
    floorWidth: document.getElementById("floorWidthInput"),
    floorDepth: document.getElementById("floorDepthInput"),
    floorAreaPreview: document.getElementById("floorAreaPreview"),
    floorConflict: document.getElementById("floorConflict"),
    floorConflictMessage: document.getElementById("floorConflictMessage"),
    saveAsDialog: document.getElementById("saveAsDialog"),
    saveAsForm: document.getElementById("saveAsForm"),
    saveAsName: document.getElementById("saveAsName"),
    plansDialog: document.getElementById("plansDialog"),
    plansList: document.getElementById("plansList"),
    exportDialog: document.getElementById("exportDialog"),
    importProjectInput: document.getElementById("importProjectInput")
  });

  renderLibrary();
  bindControls();
  initializePlanLibrary();
  state.history = [serializeLayout()];
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

  document.getElementById("savePlanBtn").addEventListener("click", () => persistCurrentPlan(true));
  document.getElementById("floorSettingsBtn").addEventListener("click", openFloorDialog);
  document.getElementById("saveAsBtn").addEventListener("click", openSaveAsDialog);
  document.getElementById("plansBtn").addEventListener("click", openPlansDialog);
  document.getElementById("exportBtn").addEventListener("click", () => els.exportDialog.showModal());
  document.getElementById("newPlanCopyBtn").addEventListener("click", () => {
    els.plansDialog.close();
    openSaveAsDialog();
  });
  document.querySelectorAll("[data-close-dialog]").forEach(button => {
    button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
  });
  els.saveAsForm.addEventListener("submit", e => {
    e.preventDefault();
    saveAsPlan(els.saveAsName.value);
  });
  els.plansList.addEventListener("click", onPlanListClick);
  document.getElementById("downloadProjectBtn").addEventListener("click", downloadProject);
  document.getElementById("importProjectBtn").addEventListener("click", () => els.importProjectInput.click());
  els.importProjectInput.addEventListener("change", importProjectFile);
  document.getElementById("exportPngBtn").addEventListener("click", exportPlanPng);
  document.getElementById("exportCsvBtn").addEventListener("click", exportFixtureCsv);
  document.getElementById("printPlanBtn").addEventListener("click", printPlan);
  els.floorForm.addEventListener("submit", applyFloorSettings);
  els.floorPreset.addEventListener("change", applyFloorPreset);
  [els.floorWidth, els.floorDepth].forEach(input => input.addEventListener("input", () => {
    els.floorPreset.value = matchingFloorPreset(Number(els.floorWidth.value), Number(els.floorDepth.value));
    updateFloorResizePreview();
  }));

  els.rotate.addEventListener("click", rotateSelected);
  els.duplicate.addEventListener("click", duplicateSelected);
  els.delete.addEventListener("click", deleteSelected);
  document.getElementById("inspectorDuplicate").addEventListener("click", duplicateSelected);
  document.getElementById("inspectorDelete").addEventListener("click", deleteSelected);
  els.undo.addEventListener("click", undo);
  els.redo.addEventListener("click", redo);
  document.getElementById("zoomInBtn").addEventListener("click", () => setZoom(state.zoom + .25));
  document.getElementById("zoomOutBtn").addEventListener("click", () => setZoom(state.zoom - .25));
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!state.fixtures.length) return;
    state.fixtures = []; setSelection([]); commit("Floor cleared"); render();
  });

  const fieldMap = [
    [els.label, "label", v => v.trim() || "Fixture"],
    [els.width, "width", parseDimension],
    [els.depth, "depth", parseDimension],
    [els.x, "x", v => clamp(Number(v), 0, state.room.width)],
    [els.y, "y", v => clamp(Number(v), 0, state.room.depth)],
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

function addFixture(typeKey, x = state.room.width / 2, y = state.room.depth / 2) {
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
  els.planTitle.textContent = state.planName;
  els.roomSummary.textContent = `Retail space plan · ${formatFeet(state.room.width)} × ${formatFeet(state.room.depth)}`;
  els.workingArea.textContent = `Working area: ${formatNumber(state.room.width * state.room.depth)} sq ft`;
  renderRoom();
  renderCanvas();
  renderInspector();
  renderTally();
  updateToolbar();
}

function renderRoom() {
  const width = state.room.width * SCALE;
  const depth = state.room.depth * SCALE;
  els.svg.setAttribute("viewBox", `0 0 ${width} ${depth}`);
  els.svg.setAttribute("aria-label", `${cleanNumber(state.room.width)} by ${cleanNumber(state.room.depth)} foot retail floor plan`);
  [els.floorRect, els.gridRect].forEach(rect => {
    rect.setAttribute("width", Math.max(0, width - 2));
    rect.setAttribute("height", Math.max(0, depth - 2));
  });
  els.wallOutline.setAttribute("d", `M2 2H${width-2}V${depth-2}H2z`);
  const doorWidth = Math.min(7.5 * SCALE, width * .6);
  const doorLeaf = Math.max(10, doorWidth / 2 - 7);
  const doorLeft = (width - doorWidth) / 2;
  const doorRight = doorLeft + doorWidth;
  els.entranceMask.setAttribute("x", doorLeft);
  els.entranceMask.setAttribute("y", depth - 14);
  els.entranceMask.setAttribute("width", doorWidth);
  els.entranceMask.setAttribute("height", 15);
  els.entranceDoors.setAttribute("d", `M${doorLeft} ${depth-2}v-${doorLeaf}a${doorLeaf} ${doorLeaf} 0 0 1 ${doorLeaf} ${doorLeaf}M${doorRight} ${depth-2}v-${doorLeaf}a${doorLeaf} ${doorLeaf} 0 0 0 -${doorLeaf} ${doorLeaf}`);
  els.entranceLabel.setAttribute("x", width / 2);
  els.entranceLabel.setAttribute("y", Math.max(18, depth - 35));
  els.scaleLegend.setAttribute("transform", `translate(0 ${depth-800})`);
}

function openFloorDialog() {
  els.floorWidth.value = cleanNumber(state.room.width);
  els.floorDepth.value = cleanNumber(state.room.depth);
  els.floorPreset.value = matchingFloorPreset(state.room.width, state.room.depth);
  const cancelOption = els.floorForm.querySelector('input[name="floorConflictAction"][value="cancel"]');
  if (cancelOption) cancelOption.checked = true;
  updateFloorResizePreview();
  els.floorDialog.showModal();
}

function applyFloorPreset() {
  if (els.floorPreset.value === "custom") return;
  const [width, depth] = els.floorPreset.value.split("x").map(Number);
  els.floorWidth.value = width;
  els.floorDepth.value = depth;
  updateFloorResizePreview();
}

function matchingFloorPreset(width, depth) {
  return [[30,20],[60,40],[120,80]].some(([presetWidth, presetDepth]) => width === presetWidth && depth === presetDepth)
    ? `${width}x${depth}`
    : "custom";
}

function updateFloorResizePreview() {
  const width = Number(els.floorWidth.value);
  const depth = Number(els.floorDepth.value);
  const valid = Number.isFinite(width) && Number.isFinite(depth) && width >= 10 && depth >= 10;
  els.floorAreaPreview.textContent = valid ? `${formatNumber(width * depth)} sq ft · Grid and fixtures remain measured in feet` : "Enter dimensions of at least 10 feet.";
  const conflicts = valid ? fixturesOutsideRoom({ width, depth }) : [];
  els.floorConflict.hidden = !conflicts.length;
  els.floorConflictMessage.textContent = conflicts.length ? `${conflicts.length} fixture${conflicts.length === 1 ? "" : "s"} will not fit completely inside this floor.` : "";
}

function applyFloorSettings(event) {
  event.preventDefault();
  const room = normalizeRoom({ width: els.floorWidth.value, depth: els.floorDepth.value });
  const conflicts = fixturesOutsideRoom(room);
  const action = els.floorForm.querySelector('input[name="floorConflictAction"]:checked')?.value || "cancel";
  if (conflicts.length && action === "cancel") {
    showToast("Choose how to handle the fixture conflicts");
    return;
  }
  state.room = room;
  if (conflicts.length && action === "move") state.fixtures.forEach(constrainFixture);
  commit(`Floor updated to ${formatFeet(room.width)} × ${formatFeet(room.depth)}`);
  els.floorDialog.close();
  render();
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
    class: `fixture${isSelected(f.id) ? " selected" : ""}${f.id === state.selectedId ? " primary" : ""}${fixtureWithinRoom(f) ? "" : " invalid"}`,
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
  els.x.max = state.room.width;
  els.y.max = state.room.depth;
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
  const coverage = state.fixtures.reduce((sum,f) => sum + f.width*f.depth,0) / (state.room.width*state.room.depth) * 100;
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
  const snapshot = serializeLayout();
  if (snapshot === state.history[state.historyIndex]) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > 50) state.history.shift();
  state.historyIndex = state.history.length - 1;
  persistCurrentPlan();
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
  const snapshot = JSON.parse(state.history[state.historyIndex]);
  if (Array.isArray(snapshot)) state.fixtures = snapshot;
  else {
    state.room = normalizeRoom(snapshot.room);
    state.fixtures = snapshot.fixtures;
  }
  normalizeSelection();
  persistCurrentPlan();
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
function serializeLayout() { return JSON.stringify({ room: state.room, fixtures: state.fixtures }); }
function makeId() { return `fx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
function clamp(value,min,max) { return Math.min(max,Math.max(min,value)); }
function normalizeAngle(value) { return ((value % 360) + 360) % 360; }
function rotatePoint(x,y,degrees) { const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r); return {x:x*c-y*s,y:x*s+y*c}; }
function getSnap() { return els.snap?.checked ? Number(els.snapSize.value) : .05; }
function snap(value) { const step=getSnap(); return Math.round(value/step)*step; }
function snapAngle(value) { return els.snap?.checked ? Math.round(value/15)*15 : value; }
function cleanNumber(value) { return Number(Number(value).toFixed(2)); }
function formatNumber(value) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value); }
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

function fixtureWithinRoom(fixture, room = state.room) {
  const halfExtents = getRotatedHalfExtents(fixture);
  const tolerance = .01;
  return fixture.x - halfExtents.x >= -tolerance
    && fixture.y - halfExtents.y >= -tolerance
    && fixture.x + halfExtents.x <= room.width + tolerance
    && fixture.y + halfExtents.y <= room.depth + tolerance;
}

function fixturesOutsideRoom(room = state.room) {
  return state.fixtures.filter(fixture => !fixtureWithinRoom(fixture, room));
}

function constrainFixture(f) {
  constrainFixtureToRoom(f, state.room);
}

function constrainFixtureToRoom(f, room) {
  f.width = parseDimension(f.width);
  f.depth = parseDimension(f.depth);
  const halfExtents = getRotatedHalfExtents(f);
  f.x = cleanNumber(constrainCenter(f.x, halfExtents.x, room.width));
  f.y = cleanNumber(constrainCenter(f.y, halfExtents.y, room.depth));
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
    x: cleanNumber(constrainGroupAxis(bounds.minX, bounds.maxX, state.room.width, desiredX)),
    y: cleanNumber(constrainGroupAxis(bounds.minY, bounds.maxY, state.room.depth, desiredY))
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

function initializePlanLibrary() {
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(PLAN_LIBRARY_KEY) || "null"); } catch (_) {}
  if (stored?.plans?.length) {
    state.plans = stored.plans.map(plan => {
      try { return normalizePlanRecord(plan); } catch (_) { return null; }
    }).filter(Boolean);
  }
  if (!state.plans.length) {
    let fixtures = null;
    try { fixtures = normalizeFixtures(JSON.parse(localStorage.getItem(LEGACY_PLAN_KEY) || "null"), DEFAULT_ROOM); } catch (_) {}
    state.plans = [createPlanRecord("Concept plan A", fixtures || sampleFixtures(), DEFAULT_ROOM)];
  }
  const active = state.plans.find(plan => plan.id === stored?.activePlanId) || state.plans[0];
  state.currentPlanId = active.id;
  state.planName = active.name;
  state.room = { ...active.room };
  state.fixtures = structuredClone(active.fixtures);
  persistPlanLibrary();
}

function createPlanRecord(name, fixtures, room = state.room) {
  const now = new Date().toISOString();
  const normalizedRoom = normalizeRoom(room);
  return {
    id: `plan-${makeId()}`,
    name: String(name || "Untitled plan").trim() || "Untitled plan",
    createdAt: now,
    updatedAt: now,
    room: normalizedRoom,
    fixtures: normalizeFixtures(fixtures, normalizedRoom) || []
  };
}

function normalizePlanRecord(plan) {
  if (!plan || typeof plan !== "object") throw new Error("Invalid plan");
  const room = normalizeRoom(plan.room);
  const fixtures = normalizeFixtures(plan.fixtures, room);
  if (!fixtures) throw new Error("Invalid fixtures");
  const now = new Date().toISOString();
  return {
    id: typeof plan.id === "string" && plan.id ? plan.id : `plan-${makeId()}`,
    name: String(plan.name || "Untitled plan").trim() || "Untitled plan",
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now,
    room,
    fixtures
  };
}

function normalizeRoom(room) {
  const width = Number(room?.width);
  const depth = Number(room?.depth);
  return {
    width: Number.isFinite(width) ? Math.max(10, cleanNumber(width)) : DEFAULT_ROOM.width,
    depth: Number.isFinite(depth) ? Math.max(10, cleanNumber(depth)) : DEFAULT_ROOM.depth
  };
}

function normalizeFixtures(fixtures, room = state.room) {
  if (!Array.isArray(fixtures)) return null;
  const seenIds = new Set();
  return fixtures.map(source => {
    if (!source || !FIXTURE_TYPES[source.type]) throw new Error("Unknown fixture type");
    let id = typeof source.id === "string" && source.id ? source.id : makeId();
    if (seenIds.has(id)) id = makeId();
    seenIds.add(id);
    const fixture = {
      id,
      type: source.type,
      label: String(source.label || FIXTURE_TYPES[source.type].short),
      width: parseDimension(source.width),
      depth: parseDimension(source.depth),
      x: Number.isFinite(Number(source.x)) ? Number(source.x) : room.width / 2,
      y: Number.isFinite(Number(source.y)) ? Number(source.y) : room.depth / 2,
      rotation: normalizeAngle(Number(source.rotation) || 0)
    };
    constrainFixtureToRoom(fixture, room);
    return fixture;
  });
}

function persistCurrentPlan(showConfirmation = false) {
  const plan = state.plans.find(item => item.id === state.currentPlanId);
  if (!plan) return false;
  plan.name = state.planName;
  plan.room = { ...state.room };
  plan.fixtures = structuredClone(state.fixtures);
  plan.updatedAt = new Date().toISOString();
  const saved = persistPlanLibrary();
  if (showConfirmation) showToast(saved ? `“${state.planName}” saved` : "Could not save in this browser");
  return saved;
}

function persistPlanLibrary() {
  try {
    localStorage.setItem(PLAN_LIBRARY_KEY, JSON.stringify({ version: 1, activePlanId: state.currentPlanId, plans: state.plans }));
    localStorage.setItem(LEGACY_PLAN_KEY, serializeFixtures());
    if (els.saveState) els.saveState.innerHTML = "<i></i> Saved locally";
    return true;
  } catch (_) {
    if (els.saveState) els.saveState.textContent = "Session only";
    return false;
  }
}

function openSaveAsDialog() {
  els.saveAsName.value = `${state.planName} copy`;
  els.saveAsDialog.showModal();
  requestAnimationFrame(() => { els.saveAsName.focus(); els.saveAsName.select(); });
}

function saveAsPlan(name) {
  const plan = createPlanRecord(name, state.fixtures, state.room);
  state.plans.push(plan);
  state.currentPlanId = plan.id;
  state.planName = plan.name;
  setSelection([]);
  state.history = [serializeLayout()];
  state.historyIndex = 0;
  persistCurrentPlan();
  els.saveAsDialog.close();
  render();
  showToast(`Saved as “${plan.name}”`);
}

function openPlansDialog() {
  persistCurrentPlan();
  renderPlansList();
  els.plansDialog.showModal();
}

function renderPlansList() {
  els.plansList.innerHTML = "";
  [...state.plans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).forEach(plan => {
    const row = document.createElement("div");
    row.className = `plan-row${plan.id === state.currentPlanId ? " active" : ""}`;
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = plan.name;
    const details = document.createElement("small");
    details.textContent = `${formatFeet(plan.room.width)} × ${formatFeet(plan.room.depth)} · ${plan.fixtures.length} fixtures · ${formatPlanDate(plan.updatedAt)}${plan.id === state.currentPlanId ? " · Open" : ""}`;
    copy.append(title, details);
    const actions = document.createElement("div");
    actions.className = "plan-row-actions";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.dataset.planAction = "open";
    openButton.dataset.planId = plan.id;
    openButton.textContent = plan.id === state.currentPlanId ? "Current" : "Open";
    openButton.disabled = plan.id === state.currentPlanId;
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "remove-plan";
    deleteButton.dataset.planAction = "delete";
    deleteButton.dataset.planId = plan.id;
    deleteButton.textContent = "Delete";
    deleteButton.disabled = plan.id === state.currentPlanId || state.plans.length === 1;
    actions.append(openButton, deleteButton);
    row.append(copy, actions);
    els.plansList.appendChild(row);
  });
  const sampleRow = document.createElement("div");
  sampleRow.className = "plan-row sample-plan";
  const sampleCopy = document.createElement("div");
  const sampleTitle = document.createElement("strong");
  sampleTitle.textContent = "Specialty retail sample";
  const sampleDetails = document.createElement("small");
  sampleDetails.textContent = "15 fixtures · Built-in starting point";
  sampleCopy.append(sampleTitle, sampleDetails);
  const sampleActions = document.createElement("div");
  sampleActions.className = "plan-row-actions";
  const sampleButton = document.createElement("button");
  sampleButton.type = "button";
  sampleButton.dataset.planAction = "sample";
  sampleButton.textContent = "Open copy";
  sampleActions.appendChild(sampleButton);
  sampleRow.append(sampleCopy, sampleActions);
  els.plansList.appendChild(sampleRow);
}

function onPlanListClick(event) {
  const button = event.target.closest("[data-plan-action]");
  if (!button) return;
  if (button.dataset.planAction === "open") openPlan(button.dataset.planId);
  if (button.dataset.planAction === "delete") deletePlan(button.dataset.planId);
  if (button.dataset.planAction === "sample") openSamplePlan();
}

function openSamplePlan() {
  persistCurrentPlan();
  const plan = createPlanRecord(uniquePlanName("Specialty retail sample"), sampleFixtures(), DEFAULT_ROOM);
  state.plans.push(plan);
  state.currentPlanId = plan.id;
  state.planName = plan.name;
  state.room = { ...plan.room };
  state.fixtures = structuredClone(plan.fixtures);
  setSelection([]);
  state.history = [serializeLayout()];
  state.historyIndex = 0;
  persistCurrentPlan();
  els.plansDialog.close();
  render();
  showToast(`Opened “${plan.name}”`);
}

function openPlan(planId) {
  persistCurrentPlan();
  const plan = state.plans.find(item => item.id === planId);
  if (!plan) return;
  state.currentPlanId = plan.id;
  state.planName = plan.name;
  state.room = { ...plan.room };
  state.fixtures = structuredClone(plan.fixtures);
  setSelection([]);
  state.history = [serializeLayout()];
  state.historyIndex = 0;
  persistPlanLibrary();
  els.plansDialog.close();
  render();
  showToast(`Opened “${plan.name}”`);
}

function deletePlan(planId) {
  const plan = state.plans.find(item => item.id === planId);
  if (!plan || plan.id === state.currentPlanId || state.plans.length === 1) return;
  if (!window.confirm(`Delete “${plan.name}”? This cannot be undone.`)) return;
  state.plans = state.plans.filter(item => item.id !== planId);
  persistPlanLibrary();
  renderPlansList();
  showToast("Plan deleted");
}

function downloadProject() {
  persistCurrentPlan();
  const plan = state.plans.find(item => item.id === state.currentPlanId);
  const project = {
    format: PROJECT_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    plan: { name: plan.name, room: { ...plan.room }, fixtures: plan.fixtures }
  };
  downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), `${safeFileName(plan.name)}.json`);
  showToast("Editable project downloaded");
}

async function importProjectFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const project = JSON.parse(await file.text());
    if (project.format !== PROJECT_FORMAT || project.version !== 1 || !project.plan) throw new Error("Unsupported project file");
    const room = normalizeRoom(project.plan.room);
    const fixtures = normalizeFixtures(project.plan.fixtures, room);
    if (!fixtures) throw new Error("Invalid fixtures");
    const plan = createPlanRecord(uniquePlanName(project.plan.name || file.name.replace(/\.json$/i, "")), fixtures, room);
    state.plans.push(plan);
    state.currentPlanId = plan.id;
    state.planName = plan.name;
    state.room = { ...plan.room };
    state.fixtures = structuredClone(plan.fixtures);
    setSelection([]);
    state.history = [serializeLayout()];
    state.historyIndex = 0;
    persistCurrentPlan();
    els.exportDialog.close();
    render();
    showToast(`Imported “${plan.name}”`);
  } catch (_) {
    showToast("That project file could not be imported");
  } finally {
    event.target.value = "";
  }
}

function exportFixtureCsv() {
  const headers = ["ID", "Label", "Type", "Width (ft)", "Depth (ft)", "X (ft)", "Y (ft)", "Rotation", "Area (sq ft)", "Linear feet", "Merchandising bays"];
  const rows = state.fixtures.map(fixture => {
    const type = FIXTURE_TYPES[fixture.type];
    return [fixture.id, fixture.label, type.name, fixture.width, fixture.depth, fixture.x, fixture.y, fixture.rotation, cleanNumber(fixture.width * fixture.depth), cleanNumber(type.linear(fixture)), type.bays(fixture)];
  });
  const csv = [headers, ...rows].map(row => row.map(csvValue).join(",")).join("\r\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${safeFileName(state.planName)}-fixture-tally.csv`);
  showToast("Fixture tally downloaded");
}

async function exportPlanPng() {
  try {
    const svgWidth = state.room.width * SCALE;
    const svgHeight = state.room.depth * SCALE;
    const rasterScale = Math.min(2, 6000 / svgWidth, 6000 / svgHeight);
    const clone = els.svg.cloneNode(true);
    clone.setAttribute("xmlns", SVG_NS);
    clone.setAttribute("width", svgWidth);
    clone.setAttribute("height", svgHeight);
    clone.querySelectorAll(".selected, .primary").forEach(node => node.classList.remove("selected", "primary"));
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = await fetch("styles.css").then(response => response.text());
    clone.insertBefore(style, clone.firstChild);
    const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
    const imageUrl = URL.createObjectURL(svgBlob);
    const image = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(svgWidth * rasterScale));
    canvas.height = Math.max(1, Math.round(svgHeight * rasterScale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(imageUrl);
    const pngBlob = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
    downloadBlob(pngBlob, `${safeFileName(state.planName)}.png`);
    showToast("Plan image downloaded");
  } catch (_) {
    showToast("The plan image could not be created");
  }
}

function printPlan() {
  els.exportDialog.close();
  const previousTitle = document.title;
  document.title = `${state.planName} - Retail Layout Studio`;
  window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once: true });
  setTimeout(() => window.print(), 80);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function uniquePlanName(name) {
  const base = String(name || "Imported plan").trim() || "Imported plan";
  if (!state.plans.some(plan => plan.name.toLowerCase() === base.toLowerCase())) return base;
  let number = 2;
  while (state.plans.some(plan => plan.name.toLowerCase() === `${base} ${number}`.toLowerCase())) number++;
  return `${base} ${number}`;
}

function safeFileName(name) { return String(name || "retail-layout").trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "retail-layout"; }
function csvValue(value) { const text = String(value ?? ""); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function formatPlanDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
