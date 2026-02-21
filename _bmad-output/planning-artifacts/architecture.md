---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-02-20'
inputDocuments: ['prd.md']
workflowType: 'architecture'
project_name: 'turism-app'
user_name: 'Pedro'
date: '2026-02-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Analisis de Contexto del Proyecto

### Vision General de Requisitos

**Requisitos Funcionales:**
33 FRs en 8 areas de capacidad. El nucleo arquitectonico se concentra en 3 pipelines: (1) captura multimedia del cliente (foto, audio, texto, geolocalizacion), (2) orquestacion de OpenAI en el servidor (GPT-4o vision + TTS), (3) broadcast en tiempo real a multiples dispositivos.

**Requisitos No Funcionales:**
Los NFRs criticos que moldean la arquitectura:
- NFR1/NFR2: La cadena foto→audio debe completarse en < 8s, con texto visible en < 3s. Esto exige procesamiento en paralelo y streaming, no secuencial.
- NFR3: Broadcast grupal < 1s — requiere conexiones persistentes (WebSocket/SSE), no polling.
- NFR6: Bundle < 500KB — descarta frameworks pesados, favorece soluciones ligeras.
- NFR11-12: Reconexion automatica + fallback a modo solo — el cliente debe ser resiliente a desconexiones.

**Escala y Complejidad:**
- Dominio primario: Full-stack web (PWA + servidor API)
- Nivel de complejidad: Medio
- Componentes arquitectonicos estimados: ~8 (cliente PWA, servidor API, orquestador OpenAI, servicio WebSocket, almacenamiento de fotos, base de datos, servicio TTS, service worker)

### Restricciones Tecnicas y Dependencias

- **OpenAI API**: dependencia externa critica para GPT-4o (vision) y TTS. Ambas APIs tienen latencia variable y rate limits. La arquitectura debe manejar streaming y paralelismo.
- **Browser APIs**: MediaDevices (camara/microfono), Geolocation API, Web Audio API, MediaRecorder. Safari mobile tiene restricciones de autoplay que requieren interaccion de usuario para iniciar audio.
- **PWA**: Service Worker para cache, manifest para instalacion. Sin acceso a APIs nativas (notificaciones push no requeridas).
- **5 usuarios fijos**: elimina necesidad de auth, registro, gestion de usuarios, escalabilidad horizontal. Simplifica drasticamente la arquitectura.
- **Stack elegido**: Next.js + React + Tailwind CSS / shadcn-ui

### Preocupaciones Transversales Identificadas

- **Politica de autoplay de audio**: Safari y Chrome requieren gesto de usuario para reproducir audio. Necesita estrategia para que el TTS se reproduzca automaticamente (posiblemente un unlock de audio al conectarse al canal).
- **Compresion de imagenes client-side**: las fotos de celular pueden pesar 3-8MB. Comprimir antes de upload es critico para el target de < 8s.
- **Gestion de estado de conexion**: el cliente debe rastrear si esta en modo grupal o solo, manejar desconexiones gracefully, y sincronizar estado al reconectarse.
- **Contexto de conversacion OpenAI**: mantener historial de mensajes por usuario por proyecto en el servidor para follow-ups contextuales.

## Evaluacion de Starter Template

### Dominio Tecnologico Primario

Full-stack web (PWA) — Next.js como framework unificado para frontend y API backend.

### Preferencias Tecnicas

- **Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui
- **Base de datos:** SQLite (archivo local en disco) + Drizzle ORM
- **Despliegue:** EC2 Ubuntu + PM2 + Nginx (reverse proxy con HTTPS y WebSocket passthrough)
- **Integraciones:** OpenAI API (GPT-4o + TTS)

### Starter Seleccionado: create-next-app + shadcn init

**Razon de seleccion:**
`create-next-app` es el starter oficial de Next.js 16.1.6, con Tailwind CSS integrado por defecto. shadcn/ui se agrega con `shadcn init` sobre el proyecto base. Combinacion moderna, ligera y bien mantenida para una PWA rapida.

**Comandos de inicializacion:**

```bash
pnpm create next-app@latest turism-app --yes
cd turism-app
pnpm dlx shadcn@latest init
```

