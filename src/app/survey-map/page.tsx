"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  ShieldCheck,
  Search,
  Layers,
  Smartphone,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Globe,
  Compass,
} from "lucide-react";

interface StateLandPortal {
  name: string;
  portalName: string;
  deptName: string;
  url: string;
  gisMapUrl: string;
  reraUrl: string;
  description: string;
  features: string[];
  sampleDistricts: string[];
}

const STATE_PORTALS: Record<string, StateLandPortal> = {
  Telangana: {
    name: "Telangana",
    portalName: "Dharani & Bhu-Naksha TS",
    deptName: "Telangana Land Records & Survey Settlement",
    url: "https://dharani.telangana.gov.in/",
    gisMapUrl: "https://bhunaksha.telangana.gov.in/",
    reraUrl: "https://rera.telangana.gov.in/",
    description:
      "Official portal for Agricultural & Non-Agricultural Survey Numbers, Pahani, ROR 1-B, Cadastral Maps, and Encumbrance Certificate.",
    features: [
      "Cadastral Survey Map (Bhunaksha)",
      "Pahani / ROR 1-B Verification",
      "Survey Sub-division Verification",
      "Prohibited Lands (22A) Check",
    ],
    sampleDistricts: ["Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy", "Yadadri Bhuvanagiri"],
  },
  "Andhra Pradesh": {
    name: "Andhra Pradesh",
    portalName: "Meebhoomi & Webland AP",
    deptName: "AP Department of Revenue & Survey",
    url: "http://meebhoomi.ap.gov.in/",
    gisMapUrl: "http://meebhoomi.ap.gov.in/FMB.aspx",
    reraUrl: "https://rera.ap.gov.in/",
    description:
      "Check AP Adangal, 1-B Records, Village FMB (Field Measurement Book) Survey maps, and Grama Ward survey numbers.",
    features: [
      "Individual & Village Adangal",
      "FMB Survey Map Download",
      "1-B Record Search",
      "Electronic Passbook & Pattadar Details",
    ],
    sampleDistricts: ["Visakhapatnam", "Vijayawada (NTR)", "Guntur", "Tirupati", "Krishna"],
  },
  Karnataka: {
    name: "Karnataka",
    portalName: "Bhoomi & Dishaank GIS",
    deptName: "Karnataka Revenue Department",
    url: "https://landrecords.karnataka.gov.in/service2/",
    gisMapUrl: "https://kgis.ksrsac.in/dishaank/",
    reraUrl: "https://rera.karnataka.gov.in/",
    description:
      "Access RTC (Pahani), Mutation register, Dishaank Mobile GIS Cadastral survey map with real-time GPS location matching.",
    features: [
      "Dishaank Live Survey Map",
      "RTC / Pahani Online",
      "Survey Mutation Status",
      "Revenue Map by Hobli & Village",
    ],
    sampleDistricts: ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Belagavi"],
  },
  Maharashtra: {
    name: "Maharashtra",
    portalName: "MahaBhulekh (7/12) & Mahabhunaksha",
    deptName: "Maharashtra Land Records Department",
    url: "https://bhulekh.mahabhumi.gov.in/",
    gisMapUrl: "https://mahabhunakshageorolls.mahabhumi.gov.in/",
    reraUrl: "https://maharera.maharashtra.gov.in/",
    description:
      "View Satbara (7/12 Utara), 8A Katha, Ferfar (Mutation) extract, and digital GIS village survey boundaries.",
    features: [
      "7/12 Satbara Utara",
      "Mahabhunaksha Cadastral Map",
      "Property Card (Malmatta Patrak)",
      "E-Mutation Tracker",
    ],
    sampleDistricts: ["Pune", "Mumbai Suburban", "Thane", "Nagpur", "Nashik"],
  },
  "Tamil Nadu": {
    name: "Tamil Nadu",
    portalName: "Patta Chitta & AnyRoR TN",
    deptName: "Tamil Nadu Revenue & Disaster Management",
    url: "https://eservices.tn.gov.in/eservicesnew/land/chitta.html",
    gisMapUrl: "https://eservices.tn.gov.in/eservicesnew/land/fmb.html",
    reraUrl: "https://rera.tn.gov.in/",
    description:
      "Verify View Patta/Chitta Extract, FMB Sketch (Field Measurement Book), TSLR (Town Survey Land Register), and A-Register.",
    features: [
      "View Patta & Chitta",
      "FMB Field Measurement Sketch",
      "TSLR Urban Survey Extract",
      "Poramboke Land Verification",
    ],
    sampleDistricts: ["Chennai", "Coimbatore", "Chengalpattu", "Kanchipuram", "Madurai"],
  },
  "Uttar Pradesh": {
    name: "Uttar Pradesh",
    portalName: "UP Bhulekh & BhuNaksha",
    deptName: "Board of Revenue Uttar Pradesh",
    url: "https://upbhulekh.gov.in/",
    gisMapUrl: "https://upbhunaksha.gov.in/",
    reraUrl: "https://up-rera.in/",
    description:
      "Check Khatauni (ROR), Gata / Khasra / Survey number details, Bhu-Naksha field maps, and dispute status.",
    features: [
      "Khatauni ROR Copy",
      "BhuNaksha Plot Map",
      "Gata Dispute Status Check",
      "Real-time Ownership Log",
    ],
    sampleDistricts: ["Gautam Buddha Nagar (Noida)", "Ghaziabad", "Lucknow", "Varanasi", "Kanpur"],
  },
  "Pan India": {
    name: "Pan India",
    portalName: "Bhuvan ISRO & DILRMP GIS",
    deptName: "Digital India Land Records & ISRO Bhuvan",
    url: "https://bhuvan-app1.nrsc.gov.in/bhuvan2d/bhuvan/bhuvan2d.php",
    gisMapUrl: "https://bhuvan-app1.nrsc.gov.in/bhuvan2d/bhuvan/bhuvan2d.php",
    reraUrl: "https://mohua.gov.in/",
    description:
      "Satellite Cadastral Overlay map powered by ISRO NRSC, linking national land survey layers with high-resolution satellite imagery.",
    features: [
      "ISRO Satellite Cadastral Map",
      "National Land Use Overlay",
      "Drainage & Waterbody Buffer Check",
      "Master Plan Zoning Layer",
    ],
    sampleDistricts: ["All Major Metros & States"],
  },
};

