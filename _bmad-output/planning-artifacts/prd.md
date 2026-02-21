---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: []
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Museum Companion

**Author:** Pedro
**Date:** 2026-02-20

## Resumen Ejecutivo

Museum Companion es una PWA movil que transforma la experiencia de visitar museos en familia. Reemplaza el flujo manual de Gemini generico — sacar foto, escribir prompt, esperar, copiar texto, reproducir audio — con una interfaz de proposito unico: apuntar, disparar, escuchar.

Disenada para un grupo familiar de 5 usuarios viajando por Europa. Velocidad y simplicidad son la maxima prioridad.

**Problema central:** Las herramientas de IA genericas requieren demasiados pasos manuales para un caso de uso que deberia ser instantaneo. Cada segundo de friccion es un segundo perdido frente a una obra de arte.

### Lo que la hace especial

Tres elementos que ningun producto existente ofrece juntos:

1. **Captura de cero friccion** — foto con un toque, audio con mantener presionado, envio automatico. Cero interaccion innecesaria.
2. **Sincronizacion multi-oyente en tiempo real** — una persona fotografia, todo el grupo escucha simultaneamente en sus propios dispositivos.
3. **Descripciones personalizables** — prompt de sistema configurable para adaptar tono, profundidad y enfoque de las explicaciones.

Todo envuelto en musica ambiental antigua que transforma una respuesta de IA en una experiencia inmersiva de audioguia.

## Clasificacion del Proyecto

- **Tipo:** PWA (SPA, solo movil)
- **Dominio:** General (turismo/cultura)
- **Complejidad:** Media — dominio simple, desafios tecnicos en sync real-time, captura camara/audio, integracion OpenAI y TTS
- **Contexto:** Greenfield

## Criterios de Exito

### Exito de Usuario

- Foto → audio reproduciendose en **< 8 segundos** (vs. 30-60s con Gemini generico)
- Flujo completo: **maximo 2 toques** (foto + envio automatico, o hold-to-record + envio al soltar)
- Conectarse/desconectarse del canal grupal: **un solo toque**
- Broadcast de audio a todos los dispositivos del grupo: **< 1 segundo** de desfase
- Momento "aha!": sacar el celular, tomar la foto, escuchar la historia con musica ambiental — sin tocar un teclado

### Exito de Adopcion

- **Adopcion familiar completa**: los 5 miembros prefieren esta app sobre Gemini generico en la primera visita a un museo
- La app se usa en **cada visita** sin que nadie sugiera volver al metodo anterior
- No aplica modelo de negocio — herramienta personal/familiar

### Resultados Medibles

- Reduccion del tiempo foto-a-audio de ~45s a < 8s
- 0 toques de teclado en el flujo principal
- 100% de las fotos accesibles para todos los participantes en la galeria compartida

## Alcance del Producto

### MVP (Fase 1)

| # | Capacidad | Criticidad |
|---|---|---|
| 1 | Barra de entrada AI-first: 3 botones (camara, microfono, teclado) con igual jerarquia visual. Camara: un toque = foto + envio auto. Microfono: hold = graba, soltar = envia. Teclado: input de texto convencional | Bloqueante |
| 2 | Geolocalizacion automatica con cada foto + mapa de ubicaciones en vista proyecto | Importante |
| 3 | Envio a OpenAI GPT-4o (vision multimodal: foto + pregunta opcional en texto/audio) | Bloqueante |
| 4 | Streaming de texto en tiempo real de la respuesta de IA | Bloqueante |
| 5 | TTS con OpenAI en espanol, reproduccion automatica | Bloqueante |
| 6 | Canal grupal: un fotografo designado, multiples oyentes, sync en tiempo real | Bloqueante |
| 7 | Modo solo: desconexion/reconexion un toque | Bloqueante |
| 8 | Conversacion unica por proyecto por usuario. En canal grupal: stream en vivo visible pero solo lectura | Bloqueante |
| 9 | Proyectos: crear, seleccionar, agrupar todo el contenido bajo el proyecto activo | Bloqueante |
| 10 | Galeria compartida: todas las fotos del proyecto (incluyendo modo solo) visibles para todos | Importante |
| 11 | Musica ambiental: 5 tracks antiguos precargados, fade-in al iniciar descripcion, fade-out al terminar. Apagada por defecto | Importante |
| 12 | Prompt personalizable en configuracion | Importante |
| 13 | Selector de fotografo en configuracion | Importante |
| 14 | Seleccion de usuario al primer uso (5 usuarios pre-configurados, sin autenticacion) | Bloqueante |

