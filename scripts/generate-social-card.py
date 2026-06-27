from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
WIDTH = 1200
HEIGHT = 630


def load_font(size, bold=False):
    names = (
        ("arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf")
        if bold
        else ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf")
    )

    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass

    return ImageFont.load_default()


def draw_text(draw, xy, text, font, fill, shadow=False):
    x, y = xy
    if shadow:
        draw.text((x + 3, y + 5), text, font=font, fill=(0, 0, 0, 110))
    draw.text((x, y), text, font=font, fill=fill)


def main():
    image = Image.new("RGBA", (WIDTH, HEIGHT), (5, 11, 20, 255))
    draw = ImageDraw.Draw(image)

    top = (10, 25, 43)
    bottom = (4, 8, 17)
    for y in range(HEIGHT):
        t = y / max(1, HEIGHT - 1)
        red = round(top[0] + (bottom[0] - top[0]) * t)
        green = round(top[1] + (bottom[1] - top[1]) * t)
        blue = round(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (WIDTH, y)], fill=(red, green, blue, 255))

    grid_color = (60, 160, 255, 12)
    for x in range(-80, WIDTH, 80):
        draw.line([(x, 0), (x + 260, HEIGHT)], fill=grid_color, width=1)
    for y in range(40, HEIGHT, 72):
        draw.line([(0, y), (WIDTH, y)], fill=(160, 60, 255, 10), width=1)

    draw.rectangle((56, 54, WIDTH - 56, HEIGHT - 54), outline=(60, 160, 255, 90), width=2)
    draw.rectangle((74, 72, WIDTH - 74, HEIGHT - 72), outline=(255, 255, 255, 20), width=1)

    icon = Image.open(PUBLIC / "app-icon-1024.png").convert("RGBA")
    icon = icon.resize((310, 310), Image.Resampling.LANCZOS)
    image.alpha_composite(icon, (790, 160))

    mono = load_font(25)
    title = load_font(76, bold=True)
    body = load_font(34)
    small = load_font(25)

    blue = (60, 160, 255, 255)
    white = (247, 248, 255, 255)
    muted = (178, 199, 220, 255)
    purple = (160, 60, 255, 255)

    draw_text(draw, (96, 116), "ACCESS NODE // DISCORD GUILD COUNT", mono, blue)
    draw_text(draw, (94, 165), "Discord", title, white, shadow=True)
    draw_text(draw, (94, 242), "Server Count", title, white, shadow=True)
    draw_text(draw, (98, 352), "Link Discord. Count your servers.", body, muted)
    draw_text(draw, (98, 397), "Wicked elaborate, I know.", body, muted)

    draw.rounded_rectangle((98, 498, 315, 544), radius=8, fill=(88, 101, 242, 255))
    draw_text(draw, (120, 507), "Discord OAuth", small, white)
    draw.rounded_rectangle((338, 498, 558, 544), radius=8, outline=blue, width=2)
    draw_text(draw, (361, 507), "by MarekCodex", small, white)
    draw.line((98, 570, 408, 570), fill=purple, width=4)

    image.convert("RGB").save(PUBLIC / "og-image.png", quality=95)


if __name__ == "__main__":
    main()
