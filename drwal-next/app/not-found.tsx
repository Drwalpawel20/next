import Link from "next/link";
export default function NotFound() {
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", textAlign: "center", padding: 24 }}>
      <div>
        <h1 style={{ fontSize: "clamp(3rem,10vw,7rem)" }}>404</h1>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>Tej strony nie ma. Może ją przeniosłem, może nigdy nie istniała.</p>
        <Link className="btn primary" href="/">Wróć na start</Link>
      </div>
    </main>
  );
}
