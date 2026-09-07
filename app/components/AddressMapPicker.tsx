"use client";

import { useEffect, useRef, useState } from "react";

// کامپوننت نقشه Leaflet (OpenStreetMap) برای انتخاب آدرس روی نقشه.
// Leaflet از CDN لود می‌شود تا نیازی به پکیج npm و سازگاری build هاستینگر نباشد.

type LatLng = { lat: number; lng: number };

type LeafletMarker = {
  setLatLng: (latlng: LatLng) => void;
  addTo: (map: unknown) => LeafletMarker;
  on?: (event: string, handler: (event: { target: LeafletMarker }) => void) => void;
  getLatLng?: () => LatLng;
};

type LeafletMap = {
  on: (event: string, handler: (event: { latlng: LatLng }) => void) => void;
  setView: (center: [number, number], zoom?: number) => void;
  remove: () => void;
};

type LeafletApi = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (map: unknown) => unknown };
  marker: (latlng: LatLng, opts?: Record<string, unknown>) => LeafletMarker;
  Icon: { Default: { mergeOptions: (opts: Record<string, unknown>) => void } };
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

export default function AddressMapPicker({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  const [mapError, setMapError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let cancelled = false;

    const createMarker = (leaflet: LeafletApi, map: LeafletMap, lat: number, lng: number) => {
      const marker = leaflet.marker({ lat, lng }, { draggable: true });
      marker.addTo(map);
      if (marker.on) {
        marker.on("dragend", (event) => {
          const position = event.target.getLatLng?.();
          if (position) onPickRef.current(position.lat, position.lng);
        });
      }
      markerRef.current = marker;
    };

    const init = () => {
      if (cancelled || !containerRef.current || mapRef.current || !window.L) return;
      const leaflet = window.L;
      leaflet.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const hasPosition = latitude !== null && longitude !== null;
      const startLat = latitude ?? 32.6546;
      const startLng = longitude ?? 51.668;
      const map = leaflet.map(containerRef.current, {
        center: [startLat, startLng],
        zoom: hasPosition ? 15 : 5,
        scrollWheelZoom: true,
      });
      leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      map.on("click", (event) => {
        onPickRef.current(event.latlng.lat, event.latlng.lng);
      });
      mapRef.current = map;
      if (hasPosition) createMarker(leaflet, map, latitude as number, longitude as number);
      setReady(true);
    };

    if (window.L) {
      init();
    } else {
      const existingCss = document.querySelector(`link[href="${LEAFLET_CSS}"]`);
      if (!existingCss) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = LEAFLET_CSS;
        document.head.appendChild(css);
      }
      const existingScript = document.querySelector(`script[src="${LEAFLET_JS}"]`);
      if (existingScript) {
        (existingScript as HTMLScriptElement).addEventListener("load", init, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = LEAFLET_JS;
        script.onload = init;
        script.onerror = () => setMapError("بارگذاری نقشه انجام نشد؛ اتصال اینترنت را بررسی کنید.");
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* نقشه قبلاً حذف شده است */ }
      }
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    if (latitude === null || longitude === null) return;
    const map = mapRef.current;
    if (markerRef.current) {
      markerRef.current.setLatLng({ lat: latitude, lng: longitude });
    } else {
      const marker = window.L.marker({ lat: latitude, lng: longitude }, { draggable: true }).addTo(map);
      if (marker.on) {
        marker.on("dragend", (event) => {
          const position = event.target.getLatLng?.();
          if (position) onPickRef.current(position.lat, position.lng);
        });
      }
      markerRef.current = marker;
    }
    map.setView([latitude, longitude], 15);
  }, [ready, latitude, longitude]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200">
      <div ref={containerRef} className="h-64 w-full" dir="ltr" />
      {mapError && <p className="bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700">{mapError}</p>}
      <p className="bg-amber-50/60 px-3 py-2 text-[10px] font-semibold text-amber-900 border-t border-amber-100">
        روی نقشه کلیک کنید تا موقعیت دقیق آدرس شما ثبت شود. نشانگر را هم می‌توانید جابه‌جا کنید.
      </p>
    </div>
  );
}
