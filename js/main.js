/* =========================================================
   EBO.EE — interactions
   Content (services, projects, contact) comes from js/data.js
   ========================================================= */
(function () {
  "use strict";

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const LANGS = ["el", "en", "sq"];
  const LABEL = { el: "ΕΛ", en: "EN", sq: "AL" };
  const DATA  = window.EBO_DATA || { contact: {}, services: [], categories: [], projects: [] };

  /* ---------------- Icons used by the service cards ---------------- */
  const ICONS = {
    home:    '<path d="M3 20h18M5 20V9l7-5 7 5v11M9.5 20v-6h5v6"/>',
    tile:    '<path d="M4 4h16v16H4z"/><path d="M4 10h16M10 4v16"/>',
    design:  '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    drywall: '<path d="M4 5h16v14H4z"/><path d="M8 5v14M16 5v14M4 12h16"/>',
    paint:   '<path d="M4 4.5h11v4H4z"/><path d="M15 6.5h3a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-6v2"/><rect x="10.5" y="14.5" width="3" height="5" rx="1"/>',
    layers:  '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    tools:   '<path d="M14 6a3.5 3.5 0 0 1 4.8 4.4l-8.4 8.4a2 2 0 0 1-2.8-2.8l8.4-8.4"/>',
    water:   '<path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z"/>',
    bolt:    '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    window:  '<path d="M4 4h16v16H4z"/><path d="M12 4v16M4 12h16"/>'
  };
  const icon = name => '<svg viewBox="0 0 24 24">' + (ICONS[name] || ICONS.home) + '</svg>';
  window.EBO_ICONS = ICONS;

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ---------------- Language ---------------- */
  // Greek is the primary language; a visitor's own choice is remembered.
  let lang = localStorage.getItem("ebo-lang");
  if (!LANGS.includes(lang)) lang = "el";

  function t(key) {
    const dict = window.I18N[lang] || window.I18N.el;
    return dict[key] !== undefined ? dict[key] : (window.I18N.el[key] || "");
  }
  // pick a field out of a data.js entry for the current language
  const d = (obj, field) => (obj[lang] && obj[lang][field]) || (obj.el && obj.el[field]) || "";

  function applyLang(next) {
    lang = LANGS.includes(next) ? next : "el";
    localStorage.setItem("ebo-lang", lang);
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach(el => {
      const v = t(el.dataset.i18n);
      if (v) el.textContent = v;
    });

    // data-i18n-attr="content:meta.desc" — translate an attribute instead
    $$("[data-i18n-attr]").forEach(el => {
      el.dataset.i18nAttr.split(",").forEach(pair => {
        const [attr, key] = pair.split(":").map(s => s.trim());
        const v = t(key);
        if (attr && v) el.setAttribute(attr, v);
      });
    });

    document.title = t("meta.title");

    $$(".lang-switch button").forEach(b => b.classList.toggle("is-active", b.dataset.lang === lang));
    const dl = $("#dockLang span");
    if (dl) dl.textContent = LABEL[lang];
    moveLangPill();

    renderContent();      // services / filters / projects follow the language too
  }

  function moveLangPill() {
    const pill = $(".lang-pill");
    const active = $(".lang-switch button.is-active");
    if (!pill || !active) return;
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = "translateX(" + (active.offsetLeft - 4) + "px)";
  }

  /* ---------------- Render from the mini database ---------------- */
  let activeFilter = "all";

  function renderContent() {
    renderServices();
    renderFilters();
    renderProjects();
    renderContactInfo();
    observeReveals();
  }

  function renderServices() {
    const grid = $("#servicesGrid");
    if (!grid) return;
    grid.innerHTML = DATA.services.map((s, i) => `
      <article class="card glass reveal" data-delay="${i % 3}">
        <span class="card-ico">${icon(s.icon)}</span>
        <h3>${esc(d(s, "t"))}</h3>
        <p>${esc(d(s, "d"))}</p>
      </article>`).join("");

    $$(".card", grid).forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
      card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }

  function renderFilters() {
    const wrap = $("#projectFilters");
    if (!wrap) return;
    // only show categories that actually have photos
    const used = new Set(DATA.projects.map(p => p.cat));
    const cats = DATA.categories.filter(c => used.has(c.id));
    if (!cats.length) { wrap.innerHTML = ""; wrap.hidden = true; return; }
    wrap.hidden = false;

    wrap.innerHTML =
      `<button type="button" class="${activeFilter === "all" ? "is-active" : ""}" data-filter="all">${esc(t("filter.all"))}</button>` +
      cats.map(c => `<button type="button" class="${activeFilter === c.id ? "is-active" : ""}" data-filter="${esc(c.id)}">${esc(c[lang] || c.el)}</button>`).join("");

    $$("button", wrap).forEach(btn => btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      $$("button", wrap).forEach(b => b.classList.toggle("is-active", b === btn));
      applyFilter();
    }));
  }

  function renderProjects() {
    const grid = $("#projectGrid");
    if (!grid) return;
    grid.innerHTML = DATA.projects.map((p, i) => `
      <figure class="proj reveal" data-index="${i}" data-cat="${esc(p.cat)}" data-delay="${i % 3}">
        <img src="${esc(p.img)}" alt="${esc(d(p, "t"))}" loading="lazy">
        <figcaption class="proj-cap glass">
          <strong>${esc(d(p, "t"))}</strong>
          <span>${esc(d(p, "p"))}</span>
        </figcaption>
      </figure>`).join("");

    $$(".proj", grid).forEach(fig => fig.addEventListener("click", () => openLightbox(fig)));
    applyFilter();
  }

  function applyFilter() {
    $$(".proj").forEach(p => p.classList.toggle("is-hidden", activeFilter !== "all" && p.dataset.cat !== activeFilter));
  }

  function renderContactInfo() {
    const c = DATA.contact || {};
    const set = (sel, href, text) => {
      const el = $(sel);
      if (!el) return;
      if (href) el.setAttribute("href", href);
      const strong = $("strong", el);
      if (strong && text) strong.textContent = text;
    };
    set("#infoPhone", "tel:" + (c.phoneRaw || ""), c.phoneLabel);
    set("#infoEmail", "mailto:" + (c.email || ""), c.email);
    set("#infoIg", c.instagram, c.instagramHandle);
    updateWaLinks();
  }

  /* ---------------- Scroll: progress, topbar, active link ---------------- */
  const topbar    = $("#topbar");
  const progress  = $(".scroll-progress i");
  const navLinks  = $$(".nav a");
  const dockItems = $$(".dock-item[href]");
  const dockPill  = $(".dock-pill");

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (topbar) topbar.classList.toggle("is-scrolled", y > 24);

    let current = "home";
    $$("main section[id]").forEach(s => { if (y >= s.offsetTop - window.innerHeight * 0.35) current = s.id; });

    navLinks.forEach(a => a.classList.toggle("is-current", a.getAttribute("href") === "#" + current));

    let activeDock = dockItems[0];
    dockItems.forEach(a => {
      const on = a.getAttribute("href") === "#" + current;
      a.classList.toggle("is-active", on);
      if (on) activeDock = a;
    });
    if (dockPill && activeDock) dockPill.style.transform = "translateX(" + (activeDock.offsetLeft - 8) + "px)";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---------------- Reveal on scroll + counters ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$(".count", e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

  function observeReveals() {
    $$(".reveal").forEach(el => {
      if (el.dataset.delay) el.style.setProperty("--d", el.dataset.delay);
      if (!el.classList.contains("is-in")) io.observe(el);
    });
  }

  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "+";
    const dur = 1400;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------- Lightbox ---------------- */
  const lb      = $("#lightbox");
  const lbImg   = lb && $(".lb-figure img", lb);
  const lbTitle = lb && $(".lb-figure figcaption strong", lb);
  const lbPlace = lb && $(".lb-figure figcaption span", lb);
  let lbIndex = 0;

  const visibleProjects = () => $$(".proj").filter(p => !p.classList.contains("is-hidden"));

  function openLightbox(fig) {
    lbIndex = visibleProjects().indexOf(fig);
    renderLightbox();
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add("is-open"));
    document.body.style.overflow = "hidden";
  }
  function renderLightbox() {
    const fig = visibleProjects()[lbIndex];
    if (!fig) return;
    const p = DATA.projects[+fig.dataset.index] || {};
    lbImg.src = $("img", fig).src;
    lbTitle.textContent = d(p, "t");
    lbPlace.textContent = d(p, "p");
  }
  function stepLightbox(dir) {
    const list = visibleProjects();
    lbIndex = (lbIndex + dir + list.length) % list.length;
    renderLightbox();
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { lb.hidden = true; }, 380);
  }

  if (lb) {
    $(".lb-close", lb).addEventListener("click", closeLightbox);
    $(".lb-next", lb).addEventListener("click", () => stepLightbox(1));
    $(".lb-prev", lb).addEventListener("click", () => stepLightbox(-1));
    lb.addEventListener("click", e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", e => {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    });
  }

  /* ---------------- Contact: WhatsApp + email ---------------- */
  const form   = $("#contactForm");
  const status = $("#formStatus");

  function formValues() {
    if (!form) return {};
    return {
      name:  form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      type:  ($("#cType option:checked") || {}).textContent || "",
      msg:   form.message.value.trim()
    };
  }

  function messageText(v) {
    return t("form.subject") + "\n" +
      t("form.name")  + ": " + v.name  + "\n" +
      t("form.phone") + ": " + v.phone + "\n" +
      (v.email ? t("form.email") + ": " + v.email + "\n" : "") +
      t("form.type")  + ": " + v.type  + "\n\n" + v.msg;
  }

  function validate() {
    if (!form) return false;
    let ok = true;
    [form.name, form.phone].forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) showStatus(t("form.err"), "err");
    return ok;
  }

  function showStatus(msg, kind) {
    if (!status) return;
    status.textContent = msg;
    status.hidden = false;
    status.className = "form-status field-full is-" + (kind || "info");
  }

  // the WhatsApp links always carry whatever is typed at that moment
  function waHref(withForm) {
    const num = (DATA.contact && DATA.contact.whatsapp) || "";
    const text = withForm && form ? messageText(formValues()) : t("form.waHello");
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(text);
  }
  function updateWaLinks() {
    const fab = $("#fabWa");
    if (fab) fab.setAttribute("href", waHref(false));
    const send = $("#waSend");
    if (send) send.setAttribute("href", waHref(true));
  }

  if (form) {
    ["input", "change"].forEach(ev => form.addEventListener(ev, () => {
      updateWaLinks();
      [form.name, form.phone].forEach(f => { if (f.value.trim()) f.classList.remove("is-invalid"); });
    }));

    // WhatsApp: opens the chat with the whole enquiry already written
    const waSend = $("#waSend");
    if (waSend) waSend.addEventListener("click", e => {
      if (!validate()) { e.preventDefault(); return; }
      waSend.setAttribute("href", waHref(true));
      showStatus(t("form.waOpening"), "ok");
    });

    // Email: sends straight to the inbox when a Web3Forms key is set,
    // otherwise falls back to opening the visitor's mail app.
    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!validate()) return;

      const v    = formValues();
      const c    = DATA.contact || {};
      const key  = (c.web3formsKey || "").trim();
      const mail = (c.email || "").trim();
      let mode   = c.mailMode || (key ? "web3forms" : "formsubmit");
      if (mode === "web3forms" && !key) mode = "formsubmit";
      if (mode === "formsubmit" && !mail) mode = "mailto";

      if (mode === "mailto") {
        window.location.href = "mailto:" + mail +
          "?subject=" + encodeURIComponent(t("form.subject")) +
          "&body=" + encodeURIComponent(messageText(v));
        showStatus(t("form.mailOpening"), "ok");
        return;
      }

      const btn = $("#mailSend");
      if (btn) btn.disabled = true;
      showStatus(t("form.sending"), "info");

      const endpoint = mode === "web3forms"
        ? "https://api.web3forms.com/submit"
        : "https://formsubmit.co/ajax/" + encodeURIComponent(mail);

      const payload = mode === "web3forms"
        ? { access_key: key, subject: t("form.subject"), from_name: "EBO.EE website",
            name: v.name, phone: v.phone, email: v.email || "no-reply@ebo.ee",
            type: v.type, message: v.msg }
        : { _subject: t("form.subject"), _template: "table", _captcha: "false",
            name: v.name, phone: v.phone, email: v.email || "", type: v.type, message: v.msg };

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });
        const out = await res.json().catch(() => ({}));
        // web3forms answers success:true, formsubmit answers success:"true"
        if (res.ok && String(out.success) === "true") {
          showStatus(t("form.ok"), "ok");
          form.reset();
          updateWaLinks();
        } else {
          showStatus(t("form.fail"), "err");
        }
      } catch (err) {
        showStatus(t("form.fail"), "err");
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ---------------- Boot ---------------- */
  const savedTheme = localStorage.getItem("ebo-theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  const themeBtn = $("#themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ebo-theme", next);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === "light" ? "#EFEAE3" : "#0A0A0B");
  });

  $$(".lang-switch button").forEach(b => b.addEventListener("click", () => applyLang(b.dataset.lang)));
  const dockLang = $("#dockLang");
  if (dockLang) dockLang.addEventListener("click", () => applyLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]));

  applyLang(lang);
  onScroll();

  // the pill must be measured after layout, and again once webfonts settle
  requestAnimationFrame(moveLangPill);
  window.addEventListener("load", moveLangPill);
  window.addEventListener("resize", moveLangPill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveLangPill);

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
