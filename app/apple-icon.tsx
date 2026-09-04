import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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
          background: "#2563EB",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 22,
            height: 92,
            borderRadius: 6,
            background: "#ffffff",
          }}
        />
        <div
          style={{
            width: 22,
            height: 62,
            borderRadius: 6,
            background: "#38BDF8",
          }}
        />
        <div
          style={{
            width: 22,
            height: 78,
            borderRadius: 6,
            background: "rgba(255,255,255,0.82)",
          }}
        />
      </div>
    ),
    size,
  );
}
