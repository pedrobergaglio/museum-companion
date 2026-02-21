"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GalleryPhoto {
  id: number;
  imageUrl: string;
  contentText: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  userId: number;
  userName: string | null;
}

interface LocationMapProps {
  photos: GalleryPhoto[];
  onPhotoSelect: (photo: GalleryPhoto) => void;
}

// Fix Leaflet default marker icon issue con bundlers — assets locales en /public/leaflet/
const markerIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para ajustar bounds del mapa a los markers
function FitBounds({ photos }: { photos: GalleryPhoto[] }) {
  const map = useMap();
  const hasAdjusted = useRef(false);

  useEffect(() => {
    if (hasAdjusted.current || photos.length === 0) return;

    const bounds = L.latLngBounds(
      photos.map((p) => [p.latitude!, p.longitude!] as [number, number])
    );

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    hasAdjusted.current = true;
  }, [map, photos]);

  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LocationMap({ photos, onPhotoSelect }: LocationMapProps) {
  if (photos.length === 0) return null;

  // Centro inicial: primer foto con geo
  const center: [number, number] = [photos[0].latitude!, photos[0].longitude!];

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      <FitBounds photos={photos} />

      {photos.map((photo) => (
        <Marker
          key={photo.id}
          position={[photo.latitude!, photo.longitude!]}
          icon={markerIcon}
        >
          <Popup maxWidth={200} minWidth={150}>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onPhotoSelect(photo)}
                className="overflow-hidden rounded"
              >
                <img
                  src={photo.imageUrl}
                  alt="Foto"
                  className="h-24 w-full rounded object-cover"
                  loading="lazy"
                />
              </button>
              <div>
                <p className="text-xs font-medium">
                  {photo.userName ?? "Usuario"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {formatDate(photo.createdAt)}
                </p>
              </div>
              {photo.contentText && (
                <p className="line-clamp-3 text-[11px] leading-tight text-gray-700">
                  {photo.contentText}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
