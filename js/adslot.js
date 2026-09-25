/* =========================================================
   EBO.EE — AdSlot: reklama AdSense OSE sponsor direkt

   Nje "slot" (kontejner) mund te shfaqe:
   - Google AdSense, nese js/ads-config.js ka client + slot te vendosura
   - nje sponsor direkt aktiv nga js/sponsors.json, perndryshe
   - asgje (slot mbetet "hidden", zero hapesire), nese s'ka as njeren as tjetren

   Klikimi mbi nje banner sponsori sot con direkt te linku i sponsorit.
   Gjurmimi i klikimeve (per faturim sipas performances) eshte hap i
   ardhshem — kerkon nje vendim arkitekture (shiko biseden me Claude-in),
   sepse faqja eshte statike (GitHub Pages, pa server).
   ========================================================= */
(function () {
  "use strict";

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function initAdsense(slotEl) {
    const cfg = (window.EBO_ADS_CONFIG && window.EBO_ADS_CONFIG.adsense) || {};
    if (!cfg.client || !cfg.slot) return false;

    if (!document.querySelector("script[data-adsbygoogle]")) {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(cfg.client);
      s.crossOrigin = "anonymous";
      s.setAttribute("data-adsbygoogle", "1");
      document.head.appendChild(s);
    }

    slotEl.innerHTML =
      '<ins class="adsbygoogle" style="display:block" ' +
      'data-ad-client="' + esc(cfg.client) + '" ' +
      'data-ad-slot="' + esc(cfg.slot) + '" ' +
      'data-ad-format="auto" data-full-width-responsive="true"></ins>';

    (window.adsbygoogle = window.adsbygoogle || []).push({});
    slotEl.hidden = false;
    return true;
  }

  async function initSponsor(slotEl) {
    let data;
    try {
      const res = await fetch("js/sponsors.json", { cache: "no-store" });
      if (!res.ok) return false;
      data = await res.json();
    } catch (e) {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);
    const active = (data.sponsors || []).filter(s =>
      s.active &&
      (!s.startDate || s.startDate <= today) &&
      (!s.endDate || s.endDate >= today)
    );
    if (!active.length) return false;

    const pick = active[Math.floor(Math.random() * active.length)];

    slotEl.innerHTML =
      '<span class="ad-slot-label">Sponsor</span>' +
      '<a class="ad-slot-link" href="' + esc(pick.url) + '" target="_blank" rel="noopener sponsored" data-sponsor-id="' + esc(pick.id) + '">' +
      '<img src="' + esc(pick.image) + '" alt="' + esc(pick.name) + '" loading="lazy" decoding="async">' +
      '</a>';
    slotEl.hidden = false;
    return true;
  }

  async function renderAdSlot(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (initAdsense(el)) return;
    await initSponsor(el);
    // if neither AdSense nor an active sponsor exists, the slot stays
    // hidden — no empty placeholder shown to visitors.
  }

  window.EBO_ADSLOTS = ["adSlotMid", "adSlotFooter"];

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  function boot() {
    window.EBO_ADSLOTS.forEach(renderAdSlot);
  }
})();
