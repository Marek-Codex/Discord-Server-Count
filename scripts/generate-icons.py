from pathlib import Path

from PIL import Image, ImageDraw

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


def point_scale(canvas_size):
    return canvas_size / 64


def render_icon(size):
    factor = 4
    canvas = size * factor
    scale = point_scale(canvas)
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))

    def scaled(point):
        return tuple(round(value * scale) for value in point)

    def polygon(draw, points, fill):
        draw.polygon([scaled(point) for point in points], fill=fill)

    def line(draw, points, fill, width):
        draw.line(
            [scaled(point) for point in points],
            fill=fill,
            width=round(width * scale),
            joint="curve",
        )

    outer = [(32, 5), (56, 19), (56, 45), (32, 59), (8, 45), (8, 19)]
    inner = [(32, 13), (49, 23), (49, 41), (32, 51), (15, 41), (15, 23)]

    mask = Image.new("L", image.size, 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.polygon([scaled(point) for point in outer], fill=255)

    gradient = Image.new("RGBA", image.size, (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    start = (0x3C, 0xA0, 0xFF)
    end = (0xA0, 0x3C, 0xFF)
    width, height = image.size

    for y in range(height):
        t = y / max(1, height - 1)
        red = round(start[0] + (end[0] - start[0]) * t)
        green = round(start[1] + (end[1] - start[1]) * t)
        blue = round(start[2] + (end[2] - start[2]) * t)
        gradient_draw.line([(0, y), (width, y)], fill=(red, green, blue, 255))

    image = Image.composite(gradient, image, mask)
    draw = ImageDraw.Draw(image)

    polygon(draw, inner, (7, 17, 28, 222))
    line(draw, [(32, 5), (56, 19), (56, 45)], (255, 255, 255, 58), 1.2)
    line(draw, [(8, 19), (8, 45), (32, 59)], (0, 0, 0, 76), 1.6)

    white = (247, 248, 255, 246)
    line(draw, [(10, 24), (10, 10), (24, 10)], white, 4)
    line(draw, [(54, 40), (54, 54), (40, 54)], white, 4)

    draw.ellipse([scaled((24, 24)), scaled((40, 40))], fill=(88, 101, 242, 255))
    line(draw, [(19, 32), (28, 32)], white, 4)
    line(draw, [(36, 32), (45, 32)], white, 4)
    line(draw, [(32, 19), (32, 28)], white, 4)
    line(draw, [(32, 36), (32, 45)], white, 4)
    line(draw, [(19, 23), (30, 17), (43, 24)], (255, 255, 255, 38), 1.5)

    return image.resize((size, size), Image.Resampling.LANCZOS)


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
