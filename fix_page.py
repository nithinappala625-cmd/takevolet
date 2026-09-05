import re

with open("src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Add bookings tab to Tab type
c = c.replace(
    'type Tab = "overview" | "payouts" | "unlocks" | "interests" | "handovers" | "users" | "rooms" | "flatmates" | "property_sales" | "build_listings" | "form_builder";',
    'type Tab = "overview" | "payouts" | "unlocks" | "interests" | "handovers" | "users" | "rooms" | "flatmates" | "property_sales" | "build_listings" | "bookings" | "form_builder";'
)

# Add state
if "const [localBookings, setLocalBookings]" not in c:
    c = c.replace(
        "const [localBuildListings, setLocalBuildListings] = useState<any[]>([]);",
        "const [localBuildListings, setLocalBuildListings] = useState<any[]>([]);\n  const [localBookings, setLocalBookings] = useState<any[]>([]);"
    )

# Add to useEffect
if "setLocalBookings(data.bookings || []);" not in c:
    c = c.replace(
        "setLocalBuildListings(data.buildListings || []);",
        "setLocalBuildListings(data.buildListings || []);\n      setLocalBookings(data.bookings || []);"
    )

# Add to tab bar array
c = c.replace(
    '["overview", "payouts", "unlocks", "interests", "handovers", "users", "rooms", "flatmates", "property_sales", "build_listings", "form_builder"] as Tab[]',
    '["overview", "payouts", "unlocks", "interests", "handovers", "users", "rooms", "flatmates", "property_sales", "build_listings", "bookings", "form_builder"] as Tab[]'
)

# Add tab label
c = c.replace(
    'tab === "build_listings" ? `build (${localBuildListings.length})`',
    'tab === "build_listings" ? `build (${localBuildListings.length})`\n                  : tab === "bookings" ? `bookings (${localBookings.length})`'
)

# Add Bookings Tab Content
bookings_content = """
          {/* ── BOOKINGS TAB ── */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Booking CRM</h2>
                  <p className="text-sm text-muted-foreground">Manage service and material bookings.</p>
                </div>
              </div>
              
              {localBookings.length === 0 ? (
                <div className="text-center py-20 border border-dashed rounded-lg text-muted-foreground">No bookings found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {localBookings.map((bk: any) => (
                    <div key={bk.id} className="bg-background border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-primary/30 transition-all">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{bk.status || 'PENDING'}</span>
                          <h3 className="font-bold text-lg">{bk.build_listings?.title || 'Unknown Listing'} <span className="text-muted-foreground font-normal text-sm">({bk.build_listings?.display_id})</span></h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Customer Details</p>
                            <p className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground"/> {bk.profiles?.full_name || 'Anonymous'}</p>
                            <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground"/> {bk.profiles?.phone || 'No Phone'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Booking Info</p>
                            <p className="text-sm"><strong>Method:</strong> {bk.payment_method}</p>
                            <p className="text-sm"><strong>Date:</strong> {new Date(bk.created_at).toLocaleString()}</p>
                          </div>
                        </div>

                        {bk.booking_data && Object.keys(bk.booking_data).length > 0 && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Dynamic Form Data</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(bk.booking_data).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span> 
                                  <span className="ml-2 font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition-colors">
                          Confirm
                        </button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FORM BUILDER TAB ── */}
"""

if "{/* ── BOOKINGS TAB ── */}" not in c:
    c = c.replace("{/* ── FORM BUILDER TAB ── */}", bookings_content)

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("Added bookings tab.")
