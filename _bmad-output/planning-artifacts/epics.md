---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-02-20'
inputDocuments: ['prd.md', 'architecture.md']
---

# Museum Companion - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Museum Companion, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: El fotografo puede tomar una foto con un solo toque que se envia automaticamente
- FR2: El fotografo puede mantener presionado el boton de camara para grabar audio + tomar foto, enviando ambos al soltar
- FR3: Cualquier usuario puede mantener presionado el boton de microfono para grabar follow-up sin foto, enviando al soltar
- FR4: Cualquier usuario puede escribir texto via boton de teclado
- FR5: El sistema captura geolocalizacion (lat/lng) automaticamente con cada foto
- FR6: El sistema envia foto (y audio/texto opcional) a OpenAI GPT-4o para descripcion contextual
- FR7: El sistema usa un prompt de sistema personalizable como contexto base para todas las consultas
- FR8: El sistema muestra la respuesta en streaming en tiempo real
- FR9: El sistema mantiene contexto de conversacion por proyecto para follow-ups
- FR10: El sistema convierte respuesta de texto a audio en espanol via OpenAI TTS
- FR11: El sistema reproduce audio TTS automaticamente al estar listo
- FR12: El sistema activa musica ambiental (volumen bajo) al iniciar descripcion, desactiva al finalizar
- FR13: El sistema selecciona aleatoriamente entre 5 tracks de musica antigua ambiental precargados
- FR14: El fotografo designado transmite capturas en tiempo real a todos los dispositivos del canal grupal
- FR15: Los oyentes ven fotos y texto streameandose en vivo
- FR16: Los oyentes reciben evento de audio TTS para reproduccion local automatica
- FR17: La conversacion grupal es solo lectura para oyentes
- FR18: Cualquier usuario puede conectarse al canal grupal con un toque
- FR19: Cualquier usuario puede desconectarse al modo solo con un toque
- FR20: Usuario en modo solo captura fotos y recibe descripciones independientemente
- FR21: Fotos en modo solo se agregan a la galeria compartida del proyecto
- FR22: Usuario en modo solo mantiene su conversacion individual del proyecto
- FR23: Cualquier usuario puede crear un proyecto con un nombre
- FR24: Cualquier usuario puede seleccionar proyecto activo
- FR25: Todo contenido se agrupa bajo el proyecto activo
- FR26: Cada usuario tiene una conversacion unica por proyecto
- FR27: Cualquier usuario puede ver todas las fotos de todos los participantes en la galeria del proyecto
- FR28: Cualquier usuario puede ver mapa con ubicaciones de todas las fotos del proyecto
- FR29: Cualquier usuario puede ver la descripcion asociada a cada foto
- FR30: Cualquier usuario puede editar el prompt de sistema para personalizar descripciones
- FR31: Cualquier usuario puede cambiar el fotografo designado del canal grupal
- FR32: El sistema permite seleccionar usuario al primer uso (5 pre-configurados, sin auth)
- FR33: Toda la interfaz (botones, labels, mensajes, placeholders, navegacion) esta en espanol argentino

### NonFunctional Requirements

- NFR1: Foto → inicio reproduccion audio TTS: < 8 segundos en 4G
- NFR2: Streaming de texto visible: < 3 segundos desde envio de foto
- NFR3: Broadcast de eventos al canal grupal: < 1 segundo
- NFR4: Carga inicial PWA (primera visita): < 3 segundos
- NFR5: Carga PWA instalada: < 1 segundo
- NFR6: Bundle JS/CSS: < 500KB (excluyendo tracks de musica)
- NFR7: Fotos comprimidas en cliente antes de envio
- NFR8: Si OpenAI no esta disponible, mensaje de error claro (no fallo silencioso)
- NFR9: Manejo de rate limits con reintentos y backoff exponencial
- NFR10: Streaming via SSE o HTTP streaming para minimizar tiempo hasta primer token
- NFR11: Reconexion WebSocket automatica cada 5 segundos si se pierde conexion
- NFR12: Despues de 3 intentos fallidos, fallback automatico a modo solo con notificacion visual
- NFR13: Fotos y descripciones persisten en servidor — sin perdida de contenido si cliente se desconecta
- NFR14: Modo degradado (texto sin audio) si TTS falla