El flag `--yes` configura: TypeScript, Tailwind CSS, ESLint, App Router, Turbopack, alias `@/*`.

### Decisiones Arquitectonicas del Starter

**Lenguaje y Runtime:**
- TypeScript (strict mode)
- Node.js 20.9+ runtime
- React 19 (canary integrado con Next.js)

**Estilo:**
- Tailwind CSS 4 con configuracion por defecto
- shadcn/ui para componentes base
- CSS variables para tema personalizable (paleta calida: naranja, rojo, amarillo)

**Build Tooling:**
- Turbopack como bundler por defecto
- pnpm como package manager
- next.config: `output: 'standalone'` para deploy en EC2

**Organizacion de Codigo:**
- App Router (file-system routing)
- Estructura `src/` con alias `@/*`
- Componentes shadcn en `@/components/ui/`

**Base de Datos:**
- SQLite archivo local en disco del EC2
- Drizzle ORM (ligero, type-safe, mejor que Prisma para proyectos pequenos)
- Migraciones via drizzle-kit

**Despliegue:**
- EC2 Ubuntu con PM2 (process manager)
- Nginx como reverse proxy con HTTPS (requerido para APIs de camara/microfono del navegador)
- WebSocket passthrough configurado en Nginx
- SQLite en disco persistente del EC2

**Nota:** La inicializacion del proyecto con estos comandos sera la primera story de implementacion.

## Decisiones Arquitectonicas Core

### Decisiones Criticas (Bloquean Implementacion)

| Categoria | Decision | Tecnologia | Razon |
|---|---|---|---|
| Tiempo real | WebSockets para sync grupal | Socket.IO | Rooms nativas para canal grupal, reconexion automatica (NFR11), fallback a polling. ~40KB cliente, dentro del budget de 500KB |
| Base de datos | Almacenamiento persistente | SQLite + Drizzle ORM | 5 usuarios, cero infraestructura extra. Drizzle: ligero, type-safe, migraciones con drizzle-kit |
| IA Vision | Analisis de imagen multimodal | OpenAI GPT-4o | Streaming de respuesta, vision + texto/audio en un solo request |
| TTS | Texto a voz en espanol | OpenAI TTS API | Voz natural, integracion directa con el mismo proveedor |
| Despliegue | Hosting de la app | EC2 Ubuntu + PM2 + Nginx | Control total sobre WebSockets y SQLite en disco. Nginx para HTTPS (requerido por browser APIs de camara/micro) |

### Decisiones Importantes (Moldean Arquitectura)

| Categoria | Decision | Tecnologia | Razon |
|---|---|---|---|
| Estado cliente | State management | Zustand | ~1KB, sin boilerplate. Maneja: estado de conexion (grupo/solo), proyecto activo, usuario actual, estado de audio |
| Compresion imagen | Compresion client-side | browser-image-compression | Maneja EXIF, web worker (non-blocking), calidad configurable. Critico para target < 8s |
| Grabacion audio | Captura de voz | MediaRecorder API (nativo) | Zero dependencias. webm/opus en Chrome, mp4/aac en Safari. OpenAI Whisper transcribe ambos formatos |
| Storage fotos | Almacenamiento de fotos | Filesystem local EC2 | Directorio `/data/photos/`, servido por Nginx como static files. S3 es overkill para 5 usuarios |
| Entrega TTS | Audio TTS al grupo | Archivo + URL via Socket.IO | Server almacena audio como archivo, broadcast de URL via Socket.IO. Cada cliente fetch y reproduce. Audio reutilizable en galeria |
| Mapas | Mapa de ubicaciones | Leaflet + react-leaflet | Open source, gratuito, sin API key. Suficiente para mapa de fotos geolocalizadas |

### Decisiones Diferidas (Post-MVP)

- Estrategia de cache offline
- Exportacion de proyectos
- CI/CD pipeline (deploy manual via SSH + PM2 es suficiente para MVP)
- Monitoring y logging (console logs + PM2 logs suficiente para 5 usuarios)

### Arquitectura de Datos

**Esquema conceptual:**

