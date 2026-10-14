import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export function CueDot({ size = 22 }: { size?: number }) {
  return <span aria-hidden="true" className="cue-dot" style={{ width: size, height: size }} />;
}

export function SampleBadge() {
  return <span className="sample-badge">SAMPLE DATA</span>;
}

export function Thumb({ className = "thumb" }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="thumb-cam" />
      <div className="thumb-game" />
    </div>
  );
}

export function TopNav({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <strong className="brand">ClipForge</strong>
      <nav aria-label="Sections" className="topnav">
        <NavLink to="/" end>Pipeline</NavLink>
        <NavLink to="/planner">Planner</NavLink>
      </nav>
      {children}
    </header>
  );
}
