// Comprehensive Hyderabad locations — major areas + smaller sub-areas

// ─── For dropdowns (profile complete + post room forms) ───────────────────────
export const LOCATIONS: { value: string; label: string }[] = [
  { value: "Hitech City", label: "Hitech City / Madhapur" },
  { value: "Gachibowli", label: "Gachibowli / Nanakramguda" },
  { value: "Kondapur", label: "Kondapur / Serilingampally" },
  { value: "Kukatpally", label: "Kukatpally / KPHB" },
  { value: "Banjara Hills", label: "Banjara Hills" },
  { value: "Jubilee Hills", label: "Jubilee Hills / Film Nagar" },
  { value: "Ameerpet", label: "Ameerpet / SR Nagar" },
  { value: "Begumpet", label: "Begumpet / Prakash Nagar" },
  { value: "Secunderabad", label: "Secunderabad" },
  { value: "Uppal", label: "Uppal / Nacharam" },
  { value: "LB Nagar", label: "LB Nagar / Saroor Nagar" },
  { value: "Dilsukhnagar", label: "Dilsukhnagar / Kothapet" },
  { value: "Himayatnagar", label: "Himayatnagar / Narayanguda" },
  { value: "Somajiguda", label: "Somajiguda / Rajbhavan Rd" },
  { value: "Tolichowki", label: "Tolichowki / Mehdipatnam" },
  { value: "Attapur", label: "Attapur / Rajendranagar" },
  { value: "Miyapur", label: "Miyapur / Chandanagar" },
  { value: "Bachupally", label: "Bachupally / Nizampet" },
  { value: "Kompally", label: "Kompally / Jeedimetla" },
  { value: "Alwal", label: "Alwal / Malkajgiri" },
  { value: "Sainikpuri", label: "Sainikpuri / AS Rao Nagar" },
  { value: "Manikonda", label: "Manikonda / Kokapet" },
  { value: "Financial District", label: "Financial District / Raidurgam" },
  { value: "Boduppal", label: "Boduppal / Peerzadiguda" },
  { value: "Hayathnagar", label: "Hayathnagar / Vanasthalipuram" },
];

const COLONIES_MAP: Record<string, string[]> = {
  "Hitech City":        ["Madhapur", "Kavuri Hills", "Ayyappa Society", "Vittal Rao Nagar", "Jubilee Enclave", "Silicon Valley"],
  "Gachibowli":         ["Gachibowli Village", "Nanakramguda", "Serilingampally", "Botanical Garden Rd", "DLF Cybercity"],
  "Kondapur":           ["Kondapur Main Rd", "Laxmi Nagar", "Surya Nagar", "Sri Ram Nagar", "Prashant Hills"],
  "Kukatpally":         ["KPHB Phase 1", "KPHB Phase 2", "KPHB Phase 3", "KPHB Phase 4", "Nizampet Road", "Moosapet", "Balanagar"],
  "Banjara Hills":      ["Road No 1", "Road No 2", "Road No 3", "Road No 10", "Road No 12", "Road No 14"],
  "Jubilee Hills":      ["Check Post", "Road No 36", "Road No 45", "Road No 78", "Film Nagar", "Madina Colony"],
  "Ameerpet":           ["SR Nagar", "Panjagutta", "Greenlands", "Nagarjuna Hills", "Erragadda", "Punjagutta Circle"],
  "Begumpet":           ["Prakash Nagar", "Ramnagar", "SD Road", "Chilkalguda", "Clock Tower"],
  "Secunderabad":       ["MG Road", "Paradise", "Trimulgherry", "Karkhana", "Bowenpally", "East Marredpally", "West Marredpally"],
  "Uppal":              ["Uppal Ring Road", "Nacharam", "Habsiguda", "Ramanthapur", "Mallapur", "Ghatkesar"],
  "LB Nagar":           ["Saroor Nagar", "Champapet", "Mansoorabad", "Chaitanyapuri", "Kothapet"],
  "Dilsukhnagar":       ["Malakpet", "Moosarambagh", "Tilak Nagar", "Keshavnagar", "Pillar No 147"],
  "Himayatnagar":       ["Narayanguda", "Basheerbagh", "Nallakunta", "Vidyanagar", "Musheerabad", "RTC X Roads"],
  "Somajiguda":         ["Rajbhavan Road", "Padmarao Nagar", "Saifabad", "Lakdikapool", "Khairatabad"],
  "Tolichowki":         ["Mehdipatnam", "Rethibowli", "Langar House", "Shaikpet", "Masab Tank"],
  "Attapur":            ["Rajendranagar", "Kishanbagh", "Shamshabad Road", "Golconda", "Nanalnagar"],
  "Miyapur":            ["Chandanagar", "Ramachandra Puram", "Hafeezpet", "Bharat Nagar", "BHEL Township"],
  "Bachupally":         ["Nizampet", "Pragati Nagar", "Bollaram", "IDA Bollaram", "Bhagyanagar Colony"],
  "Kompally":           ["Quthbullapur", "Jeedimetla", "Dundigal", "IDA Jeedimetla", "Suchitra Circle"],
  "Alwal":              ["Malkajgiri", "Neredmet", "Tarnaka", "Ramnagar Gundu", "Yapral"],
  "Sainikpuri":         ["AS Rao Nagar", "Kapra", "ECIL", "Neredmet", "Habsiguda", "Kushaiguda"],
  "Manikonda":          ["Puppalaguda", "Narsingi", "Kokapet", "Gandipet", "Gowlidoddi"],
  "Financial District": ["Nanakramguda", "Khajaguda", "Raidurgam", "Radial Road No 3"],
  "Boduppal":           ["Peerzadiguda", "Nagaram", "Ghatkesar", "Medipally", "Pocharam"],
  "Hayathnagar":        ["Vanasthalipuram", "Saroornagar", "Meerpet", "Nagole", "LB Nagar Extension"],
};

export function getColonies(location: string): string[] {
  return COLONIES_MAP[location] || [];
}


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
