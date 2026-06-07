"""
Generate two looping MP4 videos for Omix How It Works page:
1. how_omix_works.mp4 — 3-step flow animation (Browse, Chat, Meet)
2. buy_sell_kericho.mp4 — Kericho marketplace animation

Both: 1920x1080, 60fps, ~8 second loop, H.264, under 5MB each
"""

import subprocess
import os
import math

BG = (15, 15, 16)
OMIX_RED = (255, 56, 92)
OMIX_WHITE = (245, 245, 245)
OMIX_DIM = (102, 102, 102)
OMIX_GREEN = (37, 211, 102)
OMIX_BLUE = (88, 196, 221)
OMIX_AMBER = (245, 158, 11)

VIDEO_W, VIDEO_H = 1920, 1080
FPS = 60
DURATION = 8  # seconds per loop
TOTAL_FRAMES = FPS * DURATION


def create_gradio_api_call(prompt, width, height, fps, duration):
    """Use Gradio/Spaces API for quick video generation without local GPU"""
    pass


def render_frame_pillow(draw_func, frame_num, total_frames):
    """Render a single frame using Pillow"""
    from PIL import Image, ImageDraw, ImageFont
    img = Image.new('RGB', (VIDEO_W, VIDEO_H), BG)
    draw = ImageDraw.Draw(img)
    draw_func(draw, frame_num, total_frames, img)
    return img


def lerp(a, b, t):
    """Linear interpolation"""
    return a + (b - a) * t


def ease_in_out(t):
    """Smooth easing function"""
    return t * t * (3 - 2 * t)


def ease_out_back(t):
    """Slight overshoot for bouncy feel"""
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=2):
    """Draw a rounded rectangle"""
    x0, y0, x1, y1 = xy
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    if x1 - x0 < 2 or y1 - y0 < 2:
        return  # skip degenerate rects
    if fill:
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)
    if outline:
        draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=outline, width=width)


def draw_text_centered(draw, text, y, font, color, x=None):
    """Draw horizontally centered text"""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = x or (VIDEO_W - tw) // 2
    draw.text((x, y), text, fill=color, font=font)


def get_font(size):
    """Load a font, fallback to default"""
    from PIL import ImageFont
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                continue
    return ImageFont.load_default()


