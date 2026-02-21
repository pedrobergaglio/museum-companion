"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Music } from "lucide-react";
import { toast } from "sonner";
import { useAudioStore } from "@/stores/audio-store";
import { useChannelStore } from "@/stores/channel-store";
import type { User, Settings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [, setSettings] = useState<Settings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [photographerUserId, setPhotographerUserId] = useState<number>(1);
  const [ambientMusicEnabled, setAmbientMusicEnabledLocal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { setAmbientMusicEnabled: setAmbientMusicStore } = useAudioStore();
  const { setPhotographer } = useChannelStore();

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data.settings);
        setUsers(json.data.users);
        setSystemPrompt(json.data.settings.systemPrompt);
        setPhotographerUserId(json.data.settings.photographerUserId);
        setAmbientMusicEnabledLocal(json.data.settings.ambientMusicEnabled);
        setAmbientMusicStore(json.data.settings.ambientMusicEnabled);
      }
    }
    load();
  }, [setAmbientMusicStore]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, photographerUserId, ambientMusicEnabled }),
      });
      const json = await res.json();
      if (json.success) {
        setAmbientMusicStore(ambientMusicEnabled);
        // Actualizar fotografo en channel store localmente
        const photographer = users.find((u) => u.id === photographerUserId);
        if (photographer) {
          setPhotographer(photographer.id, photographer.name);
        }
        toast.success("Configuración guardada");
      } else {
        toast.error(json.error.message);
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <nav className="flex h-12 items-center gap-3 border-b border-border bg-card px-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">Configuración</h1>
      </nav>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Fotógrafo del grupo
          </label>
          <select
            value={photographerUserId}
            onChange={(e) => setPhotographerUserId(parseInt(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Prompt del sistema
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Instrucciones para la IA..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Este prompt se usa como contexto base para todas las descripciones
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Música ambiental
          </label>
          <button
            type="button"
            onClick={() => setAmbientMusicEnabledLocal(!ambientMusicEnabled)}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
              ambientMusicEnabled
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Music className="h-5 w-5" />
            <span className="flex-1 text-left">
              {ambientMusicEnabled
                ? "Activada — música de fondo durante las descripciones"
                : "Desactivada — sin música de fondo"}
            </span>
            <div
              className={`h-6 w-11 rounded-full transition-colors ${
                ambientMusicEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${
                  ambientMusicEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Reproduce música antigua de fondo mientras la IA describe una obra
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
