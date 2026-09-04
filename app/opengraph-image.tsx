import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function cairoFonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [arabic, latin] = await Promise.all([
    readFile(join(dir, "cairo-arabic-700.woff")),
    readFile(join(dir, "cairo-latin-700.woff")),
  ]);

  return [
    {
      name: "CairoAr",
      data: arabic,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "CairoLat",
      data: latin,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0F172A",
          color: "#F8FAFC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 36,
                borderRadius: 4,
                background: "#ffffff",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              marginRight: 20,
              fontSize: 36,
              fontFamily: "CairoAr",
            }}
          >
            ألواح هب
          </div>
          <div
            style={{
              display: "flex",
              marginRight: 12,
              fontSize: 36,
              color: "#38BDF8",
              fontFamily: "CairoLat",
            }}
          >
            AlwahHub
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontFamily: "CairoAr",
            lineHeight: 1.25,
          }}
        >
          مركزك الذكي لإدارة المهام والمشاريع بسلاسة عربية
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#38BDF8",
            fontSize: 28,
          }}
        >
          <div style={{ display: "flex", fontFamily: "CairoAr" }}>
            كانبان عربي  مدى
          </div>
          <div style={{ display: "flex", fontFamily: "CairoLat" }}>Apple Pay</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await cairoFonts(),
    },
  );
}
