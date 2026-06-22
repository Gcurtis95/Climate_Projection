import Link from "next/link";

const directions = [
  {
    id: 1,
    name: "Scientific Terminal",
    desc: "Cream paper background · Space Mono · CRT scanline shader · typewriter reveals",
  },
  {
    id: 2,
    name: "Brutalist Editorial",
    desc: "Black base · serif headline + grotesque body · domain-warped fluid shader · data-driven accent",
  },
  {
    id: 3,
    name: "Instrument Panel",
    desc: "Amber phosphor · IBM Plex Mono · radar particle system · 80-col fixed layout",
  },
];

export default function DesignTestIndex() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#f5f0e8",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "3rem",
        padding: "3rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.4em", color: "#666", marginBottom: "0.75rem" }}>
          DESIGN LAB / CLIMATE PROJECTIONS
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 400, letterSpacing: "0.05em" }}>
          Select a direction to preview
        </h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "560px" }}>
        {directions.map((d) => (
          <Link
            key={d.id}
            href={`/design-test/${d.id}`}
            style={{
              display: "flex",
              gap: "1.5rem",
              alignItems: "flex-start",
              padding: "1.25rem 1.5rem",
              border: "1px solid #2a2a2a",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#555")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a")}
          >
            <span style={{ fontSize: "0.7rem", color: "#555", paddingTop: "0.1rem", flexShrink: 0 }}>
              0{d.id}
            </span>
            <div>
              <p style={{ fontSize: "0.9rem", marginBottom: "0.35rem" }}>{d.name}</p>
              <p style={{ fontSize: "0.7rem", color: "#555", lineHeight: 1.6 }}>{d.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/"
        style={{ fontSize: "0.7rem", color: "#444", textDecoration: "none", letterSpacing: "0.2em" }}
      >
        ← BACK TO MAIN
      </Link>
    </main>
  );
}
