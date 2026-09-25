/* =========================================================
   EBO.EE — matja e konversioneve
   GA4  +  Google Ads  +  Consent Mode v2 (i detyrueshem per BE)

   ┌───────────────────────────────────────────────────────┐
   │  E VETMJA GJE QE NDRYSHON DUART:  blloku EBO_ADS me   │
   │  poshte.  Vendos "ads" dhe "labels" kur t'i marresh   │
   │  nga Google Ads.  Asgje tjeter nuk preket.            │
   └───────────────────────────────────────────────────────┘

   Deri sa "ads" te jete bosh, faqja mat gjithcka ne GA4 dhe
   nuk i dergon asgje Google Ads-it — pa gabime, pa dublikime.
   ========================================================= */

window.EBO_ADS = {

  /* GA4 — i instaluar tashme */
  ga: "G-7L6V8TTKS7",

  /* Google Ads — ngjite ketu ID-ne, formati: "AW-1234567890" */
  ads: "",

  /* Etiketat e konversioneve nga Google Ads.
     Cdo konversion qe krijon ne Ads te jep nje varg si
     "AbC-D_efG-h12_34-567". Ngjit vetem ate pjese, jo AW-...  */
  labels: {
    call:     "",   // konversioni "Telefonate"
    whatsapp: "",   // konversioni "WhatsApp"
    form:     "",   // konversioni "Forma e kontaktit"
    email:    ""    // konversioni "Email"
  },

  /* Sa vlen mesatarisht nje kontakt (EUR). Google i perdor
     per te optimizuar ofertat — jo per faturim. Ndryshoji
     kur ta dish sa % e kontakteve kthehen ne pune. */
  values: { call: 40, whatsapp: 35, form: 45, email: 20 },

  currency: "EUR"
};