export default function SurveyMapPage() {
  const [selectedState, setSelectedState] = useState<string>("Telangana");
  const [district, setDistrict] = useState<string>("Hyderabad");
  const [mandal, setMandal] = useState<string>("Serilingampally");
  const [village, setVillage] = useState<string>("Gachibowli");
  const [surveyNumber, setSurveyNumber] = useState<string>("");

  const portal = STATE_PORTALS[selectedState] || STATE_PORTALS["Telangana"];

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const newPortal = STATE_PORTALS[stateName];
    if (newPortal && newPortal.sampleDistricts.length > 0) {
      setDistrict(newPortal.sampleDistricts[0]);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-slate-50">
      {/* ── App Deep Link Banner ── */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white py-3 px-6 text-center text-sm shadow-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-3">
          <Smartphone size={16} className="text-amber-300" />
          <span>
            Looking for real-time GPS cadastral mapping on your mobile?
          </span>
          <a
            href="takevolet://survey-map"
            className="inline-flex items-center gap-1 bg-white text-purple-800 text-xs font-bold px-3 py-1 rounded-full shadow hover:bg-slate-100 transition"
          >
            Open in Takevolet App <ArrowRight size={12} />
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-12 mt-8 max-w-6xl">
        {/* ── Hero Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 border border-purple-200 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full mb-4">
            <Layers size={14} />
            <span className="text-xs uppercase tracking-wider font-semibold">
              National Cadastral GIS Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Cadastral GIS Land Survey Map & Digital Records
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Verify official survey numbers, Pahani/ROR records, FMB field sketches, and satellite
            cadastral boundaries across India before buying, renting, or investing.
          </p>
        </motion.div>

        {/* ── State Selection Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {Object.keys(STATE_PORTALS).map((s) => (
            <button
              key={s}
              onClick={() => handleStateChange(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedState === s
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-purple-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── Main Interactive Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column: Search & Coordinates Input */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Search className="text-purple-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900">
                Land Coordinates & Survey Search
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedState}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Hyderabad / Pune"
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mandal / Taluka
                  </label>
                  <input
                    type="text"
                    value={mandal}
                    onChange={(e) => setMandal(e.target.value)}
                    placeholder="Mandal / Taluk"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Village / Locality
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Village"
                    className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Survey / Khasra / Sy Number
                </label>
                <input
                  type="text"
                  value={surveyNumber}
                  onChange={(e) => setSurveyNumber(e.target.value)}
                  placeholder="e.g. 128/A or 45/2"
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition font-medium"
                />
              </div>

              <div className="pt-2">
                <a
                  href={portal.gisMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all text-sm"
                >
                  <Compass size={18} />
                  Open {selectedState} GIS Map
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                Always verify if the survey number falls under Section 22A (Prohibited / Government
                / Wakf / Inam lands) before proceeding with token advance payments.
              </p>
            </div>
          </div>

          {/* Right Column: Portal Details & Direct Action Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                    Official Government Portal
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {portal.portalName}
                  </h3>
                  <p className="text-sm text-slate-500">{portal.deptName}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <ShieldCheck size={14} />
                  Government Verified
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {portal.description}
              </p>

              <div className="border-t border-slate-100 pt-5 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Key Verification Features
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {portal.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm font-medium text-slate-800"
                    >
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={portal.gisMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition"
                >
                  <Layers size={15} />
                  Cadastral Map
                  <ExternalLink size={13} />
                </a>

                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-slate-200 hover:border-purple-300 text-slate-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition"
                >
                  <FileText size={15} className="text-purple-600" />
                  Pahani / 7-12 ROR
                  <ExternalLink size={13} />
                </a>

                <a
                  href={portal.reraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-slate-200 hover:border-purple-300 text-slate-800 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition"
                >
                  <ShieldCheck size={15} className="text-emerald-600" />
                  RERA Approval
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Quick Educational Steps */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-purple-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Globe size={16} className="text-purple-600" />
                4-Step Survey Number Due Diligence Checklist
              </h4>
              <ol className="space-y-3 text-xs sm:text-sm text-purple-900 font-medium list-decimal list-inside">
                <li>
                  <strong className="text-slate-900">Check Cadastral Map (Bhu-Naksha / Dishaank):</strong> Verify
                  boundaries, shape of the plot, and survey sub-division.
                </li>
                <li>
                  <strong className="text-slate-900">Verify Ownership (Pahani / 1-B / 7-12):</strong> Confirm
                  seller name matches the Pattadar / Khatedar record in government registers.
                </li>
                <li>
                  <strong className="text-slate-900">Check Section 22A Prohibited List:</strong> Ensure no
                  pending government notifications or court stay orders exist on this land.
                </li>
                <li>
                  <strong className="text-slate-900">Verify RERA & Municipal Approvals:</strong> For gated
                  communities, match the approved layout survey numbers with the RERA certificate.
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* ── App Promo Section ── */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2 block">
              Takevolet Mobile App
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Get Live GPS Survey Boundary Matching on Site
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Stand right on any plot or apartment land, tap Locate, and view the exact survey number,
              cadastral boundaries, and RERA registration directly on your phone.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.takevolet.app"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-sm transition"
              >
                <Smartphone size={18} />
                Download Takevolet Android App
              </a>
              <Link
                href="/rooms"
                className="border border-white/20 hover:border-white text-white font-semibold px-6 py-3.5 rounded-xl text-sm transition"
              >
                Browse Verified Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
