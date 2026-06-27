from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUTS = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "favicon-48x48.png": 48,
    "favicon-180x180.png": 180,
    "favicon.png": 256,
    "app-icon-1024.png": 1024,
}


def load_font(size):
    for font_name in ("arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(font_name, size)
        except OSError:
            pass

    return ImageFont.load_default()


def scaled_points(points, scale):
    return [(round(x * scale), round(y * scale)) for x, y in points]


def draw_line(draw, points, scale, fill, width):
    draw.line(
        scaled_points(points, scale),
        fill=fill,
        width=max(1, round(width * scale)),
        joint="curve",
    )


def gradient_hex(size, scale, points):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(scaled_points(points, scale), fill=255)

    gradient = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(gradient)
    top = (0x3C, 0xA0, 0xFF)
    bottom = (0xA0, 0x3C, 0xFF)

    for y in range(size):
        t = y / max(1, size - 1)
        red = round(top[0] + (bottom[0] - top[0]) * t)
        green = round(top[1] + (bottom[1] - top[1]) * t)
        blue = round(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (size, y)], fill=(red, green, blue, 255))

    return Image.composite(gradient, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask)


def draw_centered_text(draw, text, center, font, fill, shadow):
    bbox = draw.textbbox((0, 0), text, font=font, stroke_width=0)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = center[0] - text_width / 2 - bbox[0]
    y = center[1] - text_height / 2 - bbox[1]

    draw.text((x + shadow[0], y + shadow[1]), text, font=font, fill=(0, 0, 0, 150))
    draw.text((x, y), text, font=font, fill=fill)


def render_icon(output_size):
    factor = 4
    canvas = output_size * factor
    scale = canvas / 256
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))

    outer = [(128, 15), (228, 73), (228, 183), (128, 241), (28, 183), (28, 73)]
    inner = [(128, 43), (202, 86), (202, 170), (128, 213), (54, 170), (54, 86)]

    image.alpha_composite(gradient_hex(canvas, scale, outer))
    draw = ImageDraw.Draw(image)

    draw.polygon(scaled_points(inner, scale), fill=(7, 17, 28, 246))
    draw_line(draw, inner + [inner[0]], scale, (60, 160, 255, 255), 10)

    draw_line(draw, [(128, 15), (228, 73), (228, 183)], scale, (255, 255, 255, 54), 2)
    draw_line(draw, [(28, 73), (28, 183), (128, 241)], scale, (0, 0, 0, 82), 2)

    white = (247, 248, 255, 246)
    draw_line(draw, [(39, 85), (39, 43), (82, 43)], scale, white, 6)
    draw_line(draw, [(217, 171), (217, 213), (174, 213)], scale, white, 6)

    font = load_font(round(68 * scale))
    draw_centered_text(
        draw,
        "SC",
        (round(128 * scale), round(132 * scale)),
        font,
        (247, 248, 255, 255),
        (round(3 * scale), round(4 * scale)),
    )

    return image.resize((output_size, output_size), Image.Resampling.LANCZOS)


def main():
    PUBLIC.mkdir(exist_ok=True)
    rendered = {}

    for filename, size in OUTPUTS.items():
        icon = render_icon(size)
        rendered[size] = icon
        icon.save(PUBLIC / filename)

    rendered[256].save(
        PUBLIC / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (256, 256)],
    )


if __name__ == "__main__":
    main()