### Additional Requirements

- Starter template: Next.js 16 + shadcn/ui + Drizzle + SQLite + Socket.IO + Zustand + dependencies
- Custom server (src/server.ts) para Socket.IO + Next.js handler
- Drizzle schema + seed 5 usuarios pre-configurados
- PWA manifest + service worker para cache
- Audio autoplay unlock strategy (AudioContext con gesto de usuario)
- Whisper transcription para voice input
- Nginx reverse proxy con HTTPS + WebSocket passthrough
- PM2 process manager con ecosystem.config.js

### FR Coverage Map

| FR | Epic | Descripcion |
|---|---|---|
| FR1 | Epic 1 | Foto un toque + envio auto |
| FR2 | Epic 3 | Hold camara = foto + audio |
| FR3 | Epic 3 | Hold micro = audio follow-up |
| FR4 | Epic 1 | Input de texto via teclado |
| FR5 | Epic 6 | Geolocalizacion con foto |
| FR6 | Epic 1 | Envio a GPT-4o |
| FR7 | Epic 1 | Prompt sistema personalizable |
| FR8 | Epic 1 | Streaming texto tiempo real |
| FR9 | Epic 1 | Contexto conversacion por proyecto |
| FR10 | Epic 2 | TTS espanol OpenAI |
| FR11 | Epic 2 | Reproduccion auto TTS |
| FR12 | Epic 2 | Musica ambiental fade in/out |
| FR13 | Epic 2 | 5 tracks aleatorios |
| FR14 | Epic 4 | Fotografo transmite a grupo |
| FR15 | Epic 4 | Oyentes ven texto+foto en vivo |
| FR16 | Epic 4 | Oyentes reciben audio TTS |
| FR17 | Epic 4 | Canal grupal solo lectura |
| FR18 | Epic 4 | Conectar canal un toque |
| FR19 | Epic 4 | Desconectar canal un toque |
| FR20 | Epic 5 | Modo solo captura independiente |
| FR21 | Epic 5 | Fotos solo → galeria compartida |
| FR22 | Epic 5 | Conversacion individual modo solo |
| FR23 | Epic 1 | Crear proyecto |
| FR24 | Epic 1 | Seleccionar proyecto activo |
| FR25 | Epic 1 | Contenido agrupado por proyecto |
| FR26 | Epic 1 | Conversacion unica por proyecto |
| FR27 | Epic 6 | Galeria fotos compartida |
| FR28 | Epic 6 | Mapa ubicaciones |
| FR29 | Epic 6 | Descripcion asociada a foto |
| FR30 | Epic 7 | Prompt personalizable settings |
| FR31 | Epic 4 | Cambiar fotografo |
| FR32 | Epic 1 | Seleccion usuario primer uso |
| FR33 | Epic 1 | Interfaz espanol argentino |

## Epic List

### Epic 1: Fundacion del Proyecto y Primera Captura
Un usuario puede abrir la app, seleccionar su nombre, crear un proyecto, tomar una foto y recibir una descripcion en texto de la IA en tiempo real.
**FRs:** FR1, FR4, FR6, FR7, FR8, FR9, FR23, FR24, FR25, FR26, FR32, FR33

### Epic 2: Experiencia de Audio Inmersiva
Despues de recibir la descripcion en texto, el usuario escucha automaticamente la narracion en espanol con musica ambiental de fondo.
**FRs:** FR10, FR11, FR12, FR13

### Epic 3: Captura de Voz y Foto con Audio
El usuario puede hacer preguntas con su voz — manteniendo presionado en la camara (foto + pregunta) o en el microfono (follow-up sin foto).
**FRs:** FR2, FR3

