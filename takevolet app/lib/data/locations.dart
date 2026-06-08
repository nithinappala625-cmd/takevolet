const List<String> HYDERABAD_AREAS = [
  'Madhapur', 'Hitech City', 'Gachibowli', 'Kondapur', 'Kothaguda',
  'Nanakramguda', 'Financial District', 'Raidurg', 'Manikonda', 'Narsingi',
  'Kokapet', 'Tellapur', 'SR Nagar', 'Ameerpet', 'Panjagutta', 'Begumpet',
  'Somajiguda', 'Sanjeeva Reddy Nagar', 'Erragadda', 'Balkampet', 'Yousufguda',
  'Vengal Rao Nagar', 'Rajbhavan Road', 'Kukatpally', 'KPHB Colony', 'Miyapur',
  'Hafeezpet', 'Chandanagar', 'Nizampet', 'Bachupally', 'Pragathi Nagar',
  'Nallagandla', 'Serilingampally', 'Allwyn Colony', 'Moosapet', 'Uppal',
  'Nacharam', 'Habsiguda', 'Tarnaka', 'Malkajgiri', 'LB Nagar', 'Dilsukhnagar',
  'Kothapet', 'Nagole', 'Boduppal', 'Peerzadiguda', 'Medipally', 'Secunderabad',
  'Kompally', 'Alwal', 'Trimulgherry', 'Bowenpally', 'Tirmalgiri', 'Sainikpuri',
  'AS Rao Nagar', 'ECIL', 'Kapra', 'Mehdipatnam', 'Tolichowki', 'Attapur',
  'Rajendra Nagar', 'Shamshabad', 'Banjara Hills', 'Jubilee Hills', 'Film Nagar',
  'Road No. 36', 'Masab Tank', 'Nampally', 'Abids', 'Lakdikapul', 'Chikkadpally',
  'Himayath Nagar', 'Narayanguda', 'Musheerabad', 'RTC X Roads', 'Vidya Nagar',
  'Balanagar', 'Jeedimetla', 'Medchal', 'Shamirpet', 'Borabanda', 'Allapur',
  'Sanathnagar', 'Suraram', 'Gajularamaram', 'Chintal', 'Bolarum',
  'Padmarao Nagar', 'Baghlingampally', 'Amberpet', 'Karmanghat', 'Santoshnagar',
  'Chandrayangutta', 'Barkas', 'Falaknuma', 'Charminar', 'Koti', 'Bandlaguda',
  'Kismatpur', 'Gopanpally', 'Lingampally',
];

const List<String> BANGALORE_AREAS = [
  'Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout', 'Marathahalli',
  'Electronic City', 'BTM Layout', 'Jayanagar', 'JP Nagar', 'Bellandur',
  'Hebbal', 'Malleshwaram', 'Rajajinagar', 'Yelahanka', 'Banashankari',
  'Basavanagudi', 'RT Nagar', 'Ulsoor', 'Frazer Town', 'Banaswadi',
  'Kalyan Nagar', 'Hennur', 'KR Puram', 'Mahadevapura', 'Brookefield',
  'Kundalahalli', 'ITPL', 'Kadugodi', 'Sarjapur Road', 'Harlur',
  'Kasavanahalli', 'CV Raman Nagar', 'Domlur', 'Murugeshpalya', 'Thippasandra',
  'HAL', 'Kaggadasapura', 'Vignana Nagar', 'Doddanekundi', 'Silk Board',
  'Madiwala', 'Tavarekere', 'Arekere', 'Hulimavu', 'Bannerghatta Road',
  'Bommanahalli', 'Bommasandra', 'Attibele', 'Chandapura', 'Jigani',
  'Nagarbhavi', 'Kengeri', 'Rajrajeshwari Nagar', 'Vijayanagar', 'Basaveshwaranagar',
  'Mathikere', 'Yeshwanthpur', 'Peenya', 'Dasarahalli', 'Jalahalli',
  'Vidyaranyapura', 'Sahakar Nagar', 'Sanjay Nagar', 'Ganganagar', 'Ganga Nagar',
  'Nagavara', 'Manyata Tech Park', 'Thanisandra', 'Yelahanka New Town', 'Kogilu',
  'Kempapura', 'Amrutahalli', 'Horamavu', 'Ramamurthy Nagar', 'Kalkere',
];

