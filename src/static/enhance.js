// Progressive enhancement. No third party, no tracking. Everything here is
// additive: with JS off, tag links navigate to per-tag pages, images open
// normally, and the copy button simply isn't shown as interactive.

// --- 1) In-place tag filter (homepage only) --------------------------------
(function () {
  var bar = document.querySelector(".tagbar");
  var list = document.querySelector(".postlist");
  if (!bar || !list) return;
  // Only enhance the full, unfiltered list: "all" is active on the homepage.
  if (!bar.querySelector('a[data-tag="all"].is-active')) return;

  var items = [].slice.call(list.querySelectorAll(".postlist-item"));
  var links = [].slice.call(bar.querySelectorAll("a[data-tag]"));

  var empty = document.createElement("p");
  empty.className = "filter-empty mono";
  empty.hidden = true;
  empty.setAttribute("role", "status");
  list.parentNode.insertBefore(empty, list.nextSibling);

  function apply(tag) {
    var visible = 0;
    items.forEach(function (li) {
      var tags = (li.getAttribute("data-tags") || "").split(/\s+/);
      var hide = tag !== "all" && tags.indexOf(tag) === -1;
      li.hidden = hide;
      if (!hide) visible += 1;
    });
    links.forEach(function (a) {
      var on = a.getAttribute("data-tag") === tag;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    if (visible === 0) {
      empty.textContent = "No sightings tagged #" + tag + ". Suspicious.";
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
    history.replaceState(null, "", tag === "all" ? location.pathname : "#tag=" + tag);
  }

  // Links stay real links (Enter activates natively, JS-off navigates to the
  // tag page); we just intercept to filter in place.
  links.forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      apply(a.getAttribute("data-tag"));
    });
  });

  var m = location.hash.match(/^#tag=(.+)$/);
  if (m) {
    var t = decodeURIComponent(m[1]);
    if (links.some(function (a) { return a.getAttribute("data-tag") === t; })) apply(t);
  }
})();

// --- 1b) Exhibit frames: wrap each screenshot with an evidence caption ----
(function () {
  var imgs = document.querySelectorAll(".prose img");
  [].forEach.call(imgs, function (img, i) {
    if (img.closest("figure.exhibit")) return;
    var fig = document.createElement("figure");
    fig.className = "exhibit";
    img.parentNode.insertBefore(fig, img);
    fig.appendChild(img);
    var cap = document.createElement("figcaption");
    cap.className = "exhibit-cap mono";
    var no = document.createElement("span");
    no.className = "exhibit-no";
    no.textContent = "EXHIBIT " + String(i + 1).padStart(2, "0");
    cap.appendChild(no);
    if (img.getAttribute("alt")) {
      cap.appendChild(document.createTextNode(" — " + img.getAttribute("alt")));
    }
    fig.appendChild(cap);
  });
})();

// --- 2) Screenshot lightbox ------------------------------------------------
(function () {
  var imgs = document.querySelectorAll(".prose img");
  if (!imgs.length || typeof window.HTMLDialogElement !== "function") return;

  var dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Close">✕</button><img alt="">';
  document.body.appendChild(dlg);
  var big = dlg.querySelector("img");
  var closeBtn = dlg.querySelector(".lightbox-close");
  var trigger = null;

  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  closeBtn.addEventListener("click", function () { dlg.close(); });
  // Native <dialog> handles ESC + background inert + focus trap; we add
  // keyboard-open on the images and return focus to the trigger on close.
  dlg.addEventListener("close", function () { if (trigger) trigger.focus(); });

  [].forEach.call(imgs, function (img) {
    img.classList.add("zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Zoom screenshot: " + (img.alt || "image"));
    function open() {
      if (typeof dlg.showModal !== "function") return;
      trigger = img;
      big.src = img.currentSrc || img.src;
      big.alt = img.alt || "";
      dlg.showModal();
      closeBtn.focus();
    }
    img.addEventListener("click", open);
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });
})();

// --- 3) Copy-link button ---------------------------------------------------
(function () {
  var btn = document.querySelector(".share-copy");
  if (!btn || !navigator.clipboard) return;
  var original = btn.textContent;
  btn.addEventListener("click", function () {
    navigator.clipboard.writeText(btn.getAttribute("data-url")).then(function () {
      btn.textContent = "copied ✓";
      setTimeout(function () {
        btn.textContent = original;
      }, 1600);
    });
  });
})();

// --- live engagement (Cloudflare Pages Functions + D1) ---------------------
// All of this no-ops gracefully if /api/* isn't there (e.g. the GitHub Pages
// mirror has no functions), so the static fallback keeps working.
function swApi(path, slug) {
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: slug }),
  })
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; });
}

// 4) Per-post: count the view, wire the "blame" vote button.
(function () {
  var el = document.querySelector(".post[data-slug]");
  if (!el) return;
  var slug = el.getAttribute("data-slug");
  var votesEl = el.querySelector(".blame-votes");
  var viewsEl = el.querySelector(".blame-views");
  var btn = el.querySelector(".blame-btn");

  function paint(d) {
    if (!d) return;
    if (typeof d.votes === "number" && votesEl) votesEl.textContent = d.votes;
    if (typeof d.views === "number" && viewsEl) viewsEl.textContent = d.views;
  }

  swApi("/api/view", slug).then(paint);

  if (btn) {
    var key = "blamed:" + slug;
    var undo = el.querySelector(".blame-undo");
    var blameLabel = btn.textContent;

    function setBlamed(on) {
      btn.disabled = on;
      btn.textContent = on ? "🔨 blamed ✓" : blameLabel;
      if (undo) undo.hidden = !on;
      try {
        if (on) localStorage.setItem(key, "1");
        else localStorage.removeItem(key);
      } catch (e) {}
    }

    var voted = false;
    try { voted = localStorage.getItem(key) === "1"; } catch (e) {}
    if (voted) setBlamed(true);

    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      btn.disabled = true;
      swApi("/api/vote", slug).then(function (d) {
        if (!d || !d.ok) {
          // No API (e.g. GitHub mirror) or a transient error — let them retry.
          btn.textContent = "couldn't blame — retry";
          setTimeout(function () { btn.textContent = blameLabel; btn.disabled = false; }, 1800);
          return;
        }
        paint(d);
        btn.classList.add("is-stamped");
        setBlamed(true);
      });
    });

    if (undo) {
      undo.addEventListener("click", function () {
        undo.disabled = true;
        swApi("/api/unvote", slug).then(function (d) {
          undo.disabled = false;
          if (d && d.ok) {
            paint(d);
            btn.classList.remove("is-stamped");
            setBlamed(false);
          }
        });
      });
    }
  }
})();

