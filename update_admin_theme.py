import re
import sys

file_path = "c:/homies rentals/roomrelay/src/app/admin/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace background colors
content = content.replace('bg-background', 'bg-[#14171C]')
content = content.replace('bg-foreground', 'bg-white')
content = content.replace('text-foreground', 'text-white')
content = content.replace('text-background', 'text-[#0A0C10]')
content = content.replace('border-border', 'border-[#2A2E39]')
content = content.replace('bg-secondary/30', 'bg-white/5')
content = content.replace('bg-secondary/20', 'bg-[#0A0C10]')
content = content.replace('bg-secondary/10', 'bg-white/5')
content = content.replace('hover:bg-secondary/10', 'hover:bg-white/5')
content = content.replace('bg-secondary', 'bg-[#2A2E39]')
content = content.replace('border-dashed', 'border-dashed border-gray-600')
content = content.replace('text-muted-foreground', 'text-gray-400')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated theme classes in admin/page.tsx")
