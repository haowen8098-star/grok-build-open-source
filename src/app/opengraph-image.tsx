import { ImageResponse } from "next/og";

export const alt = "Grok Build Open Source terminal guide";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#050505",
          color: "#f5f5f5",
          display: "flex",
          fontFamily: "sans-serif",
          height: "100%",
          padding: "48px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #292929 1px, transparent 0)",
            backgroundSize: "24px 24px",
            inset: 0,
            opacity: 0.5,
            position: "absolute",
          }}
        />
        <div
          style={{
            border: "1px solid #2a2a2a",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "42px",
            position: "relative",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                border: "1px solid #2a2a2a",
                color: "#ffd43b",
                display: "flex",
                fontFamily: "monospace",
                fontSize: 16,
                padding: "12px 14px",
              }}
            >
              GROK BUILDING
            </div>
            <div
              style={{
                alignItems: "center",
                color: "#9a9a9a",
                display: "flex",
                fontFamily: "monospace",
                fontSize: 14,
                letterSpacing: "0.14em",
              }}
            >
              <span
                style={{
                  background: "#22c55e",
                  borderRadius: 999,
                  display: "flex",
                  height: 8,
                  marginRight: 10,
                  width: 8,
                }}
              />
              PUBLIC SOURCE
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 68,
                fontWeight: 600,
                letterSpacing: "-0.055em",
                lineHeight: 1,
                maxWidth: 980,
              }}
            >
              Grok Build Open Source
            </div>
            <div
              style={{
                color: "#9a9a9a",
                display: "flex",
                fontSize: 30,
                marginTop: 20,
              }}
            >
              Source code, setup, architecture, and boundaries.
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid #2a2a2a",
              color: "#ffd43b",
              display: "flex",
              fontFamily: "monospace",
              fontSize: 17,
              justifyContent: "space-between",
              paddingTop: 22,
            }}
          >
            <span>$ cargo run -p xai-grok-pager-bin</span>
            <span style={{ color: "#9a9a9a" }}>UNOFFICIAL GUIDE</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