def how_omix_works_draw(draw, frame, total, img):
    """Draw a single frame of the 'How Omix Works' animation"""
    from PIL import ImageFont
    import math as m

    t = frame / total  # 0.0 to 1.0
    cx = VIDEO_W // 2

    # ── Title ──
    font_title = get_font(52)
    font_label = get_font(28)
    font_desc = get_font(20)
    font_num = get_font(72)

    # Title fades in during first 15%
    title_alpha = min(1.0, t / 0.15) if t < 0.2 else (1.0 if t < 0.85 else max(0, 1 - (t - 0.85) / 0.15))
    title_y = int(80 + (1 - ease_in_out(title_alpha)) * (-30))
    if title_alpha > 0:
        title_col = tuple(int(lerp(BG[i], OMIX_WHITE[i], title_alpha)) for i in range(3))
        draw_text_centered(draw, "How Omix Works", title_y, font_title, title_col)

    # ── Cards ──
    card_w, card_h = 380, 260
    card_y = 220
    spacing = 440
    card_xs = [cx - spacing, cx, cx + spacing]

    steps = [
        {"num": "1", "label": "BROWSE", "desc": "Search listings by category", "accent": OMIX_BLUE},
        {"num": "2", "label": "CHAT", "desc": "Contact seller via WhatsApp", "accent": OMIX_GREEN},
        {"num": "3", "label": "MEET", "desc": "Pay safely via M-Pesa", "accent": OMIX_RED},
    ]

    # Cards appear one by one
    for i, step in enumerate(steps):
        appear_start = 0.15 + i * 0.1
        appear_end = appear_start + 0.12
        if t < appear_start:
            appear_t = 0
        elif t < appear_end:
            appear_t = ease_out_back((t - appear_start) / (appear_end - appear_start))
        else:
            appear_t = 1.0

        if appear_t <= 0:
            continue

        bx = card_xs[i]
        by = card_y

        # Card shadow/shimmer
        shimmer_offset = int(m.sin(t * m.pi * 2 + i * 2) * 3)

        # Card background
        card_bg = tuple(int(lerp(BG[i], 25, appear_t)) for i in range(3))
        card_outline = tuple(int(lerp(BG[i], step["accent"][i], appear_t * 0.6)) for i in range(3))

        # Scale from center
        sw = max(2, int(card_w * appear_t))
        sh = max(2, int(card_h * appear_t))
        sx = bx - sw // 2
        sy = by + card_h // 2 - sh // 2

        # Draw card
        draw_rounded_rect(draw, [sx, sy, sx + sw, sy + sh], 16, fill=card_bg, outline=card_outline, width=2)

        # Accent bar at top
        if sw > 20:
            bar_h = 6
            bar_color = tuple(int(lerp(BG[i], step["accent"][i], appear_t)) for i in range(3))
            draw_rounded_rect(draw, [sx + 10, sy + 12, sx + sw - 10, sy + 12 + bar_h], 3, fill=bar_color)

        if appear_t > 0.5 and sw > 100:
            # Step number
            num_y = sy + 35
            num_col = tuple(int(lerp(BG[i], step["accent"][i], appear_t)) for i in range(3))
            draw_text_centered(draw, step["num"], num_y, font_num, num_col, x=bx)

            # Label
            label_y = sy + 120
            lbl_col = tuple(int(lerp(BG[i], OMIX_WHITE[i], appear_t)) for i in range(3))
            draw_text_centered(draw, step["label"], label_y, font_label, lbl_col, x=bx)

            # Desc
            desc_y = sy + 160
            desc_col = tuple(int(lerp(BG[i], OMIX_DIM[i], appear_t)) for i in range(3))
            draw_text_centered(draw, step["desc"], desc_y, font_desc, desc_col, x=bx)

    # ── Arrows between cards ──
    arrow_start = 0.45
    if t > arrow_start:
        arrow_t = min(1.0, (t - arrow_start) / 0.1)
        arrow_col = tuple(int(lerp(BG[i], OMIX_DIM[i], arrow_t)) for i in range(3))
        for i in range(2):
            ax = card_xs[i] + card_w // 2 + 10
            ay = card_y + card_h // 2
            bx2 = card_xs[i + 1] - card_w // 2 - 10
            # Arrow line
            draw.line([(ax, ay), (int(lerp(ax, bx2, arrow_t)), ay)], fill=arrow_col, width=3)
            # Arrow head
            if arrow_t > 0.5:
                head_x = bx2 - 15
                draw.polygon([(bx2, ay), (head_x, ay - 8), (head_x, ay + 8)], fill=arrow_col)

    # ── Pulse highlight on active card ──
    pulse_phase = (t * 3) % 3  # cycles through 3 cards
    active_card = int(pulse_phase)
    pulse_t = m.sin(pulse_phase % 1 * m.pi)
    if pulse_t > 0.7 and t > 0.5:
        idx = min(active_card, 2)
        bx = card_xs[idx]
        glow_alpha = (pulse_t - 0.7) / 0.3
        glow_col = tuple(int(lerp(OMIX_DIM[i], steps[idx]["accent"][i], glow_alpha * 0.5)) for i in range(3))
        draw_rounded_rect(draw, [bx - card_w // 2 - 4, card_y - 4, bx + card_w // 2 + 4, card_y + card_h + 4], 18, outline=glow_col, width=3)

    # ── Bottom tagline ──
    tag_start = 0.55
    if t > tag_start:
        tag_t = ease_in_out(min(1.0, (t - tag_start) / 0.12))
        tag_col = tuple(int(lerp(BG[i], OMIX_DIM[i], tag_t)) for i in range(3))
        font_tag = get_font(22)
        draw_text_centered(draw, "Simple. Local. Free.", VIDEO_H - 140, font_tag, tag_col)

    # ── Omix watermark ──
    font_watermark = get_font(16)
    wm_col = tuple(int(lerp(BG[i], 40, 1)) for i in range(3))
    draw_text_centered(draw, "omix.co.ke", VIDEO_H - 50, font_watermark, wm_col)


def buy_sell_kericho_draw(draw, frame, total, img):
    """Draw a single frame of the 'Buy & Sell in Kericho' animation"""
    from PIL import ImageFont
    import math as m

    t = frame / total
    cx, cy = VIDEO_W // 2, VIDEO_H // 2 + 20

    # ── Title ──
    font_title = get_font(48)
    font_sub = get_font(24)
    font_stat_val = get_font(44)
    font_stat_lbl = get_font(18)
    font_cat = get_font(22)

    # Title animation
    title_t = ease_in_out(min(1.0, t / 0.12)) if t < 0.2 else 1.0
    title_y = int(70 + (1 - title_t) * (-30))
    title_col = tuple(int(lerp(BG[i], OMIX_WHITE[i], title_t)) for i in range(3))
    draw_text_centered(draw, "Buy & Sell in Kericho", title_y, font_title, title_col)

    if t > 0.08:
        sub_t = ease_in_out(min(1.0, (t - 0.08) / 0.1))
        sub_col = tuple(int(lerp(BG[i], OMIX_DIM[i], sub_t)) for i in range(3))
        draw_text_centered(draw, "Your local marketplace", title_y + 65, font_sub, sub_col)

    # ── Location pin (center) ──
    pin_t = ease_out_back(min(1.0, t / 0.2)) if t < 0.3 else 1.0
    pin_scale = pin_t
    pin_cx, pin_cy = cx, cy - 40

    if pin_scale > 0:
        # Outer circle
        r = int(30 * pin_scale)
        pin_col = tuple(int(lerp(BG[i], OMIX_RED[i], pin_t)) for i in range(3))
        draw.ellipse([pin_cx - r, pin_cy - r, pin_cx + r, pin_cy + r], fill=pin_col)
        # Inner white dot
        ir = int(10 * pin_scale)
        draw.ellipse([pin_cx - ir, pin_cy - ir, pin_cx + ir, pin_cy + ir], fill=OMIX_WHITE)
        # Triangle below pin
        tri_h = int(20 * pin_scale)
        draw.polygon([
            (pin_cx - int(18 * pin_scale), pin_cy + r - 2),
            (pin_cx + int(18 * pin_scale), pin_cy + r - 2),
            (pin_cx, pin_cy + r + tri_h),
        ], fill=pin_col)

    # ── Kericho text ──
    if t > 0.15:
        kc_t = ease_in_out(min(1.0, (t - 0.15) / 0.1))
        kc_y = pin_cy + 70
        kc_col = tuple(int(lerp(BG[i], OMIX_WHITE[i], kc_t)) for i in range(3))
        font_kc = get_font(30)
        draw_text_centered(draw, "Kericho, Kenya", kc_y, font_kc, kc_col)

    # ── Category dots orbiting ──
    categories = [
        {"label": "Electronics", "color": OMIX_BLUE, "angle_offset": 150},
        {"label": "Furniture", "color": OMIX_AMBER, "angle_offset": 30},
        {"label": "Clothing", "color": OMIX_GREEN, "angle_offset": 210},
        {"label": "Services", "color": OMIX_RED, "angle_offset": 330},
    ]

    orbit_r = 280
    for i, cat in enumerate(categories):
        cat_delay = 0.25 + i * 0.08
        if t < cat_delay:
            continue
        cat_t = ease_out_back(min(1.0, (t - cat_delay) / 0.15))

        angle = m.radians(cat["angle_offset"] + t * 20)  # slow rotation
        dx = int(m.cos(angle) * orbit_r * cat_t)
        dy = int(m.sin(angle) * orbit_r * cat_t * 0.6)  # ellipse

        dot_x = pin_cx + dx
        dot_y = pin_cy + dy
        dot_r = int(8 * cat_t)

        cat_col = tuple(int(lerp(BG[i], cat["color"][i], cat_t)) for i in range(3))

        # Dashed line to center
        if cat_t > 0.3:
            mid_x = pin_cx + dx // 2
            mid_y = pin_cy + dy // 2
            line_col = tuple(int(lerp(BG[i], cat["color"][i], cat_t * 0.3)) for i in range(3))
            # Draw dashed line
            segments = 8
            for s in range(segments):
                if s % 2 == 0:
                    sx = int(lerp(pin_cx, dot_x, s / segments))
                    sy = int(lerp(pin_cy, dot_y, s / segments))
                    ex = int(lerp(pin_cx, dot_y, (s + 1) / segments))
                    ey = int(lerp(pin_cy, dot_y, (s + 1) / segments))
                    draw.line([(sx, sy), (lerp(pin_cx, dot_x, (s + 1) / segments), lerp(pin_cy, dot_y, (s + 1) / segments))], fill=line_col, width=1)

            # Recalculate for circle
            pass

        # Draw dot
        draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=cat_col)

        # Label near dot
        if cat_t > 0.5:
            lbl_col = tuple(int(lerp(BG[i], cat["color"][i], cat_t)) for i in range(3))
            draw_text_centered(draw, cat["label"], dot_y + dot_r + 8, font_cat, lbl_col, x=dot_x)

    # ── Pin pulse ──
    pulse = m.sin(t * m.pi * 4) * 0.08 + 1.0
    if t > 0.3:
        r_pulse = int(40 * pulse)
        pulse_col = tuple(int(lerp(BG[i], OMIX_RED[i], 0.15)) for i in range(3))
        draw.ellipse([pin_cx - r_pulse, pin_cy - r_pulse, pin_cx + r_pulse, pin_cy + r_pulse], outline=pulse_col, width=2)

    # ── Stats bar at bottom ──
    stats_y = VIDEO_H - 160
    stats = [
        {"value": "FREE", "label": "to list", "color": OMIX_GREEN},
        {"value": "24H", "label": "response", "color": OMIX_BLUE},
        {"value": "100%", "label": "local", "color": OMIX_RED},
    ]

    # Divider
    if t > 0.4:
        div_t = ease_in_out(min(1.0, (t - 0.4) / 0.1))
        div_col = tuple(int(lerp(BG[i], 30, div_t)) for i in range(3))
        draw.line([(200, stats_y - 30), (VIDEO_W - 200, stats_y - 30)], fill=div_col, width=1)

    stat_spacing = 400
    stat_xs = [cx - stat_spacing, cx, cx + stat_spacing]
    for i, stat in enumerate(stats):
        st_delay = 0.45 + i * 0.08
        if t < st_delay:
            continue
        st_t = ease_out_back(min(1.0, (t - st_delay) / 0.12))
        st_col = tuple(int(lerp(BG[i], stat["color"][i], st_t)) for i in range(3))
        draw_text_centered(draw, stat["value"], stats_y, font_stat_val, st_col, x=stat_xs[i])
        lbl_col = tuple(int(lerp(BG[i], OMIX_DIM[i], st_t)) for i in range(3))
        draw_text_centered(draw, stat["label"], stats_y + 55, font_stat_lbl, lbl_col, x=stat_xs[i])


def generate_video(draw_func, output_path, duration=DURATION):
    """Generate video frames and encode with FFmpeg"""
    from PIL import Image, ImageDraw
    import tempfile

    total_frames = FPS * duration
    print(f"Rendering {total_frames} frames at {FPS}fps ({duration}s)...")

    # Create temp directory for frames
    tmpdir = tempfile.mkdtemp(prefix='omix_video_')
    print(f"Frames dir: {tmpdir}")

    for frame_num in range(total_frames):
        if frame_num % 30 == 0:
            print(f"  Frame {frame_num}/{total_frames} ({100 * frame_num // total_frames}%)")

        img = Image.new('RGB', (VIDEO_W, VIDEO_H), BG)
        draw = ImageDraw.Draw(img)

        draw_func(draw, frame_num, total_frames, img)

        frame_path = os.path.join(tmpdir, f'frame_{frame_num:05d}.png')
        img.save(frame_path, 'PNG')

    # Encode with FFmpeg
    print("Encoding with FFmpeg...")
    cmd = [
        'ffmpeg', '-y',
        '-framerate', str(FPS),
        '-i', os.path.join(tmpdir, 'frame_%05d.png'),
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-vf', 'format=yuv420p',
        output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}")
        raise RuntimeError("FFmpeg encoding failed")

    # Cleanup temp frames
    import shutil
    shutil.rmtree(tmpdir)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Done: {output_path} ({size_mb:.1f}MB)")


if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'videos')
    os.makedirs(out_dir, exist_ok=True)

    print("=" * 60)
    print("Video 1: How Omix Works")
    print("=" * 60)
    generate_video(how_omix_works_draw, os.path.join(out_dir, 'how_omix_works.mp4'))

    print()
    print("=" * 60)
    print("Video 2: Buy & Sell in Kericho")
    print("=" * 60)
    generate_video(buy_sell_kericho_draw, os.path.join(out_dir, 'buy_sell_kericho.mp4'))

    print()
    print("All videos generated successfully!")
