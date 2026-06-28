// progressive enhancement helpers
(function () {
  var q = [];
  var k = atob("QXJyb3dVcCxBcnJvd1VwLEFycm93RG93bixBcnJvd0Rvd24sQXJyb3dMZWZ0LEFycm93UmlnaHQsQXJyb3dMZWZ0LEFycm93UmlnaHQsYixh");
  var p = ["🚀","🔥","💯","🙏","✨","📈","🤝","🧠","💪","🎯","👇","🤯","💡","🌟","📊","🫶","🥹","⚡","😤","🙌"];
  var pick = function (a) { return a[(Math.random() * a.length) | 0]; };
  var fired = false;

  function enhance() {
    if (fired) return;
    fired = true;
    var root = document.querySelector("main") || document.body;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var list = [], n;
    while ((n = w.nextNode())) {
      var pn = n.parentNode;
      if (!pn || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/.test(pn.nodeName)) continue;
      if (n.nodeValue.trim()) list.push(n);
    }
    list.forEach(function (node) {
      var parts = node.nodeValue.split(/(\s+)/);
      node.nodeValue = parts
        .map(function (t) {
          if (!t.trim()) return t;
          t = t.replace(/\./g, "!!!!");
          if (Math.random() < 0.12) t = t.toUpperCase();
          if (Math.random() < 0.3) t = t + " " + pick(p);
          return t;
        })
        .join("");
    });
    var b = document.createElement("div");
    b.textContent = "🚀🔥 THOUGHT LEADERSHIP MODE ACTIVATED 🔥🚀 — agree? 👇 please clap 🙏";
    b.setAttribute(
      "style",
      "position:fixed;left:0;right:0;bottom:0;z-index:9999;text-align:center;" +
        "padding:.65rem 1rem;font-family:ui-monospace,Menlo,monospace;font-size:.8rem;" +
        "letter-spacing:.03em;background:#d62828;color:#fff;"
    );
    document.body.appendChild(b);
  }

  addEventListener("keydown", function (e) {
    q.push(e.key);
    if (q.length > 10) q.shift();
    if (q.join(",") === k) enhance();
  });
})();
