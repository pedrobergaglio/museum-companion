"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Grid3X3, MapPin, X } from "lucide-react";
import dynamic from "next/dynamic";

// Leaflet debe cargarse solo en el cliente (sin SSR)
const LocationMap = dynamic(
  () => import("@/components/gallery/location-map"),
  { ssr: false, loading: () => <MapSkeleton /> }
) as React.ComponentType<{
  photos: GalleryPhoto[];
  onPhotoSelect: (photo: GalleryPhoto) => void;
}>;

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

function MapSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-muted">
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  );
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

export default function GalleryPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [view, setView] = useState<"grid" | "map">("grid");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/gallery`);
      const json = await res.json();
      if (json.success) {
        setPhotos(json.data);
      }
    }
    load();
  }, [projectId]);

  const photosWithGeo = photos.filter(
    (p) => p.latitude !== null && p.longitude !== null
  );

  // Vista de detalle de foto
  if (selectedPhoto) {
    return (
      <div className="flex h-dvh flex-col bg-background">
        <nav className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">
              {selectedPhoto.userName ?? "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(selectedPhoto.createdAt)}
            </span>
          </div>
          {selectedPhoto.latitude && selectedPhoto.longitude && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {selectedPhoto.latitude.toFixed(4)}, {selectedPhoto.longitude.toFixed(4)}
            </span>
          )}
        </nav>

        <div className="flex-1 overflow-y-auto">
          <img
            src={selectedPhoto.imageUrl}
            alt="Foto del museo"
            className="w-full"
          />
          {selectedPhoto.contentText && (
            <div className="p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {selectedPhoto.contentText}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <nav className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-base font-semibold">Galería</h1>
        <span className="mr-2 text-xs text-muted-foreground">
          {photos.length} {photos.length === 1 ? "foto" : "fotos"}
        </span>

        {/* Tabs: Grid / Mapa */}
        <div className="flex rounded-lg border border-border bg-muted p-0.5">
          <button
            onClick={() => setView("grid")}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              view === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            aria-label="Vista grilla"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              view === "map"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
            aria-label="Vista mapa"
          >
            <MapPin className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Content */}
      {view === "grid" ? (
        <div className="flex-1 overflow-y-auto p-2">
          {photos.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">No hay fotos todavía</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square overflow-hidden rounded"
                >
                  <img
                    src={photo.imageUrl}
                    alt="Foto del museo"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay con nombre, fecha y geo indicator */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="truncate text-[10px] font-medium text-white">
                      {photo.userName ?? ""}
                    </p>
                    <p className="truncate text-[9px] text-white/70">
                      {formatDate(photo.createdAt)}
                    </p>
                  </div>
                  {photo.latitude && photo.longitude && (
                    <div className="absolute right-1 top-1">
                      <MapPin className="h-3 w-3 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1">
          {photosWithGeo.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No hay fotos con ubicación
              </p>
            </div>
          ) : (
            <LocationMap
              photos={photosWithGeo}
              onPhotoSelect={setSelectedPhoto}
            />
          )}
        </div>
      )}
    </div>
  );
}
