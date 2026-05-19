/* ============================================================
   COGNITION — script.js
   Encapsulado, sin globals. Módulos por feature.
   ============================================================ */
'use strict';

/* Service Worker — PWA offline (evita registrar en file://) */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

(function () {
  const WA = '5493513841666';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initHeader();
    initMobileNav();
    initBackTop();
    initReveal();
    initSmoothScroll();
    initMetrics();
    initContactForm();
    initSparklines();
    initAgentFeed();
    initRoiCalc();
    initMapEmbed();
    initCasesFilter();
    initChat();
  });

  /* ---------- Year en footer ---------- */
  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Header + scroll progress ---------- */
  function initHeader() {
    const header = document.getElementById('siteHeader');
    const progress = document.getElementById('scrollProgress');
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = max > 0 ? Math.min(100, (y / max) * 100) + '%' : '0%';
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMobile');
    if (!toggle || !menu) return;

    const close = () => {
      menu.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('active');
      toggle.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('active')) close();
    });
  }

  /* ---------- Back to top ---------- */
  function initBackTop() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    const update = () => btn.classList.toggle('visible', window.scrollY > 600);
    window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const els = document.querySelectorAll(
      '.section-head, .pillar, .metric, .service-card, .case-card, ' +
      '.industry-cell, .testimonial, .feature-text, .feature-visual, ' +
      '.faq-item, .dashboard, .contact-grid > *, .legal-content > *, .error-inner'
    );
    els.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), Math.min(i * 25, 100));
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -10px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Smooth scroll con offset por header ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Métricas con contador animado ---------- */
  function initMetrics() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const duration = reduceMotion ? 0 : 1400;
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / Math.max(1, duration));
        const eased = 1 - Math.pow(1 - p, 3);
        const v = (target * eased).toFixed(decimals);
        el.textContent = (decimals > 0 ? Number(v).toFixed(decimals) : Math.round(v)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- Sparklines del dashboard ---------- */
  function initSparklines() {
    document.querySelectorAll('[data-sparkline]').forEach(svg => {
      const values = svg.dataset.sparkline.split(',').map(Number);
      const w = parseFloat(svg.getAttribute('width') || svg.getBoundingClientRect().width || 200);
      const h = parseFloat(svg.getAttribute('height') || svg.getBoundingClientRect().height || 60);
      if (!values.length || !isFinite(w) || !isFinite(h)) return;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min || 1;
      const pad = 4;
      const step = (w - pad * 2) / (values.length - 1 || 1);

      const points = values.map((v, i) => {
        const x = pad + i * step;
        const y = pad + (h - pad * 2) * (1 - (v - min) / range);
        return [x, y];
      });

      const linePath = 'M ' + points.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
      const areaPath = `${linePath} L ${(pad + (values.length - 1) * step).toFixed(1)} ${(h - pad).toFixed(1)} L ${pad.toFixed(1)} ${(h - pad).toFixed(1)} Z`;

      svg.innerHTML = `
        <defs>
          <linearGradient id="sparkGrad-${Math.random().toString(36).slice(2)}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#sparkGrad-${svg.id || 'x'})" />
        <path d="${linePath}" stroke="#00D4FF" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
      // El gradiente con id random no se referencia bien; lo seteamos por estilo inline:
      const gradId = 'sg' + Math.random().toString(36).slice(2, 8);
      svg.innerHTML = `
        <defs>
          <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00D4FF" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#${gradId})" />
        <path d="${linePath}" stroke="#00D4FF" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    });
  }

  /* ---------- Contact form → WhatsApp ---------- */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);
      const note = document.getElementById('contactNote');
      const submitBtn = form.querySelector('button[type="submit"]');

      const required = ['nombre', 'empresa', 'email', 'interes', 'mensaje'];
      for (const f of required) {
        if (!String(data.get(f) || '').trim()) {
          if (note) { note.textContent = 'Completá los campos requeridos.'; note.className = 'form-note error'; }
          const empty = form.querySelector(`[name="${f}"]`);
          if (empty) empty.focus();
          return;
        }
      }

      const email = String(data.get('email') || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        if (note) { note.textContent = 'Email no válido.'; note.className = 'form-note error'; }
        form.querySelector('[name="email"]').focus();
        return;
      }

      const tel = data.get('telefono');
      const msg = encodeURIComponent(
        `Hola Cognition,\n\n` +
        `Soy ${data.get('nombre')} de ${data.get('empresa')}.\n` +
        `Email: ${email}\n` +
        (tel ? `Tel: ${tel}\n` : '') +
        `Interés: ${data.get('interes')}\n\n` +
        `${data.get('mensaje')}`
      );

      const original = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando…';
      }
      if (note) { note.textContent = 'Preparando tu mensaje…'; note.className = 'form-note'; }

      setTimeout(() => {
        if (note) { note.textContent = '✓ Listo. Te abrimos WhatsApp para confirmar el envío.'; note.className = 'form-note success'; }
        window.open(`https://wa.me/${WA}?text=${msg}`, '_blank', 'noopener');
        if (submitBtn) {
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = original;
          }, 1400);
        }
      }, 600);
    });
  }

  /* ---------- Agent feed (mockup typewriter del hero) ---------- */
  function initAgentFeed() {
    const feed = document.getElementById('agentFeed');
    if (!feed) return;

    const timeEl = document.getElementById('agentFeedTime');
    const counterEl = document.getElementById('agentFeedCounter');
    const titleEl = document.querySelector('.agent-mockup-title');

    // 3 escenarios alternables: cobranzas, trámites públicos, validación documental
    const scenarios = [
      {
        title: 'agente · cuentas-por-pagar',
        summary: '7 docs · 2.1s',
        lines: [
          { type: 'info',    marker: '→', text: 'recibo · factura-proveedor.pdf', meta: '412 KB' },
          { type: 'action',  marker: '⚙', text: 'OCR · extrayendo campos…', meta: null, doneMeta: '14 campos · 0.8s' },
          { type: 'action',  marker: '⚙', text: 'validando CUIT contra padrón AFIP…', meta: null, doneMeta: 'ok' },
          { type: 'action',  marker: '⚙', text: 'cruzando contra cuentas-por-pagar…', meta: null, doneMeta: 'match #18204' },
          { type: 'success', marker: '✓', text: 'enrutado a CxP · prioridad media', meta: null },
          { type: 'warn',    marker: '!', text: 'monto excede umbral · escalado a humano', meta: 'CFO' },
          { type: 'info',    marker: '→', text: 'siguiente: nota-debito-007.pdf', meta: '218 KB' }
        ]
      },
      {
        title: 'agente · trámites-ciudadanos',
        summary: '6 trámites · 1.7s',
        lines: [
          { type: 'info',    marker: '→', text: 'expediente nuevo · 4321/2026', meta: 'web' },
          { type: 'action',  marker: '⚙', text: 'clasificando tipo de trámite…', meta: null, doneMeta: 'habilitación comercial' },
          { type: 'action',  marker: '⚙', text: 'validando DNI y documentación…', meta: null, doneMeta: '6/6 docs ok' },
          { type: 'action',  marker: '⚙', text: 'verificando deuda municipal…', meta: null, doneMeta: 'sin objeciones' },
          { type: 'success', marker: '✓', text: 'derivado a inspector zonal', meta: 'zona 3' },
          { type: 'info',    marker: '→', text: 'notificación al ciudadano enviada', meta: 'email + SMS' },
          { type: 'info',    marker: '→', text: 'siguiente: expediente 4322/2026', meta: 'web' }
        ]
      },
      {
        title: 'agente · cobranza-médica',
        summary: '5 prestaciones · 1.4s',
        lines: [
          { type: 'info',    marker: '→', text: 'prestación · 2026-05-12-PR8821', meta: 'OSDE' },
          { type: 'action',  marker: '⚙', text: 'verificando cobertura del afiliado…', meta: null, doneMeta: 'plan 410 · vigente' },
          { type: 'action',  marker: '⚙', text: 'aplicando reglas de coseguros…', meta: null, doneMeta: '12,5% paciente' },
          { type: 'success', marker: '✓', text: 'factura lista para débito', meta: 'AR$ 47.820' },
          { type: 'warn',    marker: '!', text: 'práctica requiere autorización previa', meta: 'auditoría' },
          { type: 'info',    marker: '→', text: 'siguiente: 2026-05-12-PR8822', meta: 'IOMA' }
        ]
      }
    ];

    let scenarioIdx = 0;
    let cancelled = false;
    let elapsed = 0;
    let processed = 0;

    function sleep(ms) {
      return new Promise(res => setTimeout(res, ms));
    }

    async function typewrite(span, text) {
      span.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'agent-cursor';
      span.appendChild(cursor);
      const speed = reduceMotion ? 0 : 22;
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;
        cursor.before(text[i]);
        if (speed) await sleep(speed);
      }
      cursor.remove();
    }

    async function renderLine(data) {
      const row = document.createElement('div');
      row.className = 'agent-line agent-line--' + data.type;
      const mk = document.createElement('span');
      mk.className = 'agent-line-marker';
      mk.textContent = data.marker;
      const tx = document.createElement('span');
      tx.className = 'agent-line-text';
      row.appendChild(mk);
      row.appendChild(tx);
      feed.appendChild(row);
      requestAnimationFrame(() => row.classList.add('show'));

      await typewrite(tx, data.text);

      // metadata after typing
      if (data.meta) {
        const meta = document.createElement('span');
        meta.className = 'agent-line-meta';
        meta.textContent = data.meta;
        tx.appendChild(meta);
      }
      // si es action, simulamos espera y ponemos doneMeta
      if (data.doneMeta) {
        await sleep(reduceMotion ? 100 : 700);
        if (cancelled) return;
        const meta = document.createElement('span');
        meta.className = 'agent-line-meta';
        meta.textContent = data.doneMeta;
        tx.appendChild(meta);
        // marcar como completado
        row.classList.remove('agent-line--action');
        row.classList.add('agent-line--success');
        mk.textContent = '✓';
      }
      // limitar líneas visibles (scroll behavior pero sin scroll: pop oldest)
      if (feed.children.length > 6) {
        feed.removeChild(feed.firstChild);
      }
    }

    async function runOnce() {
      const sc = scenarios[scenarioIdx];
      if (titleEl) titleEl.textContent = sc.title;
      for (const l of sc.lines) {
        if (cancelled) return;
        await renderLine(l);
        processed++;
        if (counterEl) counterEl.textContent = String(processed).padStart(3, '0');
        await sleep(reduceMotion ? 150 : 800);
      }
      if (cancelled) return;
      await sleep(500);
      // Estado final + CTA para cambiar de escenario
      const done = document.createElement('div');
      done.className = 'agent-line agent-line--success agent-done';
      done.innerHTML =
        '<span class="agent-line-marker">●</span>' +
        '<span class="agent-line-text">ciclo completo<span class="agent-line-meta">' + sc.summary + '</span></span>';
      feed.appendChild(done);
      requestAnimationFrame(() => done.classList.add('show'));
      if (feed.children.length > 6) feed.removeChild(feed.firstChild);

      // CTA: ver otro proceso
      await sleep(300);
      if (cancelled) return;
      const ctaWrap = document.createElement('div');
      ctaWrap.className = 'agent-next-wrap';
      const cta = document.createElement('button');
      cta.type = 'button';
      cta.className = 'agent-next';
      cta.innerHTML = '<span>Ver otro proceso</span><span aria-hidden="true">→</span>';
      cta.addEventListener('click', () => {
        scenarioIdx = (scenarioIdx + 1) % scenarios.length;
        feed.innerHTML = '';
        elapsed = 0;
        if (timeEl) timeEl.textContent = '0:00';
        runOnce();
      });
      ctaWrap.appendChild(cta);
      feed.appendChild(ctaWrap);
    }

    // contador de tiempo en el bar
    if (timeEl) {
      setInterval(() => {
        if (cancelled || document.hidden) return;
        elapsed++;
        const m = Math.floor(elapsed / 60).toString().padStart(1, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        timeEl.textContent = `${m}:${s}`;
      }, 1000);
    }

    runOnce();
  }

  /* ---------- Chat IA (asistente con respuestas por keywords) ---------- */
  function initChat() {
    // Intents: cada uno tiene patrones (regex), respuesta y sugerencias siguientes
    const intents = [
      {
        match: /\b(hola|buenas|holis|hi|hello|saludos|qué tal|que tal)\b/i,
        reply: '¡Hola! Soy el asistente de Cognition. Te puedo ayudar con info sobre la Suite, casos de éxito, precios, seguridad o derivarte a una persona. ¿Qué necesitás?',
        chips: ['¿Qué es Cognition Suite?', '¿Cuánto cuesta?', 'Hablar con alguien']
      },
      {
        match: /\b(precio|precios|costo|costos|cuesta|cuanto|cuánto|tarifa|tarifas|presupuesto|valor|fee|usd|d[oó]lar)\b/i,
        reply: 'Cognition Suite empieza en USD 1.200/mes (Starter, hasta 50K documentos). El plan Enterprise es a medida según volumen y módulos. Los servicios profesionales se cotizan por proyecto a precio cerrado o como squad mensual.',
        chips: ['Pedir cotización', '¿Qué incluye Starter?', '¿Cuánto tarda?']
      },
      {
        match: /\b(tiempo|plazo|plazos|demora|demoras|tarda|días|dias|semana|semanas|cuándo|cuando|cu[aá]nto tarda)\b/i,
        reply: 'Implementaciones entre 30 y 90 días según complejidad. Discovery 1–3 semanas, piloto productivo 4–8 semanas, escala 9–13 semanas. Te damos el plazo cerrado tras el discovery inicial.',
        chips: ['¿Cómo es el discovery?', 'Quiero un piloto']
      },
      {
        match: /\b(suite|producto|productos|plataforma|cognition suite|qué es|que es)\b/i,
        reply: 'Cognition Suite tiene 3 módulos integrados:\n• Datos + Dashboards\n• DigitalDoc (OCR + LLM para documentos)\n• Operaciones + Agentes IA\nMulti-tenant, ISO 27001, integraciones SSO. Más detalle en /suite.',
        chips: ['Ver DigitalDoc', '¿Pueden on-premise?', 'Quiero una demo']
      },
      {
        match: /\b(seguridad|seguro|iso|compliance|gdpr|ley|certifica|certificación|certificaciones|auditor[ií]a)\b/i,
        reply: 'Estamos certificados ISO 9001 (calidad) e ISO 27001 (seguridad de la información) por IQNet, con auditoría externa anual. Cumplimos Ley 25.326 (AR) y firmamos DPA con cada cliente. Pentesting trimestral por terceros.',
        chips: ['¿Y los datos?', '¿On-premise?', 'Más sobre la Suite']
      },
      {
        match: /\b(datos|dato|propiedad|exportar|export|portabilidad|lock|lock-in|due[ñn]o|due[ñn]os)\b/i,
        reply: 'Tus datos son tuyos, sin matices. Firmamos DPA, los podés exportar en formatos estándar (JSON, CSV, Parquet) y no los usamos para entrenar modelos compartidos con otros clientes. Sin lock-in técnico.',
        chips: ['¿Y la seguridad?', 'Hablar con ventas']
      },
      {
        match: /\b(stack|tecnolog[ií]a|tecnologias|react|node|\.net|python|angular|aws|azure|gcp|cloud)\b/i,
        reply: 'Stack maduro: React, Next.js, Node.js, .NET, Python. PostgreSQL, MongoDB, Redis. Desplegamos en AWS, Azure, GCP u on-premise. Para IA: OpenAI, Anthropic y modelos open-source self-hosted — somos agnósticos.',
        chips: ['¿Integran con SAP?', 'Ver servicios']
      },
      {
        match: /\b(sap|oracle|tango|bejerman|tiendanube|vtex|gde|integraci[oó]n|integraciones|integra|conectar)\b/i,
        reply: 'Conectores nativos a SAP (R/3 y S/4HANA), Oracle EBS, Tango, Bejerman, Tiendanube, VTEX y sistemas provinciales como GDE. Si tu sistema no está en la lista, lo integramos en el discovery.',
        chips: ['Ver servicios', 'Pedir cotización']
      },
      {
        match: /\b(caso|casos|ejemplo|ejemplos|cliente|clientes|referencia|referencias|prueba)\b/i,
        reply: 'Tenemos 6 casos reales en /casos:\n• Gobierno provincial (−92% papel)\n• Salud (−82% rechazos)\n• Banca (94% KYC automático)\n• Logística, retail, manufactura\nMétricas auditables.',
        chips: ['Ver casos', 'Quiero algo parecido']
      },
      {
        match: /\b(contacto|hablar|humano|agente|persona|agendar|llamar|tel[ée]fono|whatsapp|wa|email|mail)\b/i,
        reply: 'Tres formas de contactarnos:\n• Agendar 30min en /contacto\n• hola@cognition.com.ar\n• WhatsApp +54 9 351 384-1666\nTe respondemos en menos de 24hs hábiles.',
        chips: ['Ir a /contacto', 'Abrir WhatsApp']
      },
      {
        match: /\b(equipo|qui[ée]n|qui[ée]nes|fundador|fundadores|ceo|cto|liderazgo|gente)\b/i,
        reply: 'Liderazgo: Diego Funes (CEO) y Romina Pereyra (CTO), cofundadores. Santiago Iglesias (COO) y Valentina Mussi (VP Eng). Somos +120 personas en 4 oficinas: Córdoba (HQ), Buenos Aires, São Paulo y Florida.',
        chips: ['Ver Nosotros', '¿Cuántos años llevan?']
      },
      {
        match: /\b(ingl[eé]s|english|idioma|idiomas|portugu[eé]s|portugues)\b/i,
        reply: 'Atendemos en español, inglés y portugués. La Suite tiene UI en ES, EN y PT-BR. Tenemos clientes activos en Argentina, Brasil y EEUU. Soporte 24/7 en los tres husos horarios.',
        chips: ['¿Tienen oficina en EEUU?']
      },
      {
        match: /\b(on.?prem|on-?premise|premise|self.?host|nube|cloud|infra|infraestructura)\b/i,
        reply: 'Tres opciones de despliegue:\n• Cloud compartido (la más común)\n• Cloud dedicado en tu cuenta AWS/Azure/GCP\n• On-premise sobre Kubernetes\nEl on-prem es habitual en sector público y financiero por residencia de datos.',
        chips: ['¿Y la seguridad?', 'Hablar con ventas']
      },
      {
        match: /\b(demo|probar|sandbox|prueba|trial|poc|piloto)\b/i,
        reply: 'Montamos un sandbox con un subconjunto de tu proceso real en 5 días hábiles. Te lo entregamos para que lo pruebes con tu equipo. Solicitalo desde /contacto o por WhatsApp.',
        chips: ['Pedir sandbox', '¿Cómo es el proceso?']
      },
      {
        match: /\b(a[ñn]os|tiempo en el mercado|trayectoria|hace cu[aá]nto|desde cu[aá]ndo)\b/i,
        reply: 'Cognition opera desde 2010 (15+ años). Empezamos como consultora de software en Córdoba, lanzamos Cognition Suite en 2018 y hoy tenemos +200 organizaciones activas en LATAM y EEUU.',
        chips: ['Ver historia completa', 'Ver casos']
      },
      {
        match: /\b(gracias|thanks|dale|ok|okey|perfecto|joya|bárbaro|barbaro|listo)\b/i,
        reply: '¡A vos! Si querés profundizar algo o conversar con un humano, agendá en /contacto. Suerte con tu proyecto 👋',
        chips: ['Agendar conversación']
      }
    ];

    const fallback = {
      reply: 'No estoy 100% seguro de cómo responder eso. Probá preguntar por la Suite, precios, seguridad, casos, integraciones o el equipo. O escribime a hola@cognition.com.ar y te derivo a una persona.',
      chips: ['¿Qué es Cognition Suite?', 'Hablar con alguien', '¿Cuánto cuesta?']
    };

    const welcome = {
      reply: 'Hola 👋 Soy el asistente de Cognition. Puedo responderte sobre la Suite, casos, precios o seguridad. ¿Por dónde empezamos?',
      chips: ['¿Qué es Cognition Suite?', '¿Cuánto cuesta?', '¿Cómo es la seguridad?']
    };

    // HTML inyectado
    const tpl = `
      <button type="button" class="chat-toggle" id="chatToggle" aria-label="Abrir asistente de Cognition" aria-expanded="false" aria-controls="chatPanel">
        <svg class="chat-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="10" rx="2"/>
          <circle cx="12" cy="5" r="2"/>
          <path d="M12 7v4"/>
          <circle cx="8.5" cy="16" r="0.8" fill="currentColor"/>
          <circle cx="15.5" cy="16" r="0.8" fill="currentColor"/>
        </svg>
        <span class="chat-toggle-tooltip">Preguntá a la IA</span>
      </button>
      <aside class="chat-panel" id="chatPanel" role="dialog" aria-label="Asistente Cognition" aria-modal="false">
        <header class="chat-head">
          <span class="chat-head-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
          </span>
          <div class="chat-head-info">
            <div class="chat-head-title">Cognition · IA</div>
            <div class="chat-head-status">en línea · responde al instante</div>
          </div>
          <button type="button" class="chat-close" id="chatClose" aria-label="Cerrar asistente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>
        <div class="chat-body" id="chatBody" role="log" aria-live="polite" aria-atomic="false"></div>
        <form class="chat-form" id="chatForm" novalidate>
          <input type="text" class="chat-input" id="chatInput" placeholder="Escribí tu pregunta…" autocomplete="off" aria-label="Mensaje" maxlength="500">
          <button type="submit" class="chat-send" id="chatSend" aria-label="Enviar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <div class="chat-foot">Respuestas automáticas · sin envío de datos personales</div>
      </aside>
    `;
    const wrap = document.createElement('div');
    wrap.innerHTML = tpl;
    document.body.appendChild(wrap);

    const toggle = document.getElementById('chatToggle');
    const panel = document.getElementById('chatPanel');
    const close = document.getElementById('chatClose');
    const body = document.getElementById('chatBody');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');

    let openState = false;
    let isTyping = false;
    let history = [];

    // Cargar historial previo (se conserva entre páginas dentro de la misma pestaña)
    try {
      const raw = sessionStorage.getItem('cog_chat_history');
      if (raw) history = JSON.parse(raw) || [];
    } catch (e) { history = []; }

    function saveHistory() {
      try { sessionStorage.setItem('cog_chat_history', JSON.stringify(history.slice(-40))); } catch (e) {}
    }

    function openChat() {
      panel.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      openState = true;
      if (!body.children.length) {
        if (history.length) {
          // Replay del historial guardado, sin chips (ya fueron usadas)
          history.forEach(m => {
            if (m.role === 'bot') renderBot(m.text, null, true);
            else renderUser(m.text, true);
          });
        } else {
          renderBot(welcome.reply, welcome.chips);
        }
      }
      setTimeout(() => input.focus(), 100);
      try { sessionStorage.setItem('cog_chat_open', '1'); } catch (e) {}
    }
    function closeChat() {
      panel.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      openState = false;
      try { sessionStorage.setItem('cog_chat_open', '0'); } catch (e) {}
    }

    toggle.addEventListener('click', () => openState ? closeChat() : openChat());
    close.addEventListener('click', closeChat);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && openState) closeChat();
    });

    // Mensaje del bot con chips opcionales
    function renderBot(text, chips, skipPush) {
      const msg = document.createElement('div');
      msg.className = 'chat-msg chat-msg--bot';
      msg.textContent = text;
      body.appendChild(msg);

      if (chips && chips.length) {
        const wrapChips = document.createElement('div');
        wrapChips.className = 'chat-suggestions';
        chips.forEach(c => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'chat-chip';
          b.textContent = c;
          b.addEventListener('click', () => {
            wrapChips.remove();
            handleUser(c);
          });
          wrapChips.appendChild(b);
        });
        body.appendChild(wrapChips);
      }
      body.scrollTop = body.scrollHeight;
      if (!skipPush) { history.push({ role: 'bot', text }); saveHistory(); }
    }

    function renderUser(text, skipPush) {
      const msg = document.createElement('div');
      msg.className = 'chat-msg chat-msg--user';
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      if (!skipPush) { history.push({ role: 'user', text }); saveHistory(); }
    }

    function showTyping() {
      if (isTyping) return null;
      isTyping = true;
      const t = document.createElement('div');
      t.className = 'chat-typing';
      t.setAttribute('aria-label', 'Escribiendo');
      t.innerHTML = '<span></span><span></span><span></span>';
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    }
    function hideTyping(node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
      isTyping = false;
    }

    function findIntent(text) {
      for (const i of intents) if (i.match.test(text)) return i;
      return fallback;
    }

    function handleUser(text) {
      const clean = String(text || '').trim();
      if (!clean) return;
      renderUser(clean);
      const t = showTyping();
      const intent = findIntent(clean);
      // Delay fijo (700ms) — UX más natural que delay proporcional al input
      const delay = reduceMotion ? 200 : 700;
      setTimeout(() => {
        hideTyping(t);
        renderBot(intent.reply, intent.chips);
      }, delay);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const val = input.value;
      input.value = '';
      handleUser(val);
    });

    // Restaurar estado abierto si venía abierto en la sesión
    try {
      if (sessionStorage.getItem('cog_chat_open') === '1') openChat();
    } catch (e) {}
  }

  /* ---------- Map embed (click-to-load para ahorrar ~500KB) ---------- */
  function initMapEmbed() {
    const wrap = document.getElementById('mapEmbed');
    const btn = document.getElementById('mapLoad');
    if (!wrap || !btn) return;
    btn.addEventListener('click', () => {
      const src = wrap.getAttribute('data-src');
      if (!src) return;
      btn.disabled = true;
      btn.textContent = 'Cargando…';
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.loading = 'lazy';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = 'Mapa de Nueva Córdoba, Argentina';
      iframe.addEventListener('load', () => {
        const ph = wrap.querySelector('.map-placeholder');
        if (ph) ph.remove();
      });
      wrap.appendChild(iframe);
    });
  }

  /* ---------- Casos: filtros por industria ---------- */
  function initCasesFilter() {
    const filters = document.querySelectorAll('.case-filter');
    const cards = document.querySelectorAll('.case-card[data-industry]');
    const empty = document.getElementById('casesEmpty');
    if (!filters.length || !cards.length) return;

    filters.forEach(btn => {
      btn.addEventListener('click', () => {
        filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const filter = btn.dataset.filter;
        let visible = 0;
        cards.forEach(card => {
          const industries = (card.dataset.industry || '').split(/\s+/);
          const match = filter === 'all' || industries.includes(filter);
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
      });
    });
  }

  /* ---------- Calculadora ROI (interactiva, signature) ---------- */
  function initRoiCalc() {
    const root = document.getElementById('roiCalc');
    if (!root) return;

    const docsInput = root.querySelector('#roiDocs');
    const minsInput = root.querySelector('#roiMins');
    const rateInput = root.querySelector('#roiRate');

    const docsLabel = root.querySelector('#roiDocsVal');
    const minsLabel = root.querySelector('#roiMinsVal');
    const rateLabel = root.querySelector('#roiRateVal');

    const hoursOut = root.querySelector('#roiHours');
    const savingMonthOut = root.querySelector('#roiSavingMonth');
    const savingYearOut = root.querySelector('#roiSavingYear');
    const roiPctOut = root.querySelector('#roiPct');
    const paybackOut = root.querySelector('#roiPayback');
    const barBefore = root.querySelector('#roiBarBefore');
    const barAfter = root.querySelector('#roiBarAfter');
    const barBeforeVal = root.querySelector('#roiBarBeforeVal');
    const barAfterVal = root.querySelector('#roiBarAfterVal');

    const SUITE_COST = 1200;       // USD/mes plan Starter
    const REDUCTION = 0.82;        // 82% reducción tiempo (caso promedio)

    function fmt(n, decimals = 0) {
      return n.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    function fmtUSD(n) {
      return 'USD ' + fmt(Math.round(n));
    }

    function setFill(el) {
      const min = parseFloat(el.min) || 0;
      const max = parseFloat(el.max) || 100;
      const val = parseFloat(el.value) || 0;
      const pct = ((val - min) / (max - min)) * 100;
      el.style.setProperty('--val', pct + '%');
    }

    function pulse(el) {
      if (!el || reduceMotion) return;
      el.classList.remove('roi-pulse');
      // reflow para reiniciar la animación
      void el.offsetWidth;
      el.classList.add('roi-pulse');
    }

    function update() {
      const docs = parseInt(docsInput.value, 10) || 0;
      const mins = parseFloat(minsInput.value) || 0;
      const rate = parseFloat(rateInput.value) || 0;

      [docsInput, minsInput, rateInput].forEach(setFill);

      const prevDocs = docsLabel.textContent;
      const prevMins = minsLabel.textContent;
      const prevRate = rateLabel.textContent;

      docsLabel.textContent = fmt(docs);
      minsLabel.textContent = mins + ' min';
      rateLabel.textContent = 'USD ' + rate + '/h';

      if (prevDocs !== docsLabel.textContent) pulse(docsLabel);
      if (prevMins !== minsLabel.textContent) pulse(minsLabel);
      if (prevRate !== rateLabel.textContent) pulse(rateLabel);

      const totalMinutes = docs * mins;
      const minutesSaved = totalMinutes * REDUCTION;
      const hoursSaved = minutesSaved / 60;
      const totalHoursToday = totalMinutes / 60;
      const costToday = totalHoursToday * rate;             // costo operativo actual
      const costWithSuite = (totalHoursToday * (1 - REDUCTION)) * rate + SUITE_COST; // 18% del trabajo + suite
      const savingPerMonth = costToday - costWithSuite;
      const savingPerYear = savingPerMonth * 12;
      const annualCost = SUITE_COST * 12;
      const roiPct = annualCost > 0 ? ((savingPerYear - annualCost) / annualCost) * 100 : 0;
      const payback = savingPerMonth > SUITE_COST ? (SUITE_COST / savingPerMonth) : null;

      // Update bar chart: "antes" siempre 100% (referencia), "después" proporcional
      if (barBefore && barAfter) {
        const ratio = costToday > 0 ? (costWithSuite / costToday) : 0;
        const afterWidth = Math.max(5, Math.min(100, ratio * 100));
        barAfter.style.width = afterWidth + '%';
        if (barBeforeVal) barBeforeVal.textContent = fmtUSD(costToday) + '/mes';
        if (barAfterVal) barAfterVal.textContent = fmtUSD(costWithSuite) + '/mes';
      }

      const prevYear = savingYearOut.textContent;
      const prevMonth = savingMonthOut.textContent;
      const prevPct = roiPctOut.textContent;

      hoursOut.textContent = fmt(Math.round(hoursSaved));
      savingMonthOut.textContent = fmtUSD(savingPerMonth);
      savingYearOut.textContent = fmtUSD(savingPerYear);

      // Cap visual del ROI a +999% — números más altos sugieren plan Enterprise
      if (roiPct > 999) {
        roiPctOut.textContent = '999%+';
      } else {
        roiPctOut.textContent = (roiPct >= 0 ? '+' : '') + fmt(Math.round(roiPct)) + '%';
      }

      // Payback: si Suite no recupera la inversión con este volumen, decirlo explícito
      paybackOut.textContent = payback === null
        ? 'Volumen bajo · cotizar caso'
        : (payback < 1 ? '< 1 mes' : fmt(Math.ceil(payback)) + (Math.ceil(payback) === 1 ? ' mes' : ' meses'));

      // Color del ROI según signo
      roiPctOut.style.color = roiPct >= 0 ? 'var(--brand)' : 'var(--danger)';

      if (prevYear !== savingYearOut.textContent) pulse(savingYearOut);
      if (prevMonth !== savingMonthOut.textContent) pulse(savingMonthOut);
      if (prevPct !== roiPctOut.textContent) pulse(roiPctOut);
    }

    [docsInput, minsInput, rateInput].forEach(el => {
      el.addEventListener('input', update);
    });
    update();
  }
})();
