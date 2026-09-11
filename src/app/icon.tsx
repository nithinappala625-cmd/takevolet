import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A", // Dark Slate
          borderRadius: "128px", // Squircle
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="320"
          height="320"
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
    ),
    { ...size }
  );
}
