import re

with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Replace any className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none" followed by whitespace and <optgroup
pattern = r'(className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none")(\s*<optgroup)'
c = re.sub(pattern, r'\1>\2', c)

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
