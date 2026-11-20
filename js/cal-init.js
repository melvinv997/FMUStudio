// Cal.com inline booking embed (kept in its own file so the site can block inline scripts)
(function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "intro-call", { origin: "https://app.cal.com" });
Cal.ns["intro-call"]("inline", {
  elementOrSelector: "#cal-inline",
  calLink: "fmustudio/intro-call",
  config: { layout: "month_view", theme: "dark" }
});
Cal.ns["intro-call"]("ui", {
  theme: "dark",
  cssVarsPerTheme: { dark: { "cal-brand": "#FD8421" } },
  hideEventTypeDetails: false,
  layout: "month_view"
});
