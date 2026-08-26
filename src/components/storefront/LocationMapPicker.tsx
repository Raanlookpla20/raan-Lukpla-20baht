"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Center of Thailand / Bangkok — shown until the customer pins a location.
const DEFAULT_CENTER: [number, number] = [13.7563, 100.5018];
const DEFAULT_ZOOM = 11;
const PIN_ZOOM = 16;

export interface LatLng {
  lat: number;
  lng: number;
}

// Self-contained inline SVG pin — avoids the well-known issue where
// Leaflet's default marker image URLs break under bundlers (they resolve
// relative to the wrong base path), so no external icon assets are needed.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35))">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.716 23.284 0 15 0z" fill="#0ea5e9"/>
    <circle cx="15" cy="15" r="6" fill="#ffffff"/>
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

function ClickToPlace({ onSelect }: { onSelect: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Imperatively pans/zooms the already-mounted map — only fired on
// programmatic moves (the "use my location" button), never on a manual
// click/drag, so the view doesn't jump around while the customer is
// actively placing the pin themselves.
function RecenterOnSignal({ signal, zoom }: { signal: LatLng | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (signal) {
      map.setView([signal.lat, signal.lng], zoom, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal?.lat, signal?.lng]);
  return null;
}

export function LocationMapPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (pos: LatLng) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [recenterSignal, setRecenterSignal] = useState<LatLng | null>(null);

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่งอัตโนมัติ กรุณาปักหมุดเองบนแผนที่");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChange(next);
        setRecenterSignal(next);
        setLocating(false);
      },
      () => {
        setGeoError("ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาปักหมุดเองบนแผนที่ด้านล่าง");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={locating}
        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        📍 {locating ? "กำลังค้นหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบันของฉัน"}
      </button>
      {geoError && <p className="text-xs text-danger-500">{geoError}</p>}

      <div className="h-64 w-full overflow-hidden rounded-xl border border-[var(--color-border)] sm:h-80">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? PIN_ZOOM : DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onSelect={onChange} />
          <RecenterOnSignal signal={recenterSignal} zoom={PIN_ZOOM} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              draggable
              icon={pinIcon}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        {value
          ? `พิกัดที่เลือก: ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)} — แตะบนแผนที่หรือลากหมุดเพื่อปรับตำแหน่ง`
          : "แตะบนแผนที่เพื่อปักหมุดตำแหน่งจัดส่ง (ไม่บังคับ)"}
      </p>
    </div>
  );
}
