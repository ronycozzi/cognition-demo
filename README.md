# Cognition — Demo de portfolio

Sitio web ficticio para Cognition Software (consultora + plataforma de IA aplicada a negocios), construido como proyecto personal de portfolio frontend.

🌐 **Demo en vivo:** *próximamente en Netlify*

---

## Stack

HTML5 · CSS3 · JavaScript (ES6+) — sin frameworks, sin build step, sin npm.

## Features signature

- **Hero split editorial** con tipografía display (4 líneas alternadas normal/itálicas) + mockup live del agente IA con typewriter animado (3 escenarios alternables: cobranzas → trámites públicos → cobranza médica).
- **Calculadora ROI interactiva** en el home: 3 sliders (documentos/mes, minutos/doc, costo/h) → ahorro mensual/anual + ROI vs Suite + payback. Pulse animado al cambiar valor.
- **Chat IA flotante** con 16 intents resueltos por regex (saludo, precios, plazos, suite, seguridad, datos, stack, integraciones, casos, contacto, equipo, idioma, on-premise, demo, trayectoria, gracias). Persistencia entre páginas vía sessionStorage. Typing indicator 700ms fijo. Drawer pop-up a la derecha arriba del WhatsApp.
- **Mapa AR estilizado** en /industrias: grafo SVG de ciudades conectadas con HQ Córdoba con halo pulsante.
- **Filtros por industria** en /casos con detail revealed on hover ("Cómo lo hicimos" con 4 bullets técnicos por caso).
- **Click-to-load Google Maps** en /contacto (ahorra ~500KB de scripts hasta que el visitor lo pide).

## Características técnicas

- **11 páginas** estáticas: home, suite, servicios, casos, industrias, nosotros, contacto, faq, privacidad, términos y 404.
- **PWA** con Service Worker · estrategia **network-first para HTML** + **cache-first para assets** (CSS/JS/img/fonts).
- **SEO técnico**: Schema.org JSON-LD (`Organization`, `SoftwareApplication`, `Service`, `AboutPage`, `ContactPage`, `FAQPage`, `BreadcrumbList`, `CollectionPage`), Open Graph PNG 1200×630, Twitter Cards, sitemap, robots, canonical, hreflang `es-AR` / `x-default`.
- **Accesibilidad**: skip-to-content, `:focus-visible` con outline brand, heading order correcto, `aria-current` en nav, `aria-expanded`/`aria-controls` en toggle, `aria-live` polite en notes de form, `aria-hidden` en SVGs decorativos, soporte `prefers-reduced-motion` en TODAS las animaciones (canvas, typewriter, reveals, pulse).
- **Mobile-first** desde 320px con breakpoints a 600/768/880/1024px. 0 overflow horizontal en ningún viewport probado (320, 375, 768, 1280).
- **Performance**: preconnect a Google Fonts, fonts con `display=swap`, scroll listener con `requestAnimationFrame`, IntersectionObserver para reveals, backdrop-filter reducido a 10px en mobile.
- **Formulario de contacto** con validación nativa + JS, loading state, success state y handoff a WhatsApp pre-armado con todos los campos.
- **0 inline styles HTML** (todo refactorizado a clases).
- **Iconos PWA** PNG 192/512 maskable + favicon.ico multi-tamaño + favicon.svg.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0D10` | fondo grafito |
| `--bg-elev` | `#14171C` | superficies elevadas |
| `--ink` | `#F2F1ED` | texto principal crema |
| `--ink-mute` | `#B7BAC1` | texto secundario |
| `--brand` | `#00D4FF` | cyan eléctrico, signature |
| `--accent` | `#635BFF` | violeta eléctrico, contrapunto |

Tipografías: **Fraunces** (display serif variable) + **Inter** (sans body) + **JetBrains Mono** (data/code).

## Estructura

```
.
├── index.html              home: hero split + agent typewriter + métricas + ROI calc + pilares + servicios + casos + logos
├── suite.html              Cognition Suite (producto) en profundidad
├── servicios.html          6 servicios profesionales + proceso 6 etapas + modalidades
├── casos.html              6 casos con filtros por industria + detail on hover
├── industrias.html         6 verticales con stats + mapa AR estilizado
├── nosotros.html           historia + valores + equipo (sin nombres reales) + alcance
├── contacto.html           formulario validado → WhatsApp + map click-to-load
├── faq.html                12 preguntas frecuentes
├── privacy.html            política de privacidad (Ley 25.326)
├── terms.html              términos y condiciones
├── 404.html                con personalidad técnica
├── css/style.css           design tokens + componentes + responsive + print
├── js/script.js            módulos: header, nav, reveal, agente IA, ROI calc, chat IA, sparklines, forms, map embed
├── sw.js                   Service Worker (network-first HTML, cache-first assets)
├── manifest.json           PWA manifest
├── favicon.svg · favicon.ico · logo.svg · og-image.png
├── icon-192.png · icon-512.png (maskable)
├── sitemap.xml · robots.txt
└── tools/generate_assets.py (Pillow script para regenerar PNG/ICO)
```

## Previsualización local

```bash
cd web-03
python -m http.server 8000
# abrir http://localhost:8000
```

O usar el Live Server de VS Code: click derecho en `index.html` → "Open with Live Server".

## Regenerar assets PNG/ICO

```bash
cd web-03
pip install Pillow
py tools/generate_assets.py
```

Genera `og-image.png` (1200×630), `icon-192.png`, `icon-512.png`. Para `favicon.ico` usar el script inline al final de `generate_assets.py` o el comando one-liner:

```bash
py -c "from PIL import Image; Image.open('icon-512.png').save('favicon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128)])"
```

---

*Proyecto de demostración personal. No representa al cliente real Cognition Software ni a sus servicios contractuales. Equipo, casos y métricas son ficticios y mantienen plausibilidad sin compromiso comercial.*
