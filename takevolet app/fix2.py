import re

with open('lib/screens/profile/user_dashboard_screen.dart', 'r', encoding='utf-8') as f:
    content = f.read()

bad_pattern = re.compile(r"                              \]\),\s+builder: \(ctx\) => AlertDialog\(", re.MULTILINE)

good_string = """                              ]),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─── TOGGLE STATUS ─────────────────────────────
  Future<void> _toggleStatus(String table, int index, dynamic id, bool newValue) async {
    setState(() {
      if (table == 'rooms') _rooms[index] = {..._rooms[index], 'is_available': newValue};
      if (table == 'flatmates') _flatmates[index] = {..._flatmates[index], 'is_available': newValue};
      if (table == 'property_sales') _flats[index] = {..._flats[index], 'is_available': newValue};
    });
    try {
      await _adminClient.from(table).update({'is_available': newValue}).eq('id', id);
    } catch (e) {
      setState(() {
        if (table == 'rooms') _rooms[index] = {..._rooms[index], 'is_available': !newValue};
        if (table == 'flatmates') _flatmates[index] = {..._flatmates[index], 'is_available': !newValue};
        if (table == 'property_sales') _flats[index] = {..._flats[index], 'is_available': !newValue};
      });
    }
  }

  // ─── EDIT ───────────────────────────────────────────────────────
  Future<void> _editItem(BuildContext context, String table, Map<String, dynamic> item) async {
    Widget? targetScreen;
    if (table == 'rooms') targetScreen = AddRoomScreen(initialData: item);
    else if (table == 'flatmates') targetScreen = AddFlatmateScreen(initialData: item);
    else if (table == 'items') targetScreen = AddItemScreen(initialData: item);
    else if (table == 'property_sales') targetScreen = AddPropertySaleScreen(initialData: item);
    else if (table == 'build_listings') targetScreen = AddBuildListingScreen(initialData: item);

    if (targetScreen != null) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => targetScreen!));
      _loadAll(); // Reload after edit
    }
  }

  // ─── DELETE (with confirmation) ─────────────────────────────────
  Future<void> _deleteItem(BuildContext context, String table, dynamic id, int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog("""

new_content = bad_pattern.sub(good_string, content)

with open('lib/screens/profile/user_dashboard_screen.dart', 'w', encoding='utf-8') as f:
    f.write(new_content)