### Epic 4: Canal Grupal en Tiempo Real
La familia se conecta al canal grupal. El fotografo designado toma fotos y todos ven el texto y escuchan el audio simultaneamente en sus dispositivos.
**FRs:** FR14, FR15, FR16, FR17, FR18, FR19, FR31

### Epic 5: Modo Solo
Un usuario se desconecta del grupo y explora independientemente — sus fotos se siguen agregando a la galeria compartida.
**FRs:** FR20, FR21, FR22

### Epic 6: Galeria Compartida y Mapa
Cualquier usuario puede ver todas las fotos del proyecto con sus descripciones y ubicaciones en un mapa.
**FRs:** FR5, FR27, FR28, FR29

### Epic 7: Configuracion y PWA
El usuario puede personalizar el prompt de la IA y la app es instalable como PWA en la pantalla de inicio.
**FRs:** FR30

---

## Epic 1: Fundacion del Proyecto y Primera Captura

Un usuario puede abrir la app, seleccionar su nombre, crear un proyecto, tomar una foto y recibir una descripcion en texto de la IA en tiempo real.

### Story 1.1: Scaffold del Proyecto y Base de Datos

As a desarrollador,
I want inicializar el proyecto con el stack definido y la base de datos con usuarios pre-configurados,
So that tenga la base funcional para construir todas las features.

**Acceptance Criteria:**

**Given** el repositorio esta vacio
**When** ejecuto los comandos de inicializacion (create-next-app, shadcn init, install dependencies)
**Then** el proyecto Next.js 16 arranca con Tailwind, shadcn/ui, TypeScript, App Router
**And** Drizzle esta configurado con SQLite y el schema incluye tablas: users, projects, project_members, conversations, messages, settings
**And** el seed crea 5 usuarios pre-configurados
**And** el custom server (src/server.ts) arranca Next.js + Socket.IO
**And** la paleta calida (naranja, rojo, amarillo) esta configurada en globals.css
**And** ecosystem.config.js esta configurado para PM2

### Story 1.2: Seleccion de Usuario y Navegacion Base

As a usuario,
I want seleccionar mi nombre al abrir la app por primera vez y ver la navegacion principal,
So that la app sepa quien soy sin necesidad de login.

**Acceptance Criteria:**

**Given** el usuario abre la app por primera vez
**When** llega a la pantalla de seleccion de usuario
**Then** ve los 5 nombres pre-configurados como botones
**And** al tocar un nombre, se guarda en localStorage y redirige a la vista principal
**And** toda la interfaz esta en espanol argentino
**And** la navegacion superior muestra: nombre del proyecto activo (o "Sin proyecto"), link a proyectos, link a galeria, link a configuracion

**Given** el usuario ya selecciono su nombre anteriormente
**When** abre la app
**Then** va directo a la vista principal sin pasar por seleccion

### Story 1.3: Gestion de Proyectos

As a usuario,
I want crear y seleccionar proyectos para organizar mis visitas a museos,
So that cada museo o viaje tenga su propio espacio con fotos y conversaciones separadas.

**Acceptance Criteria:**

**Given** el usuario esta en la pantalla de proyectos
**When** toca "Crear proyecto" e ingresa un nombre (ej: "Florencia")
**Then** el proyecto se crea en la base de datos y se selecciona como activo
**And** se crea una conversacion vacia para ese usuario en ese proyecto

**Given** el usuario ve la lista de proyectos
**When** toca un proyecto existente
**Then** ese proyecto se convierte en el activo y redirige a la vista principal
**And** la conversacion del usuario para ese proyecto se carga

### Story 1.4: Captura de Foto y Envio a IA con Streaming

As a usuario,
I want tomar una foto con un toque y recibir la descripcion de la IA en texto en tiempo real,
So that pueda entender lo que estoy viendo en el museo sin esperas largas.

**Acceptance Criteria:**

**Given** el usuario tiene un proyecto activo y esta en la vista principal (conversacion)
**When** toca el boton de camara (icono de camara en la barra inferior)
**Then** se abre la camara nativa del dispositivo, toma la foto con un toque
**And** la foto se comprime client-side (browser-image-compression, < 500KB)
**And** la foto se envia automaticamente via POST /api/capture
**And** la foto aparece en la conversacion como mensaje del usuario

