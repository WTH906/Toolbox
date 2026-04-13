import { useState } from "react";
import Folderico from "./apps/Folderico";
import ObsidianForge from "./apps/ObsidianForge";

export default function App() {
  const [activeApp, setActiveApp] = useState("folderico");
  const [tabBarVisible, setTabBarVisible] = useState(true);

  return (
    <div className="app-shell">
      {/* ── Tab Bar ── */}
      <div className={`app-switcher ${tabBarVisible ? "" : "hidden"}`}>
        <div className="app-switcher-inner">
          <button
            className={`app-tab ${activeApp === "folderico" ? "active" : ""}`}
            onClick={() => setActiveApp("folderico")}
          >
            <span className="app-tab-icon">📁</span> Folderico
          </button>
          <button
            className={`app-tab ${activeApp === "obsidian" ? "active" : ""}`}
            onClick={() => setActiveApp("obsidian")}
          >
            <span className="app-tab-icon">✍️</span> Obsidian Forge
          </button>
        </div>
        <button className="tab-toggle" onClick={() => setTabBarVisible(false)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          Hide
        </button>
      </div>

      {/* ── Floating toggle when bar is hidden ── */}
      {!tabBarVisible && (
        <button className="float-toggle" onClick={() => setTabBarVisible(true)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {activeApp === "folderico" ? "📁" : "✍️"} Switch App
        </button>
      )}

      {/* ── App Content ── */}
      <div className="app-content">
        <div style={{ display: activeApp === "folderico" ? "block" : "none", height: "100%", overflow: "auto" }}>
          <Folderico />
        </div>
        <div style={{ display: activeApp === "obsidian" ? "flex" : "none", height: "100%", overflow: "hidden" }}>
          <ObsidianForge />
        </div>
      </div>
    </div>
  );
}