- **users**: id, name, created_at (5 registros pre-configurados)
- **projects**: id, name, created_at
- **project_members**: project_id, user_id (relacion N:N)
- **conversations**: id, project_id, user_id, created_at (una por usuario por proyecto)
- **messages**: id, conversation_id, role (user/assistant), content_text, image_url, audio_url, tts_audio_url, latitude, longitude, created_at
- **settings**: id, photographer_user_id, system_prompt, updated_at

**Almacenamiento de archivos:**
- Fotos: `/data/photos/{project_id}/{timestamp}_{user_id}.webp`
- Audio TTS: `/data/audio/{project_id}/{message_id}.mp3`
- Audio grabado: `/data/recordings/{project_id}/{timestamp}_{user_id}.webm`
- Musica ambiental: `/public/music/track-{1-5}.mp3` (assets estaticos)

### API y Patrones de Comunicacion

**API Routes (Next.js App Router):**
- `POST /api/capture` — recibe foto (+ audio opcional), comprime, almacena, envia a OpenAI, devuelve stream
- `POST /api/message` — recibe texto o audio follow-up, envia a OpenAI con contexto de conversacion
- `GET /api/projects` — lista proyectos
- `POST /api/projects` — crear proyecto
- `GET /api/projects/[id]/gallery` — fotos del proyecto con geolocalizacion
- `GET /api/settings` — obtener configuracion
- `PUT /api/settings` — actualizar configuracion (fotografo, prompt)
- WebSocket (Socket.IO): eventos `join-channel`, `leave-channel`, `new-capture`, `text-stream`, `tts-ready`, `photographer-changed`

**Flujo critico foto → audio:**
1. Cliente: comprime imagen, captura geolocation
2. Cliente → Server: POST /api/capture (image + optional audio blob)
3. Server: almacena foto, transcribe audio (si existe) via Whisper
4. Server → OpenAI: GPT-4o streaming (imagen + prompt sistema + historial conversacion + pregunta)
5. Server → Clientes: broadcast chunks de texto via Socket.IO (`text-stream`)
6. Server: al completar texto, envia a OpenAI TTS
7. Server: almacena audio TTS, broadcast URL via Socket.IO (`tts-ready`)
8. Clientes: fetch audio, reproduccion automatica con fade-in de musica ambiental

### Frontend Architecture

**Estructura de componentes:**
- `app/page.tsx` — vista principal (conversacion + barra de entrada)
- `app/projects/page.tsx` — selector de proyectos
- `app/projects/[id]/gallery/page.tsx` — galeria con mapa
- `app/settings/page.tsx` — configuracion
- `components/chat/` — mensajes, streaming, fotos inline
- `components/input-bar/` — 3 botones (camara, micro, teclado)
- `components/audio/` — reproductor TTS, musica ambiental
- `components/channel/` — indicador grupo/solo, toggle

**Stores Zustand:**
- `useUserStore` — usuario actual, lista de usuarios
- `useProjectStore` — proyecto activo, lista de proyectos
- `useChannelStore` — estado grupo/solo, conexion Socket.IO, fotografo activo
- `useAudioStore` — estado de reproduccion TTS, musica ambiental, volumen

### Infraestructura y Despliegue

