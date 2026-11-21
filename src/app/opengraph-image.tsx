import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Quizzit — Import, Practice & Master";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  const logoBuffer = readFileSync(
    join(process.cwd(), "public", "mascot", "logo.png")
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F8FAFC",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          border: "16px solid #225577",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <img
            src={logoSrc}
            width={112}
            height={112}
            alt="Quizzit mascot"
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "68px",
                fontWeight: 800,
                color: "#225577",
                lineHeight: 1.05,
                letterSpacing: "-1.5px",
              }}
            >
              Quizzit
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#475569",
                marginTop: "6px",
              }}
            >
              Import, Practice & Master
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "#1E293B",
              lineHeight: 1.18,
              maxWidth: "960px",
            }}
          >
            Bring your own questions. Master every topic.
          </div>
          <div style={{ display: "flex", gap: "14px" }}>
            {[
              "Multiple Choice",
              "Identification",
              "Enumeration",
              "CSV & JSON",
            ].map((label) => (
              <div
                key={label}
                style={{
                  backgroundColor: "#DCEBF5",
                  color: "#1B4866",
                  border: "3px solid #225577",
                  borderRadius: "16px",
                  padding: "10px 22px",
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
