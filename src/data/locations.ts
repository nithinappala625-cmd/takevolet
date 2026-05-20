// Comprehensive Hyderabad locations — major areas + smaller sub-areas

export const HYDERABAD_AREAS = [
  // IT Corridor
  "Madhapur",
  "Hitech City",
  "Gachibowli",
  "Kondapur",
  "Kothaguda",
  "Nanakramguda",
  "Financial District",
  "Raidurg",
  "Manikonda",
  "Narsingi",
  "Kokapet",
  "Tellapur",
  
  // Central / Student & Bachelor Hubs
  "SR Nagar",
  "Ameerpet",
  "Panjagutta",
  "Begumpet",
  "Somajiguda",
  "Sanjeeva Reddy Nagar",
  "Erragadda",
  "Balkampet",
  "Yousufguda",
  "Vengal Rao Nagar",
  "Rajbhavan Road",
  
  // Kukatpally Belt
  "Kukatpally",
  "KPHB Colony",
  "Miyapur",
  "Hafeezpet",
  "Chandanagar",
  "Nizampet",
  "Bachupally",
  "Pragathi Nagar",
  "Nallagandla",
  "Serilingampally",
  "Allwyn Colony",
  "Moosapet",
  
  // Uppal / LB Nagar Belt
  "Uppal",
  "Nacharam",
  "Habsiguda",
  "Tarnaka",
  "Malkajgiri",
  "LB Nagar",
  "Dilsukhnagar",
  "Kothapet",
  "Nagole",
  "Boduppal",
  "Peerzadiguda",
  "Medipally",
  
  // Secunderabad
  "Secunderabad",
  "Kompally",
  "Alwal",
  "Trimulgherry",
  "Bowenpally",
  "Tirmalgiri",
  "Sainikpuri",
  "AS Rao Nagar",
  "ECIL",
  "Kapra",
  
  // Old City / South
  "Mehdipatnam",
  "Tolichowki",
  "Attapur",
  "Rajendra Nagar",
  "Shamshabad",
  "Banjara Hills",
  "Jubilee Hills",
  "Film Nagar",
  "Road No. 36",
  "Masab Tank",
  "Nampally",
  "Abids",
  "Lakdikapul",
  
  // Other
  "Chikkadpally",
  "Himayath Nagar",
  "Narayanguda",
  "Musheerabad",
  "RTC X Roads",
  "Vidya Nagar",
  "Balanagar",
  "Jeedimetla",
  "Medchal",
  "Shamirpet",
];

// ─── For dropdowns (profile complete + post room forms) ───────────────────────
export const LOCATIONS: { value: string; label: string }[] = [...new Set(HYDERABAD_AREAS)]
  .sort((a, b) => a.localeCompare(b))
  .map(area => ({
    value: area,
    label: area
  }));