**EC2 Setup:**
- Ubuntu LTS
- Node.js 20 LTS
- PM2 con `ecosystem.config.js`
- Nginx reverse proxy: HTTPS (Let's Encrypt), WebSocket upgrade, static file serving para `/data/`
- SQLite en `/home/app/data/museum-companion.db`
- Fotos/audio en `/home/app/data/`

**Deploy process (MVP):**
```bash
# En EC2
git pull origin main
pnpm install
pnpm build
pm2 restart museum-companion
```

### Analisis de Impacto de Decisiones

**Secuencia de implementacion:**
1. Scaffold Next.js + shadcn + Drizzle + SQLite
2. Schema de base de datos + seed de usuarios
3. Captura de foto + compresion + upload
4. Integracion OpenAI GPT-4o con streaming
5. TTS + reproduccion automatica
6. Socket.IO server + canal grupal
7. Modo solo + toggle
8. Proyectos + conversaciones
9. Galeria + mapa Leaflet
10. Musica ambiental
11. Settings (prompt, fotografo)
12. PWA manifest + service worker
13. Deploy EC2 + Nginx + PM2

**Dependencias entre decisiones:**
- Socket.IO requiere Nginx con WebSocket upgrade config
- TTS delivery (URL via Socket.IO) depende de ambos: storage filesystem + Socket.IO
- Streaming de texto depende de tanto OpenAI streaming como Socket.IO broadcast
- Musica ambiental depende de audio store + TTS playback events

## Patrones de Implementacion y Reglas de Consistencia

### Puntos de Conflicto Criticos Identificados

12 areas donde agentes de IA podrian tomar decisiones diferentes si no se especifican.

### Patrones de Nombres

**Base de Datos (Drizzle/SQLite):**
- Tablas: `snake_case`, plural → `users`, `projects`, `messages`, `project_members`
- Columnas: `snake_case` → `user_id`, `created_at`, `content_text`
- Foreign keys: `{tabla_singular}_id` → `user_id`, `project_id`, `conversation_id`
- Indices: `idx_{tabla}_{columna}` → `idx_messages_conversation_id`

**API (Next.js App Router):**
- Endpoints: `/api/{recurso}` plural, kebab-case → `/api/projects`, `/api/projects/[id]/gallery`
- Parametros de ruta: `[id]` (convencion Next.js)
- Query params: `camelCase` → `?projectId=1`

**Codigo:**
- Componentes React: `PascalCase` → `InputBar`, `ChatMessage`, `PhotoGallery`
- Archivos de componentes: `kebab-case.tsx` → `input-bar.tsx`, `chat-message.tsx`
- Funciones/variables: `camelCase` → `getActiveProject`, `currentUser`
- Hooks: `use` prefix + `camelCase` → `useChannelStore`, `useAudioPlayer`
- Constantes: `UPPER_SNAKE_CASE` → `MAX_IMAGE_SIZE`, `SOCKET_RECONNECT_INTERVAL`
- Tipos/Interfaces: `PascalCase` con prefijo descriptivo → `Message`, `Project`, `CapturePayload`

**Socket.IO Events:**
- `kebab-case` → `new-capture`, `text-stream`, `tts-ready`, `join-channel`, `leave-channel`, `photographer-changed`

### Patrones de Estructura

**Organizacion del proyecto:**
```
src/
  app/                    # App Router pages
    api/                  # API routes
      capture/route.ts
      message/route.ts
      projects/
        route.ts
        [id]/
          gallery/route.ts
      settings/route.ts
    projects/page.tsx
    projects/[id]/gallery/page.tsx
    settings/page.tsx
    layout.tsx
    page.tsx              # Vista principal (conversacion)
  components/
    ui/                   # shadcn components (auto-generated)
    chat/                 # Mensajes, streaming, fotos inline
    input-bar/            # 3 botones (camara, micro, teclado)
    audio/                # Reproductor TTS, musica ambiental
    channel/              # Indicador grupo/solo, toggle
  lib/
    db/                   # Drizzle schema, connection, queries
      schema.ts
      index.ts
      queries/
    socket/               # Socket.IO server + client setup
      server.ts
      client.ts
    openai/               # OpenAI client, prompts, streaming
      client.ts
      tts.ts
    utils/                # Helpers genericos
      image-compression.ts
      audio-recorder.ts
      geolocation.ts
  stores/                 # Zustand stores
    user-store.ts
    project-store.ts
    channel-store.ts
    audio-store.ts
  types/                  # TypeScript types compartidos
    index.ts
data/                     # Fuera de src/ — persistencia en disco
  photos/
  audio/
  recordings/
  museum-companion.db
public/
  music/                  # 5 tracks ambiental
    track-1.mp3
    track-2.mp3
    track-3.mp3
    track-4.mp3
    track-5.mp3
```

**Tests:** Co-located con el archivo que testean → `input-bar.test.tsx` junto a `input-bar.tsx`

### Patrones de Formato

**API Responses:**
```typescript
// Exito
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }

// Stream (SSE para OpenAI streaming)
// Cada chunk: data: { type: 'text-delta' | 'text-done' | 'error', content: string }
```

**JSON field naming:** `camelCase` en API responses (frontend-friendly), `snake_case` en base de datos. Drizzle maneja el mapeo.

**Fechas:** ISO 8601 strings en API → `"2026-02-20T14:30:00Z"`. SQLite almacena como TEXT en ISO format.

**IDs:** Integers autoincrement en SQLite. Simple para 5 usuarios.

### Patrones de Comunicacion

**Socket.IO Event Payloads:**
```typescript
// new-capture: fotografo envio nueva captura
{ messageId: number, imageUrl: string, projectId: number, userId: number }

// text-stream: chunk de texto de OpenAI
{ messageId: number, delta: string, done: boolean }

// tts-ready: audio TTS disponible
{ messageId: number, audioUrl: string }

// photographer-changed: nuevo fotografo asignado
{ userId: number, userName: string }
```

**Zustand Store Pattern:**
```typescript
// Cada store sigue este patron
interface StoreState {
  // State
  data: T
  isLoading: boolean
  // Actions
  setData: (data: T) => void
  fetchData: () => Promise<void>
}

const useStore = create<StoreState>((set) => ({
  data: initialValue,
  isLoading: false,
  setData: (data) => set({ data }),
  fetchData: async () => {
    set({ isLoading: true })
    // fetch logic
    set({ data: result, isLoading: false })
  },
}))
```

### Patrones de Proceso

**Error Handling:**
- API routes: try/catch con `NextResponse.json({ success: false, error: { code, message } }, { status })`. Nunca exponer stack traces.
- Cliente: toast via sonner (shadcn) para errores de usuario. Console.error para errores de desarrollo.
- OpenAI errors: retry con backoff exponencial (max 3 intentos), luego toast de error al usuario.
- Socket.IO: reconexion automatica, fallback a modo solo despues de 3 intentos (NFR11-12).

**Loading States:**
- Nombre: `isLoading` (boolean), `isStreaming` (boolean para texto en vivo)
- Componente `Spinner` de shadcn para loading visual
- Skeleton de texto mientras se espera respuesta de IA
- Loading en barra inferior durante captura → envio → respuesta

**Audio Autoplay Strategy:**
- Al conectarse al canal grupal o al enviar primera captura: crear AudioContext con gesto de usuario (tap en boton). Esto "desbloquea" el audio en Safari/Chrome.
- TTS playback: usar `Audio()` constructor, play programmatically. Funciona post-unlock.
- Musica ambiental: mismo AudioContext, `GainNode` para fade in/out.

### Reglas Obligatorias para Agentes de IA

1. **SIEMPRE** seguir convenciones de nombres definidas arriba — no inventar alternativas
2. **SIEMPRE** usar la estructura de carpetas definida — no crear carpetas nuevas sin documentar
3. **SIEMPRE** usar el patron de API response `{ success, data/error }` — no respuestas directas
4. **SIEMPRE** usar Zustand para estado compartido — no React Context, no props drilling para estado global
5. **SIEMPRE** manejar errores con el patron definido — no `catch` vacios, no errores silenciosos
6. **NUNCA** incluir time estimates en comentarios o documentacion
7. **NUNCA** agregar dependencias sin justificacion documentada
8. **TODA** la interfaz de usuario en espanol argentino

## Estructura del Proyecto y Limites Arquitectonicos

### Estructura Completa de Directorios

```
turism-app/
├── README.md
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── drizzle.config.ts
├── components.json                # shadcn config
├── .env.local                     # OPENAI_API_KEY, etc
├── .env.example
├── .gitignore
├── ecosystem.config.js            # PM2 config
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind + tema calido
│   │   ├── layout.tsx             # Root layout, PWA meta tags
│   │   ├── manifest.ts            # PWA manifest (Next.js metadata API)
│   │   ├── page.tsx               # Vista principal: conversacion + input bar
│   │   ├── select-user/
│   │   │   └── page.tsx           # Seleccion de usuario (primer uso)
│   │   ├── projects/
│   │   │   ├── page.tsx           # Lista/crear proyectos
│   │   │   └── [id]/
│   │   │       └── gallery/
│   │   │           └── page.tsx   # Galeria fotos + mapa Leaflet
│   │   ├── settings/
│   │   │   └── page.tsx           # Prompt personalizable, fotografo
│   │   └── api/
│   │       ├── capture/
│   │       │   └── route.ts       # POST: foto + audio opcional → OpenAI → TTS
│   │       ├── message/
│   │       │   └── route.ts       # POST: texto/audio follow-up → OpenAI → TTS
│   │       ├── projects/
│   │       │   ├── route.ts       # GET: listar, POST: crear
│   │       │   └── [id]/
│   │       │       └── gallery/
│   │       │           └── route.ts  # GET: fotos con geo del proyecto
│   │       ├── settings/
│   │       │   └── route.ts       # GET/PUT: config (fotografo, prompt)
│   │       └── socket/
│   │           └── route.ts       # Socket.IO server setup (custom server)
│   ├── components/
│   │   ├── ui/                    # shadcn auto-generated
│   │   │   ├── button.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx         # Toast notifications
│   │   │   └── ...
│   │   ├── chat/
│   │   │   ├── chat-view.tsx      # Contenedor principal de conversacion
│   │   │   ├── chat-message.tsx   # Mensaje individual (texto, foto, streaming)
│   │   │   └── streaming-text.tsx # Texto que se renderiza en vivo
│   │   ├── input-bar/
│   │   │   ├── input-bar.tsx      # Barra con 3 botones
│   │   │   ├── camera-button.tsx  # Tap: foto. Hold: foto + audio
│   │   │   ├── mic-button.tsx     # Hold: graba audio follow-up
│   │   │   └── keyboard-button.tsx # Abre input de texto
│   │   ├── audio/
│   │   │   ├── tts-player.tsx     # Reproduce TTS automaticamente
│   │   │   └── ambient-music.tsx  # Fade in/out musica ambiental
│   │   ├── channel/
│   │   │   └── channel-toggle.tsx # Boton grupo/solo
│   │   ├── gallery/
│   │   │   ├── photo-grid.tsx     # Grid de fotos del proyecto
│   │   │   └── location-map.tsx   # Mapa Leaflet con marcadores
│   │   └── layout/
│   │       ├── nav-bar.tsx        # Navegacion superior
│   │       └── bottom-bar.tsx     # Wrapper del input bar
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle schema (todas las tablas)
│   │   │   ├── index.ts          # DB connection singleton
│   │   │   ├── seed.ts           # Seed 5 usuarios pre-configurados
│   │   │   └── queries/
│   │   │       ├── messages.ts    # CRUD mensajes + conversacion
│   │   │       ├── projects.ts   # CRUD proyectos
│   │   │       └── settings.ts   # Get/update settings
│   │   ├── socket/
│   │   │   ├── server.ts         # Socket.IO server init, event handlers
│   │   │   └── client.ts         # Socket.IO client hook, reconnection
│   │   ├── openai/
│   │   │   ├── client.ts         # OpenAI client singleton
│   │   │   ├── vision.ts         # GPT-4o vision request + streaming
│   │   │   └── tts.ts            # TTS generation, save to file
│   │   └── utils/
│   │       ├── image-compression.ts  # browser-image-compression wrapper
│   │       ├── audio-recorder.ts     # MediaRecorder wrapper
│   │       └── geolocation.ts        # Geolocation API wrapper
│   ├── stores/
│   │   ├── user-store.ts         # Usuario actual, lista usuarios
│   │   ├── project-store.ts      # Proyecto activo, lista proyectos
│   │   ├── channel-store.ts      # Estado grupo/solo, Socket.IO, fotografo
│   │   └── audio-store.ts        # TTS playback, musica ambiental, volumen
│   ├── types/
│   │   └── index.ts              # Tipos compartidos: Message, Project, etc.
│   └── hooks/
│       ├── use-capture.ts        # Hook para flujo foto → server → response
│       └── use-audio-unlock.ts   # Hook para desbloquear audio en Safari
├── data/                          # Persistencia en disco (gitignored)
│   ├── photos/                   # {project_id}/{timestamp}_{user_id}.webp
│   ├── audio/                    # {project_id}/{message_id}.mp3
│   ├── recordings/               # {project_id}/{timestamp}_{user_id}.webm
│   └── museum-companion.db       # SQLite database
├── public/
│   ├── music/
│   │   ├── track-1.mp3
│   │   ├── track-2.mp3
│   │   ├── track-3.mp3
│   │   ├── track-4.mp3
│   │   └── track-5.mp3
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   └── sw.js                     # Service worker (cache static assets)
└── drizzle/
    └── migrations/               # SQL migration files
```

### Limites Arquitectonicos

**Limites de API:**
- `/api/capture` y `/api/message` son los unicos entry points para interaccion con OpenAI. Ningun otro endpoint llama a OpenAI.
- `/api/socket` inicializa el servidor Socket.IO. Todos los eventos real-time pasan por aqui.
- Todos los endpoints validan input y retornan `{ success, data/error }`.

**Limites de Componentes:**
- `components/chat/` solo lee datos y muestra mensajes. No hace fetch directamente — usa hooks y stores.
- `components/input-bar/` es el unico lugar que captura media (foto, audio). Llama a hooks que hacen POST a la API.
- `components/audio/` maneja exclusivamente reproduccion (TTS + musica). No captura.
- `components/channel/` solo lee y escribe `channelStore`. No hace fetch a API directamente.

**Limites de Datos:**
- `lib/db/queries/` es la unica capa que toca SQLite. Ningun componente o API route hace queries directamente.
- `lib/openai/` es la unica capa que habla con OpenAI. Ningun otro archivo importa el SDK de OpenAI.
- `lib/socket/server.ts` es el unico archivo que emite eventos Socket.IO desde el server.
- `lib/socket/client.ts` es el unico archivo que escucha eventos Socket.IO en el client.

### Mapeo de Requisitos a Estructura

| Categoria FR | Archivos principales |
|---|---|
| FR1-FR5: Captura y Entrada | `components/input-bar/*`, `hooks/use-capture.ts`, `lib/utils/*`, `api/capture/route.ts` |
| FR6-FR9: Procesamiento IA | `lib/openai/vision.ts`, `lib/openai/client.ts`, `lib/db/queries/messages.ts` |
| FR10-FR13: Audio y TTS | `lib/openai/tts.ts`, `components/audio/*`, `stores/audio-store.ts` |
| FR14-FR19: Canal Grupal | `lib/socket/*`, `stores/channel-store.ts`, `components/channel/*` |
| FR20-FR22: Modo Solo | `stores/channel-store.ts` (mismo toggle), `hooks/use-capture.ts` |
| FR23-FR26: Proyectos | `app/projects/*`, `lib/db/queries/projects.ts`, `stores/project-store.ts` |
| FR27-FR29: Galeria | `app/projects/[id]/gallery/*`, `components/gallery/*`, `api/projects/[id]/gallery/route.ts` |
| FR30-FR32: Configuracion | `app/settings/*`, `api/settings/route.ts`, `lib/db/queries/settings.ts` |
| FR33: Idioma | Todos los archivos de componentes — labels hardcoded en espanol argentino |

### Flujo de Datos Principal

```
[Cliente: Input Bar]
    ↓ foto comprimida + audio + geolocation
[API: /api/capture]
    ↓ almacena foto en /data/photos/
    ↓ transcribe audio (Whisper) si existe
    ↓ envia a OpenAI GPT-4o con historial conversacion
    ↓ stream texto → Socket.IO broadcast (text-stream)
    ↓ texto completo → OpenAI TTS
    ↓ almacena audio en /data/audio/
    ↓ Socket.IO broadcast (tts-ready) con URL
[Clientes: Todos]
    ↓ renderizan texto en streaming
    ↓ fetch audio URL
    ↓ fade-in musica ambiental
    ↓ reproduccion automatica TTS
    ↓ fade-out musica al terminar
```

### Integracion con Despliegue

**Next.js Standalone Build:**
- `next.config.ts` → `output: 'standalone'`
- Build genera `.next/standalone/` con server Node.js autocontenido
- PM2 ejecuta `src/server.ts` (custom server que wrappea Next.js + Socket.IO)

**Nginx Config (esquema):**
```nginx
server {
    listen 443 ssl;
    # SSL certs via Let's Encrypt

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # WebSocket
    }

    location /data/ {
        alias /home/app/data/;  # Static file serving para fotos/audio
    }
}
```

## Resultados de Validacion de Arquitectura

### Validacion de Coherencia ✅

**Compatibilidad de Decisiones:**
- Next.js 16 + Socket.IO: Compatible. Custom server wrappea Next.js handler con Socket.IO.
- Drizzle + SQLite: Compatible via `drizzle-orm/better-sqlite3`.
- Tailwind 4 + shadcn/ui: Compatible nativamente.
- Zustand + React 19: Compatible.
- Leaflet + Next.js: Compatible con `next/dynamic` y `ssr: false`.
- browser-image-compression: Client-side only, sin conflicto.

**Consistencia de Patrones:** `snake_case` DB ↔ `camelCase` API ↔ `PascalCase` componentes. Socket.IO events en `kebab-case`. Sin colisiones ni ambiguedad.

**Alineacion de Estructura:** Cada FR tiene archivos mapeados. Sin FRs huerfanos. Boundaries claros con unico punto de acceso por capa.

### Validacion de Cobertura de Requisitos ✅

**33 Requisitos Funcionales:** Todos cubiertos — cada FR mapeado a archivos especificos en la estructura.

**14 Requisitos No Funcionales:** Todos cubiertos — performance (streaming paralelo, compresion client-side), integracion (retry + backoff, error handling), fiabilidad (auto-reconnect, fallback modo solo, persistencia server-side, modo degradado).

### Validacion de Readiness ✅

- Todas las decisiones criticas documentadas con tecnologias y versiones
- Arbol completo de directorios con responsabilidad por archivo
- Patrones de naming, formato, comunicacion, errores, loading, audio — todos con ejemplos

### Gaps Resueltos en Validacion

1. **Custom server**: agregado `src/server.ts` para HTTP + Socket.IO + Next.js handler
2. **Audio transcription**: agregado `src/lib/openai/whisper.ts` para transcripcion via Whisper
3. **Environment variables**: `OPENAI_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_SOCKET_URL`

### Gaps Diferidos (Post-MVP)

- Backup strategy para SQLite y fotos
- Health check endpoint
- CI/CD pipeline
- Rate limiting (innecesario para 5 usuarios)

### Checklist de Completitud

- [x] Contexto del proyecto analizado
- [x] Escala y complejidad evaluada
- [x] Restricciones tecnicas identificadas
- [x] Preocupaciones transversales mapeadas
- [x] Decisiones criticas documentadas con versiones
- [x] Stack tecnologico completamente especificado
- [x] Patrones de integracion definidos
- [x] Performance considerado
- [x] Convenciones de nombres establecidas
- [x] Patrones de estructura definidos
- [x] Patrones de comunicacion especificados
- [x] Patrones de proceso documentados
- [x] Directorio completo definido
- [x] Limites de componentes establecidos
- [x] Puntos de integracion mapeados
- [x] Mapeo requisitos → estructura completo

### Evaluacion de Readiness

**Estado General:** LISTO PARA IMPLEMENTACION

**Nivel de Confianza:** Alto

**Fortalezas:**
- Stack simple y coherente — Next.js maneja frontend + API + server
- Boundaries claros — cada capa con unico punto de acceso
- Flujo de datos completamente especificado (foto → IA → TTS → broadcast)
- Sin complejidad innecesaria — SQLite, filesystem, sin auth

**Primera Prioridad de Implementacion:**
```bash
pnpm create next-app@latest turism-app --yes
cd turism-app
pnpm dlx shadcn@latest init
pnpm add drizzle-orm better-sqlite3 socket.io socket.io-client openai zustand browser-image-compression react-leaflet leaflet
pnpm add -D drizzle-kit @types/better-sqlite3 @types/leaflet
```
