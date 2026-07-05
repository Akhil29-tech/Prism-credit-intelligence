import { useState, useEffect } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import EDA from "./pages/EDA";
import ModelArena from "./pages/ModelArena";
import Predictor from "./pages/Predictor";
import WhatIf from "./pages/WhatIf";
import BiasScan from "./pages/BiasScan";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error);
  }, []);

  const pages = {
    dashboard: <Dashboard stats={stats}/>,
    eda:       <EDA stats={stats}/>,
    arena:     <ModelArena stats={stats}/>,
    predictor: <Predictor/>,
    whatif:    <WhatIf/>,
    biasscan:  <BiasScan/>,
  };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} stats={stats}/>
      <main className="main-content">
        {pages[page]}
      </main>
    </div>
  );
}