const COLONIES_MAP: Record<string, string[]> = {
  "Madhapur":           ["Madhapur Main Rd", "Kavuri Hills", "Ayyappa Society", "Vittal Rao Nagar", "Jubilee Enclave", "Silicon Valley"],
  "Hitech City":        ["Hitech City Metro", "Cyber Towers Colony", "L&T Infocity", "Mindspace Area", "Phases 1 & 2"],
  "Gachibowli":         ["Gachibowli Village", "Botanical Garden Rd", "DLF Cybercity", "Indira Nagar", "Telecom Nagar"],
  "Nanakramguda":       ["Financial District Rd", "Nanakramguda Village", "Wipro Circle Area", "One West Area"],
  "Kondapur":           ["Kondapur Main Rd", "Laxmi Nagar", "Surya Nagar", "Sri Ram Nagar", "Prashant Hills", "Raghavendra Colony"],
  "Kukatpally":         ["KPHB Phase 1", "KPHB Phase 2", "KPHB Phase 3", "KPHB Phase 4", "Moosapet", "Balanagar", "Vivekananda Nagar"],
  "Banjara Hills":      ["Road No 1", "Road No 2", "Road No 3", "Road No 10", "Road No 12", "Road No 14", "Mithila Nagar"],
  "Jubilee Hills":      ["Check Post", "Road No 36", "Road No 45", "Road No 78", "Film Nagar", "Madina Colony"],
  "Ameerpet":           ["Ameerpet Metro", "Maitrivanam", "Satyam Theatre Rd", "Dharam Karan Rd", "Aditya Enclave", "Greenlands"],
  "SR Nagar":           ["SR Nagar Metro", "Sanjeeva Reddy Nagar", "BK Guda", "Umesh Chandra Statue", "Community Hall", "Erragadda"],
  "Yousufguda":         ["Yousufguda Basti", "Krishna Nagar", "Madhura Nagar", "Jawahar Nagar", "Sriram Nagar", "Moti Nagar"],
  "Begumpet":           ["Prakash Nagar", "Ramnagar", "SD Road", "Chilkalguda", "Clock Tower", "Mayur Marg"],
  "Somajiguda":         ["Rajbhavan Road", "Padmarao Nagar", "Saifabad", "Lakdikapool", "Khairatabad", "Yashoda Hospital Rd"],
  "Secunderabad":       ["MG Road", "Paradise", "Trimulgherry", "Karkhana", "Bowenpally", "East Marredpally", "West Marredpally"],
  "Uppal":              ["Uppal Ring Road", "Nacharam", "Ramanthapur", "Mallapur", "Ghatkesar"],
  "Habsiguda":          ["Habsiguda Street No 8", "Street No 1", "Kakatiya Nagar", "Ravindra Nagar"],
  "Tarnaka":            ["Tarnaka Metro", "Osmania University Rd", "Kimtee Colony", "Vijayapuri Colony"],
  "LB Nagar":           ["Saroor Nagar", "Champapet", "Mansoorabad", "Chaitanyapuri", "Kothapet"],
  "Dilsukhnagar":       ["Malakpet", "Moosarambagh", "Tilak Nagar", "Keshavnagar", "Pillar No 147"],
  "Himayatnagar":       ["Narayanguda", "Basheerbagh", "Nallakunta", "Vidyanagar", "Musheerabad", "RTC X Roads"],
  "Panjagutta":         ["Nagarjuna Hills", "Punjagutta Circle", "Dwarakapuri Colony", "Model House Lane"],
  "Mehdipatnam":        ["Mehdipatnam Bus Depot", "Rethibowli", "Langar House", "Masab Tank", "Pillar No 20"],
  "Tolichowki":         ["Shaikpet", "Masab Tank", "Nizam Colony", "Meridian School Rd"],
  "Attapur":            ["Rajendranagar", "Kishanbagh", "Shamshabad Road", "Golconda", "Nanalnagar"],
  "Miyapur":            ["Hafeezpet", "Bharat Nagar", "BHEL Township", "Miyapur Metro Stn"],
  "Chandanagar":        ["Chandanagar Station Rd", "Deepti Sri Nagar", "Gangaram", "HUDA Colony"],
  "Nallagandla":        ["Nallagandla Bypass Rd", "Aparna Sarovar Area", "Citizen Hospital Rd", "HUDA Layout"],
  "Tellapur":           ["Tellapur Road", "Visions Villa Area", "Radha Krishna Colony"],
  "Nizampet":           ["Nizampet Road", "Pragati Nagar Rd", "Kolanu Narayana Reddy Colony"],
  "Bachupally":         ["Bachupally X Roads", "Bollaram", "IDA Bollaram", "Bhagyanagar Colony"],
  "Pragathi Nagar":     ["Pragathi Nagar Lake Rd", "Kakatiya Hills", "Mithila Nagar"],
  "Kompally":           ["Quthbullapur", "Jeedimetla", "Dundigal", "IDA Jeedimetla", "Suchitra Circle"],
  "Alwal":              ["Malkajgiri", "Neredmet", "Tarnaka", "Yapral"],
  "Malkajgiri":         ["Safilguda", "Anandbagh", "Vimal Theatre Rd", "Gautham Nagar"],
  "Sainikpuri":         ["AS Rao Nagar", "Kapra", "ECIL", "Kushaiguda"],
  "Manikonda":          ["Puppalaguda", "Narsingi", "Kokapet", "Gandipet", "Gowlidoddi"],
  "Puppalaguda":        ["Alkapur Township", "Puppalaguda Main Rd", "Golden Temple Rd"],
  "Narsingi":           ["Narsingi Junction", "Outer Ring Road Area", "Gandipet Rd"],
  "Kokapet":            ["Kokapet SEZ", "Golden Mile Layout", "Kokapet Village"],
  "Financial District": ["Nanakramguda", "Khajaguda", "Raidurgam", "Radial Road No 3"],
  "Boduppal":           ["Peerzadiguda", "Nagaram", "Medipally", "Pocharam"],
  "Hayathnagar":        ["Vanasthalipuram", "Saroornagar", "Meerpet", "Nagole", "LB Nagar Extension"],
};

export function getColonies(location: string): string[] {
  if (COLONIES_MAP[location]) {
    return COLONIES_MAP[location];
  }
  // Smart dynamic colony fallback generator
  return [
    `${location} Main Road`,
    `${location} Colony`,
    `Sector 1, ${location}`,
    `Phase 1, ${location}`,
    `Near Metro Station, ${location}`,
    `Greenwood Area, ${location}`
  ];
}


export const CATEGORIES = [
  "Furniture",
  "Electronics",
  "Appliances",
  "Kitchenware",
  "Bedding & Mattress",
  "Others",
];

export const FURNISHING_OPTIONS = [
  "Fully Furnished",
  "Semi Furnished",
  "Unfurnished",
];

export const GENDER_PREFERENCE = [
  "Male Bachelors Only",
  "Female Bachelors Only",
  "Any Gender",
];

// Updated: members allowed up to 15
export const MEMBERS_ALLOWED = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Updated: budget up to ₹80,000
export const BUDGET_RANGES = [
  { label: "Under ₹5,000", min: 0, max: 5000 },
  { label: "₹5,000 - ₹8,000", min: 5000, max: 8000 },
  { label: "₹8,000 - ₹12,000", min: 8000, max: 12000 },
  { label: "₹12,000 - ₹18,000", min: 12000, max: 18000 },
  { label: "₹18,000 - ₹25,000", min: 18000, max: 25000 },
  { label: "₹25,000 - ₹40,000", min: 25000, max: 40000 },
  { label: "₹40,000 - ₹60,000", min: 40000, max: 60000 },
  { label: "₹60,000 - ₹80,000", min: 60000, max: 80000 },
  { label: "₹80,000+", min: 80000, max: 9999999 },
];

export const ITEM_CONDITIONS = [
  "Like New",
  "Good",
  "Fair",
  "Needs Repair",
];

export const PARKING_OPTIONS = [
  "Bike Parking",
  "Car Parking",
  "Bike + Car Parking",
  "No Parking",
];