### Post-MVP (Fase 2)

- Descripciones personalizadas por usuario (cada miembro recibe version adaptada a sus intereses)

### Recomendaciones (no aprobadas)

- Modo offline con cache
- Exportar proyecto como PDF/album
- Deteccion automatica de obra de arte
- Follow-up contextual por obra

### Estrategia de Mitigacion de Riesgos

**Tecnicos:**
- Cadena foto → IA → TTS > 8s → streaming de texto primero, audio en paralelo, modo degradado texto-only
- WebSocket inestable en museo → modo solo como fallback automatico, reconexion automatica

**Recurso:**
- Un solo desarrollador (Pedro) → stack simple, sin over-engineering. Features "Importantes" pueden posponerse si Bloqueantes toman mas tiempo

**Mercado:** No aplica — herramienta familiar con validacion inmediata en campo.

## Recorridos de Usuario

### Recorrido 1: Maria (Fotografa) — Captura rapida

**Escena:** Maria esta frente al David en la Galleria dell'Accademia. Su familia esta en la misma sala, cada uno con auriculares, avanzando juntos. Proyecto "Florencia" activo, canal grupal conectado.

**Accion:** Apunta al David, toca el boton de camara una vez. Foto + envio automatico. En 6 segundos, musica ambiental entra con volumen bajo y una voz en espanol narra la historia — en su telefono y simultaneamente en los auriculares de toda su familia. En todas las pantallas: foto y texto streameandose en vivo.

**Resolucion:** Foto guardada con geolocalizacion en la galeria compartida. Conversacion del proyecto actualizada. Musica se apaga al terminar. La familia sigue caminando.

### Recorrido 2: Maria (Fotografa) — Pregunta especifica

**Escena:** Maria frente a un cuadro que no entiende. Quiere saber sobre la tecnica de pintura, no el contexto general.

**Accion:** Mantiene presionado el boton de camara. Dice: "que tecnica de pintura uso el artista y por que era innovadora para la epoca?". Suelta. Foto + audio se envian automaticamente.

**Resolucion:** Respuesta enfocada exactamente en la tecnica. El prompt en settings incluye "responde en espanol, como guia de museo experto, con datos especificos y fechas". Todo el grupo escucha.

### Recorrido 3: Maria — Follow-up sin foto

**Escena:** Maria acaba de escuchar la descripcion y quiere profundizar.

**Accion:** Toca boton de microfono, mantiene presionado: "y quien fue el mecenas que encargo esta obra?". Suelta. Envio automatico como follow-up.

**Resolucion:** La IA responde en contexto — sabe de que cuadro habla. Audio automatico para todo el grupo. No fue necesario repetir contexto ni sacar otra foto.

### Recorrido 4: Lucas (Oyente) — Modo solo

**Escena:** Lucas, 17 anos, decide separarse del grupo para explorar a su ritmo.

**Accion:** Un toque para desconectarse del canal grupal. Modo solo activo. Saca fotos, recibe descripciones individuales. Su conversacion personal del proyecto se llena con sus capturas.

**Resolucion:** Sus fotos se agregan a la galeria compartida incluso en modo solo. Reconexion al grupo con un toque cuando quiera.

### Recorrido 5: Pedro — Cambio de fotografo

**Escena:** Pedro quiere que Lucas sea el fotografo del grupo.

