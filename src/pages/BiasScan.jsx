import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ fontSize:12, color:p.color }}>{p.name}: {p.value}%</div>)}
    </div>
  );
};

export default function BiasScan() {
  const [data, setData] = useState(null);
  const [attr, setAttr] = useState("gender");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fairness")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>⏳ Running fairness audit...</div>;
  if (!data) return <div style={{ textAlign:"center", padding:"80px 0", color:"var(--red)" }}>Failed to load fairness data.</div>;

  const attrData = data[attr];
  if (!attrData) return null;

  const overallScore = Math.round(((attrData.di_pass ? 1 : 0) + (attrData.dp_pass ? 1 : 0)) / 2 * 100);
  const scoreColor = overallScore >= 70 ? "var(--green)" : overallScore >= 40 ? "var(--yellow)" : "var(--red)";

  const regulations = [
    { name:"EU AI Act 2024 — Article 10", desc:"Requires fairness testing for high-risk AI in credit scoring", pass: attrData.di_pass && attrData.dp_pass },
    { name:"RBI Responsible AI Guidelines 2024", desc:"Requires model explainability and bias monitoring for credit decisions", pass: attrData.di_pass },
    { name:"Equal Credit Opportunity Act", desc:"Prohibits discrimination based on gender, age, marital status", pass: attrData.di_pass && attrData.dp_pass },
  ];

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div className="page-badge">Fairness & Compliance</div>
        <div className="page-title">BiasScan — AI Fairness Auditor</div>
        <div className="page-subtitle">Disparate Impact · Demographic Parity · Equal Opportunity · EU AI Act 2024 Aligned</div>
      </div>

      {/* Attribute selector */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-card-header">
          <div className="chart-title">Protected Attribute</div>
          <div className="chart-subtitle">Select which demographic variable to audit</div>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {["gender","marital_status","job"].map(a => (
            <button key={a} onClick={() => setAttr(a)} style={{
              padding:"8px 20px", borderRadius:20, border:`2px solid ${attr===a?"var(--gold-500)":"var(--border)"}`,
              background: attr===a ? "rgba(201,168,76,0.1)" : "var(--bg3)",
              color: attr===a ? "var(--gold-600)" : "var(--muted)",
              fontWeight: attr===a ? 700 : 500,
              cursor:"pointer", fontSize:13, transition:"all 0.15s",
              textTransform:"capitalize",
            }}>
              {a.replace("_"," ")}
            </button>
          ))}
        </div>
      </div>

      {/* Fairness metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        {[
          { label:"Disparate Impact", value:attrData.disparate_impact, pass:attrData.di_pass, threshold:"≥ 0.80", desc:"Min/Max approval ratio" },
          { label:"Demo. Parity Diff", value:attrData.dp_difference, pass:attrData.dp_pass, threshold:"≤ 0.10", desc:"Approval rate gap" },
          { label:"Overall Score", value:`${overallScore}%`, pass:overallScore>=70, threshold:"≥ 70%", desc:"Combined fairness" },
          { label:"Status", value:overallScore>=70?"Fair":"Review", pass:overallScore>=70, threshold:"", desc:"Regulatory status" },
        ].map(({ label, value, pass, threshold, desc }) => (
          <div key={label} className="kpi-card" style={{ borderTopColor: pass ? "var(--green)" : "var(--red)" }}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ fontSize:"1.6rem", color: pass ? "var(--green)" : "var(--red)" }}>{value}</div>
            <div style={{ fontSize:11, marginTop:4 }}>
              <span style={{ color: pass ? "var(--green)" : "var(--red)", fontWeight:700 }}>{pass ? "✅ PASS" : "❌ FAIL"}</span>
              {threshold && <span style={{ color:"var(--muted)", marginLeft:6 }}>{threshold}</span>}
            </div>
            <div style={{ fontSize:11, color:"var(--faint)", marginTop:2 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Approval Rate by Group</div>
            <div className="chart-subtitle">Higher = more approvals</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attrData.groups} margin={{ left:0, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="group" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="approval_rate" name="Approval Rate" radius={[6,6,0,0]}>
                {attrData.groups.map((_,i) => <Cell key={i} fill={["#0a1628","#c9a84c","#16a34a","#7c3aed"][i%4]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Default Rate by Group</div>
            <div className="chart-subtitle">Predicted vs Actual comparison</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={attrData.groups} margin={{ left:0, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="group" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="actual_default_rate" name="Actual" fill="#dc2626" radius={[4,4,0,0]} opacity={0.7}/>
              <Bar dataKey="predicted_default_rate" name="Predicted" fill="#0a1628" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Group stats table */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-card-header">
          <div className="chart-title">Group Statistics</div>
          <div className="chart-subtitle">Detailed breakdown by {attr.replace("_"," ")}</div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {["Group","Count","Approval Rate","Actual Default %","Predicted Default %"].map(h=><th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {attrData.groups.map(g => (
                <tr key={g.group}>
                  <td style={{ fontWeight:600, textTransform:"capitalize" }}>{g.group}</td>
                  <td style={{ fontFamily:"var(--font-mono)" }}>{g.count.toLocaleString()}</td>
                  <td><span style={{ fontWeight:700, color:"var(--green)" }}>{g.approval_rate}%</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)", color:"var(--red)" }}>{g.actual_default_rate}%</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)", color:"var(--navy-700)" }}>{g.predicted_default_rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory compliance */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-title">Regulatory Compliance</div>
          <div className="chart-subtitle">International AI fairness standards</div>
        </div>
        {regulations.map(({ name, desc, pass }) => (
          <div key={name} className={`compliance-card ${pass ? "compliance-pass" : "compliance-warn"}`}>
            <div style={{ fontSize:20 }}>{pass ? "✅" : "⚠️"}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color: pass ? "var(--green)" : "var(--yellow)", marginBottom:3 }}>{name}</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{desc}</div>
            </div>
            <div style={{ marginLeft:"auto", flexShrink:0 }}>
              <span className={`badge ${pass ? "badge-green" : "badge-yellow"}`}>{pass ? "COMPLIANT" : "REVIEW"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
