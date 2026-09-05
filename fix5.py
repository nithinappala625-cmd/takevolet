import io

with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace('className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none"\n                      <optgroup label="Build - People & Services">', 'className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none">\n                      <optgroup label="Build - People & Services">')

# Also handle CRLF just in case
c = c.replace('className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none"\r\n                      <optgroup label="Build - People & Services">', 'className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none">\r\n                      <optgroup label="Build - People & Services">')

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
