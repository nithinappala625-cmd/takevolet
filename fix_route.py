import re

with open("src/app/api/admin/data/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix the Promise.all array destructuring
c = re.sub(
    r"const \[payoutsRes, interestsRes, handoversRes, profilesRes, roomsRes, flatmatesRes, contactUnlocksRes, flatmateUnlocksRes, propertySalesRes, buildListingsRes\] = await Promise\.all\(\[",
    "const [payoutsRes, interestsRes, handoversRes, profilesRes, roomsRes, flatmatesRes, contactUnlocksRes, flatmateUnlocksRes, propertySalesRes, buildListingsRes, bookingsRes] = await Promise.all([",
    c
)

c = re.sub(
    r"const bookings      = .*;",
    "const bookings      = bookingsRes?.data || [];",
    c
)

c = re.sub(
    r"    buildListings,\n    unlocks: combinedUnlocks,\n  }\);\n}",
    "    buildListings,\n    bookings,\n    unlocks: combinedUnlocks,\n  });\n}",
    c
)

with open("src/app/api/admin/data/route.ts", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed route.ts")
