import Link from "next/link";

export default function LoadingIndex() {
  return (
    <main style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "monospace", padding: "3rem" }}>
      <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", opacity: 0.4, marginBottom: "2rem" }}>
        LOADING SCREEN PROTOTYPES — RYOJI IKEDA DIRECTION
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[
          ["01", "TEST PATTERN", "/design-test/loading/1", "Scrolling barcode bands, one per pipeline stage"],
          ["02", "DATA COLUMNS", "/design-test/loading/2", "Binary character matrix — real data materialises as stages resolve"],
          ["03", "OSCILLOSCOPE", "/design-test/loading/3", "Six climate variable channels as sine wave traces"],
        ].map(([n, title, href, desc]) => (
          <Link key={n} href={href} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", gap: "2rem", alignItems: "baseline", padding: "0.6rem 0", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: "0.55rem", opacity: 0.35, minWidth: "2ch" }}>{n}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.2em", minWidth: "16ch" }}>{title}</span>
              <span style={{ fontSize: "0.6rem", opacity: 0.45 }}>{desc}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
