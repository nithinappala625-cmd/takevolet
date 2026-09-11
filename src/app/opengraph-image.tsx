import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0A 0%, #171717 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "300px",
            height: "300px",
            background: "rgba(212, 175, 55, 0.1)",
            borderRadius: "50%",
            marginBottom: "40px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            width="200"
            height="200"
            style={{ display: "flex" }}
          >
            <defs>
              <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="50%" stopColor="#7B3AEC" />
                <stop offset="100%" stopColor="#5B21B6" />
              </linearGradient>
            </defs>
            <path
              d="M256 60 L440 220 H380 V420 H290 V290 H222 V420 H132 V220 H72 Z"
              fill="url(#purpleGrad)"
            />
          </svg>
        </div>
        
        <div
          style={{
            display: "flex",
            fontSize: "72px",
            fontWeight: 800,
            letterSpacing: "-0.05em",
            color: "#FFFFFF",
            fontFamily: "sans-serif",
          }}
        >
          Takevolet
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "32px",
            fontWeight: 500,
            color: "#A3A3A3",
            fontFamily: "sans-serif",
            marginTop: "16px",
          }}
        >
          Zero Brokerage Rooms & Flatmates in Hyderabad
        </div>
      </div>
    ),
    { ...size }
  );
}
