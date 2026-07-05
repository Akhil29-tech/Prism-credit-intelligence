import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";

const BASE_PROFILE = {
  age:32, income:45000, employment_years:3, loan_amount:120000,
  loan_duration:36, num_credits:2, existing_credits:1, dependents:1,
  savings:"100-500", checking_account:"0-200", purpose:"car",
  gender:"Male", marital_status:"Single", housing:"rent", job:"skilled",
  foreign_worker:"yes", credit_history:"existing paid",
  telephone:"yes", property:"real estate",
};

const SIMULATIONS = [
  { key:"income", label:"Income Increase", values:[30000,40000,50000,60000,75000,100000,150000], unit:"₹" },
  { key:"loan_amount", label:"Loan Amount Decrease", values:[200000,160000,120000,80000,50000,30000], unit:"₹" },
  { key:"employment_years", label:"Employment Years", values:[0,1,2,3,5,8,12,20], unit:"yrs" },
  { key:"loan_duration", label:"Loan Duration", values:[84,60,48,36,24,12], unit:"mo" },
];

export default function WhatIf() {
  const [base, setBase] = useState(BASE_PROFILE);
  const [simKey, setSimKey] = useState("income");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baseResult, setBaseResult] = useState(null);

  const sim = SIMULATIONS.find(s => s.key === simKey);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatif", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ base, variable: simKey, values: sim.values }),
      });
      const data = await res.json();
      setResults(data.results || []);

      // Get base prediction
      const baseRes = await fetch("/api/predict", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ ...base, debt_to_income: parseFloat((base.loan_amount/base.income).toFixed(2)) }),
      });
      const baseData = await baseRes.json();
      setBaseResult(baseData);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const best = results.length ? results.reduce((a,b) => a.probability < b.probability ? a : b) : null;

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div className="page-badge">Scenario Analysis</div>
        <div className="page-title">What-If Simulator</div>
        <div className="page-subtitle">Change one variable · watch CIBIL score update · find the best-case scenario</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:20 }}>
        {/* Controls */}
        <div>
          <div className="chart-card" style={{ marginBottom:16 }}>
            <div className="chart-card-header">
              <div className="chart-title">Base Profile</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                ["income","Annual Income (₹)","number"],
                ["loan_amount","Loan Amount (₹)","number"],
                ["employment_years","Employment Years","number"],
                ["age","Age","number"],
              ].map(([key,label,type]) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <input type={type} className="form-input" value={base[key]}
                    onChange={e => setBase(b => ({ ...b, [key]: Number(e.target.value) }))}/>
                </div>
              ))}
              {[
                ["credit_history","Credit History",["existing paid","all paid","delayed","critical","no credits"]],
                ["job","Job Type",["skilled","unskilled","management","unemployed"]],
                ["savings","Savings",["< 100","100-500","500-1000","1000-5000","> 5000"]],
              ].map(([key,label,opts]) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <select className="form-select" value={base[key]}
                    onChange={e => setBase(b => ({ ...b, [key]: e.target.value }))}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Variable to Simulate</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {SIMULATIONS.map(s => (
                <button key={s.key} onClick={() => setSimKey(s.key)} style={{
                  padding:"10px 14px", borderRadius:8, border:`2px solid ${simKey===s.key ? "var(--gold-500)" : "var(--border)"}`,
                  background: simKey===s.key ? "rgba(201,168,76,0.08)" : "var(--bg3)",
                  color: simKey===s.key ? "var(--gold-600)" : "var(--muted)",
                  fontWeight: simKey===s.key ? 700 : 500,
                  cursor:"pointer", textAlign:"left", fontSize:13, transition:"all 0.15s",
                }}>
                  {s.label}
                </button>
              ))}
            </div>
            <button className="btn btn-gold btn-full" onClick={runSimulation} disabled={loading}>
              {loading ? "⏳ Simulating..." : "▶ Run Simulation"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          {baseResult && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div className="kpi-card">
                <div className="kpi-label">Current CIBIL Score</div>
                <div className="kpi-value" style={{ color: baseResult.cibil_score >= 700 ? "var(--green)" : baseResult.cibil_score >= 550 ? "var(--yellow)" : "var(--red)" }}>
                  {baseResult.cibil_score}
                </div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>{baseResult.risk_label}</div>
              </div>
              {best && (
                <div className="kpi-card" style={{ borderTopColor:"var(--green)" }}>
                  <div className="kpi-label">Best Case CIBIL</div>
                  <div className="kpi-value" style={{ color:"var(--green)" }}>{best.cibil}</div>
                  <div style={{ fontSize:12, color:"var(--muted)" }}>at {sim?.unit}{typeof best.value === "number" ? best.value.toLocaleString() : best.value}</div>
                </div>
              )}
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="chart-card" style={{ marginBottom:16 }}>
                <div className="chart-card-header">
                  <div className="chart-title">CIBIL Score vs {sim?.label}</div>
                  <div className="chart-subtitle">Higher is better · Green zone = safe lending</div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={results} margin={{ left:10, right:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="value" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false}
                           tickFormatter={v => typeof v === "number" && v > 1000 ? `₹${(v/1000).toFixed(0)}K` : v}/>
                    <YAxis domain={[300,900]} tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8 }}
                             formatter={(v) => [v, "CIBIL Score"]}/>
                    <ReferenceLine y={700} stroke="#16a34a" strokeDasharray="6 3" label={{ value:"Safe Zone", position:"right", fontSize:10, fill:"#16a34a" }}/>
                    <ReferenceLine y={baseResult?.cibil_score} stroke="#94a3b8" strokeDasharray="4 4"/>
                    <Line type="monotone" dataKey="cibil" stroke="#c9a84c" strokeWidth={3} dot={{ r:4, fill:"#c9a84c" }} activeDot={{ r:6 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-card-header">
                  <div className="chart-title">Default Probability vs {sim?.label}</div>
                  <div className="chart-subtitle">Lower is better</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={results} margin={{ left:10, right:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="value" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false}
                           tickFormatter={v => typeof v === "number" && v > 1000 ? `₹${(v/1000).toFixed(0)}K` : v}/>
                    <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v*100).toFixed(0)}%`}/>
                    <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8 }}
                             formatter={(v) => [`${(v*100).toFixed(1)}%`, "Default Probability"]}/>
                    <ReferenceLine y={0.35} stroke="#dc2626" strokeDasharray="6 3" label={{ value:"Risk Threshold", position:"right", fontSize:10, fill:"#dc2626" }}/>
                    <Line type="monotone" dataKey="probability" stroke="#dc2626" strokeWidth={3} dot={{ r:4, fill:"#dc2626" }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {results.length === 0 && (
            <div style={{ background:"white", border:"1px solid var(--border)", borderRadius:16, padding:"60px 40px", textAlign:"center", color:"var(--muted)" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>💡</div>
              <div style={{ fontWeight:700, fontSize:16, color:"var(--navy-800)", marginBottom:8 }}>Run a simulation</div>
              <div style={{ fontSize:13 }}>Set the base profile, choose a variable, and click Run Simulation to see how risk changes</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
