import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/** A throw during render used to unmount the whole game into a white page. Keep the theatre open
 *  and say what happened instead — with a way back in. */
class Boundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(err: unknown) { return { err: err instanceof Error ? err.message : String(err) }; }
  render() {
    if (!this.state.err) return this.props.children;
    return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#100e12", color: "#e8ddc7", fontFamily: "Georgia, serif", textAlign: "center", padding: 24, boxSizing: "border-box" }}>
      <div style={{ fontSize: 34, letterSpacing: 5, color: "#f3e9d2" }}>RUBBER REQUIEM</div>
      <div style={{ opacity: .8, maxWidth: 460 }}>The marquee fell down: {this.state.err}</div>
      <button style={{ font: "inherit", padding: "10px 18px", background: "#d8c69a", color: "#21171b", border: "3px solid #171217", boxShadow: "4px 5px 0 #171217", cursor: "pointer" }} onClick={() => window.location.reload()}>RELOAD THE SHOW</button>
    </div>;
  }
}

// If mounting throws (sandboxed storage, blocked APIs, ...), show the reason
// inside the boot fallback instead of leaving a silent white screen.
try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Boundary>
        <App />
      </Boundary>
    </StrictMode>
  );
  (window as Window & { __rr_booted?: boolean }).__rr_booted = true;
  const bootMsg = document.getElementById("boot-msg");
  if (bootMsg) bootMsg.textContent = "";
} catch (err) {
  const el = document.getElementById("boot-msg");
  if (el) el.textContent = `The show hit a snag: ${err instanceof Error ? err.message : String(err)}`;
  throw err;
}
