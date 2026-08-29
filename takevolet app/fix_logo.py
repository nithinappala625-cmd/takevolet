from PIL import Image

img = Image.open('C:\\homies rentals\\roomrelay\\takevolet app\\takevolet new logo\\newlogo.jpg').convert('RGB')
pixels = img.load()
w, h = img.size

# Find the background color from top-middle
center_color = pixels[w//2, 10]

for x in range(w):
    for y in range(h):
        r, g, b = pixels[x, y]
        # If it's close to white
        if r > 230 and g > 230 and b > 230:
            pixels[x, y] = center_color

img.save('C:\\homies rentals\\roomrelay\\takevolet app\\assets\\images\\tvl_logo_solid.jpg')
