"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle2 } from "lucide-react";

export type ResolvedAddress = {
  lat: number;
  lng: number;
  address: string;
  province?: string;
  city?: string;
  postalCode?: string;
};

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

type LeafletDivIcon = unknown;

type LeafletApi = {
  map: (el: HTMLElement, opts?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, opts?: Record<string, unknown>) => { addTo: (map: unknown) => unknown };
  marker: (latlng: LatLng, opts?: Record<string, unknown>) => LeafletMarker;
  divIcon: (opts: { className?: string; html?: string; iconSize?: [number, number]; iconAnchor?: [number, number] }) => LeafletDivIcon;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// پین اختصاصی SVG با انیمیشن پالس و سایه؛ بدون وابستگی به فایلهای خارجی unpkg که در ایران مسدود یا کند هستند
const PIN_HTML = `
  <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; bottom: 0; width: 14px; height: 5px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(1px);"></div>
    <div style="position: absolute; bottom: 6px; transform: scale(1); animation: pinBounce 0.4s ease-out;">
      <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#b45309"/>
        <circle cx="12" cy="11" r="5" fill="#ffffff"/>
        <circle cx="12" cy="11" r="2.5" fill="#78350f"/>
      </svg>
    </div>
  </div>
`;

export default function AddressMapPicker({
  latitude,
  longitude,
  onPick,
  onAddressSelect,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (lat: number, lng: number) => void;
  onAddressSelect?: (data: ResolvedAddress) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  const onAddressSelectRef = useRef(onAddressSelect);

  const [mapError, setMapError] = useState("");
  const [ready, setReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastResolvedAddress, setLastResolvedAddress] = useState<string>("");
  const [locatingUser, setLocatingUser] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
    onAddressSelectRef.current = onAddressSelect;
  }, [onPick, onAddressSelect]);

  // متد درخواست تبدیل مختصات به آدرس متنی فارسی (Reverse Geocoding)
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/shipping/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success && data.address) {
        setLastResolvedAddress(data.address);
        if (onAddressSelectRef.current) {
          onAddressSelectRef.current({
            lat,
            lng,
            address: data.address,
            province: data.province,
            city: data.city,
            postalCode: data.postalCode,
          });
        }
      }
    } catch (err) {
      console.warn("Could not reverse geocode:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // دریافت موقعیت فعلی کاربر با GPS مرورگر
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("مرورگر شما از موقعیت‌یاب پشتیبانی نمی‌کند.");
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocatingUser(false);
        onPickRef.current(lat, lng);
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng({ lat, lng });
        }
        void fetchAddressFromCoords(lat, lng);
      },
      () => {
        setLocatingUser(false);
        alert("دسترسی به موقعیت مکانی داده نشد یا GPS فعال نیست. لطفاً روی نقشه کلیک کنید.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    let cancelled = false;

    const createOrUpdateMarker = (leaflet: LeafletApi, map: LeafletMap, lat: number, lng: number) => {
      const pinIcon = leaflet.divIcon({
        className: "custom-map-marker-pin",
        html: PIN_HTML,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng({ lat, lng });
      } else {
        const marker = leaflet.marker({ lat, lng }, { draggable: true, icon: pinIcon });
        marker.addTo(map);
        if (marker.on) {
          marker.on("dragend", (event) => {
            const pos = event.target.getLatLng?.();
            if (pos) {
              onPickRef.current(pos.lat, pos.lng);
              void fetchAddressFromCoords(pos.lat, pos.lng);
            }
          });
        }
        markerRef.current = marker;
      }
    };

    const init = () => {
      if (cancelled || !containerRef.current || mapRef.current || !window.L) return;
      const leaflet = window.L;

      const hasPosition = latitude !== null && longitude !== null;
      // مرکز پیش‌فرض: اصفهان (مبدأ فروشگاه) یا مختصات انتخابی
      const startLat = latitude ?? 32.6546;
      const startLng = longitude ?? 51.668;

      const map = leaflet.map(containerRef.current, {
        center: [startLat, startLng],
        zoom: hasPosition ? 16 : 13,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; نقشه باز",
        })
        .addTo(map);

      map.on("click", (event) => {
        const { lat, lng } = event.latlng;
        onPickRef.current(lat, lng);
        createOrUpdateMarker(leaflet, map, lat, lng);
        void fetchAddressFromCoords(lat, lng);
      });

      mapRef.current = map;
      if (hasPosition) {
        createOrUpdateMarker(leaflet, map, latitude as number, longitude as number);
      }
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
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
      }
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // همگام‌سازی هنگام تغییر بیرونی مختصات
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    if (latitude === null || longitude === null) return;
    const map = mapRef.current;
    const leaflet = window.L;

    const pinIcon = leaflet.divIcon({
      className: "custom-map-marker-pin",
      html: PIN_HTML,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng({ lat: latitude, lng: longitude });
    } else {
      const marker = leaflet.marker({ lat: latitude, lng: longitude }, { draggable: true, icon: pinIcon }).addTo(map);
      if (marker.on) {
        marker.on("dragend", (event) => {
          const pos = event.target.getLatLng?.();
          if (pos) {
            onPickRef.current(pos.lat, pos.lng);
            void fetchAddressFromCoords(pos.lat, pos.lng);
          }
        });
      }
      markerRef.current = marker;
    }
    map.setView([latitude, longitude], 16);
  }, [ready, latitude, longitude]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-300 bg-stone-50 shadow-inner">
      {/* دکمه موقعیت فعلی شناور روی نقشه */}
      <div className="absolute top-3 left-3 z-[400] flex gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/95 px-3 py-1.5 text-[11px] font-black text-stone-800 shadow-md backdrop-blur-sm hover:bg-amber-50 hover:text-amber-900 transition active:scale-95"
        >
          {locatingUser ? (
            <Loader2 className="size-3.5 animate-spin text-amber-600" />
          ) : (
            <Navigation className="size-3.5 text-amber-600" />
          )}
          <span>{locatingUser ? "در حال مکان‌یابی..." : "موقعیت من"}</span>
        </button>
      </div>

      {/* نمایش نقشه */}
      <div ref={containerRef} className="h-72 w-full cursor-crosshair" dir="ltr" />

      {mapError && (
        <p className="bg-rose-50 px-3 py-2 text-[10px] font-semibold text-rose-700 border-t border-rose-100">
          {mapError}
        </p>
      )}

      {/* وضعیت تبدیل نقشه به آدرس خودکار */}
      <div className="border-t border-stone-200 bg-white p-3">
        {isGeocoding ? (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
            <Loader2 className="size-4 animate-spin text-amber-600" />
            <span>در حال استخراج نام خیابان و آدرس دقیق از روی نقشه...</span>
          </div>
        ) : lastResolvedAddress ? (
          <div className="flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <span className="font-bold">آدرس از روی نقشه نوشته و ثبت شد: </span>
              <span className="font-medium text-stone-700">{lastResolvedAddress}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            <MapPin className="size-3.5 text-amber-600 shrink-0" />
            <span>
              روی نقطه موردنظر خود در نقشه کلیک کنید یا نشانگر را جابه‌جا کنید تا نام خیابان و آدرس خودکار در فرم نوشته شود.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