**Given** el servidor recibe la foto
**When** envia a OpenAI GPT-4o con el prompt del sistema + historial de conversacion
**Then** la respuesta se muestra en streaming en tiempo real en la conversacion (texto apareciendo caracter a caracter)
**And** el mensaje completo (foto + respuesta) se persiste en la base de datos
**And** si OpenAI falla, se muestra un toast de error claro

### Story 1.5: Input de Texto como Follow-up

As a usuario,
I want escribir una pregunta de follow-up usando el teclado,
So that pueda profundizar sobre lo que la IA me explico sin tomar otra foto.

**Acceptance Criteria:**

**Given** el usuario esta en la conversacion con mensajes previos
**When** toca el boton de teclado (icono de teclado en la barra inferior)
**Then** aparece un campo de texto con placeholder "Escribi tu pregunta..."
**And** al enviar, el texto se envia via POST /api/message con el contexto de conversacion del proyecto
**And** la IA responde en streaming con contexto de la conversacion previa (sabe de que obra se habla)
**And** el mensaje se persiste en la base de datos

---

## Epic 2: Experiencia de Audio Inmersiva

Despues de recibir la descripcion en texto, el usuario escucha automaticamente la narracion en espanol con musica ambiental de fondo.

### Story 2.1: TTS y Reproduccion Automatica

As a usuario,
I want escuchar automaticamente la descripcion narrada en espanol cuando la IA termina de responder,
So that no tenga que leer la pantalla y pueda seguir mirando la obra.

**Acceptance Criteria:**

**Given** la IA termina de generar la respuesta completa de texto
**When** el servidor envia el texto a OpenAI TTS API
**Then** se genera audio en espanol con voz natural
**And** el audio se almacena como archivo MP3 en /data/audio/
**And** la URL del audio se asocia al mensaje en la base de datos
**And** el cliente recibe la URL y reproduce automaticamente
**And** si TTS falla, el texto se mantiene visible (modo degradado NFR14)

**Given** el usuario abre la app por primera vez o toca cualquier boton
**When** se produce el primer gesto de usuario
**Then** se crea un AudioContext para desbloquear audio autoplay en Safari/Chrome

### Story 2.2: Musica Ambiental

As a usuario,
I want escuchar musica ambiental antigua de fondo durante las descripciones,
So that la experiencia se sienta como una audioguia profesional inmersiva.

**Acceptance Criteria:**

**Given** el TTS esta a punto de reproducirse
**When** comienza la reproduccion del audio TTS
**Then** un track de musica ambiental aleatorio (de los 5 precargados) inicia con fade-in a volumen bajo
**And** la musica se mantiene durante toda la narracion
**And** cuando el TTS termina, la musica hace fade-out y se detiene

**Given** no hay descripcion reproduciendose
**When** el usuario esta en la app sin audio activo
**Then** no hay musica sonando (apagada por defecto)

---

## Epic 3: Captura de Voz y Foto con Audio

El usuario puede hacer preguntas con su voz — manteniendo presionado en la camara (foto + pregunta) o en el microfono (follow-up sin foto).

### Story 3.1: Hold-to-Record en Camara (Foto + Pregunta de Voz)

As a usuario,
I want mantener presionado el boton de camara para tomar una foto mientras grabo mi pregunta de voz,
So that pueda preguntar algo especifico sobre lo que veo sin tener que escribir.

**Acceptance Criteria:**

**Given** el usuario esta en la vista principal con proyecto activo
**When** mantiene presionado el boton de camara
**Then** se abre la camara, toma la foto, y simultaneamente comienza a grabar audio via MediaRecorder
**And** un indicador visual muestra que esta grabando
**When** suelta el boton
**Then** la foto + audio se envian automaticamente via POST /api/capture
**And** el servidor transcribe el audio via OpenAI Whisper
**And** la foto + transcripcion se envian a GPT-4o como pregunta contextual
**And** la respuesta se muestra en streaming + se genera TTS + se reproduce automaticamente

