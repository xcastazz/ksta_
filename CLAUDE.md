# KstaStudio_: guía completa para la IA

Este archivo lo lee Claude Code (u otra IA) al abrir el repositorio. Explica **qué es KstaStudio_, cómo trabaja su dueño, cómo está hecho este sitio y cómo se hacen todos los demás trabajos del estudio** (páginas de clientes, PDFs, videos, reels, fuentes, correos), para poder seguir haciéndolos igual desde cualquier computador.

> Si algo de aquí ya no coincide con el código, manda el código. Actualiza este archivo cuando cambie algo importante.

---

## 1. Quién es y cómo le gusta trabajar

- **KstaStudio_** es el estudio creativo de **Jerónimo Castañeda Velásquez**, en Medellín (Colombia): páginas web, logos, PDFs comerciales, videos y reels para negocios.
- Usuario de GitHub: `xcastazz`. Correo del estudio: kstastudio@gmail.com. Correo para entrar al panel admin: jc.casta00@gmail.com.
- Contacto público (está en `src/config.js`): WhatsApp **573116390334**, Instagram **@kstastudio_**.

### Reglas que siempre se cumplen
1. **Todo en español, muy sencillo y cálido**, sin jerga técnica. Al final de cada tarea se explica en palabras simples qué se hizo.
2. **Cada cambio se construye, se publica y se sube a git en el mismo turno**: `npm run deploy` (o `npx wrangler deploy` en los demás proyectos) y luego commit + push. No hay que pedir permiso para publicar cambios de rutina.
3. Los commits terminan con la línea `Co-Authored-By: Claude …` que indique la herramienta.
4. **Nada de emojis** en páginas, PDFs ni diseños: se usan íconos (Phosphor, Lucide o SVG propios).
5. **Nada de la bolita o punto de color antes de textos pequeños** ("eyebrows"/kickers): se ve hecho por IA.
6. **Lenguaje neutral** de género en los textos (por ejemplo "Ilustración" en vez de "Ilustradora") cuando no se sabe o el cliente lo pide.
7. En anuncios: español neutro de Colombia, sin "parce".
8. **No inventar datos**: ni testimonios, ni cifras, ni clientes. Si se usa un caso de ejemplo, se marca "Diseño de ejemplo" o "Historia de ejemplo". Fotos de otros: solo con licencia libre y con crédito.
9. **Imágenes proporcionadas**: nunca gigantes; cuidar proporciones.
10. **Videos terminados no se vuelven a renderizar** sin que él lo pida, y **en los videos no va su teléfono ni correo** (los pidió fuera).
11. Confidencialidad: el material de los clientes (fotos, videos, CRM, formularios) no se publica ni se comparte. Se guarda en carpetas ignoradas por git (`_cliente/`).
12. Cuando él no está (sale del computador), se trabaja de forma autónoma, se publica y se le avisa al final.

---

## 2. Este repositorio: el sitio kstastudio.com

- **En vivo:** https://kstastudio.com (y www). También responde en `ksta.jc-casta00.workers.dev`.
- **Tecnología:** Vite (JavaScript sin framework) + Three.js para el fondo 3D + Supabase (base de datos y login) + un Cloudflare Worker (`src/worker.js`) que sirve el sitio y una API privada.
- **Comandos:**
  - `npm install`
  - `npm run dev` → servidor local
  - `npm run deploy` → `vite build && wrangler deploy` (publica en Cloudflare)
