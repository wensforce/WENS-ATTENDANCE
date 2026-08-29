const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// "DEMO_MAP_ID" lets AdvancedMarkerElement work without a cloud-configured
// map style. Set VITE_GOOGLE_MAPS_MAP_ID for production styling and quotas.
export const GOOGLE_MAPS_MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

let loaderPromise = null;

/* eslint-disable */
// Google's official dynamic library import bootstrap. It defines
// google.maps.importLibrary synchronously and fetches the API on first use.
const installBootstrap = (g) => {
  var h,
    a,
    k,
    p = "The Google Maps JavaScript API",
    c = "google",
    l = "importLibrary",
    q = "__ib__",
    m = document,
    b = window;
  b = b[c] || (b[c] = {});
  var d = b.maps || (b.maps = {}),
    r = new Set(),
    e = new URLSearchParams(),
    u = () =>
      h ||
      (h = new Promise((f, n) => {
        a = m.createElement("script");
        e.set("libraries", [...r] + "");
        for (k in g)
          e.set(
            k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
            g[k],
          );
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => (h = n(Error(p + " could not load.")));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
  d[l]
    ? console.warn(p + " only loads once. Ignoring:", g)
    : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
};
/* eslint-enable */

/**
 * Loads the Google Maps JS API bootstrap once per page and resolves when ready.
 * @returns {Promise<typeof window.google.maps>}
 */
export const loadGoogleMaps = () => {
  if (loaderPromise) return loaderPromise;

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error("VITE_GOOGLE_MAPS_API_KEY is not configured"),
    );
  }

  installBootstrap({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });

  loaderPromise = window.google.maps
    .importLibrary("core")
    .then(() => window.google.maps)
    .catch((error) => {
      loaderPromise = null;
      throw error;
    });

  return loaderPromise;
};