const Map<String, List<String>> COLONIES_MAP = {
  'Madhapur': [
    'Madhapur Main Rd', 'Kavuri Hills', 'Ayyappa Society',
    'Vittal Rao Nagar', 'Jubilee Enclave', 'Silicon Valley',
  ],
  'Hitech City': [
    'Hitech City Metro', 'Cyber Towers Colony', 'L&T Infocity',
    'Mindspace Area', 'Phases 1 & 2',
  ],
  'Gachibowli': [
    'Gachibowli Village', 'Botanical Garden Rd', 'DLF Cybercity',
    'Indira Nagar', 'Telecom Nagar',
  ],
  'Kondapur': [
    'Kondapur Main Rd', 'Laxmi Nagar', 'Surya Nagar',
    'Sri Ram Nagar', 'Prashant Hills', 'Raghavendra Colony',
  ],
  'Kukatpally': [
    'KPHB Phase 1', 'KPHB Phase 2', 'KPHB Phase 3',
    'KPHB Phase 4', 'Moosapet', 'Balanagar', 'Vivekananda Nagar',
  ],
  'Banjara Hills': [
    'Road No 1', 'Road No 2', 'Road No 3',
    'Road No 10', 'Road No 12', 'Road No 14', 'Mithila Nagar',
  ],
  'Jubilee Hills': [
    'Check Post', 'Road No 36', 'Road No 45',
    'Road No 78', 'Film Nagar', 'Madina Colony',
  ],
  'Ameerpet': [
    'Ameerpet Metro', 'Maitrivanam', 'Satyam Theatre Rd',
    'Dharam Karan Rd', 'Aditya Enclave', 'Greenlands',
  ],
  'SR Nagar': [
    'SR Nagar Metro', 'Sanjeeva Reddy Nagar', 'BK Guda',
    'Umesh Chandra Statue', 'Community Hall', 'Erragadda',
  ],
};

const Map<String, List<String>> BANGALORE_COLONIES_MAP = {
  'Whitefield': [
    'ITPL', 'Kadugodi', 'Hope Farm', 'Immaculate Conception Church',
    'Forum Value Mall', 'EPIP Zone',
  ],
  'Koramangala': [
    '1st Block', '2nd Block', '3rd Block', '4th Block',
    '5th Block', '6th Block', '7th Block', '8th Block',
  ],
  'HSR Layout': [
    'Sector 1', 'Sector 2', 'Sector 3', 'Sector 4',
    'Sector 5', 'Sector 6', 'Sector 7',
  ],
  'Electronic City': [
    'Phase 1', 'Phase 2', 'Neeladri Road', 'Wipro Gate', 'Infosys Gate',
  ],
  'Marathahalli': [
    'Kalamandir', 'AECS Layout', 'Munnekollal', 'Silver Springs Layout',
    'Tulasi Theater', 'Spice Garden',
  ],
  'Indiranagar': [
    '100 Feet Road', '80 Feet Road', 'CMH Road', 'Defence Colony',
    'HAL 2nd Stage', 'Appareddy Palya',
  ],
};

List<String> getColonies(String location, {String city = 'Hyderabad'}) {
  if (city == 'Bangalore') {
    if (BANGALORE_COLONIES_MAP.containsKey(location)) {
      return BANGALORE_COLONIES_MAP[location]!;
    }
  } else {
    if (COLONIES_MAP.containsKey(location)) {
      return COLONIES_MAP[location]!;
    }
  }
  return [
    '$location Main Road',
    '$location Colony',
    'Sector 1, $location',
    'Phase 1, $location',
    'Near Metro Station, $location',
    'Greenwood Area, $location',
  ];
}
