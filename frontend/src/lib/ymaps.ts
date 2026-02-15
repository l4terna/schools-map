export type YMap = any;
export type YPlacemark = any;
export type YClusterer = any;

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;

const SCRIPT_ID = "ymaps-script";

let readyPromise: Promise<any> | null = null;

export function loadYmaps(): Promise<any> {
  if (readyPromise) return readyPromise;

  readyPromise = new Promise((resolve, reject) => {
    if ((window as any).ymaps) {
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () =>
        (window as any).ymaps.ready(() => resolve((window as any).ymaps)),
      );
      existing.addEventListener("error", reject);
      return;
    }

    const params = new URLSearchParams({
      lang: "ru_RU",
      load: "package.full",
    });
    if (API_KEY) params.set("apikey", API_KEY);

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.onload = () =>
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return readyPromise;
}
