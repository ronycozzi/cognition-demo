"""
Genera assets PNG de Cognition para OG/PWA.
Output:
  og-image.png    1200x630   social sharing
  icon-192.png    192x192    PWA icon
  icon-512.png    512x512    PWA icon (maskable)
"""
from PIL import Image, ImageDraw, ImageFont
import os
import math
import random

random.seed(7)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BG = (11, 13, 16)
BG2 = (20, 23, 28)
INK = (242, 241, 237)
INK_MUTE = (183, 186, 193)
INK_DIM = (126, 132, 143)
BRAND = (0, 212, 255)
ACCENT = (99, 91, 255)

def get_font(serif, size):
    candidates_serif = ["georgia.ttf", "Georgia.ttf", "times.ttf", "Times.ttf", "DejaVuSerif.ttf"]
    candidates_sans = ["arial.ttf", "Arial.ttf", "segoeui.ttf", "SegoeUI.ttf", "DejaVuSans.ttf"]
    candidates = candidates_serif if serif else candidates_sans
    for c in candidates:
        for p in [c, f"C:/Windows/Fonts/{c}", f"/usr/share/fonts/truetype/dejavu/{c}"]:
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()

def radial_gradient(img, cx, cy, radius, color, alpha_max=0.18):
    """Aplica un gradient radial sutil sobre la imagen."""
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    steps = 40
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(255 * alpha_max * (1 - i / steps))
        draw.ellipse(
            (cx - r, cy - r, cx + r, cy + r),
            fill=(color[0], color[1], color[2], a),
        )
    img.paste(overlay, (0, 0), overlay)

def base_gradient(width, height):
    """Background gradient vertical sutil grafito."""
    img = Image.new("RGB", (width, height), BG)
    px = img.load()
    for y in range(height):
        t = y / height
        r = int(BG[0] + (BG2[0] - BG[0]) * t)
        g = int(BG[1] + (BG2[1] - BG[1]) * t)
        b = int(BG[2] + (BG2[2] - BG[2]) * t)
        for x in range(width):
            px[x, y] = (r, g, b)
    return img

def draw_neural_network(draw, nodes, brand_color=BRAND, line_alpha=46):
    """Dibuja líneas entre nodos cercanos y los nodos como círculos."""
    overlay_lines = Image.new("RGBA", (1, 1))  # placeholder
    for i, a in enumerate(nodes):
        for b in nodes[i + 1:]:
            dx = a[0] - b[0]
            dy = a[1] - b[1]
            dist = math.hypot(dx, dy)
            if dist < 240:
                alpha = int(line_alpha * (1 - dist / 240))
                color = (brand_color[0], brand_color[1], brand_color[2], alpha)
                draw.line([a, b], fill=color, width=1)
    for n in nodes:
        draw.ellipse((n[0] - 4, n[1] - 4, n[0] + 4, n[1] + 4),
                     fill=(*brand_color, 230))

def draw_logo_mark(draw, cx, cy, scale=1.0, color=BRAND):
    """Dibuja el logomark de Cognition: 5 nodos en pentágono con conexiones."""
    pts = [
        (cx - 18 * scale, cy - 22 * scale),
        (cx + 18 * scale, cy - 22 * scale),
        (cx, cy),
        (cx - 18 * scale, cy + 22 * scale),
        (cx + 18 * scale, cy + 22 * scale),
    ]
    edges = [(0, 2), (1, 2), (2, 3), (2, 4)]
    for a, b in edges:
        draw.line([pts[a], pts[b]], fill=color, width=max(2, int(2 * scale)))
    r = max(3, int(4 * scale))
    for p in pts:
        draw.ellipse((p[0] - r, p[1] - r, p[0] + r, p[1] + r), fill=color)

