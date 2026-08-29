with open('user_dashboard_temp.txt', 'r', encoding='utf-8') as f:
    content = f.read()

bad_string = """                            child: Container(
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),"""

good_string = """                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(color: Colors.red.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                SizedBox(width: 4),
                                Text('Delete', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600, fontSize: 13)),
                              ]),
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
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('⚠️ Confirm Delete'),
        content: const Text('This will permanently delete this listing.\\nAre you sure? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),"""

new_content = content.replace(bad_string, good_string)

with open('lib/screens/profile/user_dashboard_screen.dart', 'w', encoding='utf-8') as f:
    f.write(new_content)
