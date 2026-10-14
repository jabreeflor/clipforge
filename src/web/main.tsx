import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ClipEditor } from "./pages/ClipEditor.tsx";
import { Pipeline } from "./pages/Pipeline.tsx";
import { Planner } from "./pages/Planner.tsx";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Pipeline />} />
        <Route path="/clips/:id" element={<ClipEditor />} />
        <Route path="/planner" element={<Planner />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