- **Variables:** copiar `.env.example` a `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto Supabase `wotvygcvkjsysydlymvm`. El `.env` nunca se sube.
- **Cloudflare:** cuenta `jc-casta00`. Hay que iniciar sesión con `npx wrangler login` en cada computador nuevo.

### Archivos de `src/`
| Archivo | Para qué sirve |
|---|---|
| `main.js` | Arranque de la página pública, navegación y secciones |
| `config.js` | WhatsApp, correo, Instagram y horarios de asesorías por Meet |
| `pricing.js` | **Lista de precios en COP (sin IVA).** Todo el sitio y los PDF se recalculan desde aquí |
| `plans.js` | Planes por categoría (niveles con servicios incluidos) |
| `plain.js` | Traduce las claves internas de precios a nombres sencillos para el cliente |
| `quote.js` | Asistente de cotización paso a paso ("Cotiza en 2 minutos") |
| `budget.js` / `planner.js` | Planificador por presupuesto ("¿qué me alcanza con X?") |
| `booking.js` | Agenda de asesorías por Google Meet |
| `proposal.js` / `pdf.js` / `logo-png.js` | Propuestas y cotizaciones en PDF con jsPDF |
| `audit.js` | Auditoría web: preguntas → hallazgos → documento en PDF |
| `devprompt.js` | Genera un "brief" listo para pegar en Claude Code y arrancar el proyecto de un cliente |
| `projects.js` / `showcase.js` | Proyectos reales mostrados en el portafolio (cada uno en marco de navegador) |
| `templates.js` | Plantillas gratuitas de HTML5 UP (CC BY 3.0) en `public/templates` |
| `scene.js` | Fondo 3D de puntos ondulados que cambia por sección |
| `icons.js` | Íconos Phosphor (duotone, MIT) |
| `supabase.js` | Cliente de Supabase |
| `admin.js` / `admin.css` / `admin.html` | Panel privado `/admin` |
| `worker.js` | Worker: sirve `dist/` y la ruta `POST /api/interpretar` (Workers AI convierte un texto libre del cliente en respuestas del cotizador) |

### Secciones de la página pública
inicio, promo, opiniones, proyectos, manifiesto, servicios, plantillas, paquetes, auditoría, presupuesto, planificador, proceso, nosotros, preguntas frecuentes y contacto.

### Panel admin (`/admin`)
- Entrada con enlace mágico de Supabase. Solo entran los correos de la tabla `admins`.
- Tiene: tablero, lista y detalle de clientes (leads), editor de cotización con precios automáticos (PDF + WhatsApp), seguimientos, auditorías, "Desde texto" (pega lo que escribió el cliente y la IA llena la cotización), ajustes y notificaciones.

### Base de datos (Supabase, `supabase/schema.sql`)
- `leads`: clientes y cotizaciones (`quote` jsonb, `quote_total`, `notes`, `template`, `follow_up`, `priority`, `updated_at`).
- `admins`: correos con acceso al panel.
- `lead_events`: historial de cada cliente.
- Todas con RLS activo.
- **Ojo:** los proyectos gratis de Supabase se pausan tras 7 días sin uso. Si el panel falla, hay que entrar a supabase.com y reactivarlo.

### Otras páginas dentro de `public/`
- `propuestas/<cliente>/`: vistas previas que se muestran al cliente antes de cerrar (ej. `propuestas/maak`, con camión 3D y letreros de carretera; `propuestas/soluciones-legales`).
- `auditoria-web/`, `paginas-web/`, `logos/`, `muestras/`: páginas de servicios y ejemplos.
- `privacidad.html`, `robots.txt`, `sitemap.xml`.

---

## 3. Cómo se hace una página para un cliente (el proceso completo)

1. **Brief:** leer audios, fotos y mensajes del cliente. Los audios de WhatsApp (.ogg/.m4a) se transcriben con Whisper (ver §6).
2. **Cotización:** se crea el cliente en el panel (`leads`) y se genera la cotización, la propuesta y el contrato en PDF.
3. **Vista previa:** una página en `public/propuestas/<cliente>/` del sitio para mostrarle la idea.
4. **Proyecto propio:** carpeta aparte en `Documents/Proyectos/<cliente>`, con un **Cloudflare Worker con assets estáticos**:
   - `wrangler.toml` con `[assets] directory="./public"`, `binding="ASSETS"`, `run_worker_first=["/api/*", ...]`.
   - `src/worker.js` para formularios y panel privado.
   - **D1** como base de datos de solicitudes (`schema.sql`).
   - **R2** para videos y archivos que el cliente sube desde su panel.
   - **Send Email** (`[[send_email]]`) para avisar al cliente de cada solicitud.
   - **Panel privado** `/admin/` con contraseña guardada como *secret* (`wrangler secret put ADMIN_PASSWORD` y `SESSION_SECRET`). La sesión va en una cookie firmada con HMAC.
   - `<meta name="robots" content="noindex">` hasta conectar el dominio propio.
5. **Diseño:** usar las skills de diseño (§5). Reglas:
   - fotos reales del cliente;
   - una idea por pantalla;
   - nada "en caja", con secciones separadas por líneas finas y no por tarjetas;
   - un "momento" animado (por ejemplo, pasos que cambian la foto al bajar);
   - accesible para personas mayores: botones grandes y textos claros.
6. **Revisión:** capturas con Chrome sin ventana (puppeteer-core) a 1440 px y 390 px. Revisar que nada se salga de la pantalla y que no haya errores de consola.
7. **Publicar** (`npx wrangler deploy`), commit y explicarle al dueño en palabras sencillas.
8. **Dominio:** cuando el cliente aprueba, se conecta su dominio en Cloudflare (custom domain del Worker) y se quita el `noindex`.

### Correos con el dominio del cliente
1. Mover los DNS del dominio a Cloudflare.
2. Activar **Email Routing** para que `contacto@sudominio.com` llegue a su Gmail.
3. Para responder "como" ese correo desde Gmail ("Enviar como"), usar el SMTP de su hosting.
4. Ajustar el SPF para incluir el hosting y `_spf.mx.cloudflare.net`.

Se le entrega una guía en PDF con capturas.

---

## 4. Proyectos de clientes (carpetas en `Documents/Proyectos/`)

| Carpeta | Cliente | En vivo | Notas |
|---|---|---|---|
| `solucioneslegales` | Compañía Soluciones Legales (abogados, Bogotá) | soluciones-legales.jc-casta00.workers.dev | Varias páginas generadas por `tools/build-pages.mjs` (`node tools/build-pages.mjs` y luego deploy). Paleta "papel y bronce", fuentes Newsreader + Hanken Grotesk. D1 + R2 + correo + panel `/admin/`. Material del cliente en `_cliente/` (ignorado). Reels en `public/video/reels/`. |
| `laura` | Laura Trespalacios (ilustradora, portafolio) | laura-trespalacios.jc-casta00.workers.dev | Buzón privado `/buzon/`. Fuente propia "Laura Mano" (`public/fonts/laura-mano.otf`) hecha con `tools/mkfont.mjs` desde su alfabeto dibujado. Versión de css/js con `?v=N`. |
| `csl-video` | Videos y reels (Remotion) | — | Ver §6. |
| `elsilencio` | El Silencio (lotes campestres, Urabá) | el-silencio.jc-casta00.workers.dev | Lotes vendidos marcados, videos y sección Urabá. |
| `ivbags` | IV Bags | ivbagss.com | Repo `xcastazz/ivbags`. Usa Supabase Storage. |
| `catalogotec` | Catálogo | catalogo.jc-casta00.workers.dev | Repo `xcastazz/catalogo`. |
| MAAK | Transportadora MAAK | kstastudio.com/propuestas/maak | Vista previa con camión 3D. Precio acordado: $600.000. |
| ASISST | Software (posible sociedad) | — | Solo documento de requerimientos en PDF. |

> **Importante:** varias carpetas (`solucioneslegales`, `laura`, `csl-video`, `elsilencio`) **no tienen repositorio en GitHub**. Para trabajar en otro computador hay que subirlas (como repos privados) o copiarlas. Las contraseñas de los paneles de clientes **no van en git**: están en archivos locales `Proyectos/.csl-admin-pass.txt` y `Proyectos/.laura-buzon-pass.txt`, y como *secrets* en Cloudflare.

---

## 5. Herramientas y skills de Claude Code

Skills instaladas en `~/.claude/skills` (hay que instalarlas de nuevo en un computador nuevo, revisándolas antes):
- **Diseño:** `taste-skill` (sistema completo, paletas, tipografías, fotos con licencia vía `scripts/photos.mjs search|fetch|credits`), `frontend-design`, `impeccable`, `ui-ux-pro-max`, `better-typography`, `better-colors`, `better-layout`, `better-interface`, `better-ui`, `interface-review`.
- **Video:** `remotion-best-practices` (de github.com/remotion-dev/skills).

Herramientas de línea de comandos que se usan (se instalan con `npm i --no-save` en una carpeta de trabajo):
- `puppeteer-core` + `ws` con el Chrome instalado (`C:/Program Files/Google/Chrome/Application/chrome.exe`): capturas, PDFs desde HTML y revisión de páginas.
- `ffmpeg-static`: cortar videos, sacar fotogramas, normalizar audio.
- `sharp`: recortar, quitar fondos (por ejemplo el logo dorado de Soluciones Legales), dar color a las fotos.
- `pdfjs-dist`, `pdf-to-img` y `mammoth`: leer PDFs y Word del cliente.
- `potrace` + `opentype.js`: convertir un alfabeto dibujado a mano en una fuente `.otf`.
- `@huggingface/transformers` (whisper-small) o `whisper.cpp` (vía `@remotion/install-whisper-cpp`): transcribir audios.
- Para descargar carpetas públicas de Google Drive sin Python: leer `drive.google.com/embeddedfolderview?id=ID` y bajar cada archivo de `drive.usercontent.google.com/download?id=ID&export=download&confirm=t`.

**PDFs comerciales** (cotizaciones, propuestas, contratos, guías): se escriben en HTML con la marca y se exportan a PDF con puppeteer. Se guardan en `Descargas` con nombres como `Cliente-Tema-KstaStudio.pdf`.

---

## 6. Videos y reels (`Documents/Proyectos/csl-video`, Remotion)

Proyecto Remotion (React) para reels verticales 1080×1920 a 30 fps.

- `prep.mjs <reel>`:
  - recorta cada toma;
  - pone el video vertical, corrige el color y normaliza la voz;
  - transcribe con whisper.cpp (modelo *medium*);
  - **alinea el guion escrito con lo que se dijo**, para que los subtítulos tengan buena ortografía y tiempos reales.

  Las tomas y guiones están en `reels.data.mjs`. Las tomas salen en `public/clips/` y los subtítulos en `public/captions/`.
- `align-voice.mjs`: para notas de voz sueltas, reubica las palabras dentro de los tramos donde de verdad hay voz (whisper suele marcar las palabras antes de tiempo).
- `src/kit.tsx`: piezas reutilizables, todas animadas solo con `useCurrentFrame()`:
  - subtítulos palabra por palabra;
  - clip con zoom lento y "golpes" de zoom;
  - letreros de impacto y tarjetas de pasos;
  - escenas 3D con `@remotion/three`: casa, balanza, columnas, documentos;
  - cierre con logo, marca fija y barra de avance.
- `src/Generic.tsx` + `src/configs.ts`: reels armados desde una configuración (gancho 3D → clips con efectos → escenas 3D con el abogado en círculo → cierre).
- `src/Herencia.tsx`: reel hecho a mano.
- `src/Ksta.tsx`: reel de KstaStudio "Dime tu negocio y te hago la página" (todo animado, voz de Jerónimo, colores morados).
- Sonidos en `public/sfx/`: generados con ffmpeg (whoosh, hit, pop, riser, chime, tick, bed, beat), así que no hay problemas de derechos.
- Comandos:
  - `npx remotion studio`: vista previa;
  - `npx remotion still src/index.ts <id> out/x.png --frame=N --scale=0.25 --browser-executable="<chrome>"`: revisar cuadros;
  - `npx remotion render src/index.ts <id> out/<id>.mp4 --browser-executable="<chrome>" --crf=18`: render final.
- **Volumen final:** pasar el render por `loudnorm=I=-14:TP=-1.2` con ffmpeg. Volúmenes por encima de 1 en `<Audio>` no suben más.
- `whisper.cpp/` (1.5 GB) y `node_modules` no van en git: se reinstalan con `node whisper-setup.mjs` y `npm install`.
- **Licencia de Remotion:** gratis para empresas de hasta 3 personas.

### Qué hace viral un reel (investigado)
- Gancho en los primeros 3 segundos.
- Transición fuerte en el golpe de la música.
- Subtítulos grandes palabra por palabra.
- 20–45 s en Instagram.
- Pedir que comenten una palabra al final.
- Que el final empalme con el inicio (bucle).
- Serie "Dime tu negocio y te hago la página": cada capítulo responde a un comentario real.

---

## 7. Marca KstaStudio_

- **Colores:** fondo muy oscuro morado `#0b0713`, morado `#6d28d9` / `#a876ff`, rosado `#e879f9`, verde `#86efac`, lila claro `#e9d5ff`.
- **Fuentes:** Geist (y Geist Mono) en la marca; el sitio también usa Manrope y Cormorant Garamond.
- **Logos:** `public/logo-mark.svg`, `public/favicon.svg`. Las versiones PNG ("con nombre" y "perfil") están en Descargas del computador original.
- **Promesas que sí se pueden decir en publicidad** (están en el sitio):
  - páginas desde **$350.000**;
  - listas en **1 a 2 semanas**;
  - **se paga la mitad al empezar**;
  - **si no te gusta, la rehacemos**.

---

## 8. Pendientes conocidos

- **Soluciones Legales:**
  - conectar su dominio y quitar el `noindex`;
  - faltan su NIT y testimonios reales;
  - confirmar quién es quién en los videos para poner foto con nombre.
- **Laura:** imágenes en alta calidad, revisar textos en inglés y dominio propio.
- **MAAK:** corregir en el panel el precio del cliente a $600.000 y añadir el nombre y teléfono del contacto.
- **KstaStudio:** testimonios reales (nunca inventados) y más proyectos en el portafolio.
- **Subir a GitHub** (privados) los proyectos de clientes que aún no tienen repositorio.