**Accion:** Configuracion → cambia fotografo de "Maria" a "Lucas".

**Resolucion:** Las fotos de Lucas ahora se transmiten al canal grupal. Maria pasa a oyente. Cambio inmediato, sin desconectar a nadie.

### Requisitos Revelados por Recorrido

| Recorrido | Capacidades |
|---|---|
| Captura rapida | Camara un toque, envio auto, IA + TTS, sync grupal, geo, musica, stream texto+foto |
| Pregunta especifica | Hold-to-record camara, foto+audio, prompt personalizable, IA contextual |
| Follow-up voz | Microfono hold-to-record sin foto, conversacion contextual, audio grupal |
| Modo solo | Canal grupal lectura, desconexion/reconexion un toque, conversacion individual, fotos a galeria compartida |
| Cambio fotografo | Selector en settings, cambio instantaneo |

## Innovacion y Patrones Novedosos

### Areas de Innovacion

- **Sincronizacion grupal de audioguia en tiempo real**: una persona captura, todo el grupo escucha simultaneamente — no existe en ninguna app de museos, audioguias o herramientas de IA
- **Interfaz AI-first de 3 botones**: camara y microfono al mismo nivel que teclado como paradigma de entrada. Invierte la jerarquia de las apps de IA convencionales
- **Descripcion inmersiva con musica ambiental**: respuesta de IA transformada en experiencia de audioguia con musica que entra y sale automaticamente

### Contexto de Mercado

- Audioguias de museo: estaticas, pre-grabadas, no se adaptan
- Apps de IA genericas: multiples pasos manuales, sin funcionalidad grupal
- No existe producto que combine vision AI + TTS + sync grupal + musica ambiental en interfaz de cero friccion

### Validacion

- En campo inmediato: la familia viaja ahora, MVP se prueba en el proximo museo
- Metrica: 5 usuarios prefieren la app sobre Gemini generico en la primera visita

## Requisitos Especificos de PWA

### Arquitectura

- **SPA** con navegacion interna. Vistas: conversacion (principal), selector de proyecto, galeria con mapa, configuracion
- **Navegadores:** Chrome y Safari mobile (Android e iOS). Sin soporte desktop ni legacy
- **SEO:** No requerido — app privada, no indexable

### Tiempo Real

WebSockets o SSE para:
- Sincronizar fotos y descripciones del fotografo a oyentes
- Stream de texto en vivo de la respuesta de IA
- Broadcast del evento de audio TTS (cada dispositivo reproduce localmente, sin sincronizacion exacta del trigger)

### API de IA

- **Proveedor:** OpenAI
- **Vision:** GPT-4o multimodal (foto + pregunta opcional en texto/audio transcrito)
- **TTS:** OpenAI TTS API, espanol, voz natural
- **Streaming:** Respuesta streameada para texto en tiempo real antes de audio

### Implementacion

- **PWA manifest:** instalable, splash screen con paleta calida (naranja, rojo, amarillo)
- **Service Worker:** cache de assets estaticos y tracks de musica
- **Sin autenticacion:** 5 usuarios pre-configurados, seleccion al primer uso
- **Almacenamiento:** servidor. Cliente lo mas liviano posible
- **Paleta:** escala calida — naranja, rojo, amarillo
- **Viewport:** 320px - 430px, solo portrait
- **Interfaz:** conversacion tipo chat + barra fija inferior con 3 botones (camara, microfono, teclado)

## Requisitos Funcionales

### Captura y Entrada

- FR1: El fotografo puede tomar una foto con un solo toque que se envia automaticamente
- FR2: El fotografo puede mantener presionado el boton de camara para grabar audio + tomar foto, enviando ambos al soltar
- FR3: Cualquier usuario puede mantener presionado el boton de microfono para grabar follow-up sin foto, enviando al soltar
- FR4: Cualquier usuario puede escribir texto via boton de teclado
- FR5: El sistema captura geolocalizacion (lat/lng) automaticamente con cada foto

