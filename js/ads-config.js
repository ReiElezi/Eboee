/* =========================================================
   EBO.EE — konfigurimi i reklamave (Google AdSense)

   E VETMJA GJE QE NDRYSHON DUART kur te aprovohesh nga AdSense:
   vendos "client" dhe "slot" me poshte. Asgje tjeter nuk preket.

   Deri sa "client" te jete bosh, AdSlot kalon vetvetiu ne modalitetin
   "sponsor direkt" (shiko js/sponsors.json) — asnje reklame AdSense
   s'ngarkohet dhe asnje script i Google-it s'thirret.
   ========================================================= */
window.EBO_ADS_CONFIG = {
  adsense: {
    client: "",  // p.sh. "ca-pub-1234567890123456"
    slot:   ""   // p.sh. "1234567890"
  }
};
