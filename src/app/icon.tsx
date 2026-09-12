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
          background: "linear-gradient(135deg, #7B3AEC 0%, #6366F1 50%, #4F46E5 100%)",
          borderRadius: "112px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="320"
          height="320"
          fill="none"
          style={{ display: "flex" }}
        >
          <path
            d="M3 10.5L12 3.5L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M9 21V12.5H15V21H9Z"
            fill="#7B3AEC"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