### Procesamiento de IA

- FR6: El sistema envia foto (y audio/texto opcional) a OpenAI GPT-4o para descripcion contextual
- FR7: El sistema usa un prompt de sistema personalizable como contexto base para todas las consultas
- FR8: El sistema muestra la respuesta en streaming en tiempo real
- FR9: El sistema mantiene contexto de conversacion por proyecto para follow-ups

### Audio y TTS

- FR10: El sistema convierte respuesta de texto a audio en espanol via OpenAI TTS
- FR11: El sistema reproduce audio TTS automaticamente al estar listo
- FR12: El sistema activa musica ambiental (volumen bajo) al iniciar descripcion, desactiva al finalizar
- FR13: El sistema selecciona aleatoriamente entre 5 tracks de musica antigua ambiental precargados

### Canal Grupal y Sincronizacion

- FR14: El fotografo designado transmite capturas en tiempo real a todos los dispositivos del canal grupal
- FR15: Los oyentes ven fotos y texto streameandose en vivo
- FR16: Los oyentes reciben evento de audio TTS para reproduccion local automatica
- FR17: La conversacion grupal es solo lectura para oyentes
- FR18: Cualquier usuario puede conectarse al canal grupal con un toque
- FR19: Cualquier usuario puede desconectarse al modo solo con un toque

### Modo Solo

- FR20: Usuario en modo solo captura fotos y recibe descripciones independientemente
- FR21: Fotos en modo solo se agregan a la galeria compartida del proyecto
- FR22: Usuario en modo solo mantiene su conversacion individual del proyecto

### Proyectos

- FR23: Cualquier usuario puede crear un proyecto con un nombre
- FR24: Cualquier usuario puede seleccionar proyecto activo
- FR25: Todo contenido se agrupa bajo el proyecto activo
- FR26: Cada usuario tiene una conversacion unica por proyecto

### Galeria Compartida

- FR27: Cualquier usuario puede ver todas las fotos de todos los participantes en la galeria del proyecto
- FR28: Cualquier usuario puede ver mapa con ubicaciones de todas las fotos del proyecto
- FR29: Cualquier usuario puede ver la descripcion asociada a cada foto

### Configuracion

- FR30: Cualquier usuario puede editar el prompt de sistema para personalizar descripciones
- FR31: Cualquier usuario puede cambiar el fotografo designado del canal grupal
- FR32: El sistema permite seleccionar usuario al primer uso (5 pre-configurados, sin auth)

### Idioma e Interfaz

- FR33: Toda la interfaz (botones, labels, mensajes, placeholders, navegacion) esta en espanol argentino

## Requisitos No Funcionales

### Performance

- NFR1: Foto → inicio reproduccion audio TTS: < 8 segundos en 4G
- NFR2: Streaming de texto visible: < 3 segundos desde envio de foto
- NFR3: Broadcast de eventos al canal grupal: < 1 segundo
- NFR4: Carga inicial PWA (primera visita): < 3 segundos
- NFR5: Carga PWA instalada: < 1 segundo
- NFR6: Bundle JS/CSS: < 500KB (excluyendo tracks de musica)
- NFR7: Fotos comprimidas en cliente antes de envio

### Integracion

- NFR8: Si OpenAI no esta disponible, mensaje de error claro (no fallo silencioso)
- NFR9: Manejo de rate limits con reintentos y backoff exponencial
- NFR10: Streaming via SSE o HTTP streaming para minimizar tiempo hasta primer token

### Fiabilidad

- NFR11: Reconexion WebSocket automatica cada 5 segundos si se pierde conexion
- NFR12: Despues de 3 intentos fallidos, fallback automatico a modo solo con notificacion visual
- NFR13: Fotos y descripciones persisten en servidor — sin perdida de contenido si cliente se desconecta
- NFR14: Modo degradado (texto sin audio) si TTS falla