### Story 3.2: Hold-to-Record en Microfono (Follow-up de Voz sin Foto)

As a usuario,
I want mantener presionado el boton de microfono para hacer una pregunta de follow-up con mi voz sin sacar foto,
So that pueda profundizar en la conversacion usando solo la voz.

**Acceptance Criteria:**

**Given** el usuario tiene conversacion previa en el proyecto activo
**When** mantiene presionado el boton de microfono
**Then** comienza a grabar audio via MediaRecorder
**And** indicador visual muestra grabacion activa
**When** suelta el boton
**Then** el audio se envia via POST /api/message (sin foto)
**And** el servidor transcribe via Whisper y envia a GPT-4o con contexto de conversacion
**And** la respuesta se muestra en streaming + TTS + reproduccion automatica

---

## Epic 4: Canal Grupal en Tiempo Real

La familia se conecta al canal grupal. El fotografo designado toma fotos y todos ven el texto y escuchan el audio simultaneamente en sus dispositivos.

### Story 4.1: Infraestructura Socket.IO y Canal Grupal

As a usuario,
I want conectarme al canal grupal con un solo toque,
So that pueda recibir en vivo lo que el fotografo esta capturando.

**Acceptance Criteria:**

**Given** el usuario esta en la vista principal
**When** toca el boton de "Conectar al grupo" (toggle en la interfaz)
**Then** se conecta al canal grupal via Socket.IO (room del proyecto activo)
**And** el toggle muestra estado "Conectado al grupo"
**And** si la conexion se pierde, intenta reconexion automatica cada 5 segundos (NFR11)
**And** despues de 3 intentos fallidos, pasa a modo solo con notificacion visual (NFR12)

**Given** el usuario esta conectado al grupo
**When** toca el toggle de nuevo
**Then** se desconecta del canal grupal y pasa a modo solo

### Story 4.2: Broadcast del Fotografo al Grupo

As a oyente del grupo,
I want ver las fotos y descripciones del fotografo en tiempo real en mi dispositivo,
So that pueda seguir la experiencia del grupo desde mi telefono.

**Acceptance Criteria:**

**Given** el usuario es el fotografo designado y esta conectado al grupo
**When** toma una foto (tap o hold)
**Then** la captura se procesa normalmente (IA + TTS) y ademas se emiten eventos Socket.IO:
- `new-capture`: foto URL + metadata a todos los oyentes
- `text-stream`: chunks de texto en tiempo real a todos los oyentes
- `tts-ready`: URL del audio TTS a todos los oyentes

**Given** el usuario es oyente (no fotografo) y esta conectado al grupo
**When** recibe eventos del fotografo
**Then** ve la foto aparecer en su pantalla
**And** ve el texto streameandose en vivo
**And** recibe y reproduce automaticamente el audio TTS
**And** la conversacion grupal es solo lectura (no puede enviar mensajes al canal)

### Story 4.3: Selector de Fotografo en Configuracion

As a usuario,
I want cambiar quien es el fotografo designado del grupo,
So that diferentes miembros de la familia puedan tomar fotos para el grupo.

**Acceptance Criteria:**

**Given** el usuario esta en la pantalla de configuracion
**When** ve el selector de fotografo con los 5 nombres de usuario
**Then** puede seleccionar un nuevo fotografo
**And** el cambio se guarda en la base de datos (tabla settings)
**And** se emite evento Socket.IO `photographer-changed` a todos los conectados
**And** el cambio es inmediato — no desconecta a nadie del canal

---

## Epic 5: Modo Solo

Un usuario se desconecta del grupo y explora independientemente — sus fotos se siguen agregando a la galeria compartida.

### Story 5.1: Captura Independiente en Modo Solo

As a usuario,
I want explorar el museo por mi cuenta sacando fotos y recibiendo descripciones individuales,
So that pueda ir a mi ritmo sin depender del grupo.