// 5) Live Hall of Shame: hydrate every board/teaser, re-sort by live votes.
(function () {
  var lists = document.querySelectorAll("[data-board]");
  if (!lists.length) return;
  fetch("/api/board")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.posts) return;
      var by = {};
      data.posts.forEach(function (p) { by[p.slug] = p; });
      [].forEach.call(lists, function (list) {
        var rows = [].slice.call(
          list.querySelectorAll(".board-row[data-slug], .shame-item[data-slug]")
        );
        if (!rows.length) return;
        rows.forEach(function (row) {
          var p = by[row.getAttribute("data-slug")] || { views: 0, votes: 0 };
          var v = row.querySelector(".live-votes"); if (v) v.textContent = p.votes;
          var w = row.querySelector(".live-views"); if (w) w.textContent = p.views;
          row.dataset.votes = p.votes;
          row.dataset.views = p.views;
        });
        var frag = document.createDocumentFragment();
        rows
          .sort(function (a, b) {
            return (b.dataset.votes - a.dataset.votes) || (b.dataset.views - a.dataset.views);
          })
          .forEach(function (row, i) {
            frag.appendChild(row);
            var rk = row.querySelector(".board-rank, .shame-rank");
            if (rk) rk.textContent = rk.className.indexOf("board-rank") > -1
              ? String(i + 1).padStart(3, "0")
              : String(i + 1);
          });
        list.appendChild(frag);
      });
    })
    .catch(function () {});
})();

// 6) "You've blamed N slops" — private, localStorage-only, no tracking.
(function () {
  var el = document.querySelector("[data-blame-tally]");
  if (!el) return;
  var n = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      if ((localStorage.key(i) || "").indexOf("blamed:") === 0) n += 1;
    }
  } catch (e) { return; }
  if (n > 0) {
    el.textContent = "you've blamed " + n + " slop" + (n === 1 ? "" : "s");
    el.hidden = false;
  }
})();

// 7) Random sighting (header + footer dice).
(function () {
  var links = document.querySelectorAll("[data-random]");
  if (!links.length) return;
  [].forEach.call(links, function (link) {
    link.hidden = false;
    link.addEventListener("click", function (e) {
      e.preventDefault();
      fetch(link.getAttribute("data-src") || "/posts.json")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (list) {
          if (!list || !list.length) return;
          var p = list[Math.floor(Math.random() * list.length)];
          if (p && p.url) location.href = p.url;
        })
        .catch(function () {});
    });
  });
})();

// 8) Homepage sort: newest / most-blamed / most-viewed (live counts from D1).
(function () {
  var bar = document.querySelector("[data-sort]");
  var list = document.querySelector(".postlist");
  if (!bar || !list) return;
  bar.hidden = false;
  var items = [].slice.call(list.querySelectorAll(".postlist-item"));
  var buttons = [].slice.call(bar.querySelectorAll("[data-sort-by]"));
  var counts = {};

  function pub(li) { return li.getAttribute("data-published") || ""; }
  function sortBy(mode) {
    var sorted = items.slice();
    if (mode === "newest") {
      sorted.sort(function (a, b) { return pub(b).localeCompare(pub(a)); });
    } else {
      var k = mode === "blamed" ? "votes" : "views";
      sorted.sort(function (a, b) {
        var da = counts[a.getAttribute("data-slug")] || {};
        var db = counts[b.getAttribute("data-slug")] || {};
        return (db[k] || 0) - (da[k] || 0) || pub(b).localeCompare(pub(a));
      });
    }
    var frag = document.createDocumentFragment();
    sorted.forEach(function (li) { frag.appendChild(li); });
    list.appendChild(frag);
    buttons.forEach(function (btn) {
      var on = btn.getAttribute("data-sort-by") === mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () { sortBy(btn.getAttribute("data-sort-by")); });
  });
  fetch("/api/board")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.posts) d.posts.forEach(function (p) { counts[p.slug] = p; }); })
    .catch(function () {});
})();

// 9) "New since your last visit" flags (localStorage, cookieless).
(function () {
  var items = document.querySelectorAll(".postlist-item[data-published]");
  if (!items.length) return;
  var last = 0;
  try { last = parseInt(localStorage.getItem("lastVisit") || "0", 10); } catch (e) {}
  if (last) {
    [].forEach.call(items, function (li) {
      var d = Date.parse(li.getAttribute("data-published") + "T00:00:00Z");
      if (d > last) {
        var title = li.querySelector(".postlist-title");
        if (title) {
          var flag = document.createElement("span");
          flag.className = "new-flag mono";
          flag.textContent = "new";
          title.appendChild(flag);
        }
      }
    });
  }
  try { localStorage.setItem("lastVisit", String(Date.now())); } catch (e) {}
})();
