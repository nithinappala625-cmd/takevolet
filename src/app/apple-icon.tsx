import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          width="120"
          height="120"
          style={{ display: "flex" }}
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F2D06B" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#997A15" />
            </linearGradient>
          </defs>
          <path
            d="M256 60 L440 220 H380 V420 H290 V290 H222 V420 H132 V220 H72 Z"
            fill="url(#goldGrad)"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