(function () {
  "use strict";

  var CFG = window.EBO_ADS;
  var LS_CONSENT = "ebo-consent";
  var LS_CLICKID = "ebo-clickid";

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function read(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* ---------------- Google Ads: konfigurimi ---------------- */

  if (CFG.ads) gtag("config", CFG.ads);

  /* ---------------- Nga cila reklame erdhi vizitori? ----------------
     Google e ngjit ?gclid=... ne link kur klikohet nje reklame.
     E ruajme 90 dite, qe edhe nese vizitori kthehet me vone dhe
     telefonon, ta dime se erdhi nga reklama.                        */

  (function captureClickId() {
    var q = new URLSearchParams(location.search);
    var id = q.get("gclid") || q.get("gbraid") || q.get("wbraid");
    var src = q.get("utm_source") || (id ? "google-ads" : "");
    var camp = q.get("utm_campaign") || "";
    if (!id && !src) return;
    write(LS_CLICKID, JSON.stringify({
      id: id || "", src: src, camp: camp, at: Date.now()
    }));
  })();

  function source() {
    var raw = read(LS_CLICKID);
    if (!raw) return "";
    try {
      var o = JSON.parse(raw);
      if (Date.now() - o.at > 90 * 864e5) return "";     // 90 dite
      return [o.src, o.camp, o.id].filter(Boolean).join(" · ");
    } catch (e) { return ""; }
  }

  /* ---------------- Dergimi i nje konversioni ---------------- */

  var lastSent = {};

  function lead(kind, extra) {
    // mbron nga dublikimi kur nje klikim ndez dy degjues njeheresh
    var now = Date.now();
    if (lastSent[kind] && now - lastSent[kind] < 1500) return;
    lastSent[kind] = now;

    var value = (CFG.values && CFG.values[kind]) || 0;
    var src = source();

    // 1) GA4 — funksionon gjithmone, edhe pa Google Ads
    gtag("event", "generate_lead", {
      method: kind,
      value: value,
      currency: CFG.currency,
      ebo_source: src || "organic",
      ebo_detail: (extra && extra.detail) || ""
    });

    // 2) Google Ads — vetem nese ID-ja dhe etiketa jane vendosur
    var label = CFG.labels && CFG.labels[kind];
    if (CFG.ads && label) {
      gtag("event", "conversion", {
        send_to: CFG.ads + "/" + label,
        value: value,
        currency: CFG.currency
      });
    }
  }

  /* ---------------- Kapja e klikimeve ----------------
     Nje degjues i vetem mbi document-in kap cdo buton kontakti,
     edhe ata qe main.js i krijon me vone.                      */

  document.addEventListener("click", function (e) {
    // nese main.js e ndaloi klikimin (p.sh. forma s'eshte plotesuar),
    // atehere s'ka kontakt te vertete — mos e numero
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = (a.getAttribute("href") || "").toLowerCase();

    if (href.indexOf("tel:") === 0)           lead("call",     { detail: a.id || "tel" });
    else if (href.indexOf("wa.me") > -1 ||
             href.indexOf("whatsapp.com") > -1) lead("whatsapp", { detail: a.id || "wa" });
    else if (href.indexOf("mailto:") === 0)   lead("email",    { detail: a.id || "mail" });
    else if (href.indexOf("instagram.com") > -1)
      gtag("event", "click_instagram", { ebo_source: source() || "organic" });
  }, false);

  /* main.js e ndez kete kur forma niset me sukses */
  document.addEventListener("ebo:lead", function (e) {
    lead((e.detail && e.detail.kind) || "form", e.detail);
  });

  /* ---------------- Consent Mode v2: shiriti i pelqimit ----------------
     Pa kete, Google Ads nuk lejohet te mbledhe te dhena nga
     vizitoret ne BE — dhe remarketing-u mbetet bosh.            */

  var TXT = {
    el: {
      msg: "Χρησιμοποιούμε cookies για να μετράμε την επισκεψιμότητα και την απόδοση των διαφημίσεών μας.",
      ok: "Αποδοχή", no: "Μόνο τα απαραίτητα"
    },
    en: {
      msg: "We use cookies to measure traffic and how well our ads perform.",
      ok: "Accept", no: "Essential only"
    },
    sq: {
      msg: "Përdorim cookies për të matur vizitat dhe performancën e reklamave tona.",
      ok: "Pranoj", no: "Vetëm të domosdoshmet"
    }
  };

  function grant(yes) {
    var v = yes ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
      analytics_storage: v
    });
    gtag("set", "ads_data_redaction", !yes);
    write(LS_CONSENT, yes ? "granted" : "denied");
  }

  function banner() {
    if (read(LS_CONSENT)) return;                 // ka vendosur nje here

    var lang = read("ebo-lang");
    if (!TXT[lang]) lang = "el";
    var t = TXT[lang];

    var el = document.createElement("div");
    el.className = "consent glass";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<p></p>' +
      '<div class="consent-btns">' +
      '<button type="button" class="btn btn-ghost btn-sm" data-c="no"></button>' +
      '<button type="button" class="btn btn-primary btn-sm" data-c="ok"></button>' +
      '</div>';
    el.querySelector("p").textContent = t.msg;
    el.querySelector('[data-c="no"]').textContent = t.no;
    el.querySelector('[data-c="ok"]').textContent = t.ok;

    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]");
      if (!b) return;
      grant(b.dataset.c === "ok");
      el.classList.remove("is-in");
      document.body.classList.remove("has-consent");
      setTimeout(function () { el.remove(); }, 300);
    });

    document.body.appendChild(el);
    document.body.classList.add("has-consent");
    // setTimeout, jo requestAnimationFrame: rAF nuk ndizet nese faqja
    // hapet ne nje tab ne sfond, dhe shiriti do te mbetej i padukshem
    setTimeout(function () { el.classList.add("is-in"); }, 30);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", banner);
  else banner();

  /* e bejme te arritshem per main.js */
  window.EBO_TRACK = { lead: lead, source: source };

})();