# ============ OG IMAGE 1200x630 ============
def make_og():
    W, H = 1200, 630
    img = base_gradient(W, H).convert("RGBA")
    # Glows en esquinas (lejos del texto)
    radial_gradient(img, int(W * 0.92), int(H * 0.10), int(W * 0.55), ACCENT, 0.26)
    radial_gradient(img, int(W * 0.08), int(H * 0.95), int(W * 0.50), BRAND, 0.20)

    draw = ImageDraw.Draw(img, "RGBA")

    # Red neuronal solo en zona derecha (no choca con texto izquierda)
    # Cluster derecho — entre x=780 y x=1160, y=60 y y=400
    nodes_right = [
        (820, 90), (980, 140), (1110, 80), (900, 240), (1060, 280),
        (820, 360), (1130, 360), (1000, 420), (880, 460)
    ]
    draw_neural_network(draw, nodes_right, ACCENT, 60)

    # Algunos puntos sueltos abajo a la izquierda (decorativos, no en zona texto)
    deco_left = [(120, 560), (60, 520), (200, 590)]
    for p in deco_left:
        draw.ellipse((p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3), fill=(*BRAND, 200))

    # Logo + nombre arriba izquierda
    draw_logo_mark(draw, 120, 95, scale=0.85, color=BRAND)
    f_brand = get_font(serif=True, size=40)
    draw.text((158, 75), "Cognition", fill=INK, font=f_brand)

    # Línea decorativa debajo del brand
    draw.line([(96, 145), (160, 145)], fill=(*BRAND, 160), width=2)

    # Headline grande (3 líneas, achicado a 72pt para que entre)
    f_h1 = get_font(serif=True, size=72)
    headline_y = 218
    line_gap = 92
    draw.text((96, headline_y),                "No te vendemos IA.",   fill=INK,   font=f_h1)
    draw.text((96, headline_y + line_gap),     "Te entregamos",        fill=INK,   font=f_h1)
    draw.text((96, headline_y + line_gap * 2), "resultados.",          fill=BRAND, font=f_h1)

    # Badges al pie con más spacing — texto blanco crema para máximo contraste
    f_badge = get_font(serif=False, size=18)
    badges = ["+200 ORGANIZACIONES", "15+ AÑOS", "ISO 27001", "IQNET"]
    x = 96
    badge_y = H - 56
    for b in badges:
        w = draw.textlength(b, font=f_badge)
        pad = 18
        draw.rounded_rectangle(
            (x, badge_y - 24, x + w + pad * 2, badge_y + 18),
            radius=22,
            outline=(*BRAND, 140),
            fill=(20, 30, 40, 220),
            width=2,
        )
        draw.text((x + pad, badge_y - 13), b, fill=INK, font=f_badge)
        x += w + pad * 2 + 12

    out = os.path.join(ROOT, "og-image.png")
    img.convert("RGB").save(out, "PNG", optimize=True)
    print("OK", out, img.size)

# ============ PWA ICONS ============
def make_icon(size, maskable_padding=0):
    img = Image.new("RGBA", (size, size), (*BG, 255))
    draw = ImageDraw.Draw(img, "RGBA")

    # Rounded background
    rounded = Image.new("L", (size, size), 0)
    rd = ImageDraw.Draw(rounded)
    radius = int(size * 0.22)
    rd.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    img.putalpha(rounded)

    # Logo mark centrado
    cx = size // 2
    cy = size // 2
    inner = size - maskable_padding * 2
    scale = inner / 100  # logo nominal de ~80px
    draw_logo_mark(draw, cx, cy, scale=scale, color=BRAND)

    return img

def make_pwa_icons():
    for s in [192, 512]:
        ic = make_icon(s, maskable_padding=int(s * 0.15))
        path = os.path.join(ROOT, f"icon-{s}.png")
        ic.save(path, "PNG", optimize=True)
        print("OK", path, ic.size)

def make_wordmarks():
    """Genera 6 wordmarks PNG profesionales para el logos-strip."""
    brands = [
        ("PROVINCIA · GOB", "serif", "italic"),
        ("Nucleo Bank",      "serif", "regular"),
        ("HELIOS PHARMA",    "sans",  "bold"),
        ("andes·logistics",  "sans",  "regular"),
        ("SaludPlus",        "serif", "regular"),
        ("ROTAR FINANCE",    "sans",  "bold"),
    ]
    for name, style, weight in brands:
        W, H = 480, 120
        img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        font_size = 56 if len(name) > 12 else 64
        if style == "serif":
            f = get_font(serif=True, size=font_size)
        else:
            f = get_font(serif=False, size=font_size)

        # Centramos
        bbox = draw.textbbox((0, 0), name, font=f)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (W - tw) // 2
        y = (H - th) // 2 - bbox[1]

        # Sombra sutil
        draw.text((x, y), name, fill=(255, 255, 255, 255), font=f)

        slug = name.lower().replace(" ", "-").replace("·", "").replace(".", "").strip("-")
        out = os.path.join(ROOT, "assets", "logos", f"{slug}.png")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        img.save(out, "PNG", optimize=True)
        print("OK", out)

if __name__ == "__main__":
    make_og()
    make_pwa_icons()
    make_wordmarks()