**Acceptance Criteria:**

**Given** el usuario esta desconectado del canal grupal (modo solo)
**When** toma fotos o hace preguntas (via camara, micro o teclado)
**Then** las capturas se procesan normalmente (IA + TTS) en su conversacion individual del proyecto
**And** las fotos se guardan en la base de datos asociadas al proyecto y al usuario
**And** las fotos se agregan automaticamente a la galeria compartida del proyecto (visibles para todos)
**And** su conversacion individual es independiente de la del canal grupal
**And** al reconectarse al grupo, sus fotos siguen en la galeria compartida

---

## Epic 6: Galeria Compartida y Mapa

Cualquier usuario puede ver todas las fotos del proyecto con sus descripciones y ubicaciones en un mapa.

### Story 6.1: Captura de Geolocalizacion

As a usuario,
I want que cada foto que tome guarde automaticamente mi ubicacion,
So that despues pueda ver en un mapa donde tome cada foto.

**Acceptance Criteria:**

**Given** el usuario toma una foto (cualquier modo: solo o grupal)
**When** la foto se captura
**Then** el sistema obtiene lat/lng via Geolocation API del navegador
**And** las coordenadas se almacenan junto al mensaje en la base de datos
**And** si el usuario deniega permisos de ubicacion, la foto se guarda sin coordenadas (no bloquea)

### Story 6.2: Galeria de Fotos del Proyecto

As a usuario,
I want ver todas las fotos del proyecto en una galeria visual,
So that pueda revisar lo que vimos durante la visita al museo.

**Acceptance Criteria:**

**Given** el usuario navega a la galeria del proyecto activo
**When** la pagina carga
**Then** ve un grid con todas las fotos del proyecto (de todos los usuarios, incluyendo modo solo)
**And** cada foto muestra miniatura, nombre del usuario que la tomo, y fecha
**And** al tocar una foto, ve la foto en grande + la descripcion completa de la IA

### Story 6.3: Mapa de Ubicaciones

As a usuario,
I want ver un mapa con marcadores en los lugares donde tomamos fotos,
So that pueda recordar el recorrido que hicimos por el museo.

**Acceptance Criteria:**

**Given** el usuario esta en la galeria del proyecto
**When** cambia a la vista de mapa
**Then** ve un mapa Leaflet con marcadores en las ubicaciones de todas las fotos con geolocalizacion
**And** al tocar un marcador, ve la miniatura de la foto y un snippet de la descripcion
**And** las fotos sin geolocalizacion no aparecen en el mapa pero si en la galeria

---

## Epic 7: Configuracion y PWA

El usuario puede personalizar el prompt de la IA y la app es instalable como PWA en la pantalla de inicio.

### Story 7.1: Prompt Personalizable

As a usuario,
I want editar el prompt de sistema que la IA usa para generar descripciones,
So that pueda adaptar el tono, profundidad y enfoque a lo que mi familia necesita.

**Acceptance Criteria:**

**Given** el usuario esta en la pantalla de configuracion
**When** ve el campo de texto "Prompt del sistema"
**Then** tiene un valor por defecto (ej: "Sos un guia de museo experto. Responde en espanol, con datos especificos, fechas y contexto historico.")
**And** puede editar el texto libremente
**And** al guardar, se actualiza en la base de datos via PUT /api/settings
**And** todas las futuras consultas a OpenAI usan el nuevo prompt

### Story 7.2: PWA Instalable

As a usuario,
I want instalar la app en la pantalla de inicio de mi celular,
So that se abra rapido como una app nativa sin pasar por el navegador.

**Acceptance Criteria:**

**Given** el usuario visita la app en Chrome o Safari mobile
**When** el navegador detecta el PWA manifest
**Then** ofrece la opcion de "Agregar a pantalla de inicio"
**And** la app tiene manifest con nombre, iconos (192x192, 512x512), colores de la paleta calida
**And** el service worker cachea assets estaticos y tracks de musica para carga rapida
**And** la app instalada carga en < 1 segundo (NFR5)
