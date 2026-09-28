/* ===========================================================================
   gallery.js — renders the project gallery from window.PROJECTS (projects.js)

   No dependencies, no build step. Reads the data, paints the hero and the
   grid, and wires up search / tag filtering / theme / scroll reveal.
   =========================================================================== */

(function () {
  "use strict";

  var DATA = Array.isArray(window.PROJECTS) ? window.PROJECTS.slice() : [];
  var DEFAULT_ACCENT = "#7c3aed";

  var el = {
    hero:    document.getElementById("hero"),
    chips:   document.getElementById("chips"),
    search:  document.getElementById("search"),
    grid:    document.getElementById("grid"),
    count:   document.getElementById("count"),
    empty:   document.getElementById("empty"),
    toggle:  document.getElementById("theme-toggle"),
    controls: document.getElementById("controls")
  };

  var state = { query: "", tags: [] };

  /* ------------------------------------------------------------- helpers -- */

  function isExternal(p) {
    if (typeof p.external === "boolean") return p.external;
    return /^https?:\/\//i.test(p.url || "");
  }

  function accentOf(p) {
    return p.accent || DEFAULT_ACCENT;
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* A <picture> that prefers .webp and falls back to .jpg. `shot` in the data
     is the path WITHOUT an extension, so one field covers both files. */
  function shotNode(p, eager) {
    if (!p.shot) {
      var span = make("span", "fallback", p.emoji || "✨");
      span.setAttribute("aria-hidden", "true");
      return span;
    }
    var picture = document.createElement("picture");
    var source = document.createElement("source");
    source.type = "image/webp";
    source.srcset = p.shot + ".webp";
    var img = document.createElement("img");
    img.src = p.shot + ".jpg";
    img.alt = "Screenshot of " + p.title;
    img.width = 1200;
    img.height = 750;
    img.decoding = "async";
    img.loading = eager ? "eager" : "lazy";
    /* If neither file is there yet, drop back to the emoji cover. */
    img.addEventListener("error", function () {
      var fallback = make("span", "fallback", p.emoji || "✨");
      fallback.setAttribute("aria-hidden", "true");
      if (picture.parentNode) picture.parentNode.replaceChild(fallback, picture);
    });
    picture.appendChild(source);
    picture.appendChild(img);
    return picture;
  }

  function linkAttrs(anchor, p) {
    anchor.href = p.url;
    if (isExternal(p)) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  }

  /* ---------------------------------------------------------------- hero -- */

  function renderHero(p) {
    if (!p) { el.hero.hidden = true; return; }

    var a = make("a", "hero");
    a.style.setProperty("--accent", accentOf(p));
    linkAttrs(a, p);

    var inner = make("div", "hero-inner");
    var copy = make("div", "hero-copy");

    copy.appendChild(make("p", "eyebrow", "Latest project"));
    copy.appendChild(make("h2", null, p.title));
    if (p.tagline) copy.appendChild(make("p", null, p.tagline));

    if (p.built && p.built.length) {
      var built = make("ul", "built");
      p.built.forEach(function (b) { built.appendChild(make("li", null, b)); });
      copy.appendChild(built);
    }

    var cta = make("span", "cta");
    cta.appendChild(document.createTextNode(isExternal(p) ? "Visit it" : "Play it"));
    cta.appendChild(make("span", null, "→"));
    copy.appendChild(cta);

    var shot = make("div", "hero-shot");
    shot.appendChild(shotNode(p, true));

    inner.appendChild(copy);
    inner.appendChild(shot);
    a.appendChild(inner);

    el.hero.innerHTML = "";
    el.hero.appendChild(a);
  }

  /* ---------------------------------------------------------------- card -- */

  var EXT_ICON =
    '<svg class="ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 17 17 7M9 7h8v8"/></svg>';

  function renderCard(p) {
    var li = document.createElement("li");
    var a = make("a", "card");
    a.style.setProperty("--accent", accentOf(p));
    linkAttrs(a, p);

    var shot = make("div", "card-shot");
    shot.appendChild(shotNode(p, false));
    a.appendChild(shot);

    var body = make("div", "card-body");
    var h3 = make("h3");
    h3.appendChild(document.createTextNode(p.title));
    if (isExternal(p)) {
      h3.insertAdjacentHTML("beforeend", EXT_ICON);
      var sr = make("span", "sr-only", " (opens in a new tab)");
      sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
      h3.appendChild(sr);
    }
    body.appendChild(h3);

    if (p.tagline) body.appendChild(make("p", null, p.tagline));

    if (p.tags && p.tags.length) {
      var tags = make("ul", "card-tags");
      p.tags.forEach(function (t) { tags.appendChild(make("li", null, t)); });
      body.appendChild(tags);
    }

    a.appendChild(body);
    li.appendChild(a);
    return li;
  }

  /* -------------------------------------------------------------- filter -- */

  function matches(p) {
    if (state.tags.length) {
      var own = p.tags || [];
      var hit = state.tags.some(function (t) { return own.indexOf(t) !== -1; });
      if (!hit) return false;
    }
    if (!state.query) return true;
    var haystack = [p.title, p.tagline, (p.tags || []).join(" "), (p.built || []).join(" ")]
      .join(" ")
      .toLowerCase();
    return state.query.split(/\s+/).every(function (word) {
      return haystack.indexOf(word) !== -1;
    });
  }

  var observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("in");
              observer.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -40px 0px" }
        )
      : null;

  function renderGrid() {
    var visible = DATA.filter(matches);

    el.grid.innerHTML = "";
    visible.forEach(function (p, i) {
      var li = renderCard(p);
      var card = li.firstChild;
      if (observer) {
        card.style.transitionDelay = Math.min(i, 6) * 55 + "ms";
        observer.observe(card);
      } else {
        card.classList.add("in");
      }
      el.grid.appendChild(li);
    });

    el.empty.hidden = visible.length !== 0;
    el.count.textContent =
      visible.length === DATA.length
        ? DATA.length + " projects"
        : visible.length + " of " + DATA.length;

    Array.prototype.forEach.call(el.chips.querySelectorAll(".chip"), function (chip) {
      var tag = chip.dataset.tag;
      var on = tag === "" ? state.tags.length === 0 : state.tags.indexOf(tag) !== -1;
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function renderChips() {
    var seen = [];
    DATA.forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        if (seen.indexOf(t) === -1) seen.push(t);
      });
    });
    seen.sort();

    el.chips.innerHTML = "";
    [""].concat(seen).forEach(function (tag) {
      var chip = make("button", "chip", tag || "All");
      chip.type = "button";
      chip.dataset.tag = tag;
      chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", function () {
        if (tag === "") {
          state.tags = [];
        } else {
          var at = state.tags.indexOf(tag);
          if (at === -1) state.tags.push(tag);
          else state.tags.splice(at, 1);
        }
        syncHash();
        renderGrid();
      });
      el.chips.appendChild(chip);
    });
  }

  /* ---------------------------------------------------------------- hash -- */
  /* Filters live in the URL so a filtered view can be shared and survives a
     reload: #tag=Game,Kids&q=map */

  function syncHash() {
    var parts = [];
    if (state.tags.length) parts.push("tag=" + state.tags.map(encodeURIComponent).join(","));
    if (state.query) parts.push("q=" + encodeURIComponent(state.query));
    var hash = parts.length ? "#" + parts.join("&") : "";
    if (hash) {
      history.replaceState(null, "", hash);
    } else {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function readHash() {
    var raw = location.hash.replace(/^#/, "");
    if (!raw) return;
    raw.split("&").forEach(function (pair) {
      var bits = pair.split("=");
      var key = bits[0];
      var value = decodeURIComponent((bits[1] || "").replace(/\+/g, " "));
      if (key === "tag" && value) state.tags = value.split(",").filter(Boolean);
      if (key === "q" && value) {
        state.query = value.toLowerCase().trim();
        el.search.value = value;
      }
    });
  }

  /* --------------------------------------------------------------- theme -- */

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    el.toggle.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    try { localStorage.setItem("br-theme", theme); } catch (e) { /* private mode */ }
  }

  el.toggle.addEventListener("click", function () {
    var now = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    setTheme(now);
  });
  setTheme(document.documentElement.getAttribute("data-theme") || "dark");

  /* -------------------------------------------------------------- search -- */

  var debounce;
  el.search.addEventListener("input", function (e) {
    clearTimeout(debounce);
    var value = e.target.value;
    debounce = setTimeout(function () {
      state.query = value.toLowerCase().trim();
      syncHash();
      renderGrid();
    }, 120);
  });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      el.search.focus();
      el.search.select();
    } else if (e.key === "Escape" && document.activeElement === el.search) {
      el.search.value = "";
      state.query = "";
      el.search.blur();
      syncHash();
      renderGrid();
    }
  });

  /* Shadow under the sticky controls bar, only once it is actually stuck. */
  if ("IntersectionObserver" in window) {
    var sentinel = make("div");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px";
    document.body.appendChild(sentinel);
    new IntersectionObserver(function (entries) {
      el.controls.classList.toggle("stuck", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ----------------------------------------------------------------- go! -- */

  if (!DATA.length) {
    el.hero.hidden = true;
    el.controls.hidden = true;
    el.empty.hidden = false;
    el.empty.innerHTML = "<strong>No projects yet</strong>Add one to projects.js to get started.";
    return;
  }

  var featuredIndex = DATA.findIndex(function (p) { return p.featured; });
  var featured = featuredIndex === -1 ? null : DATA.splice(featuredIndex, 1)[0];

  renderHero(featured);
  renderChips();
  readHash();
  renderGrid();
})();
