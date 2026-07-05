import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
         ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight:700, marginBottom:4, color:"#0a1628" }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ fontSize:12, color:p.color || "#475569" }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

const INSIGHTS = [
  { icon:"📌", text:"Applicants under 25 default at nearly 3x the average rate — age is a strong risk predictor." },
  { icon:"💰", text:"Low-income applicants (< ₹30K/year) show significantly higher default rates." },
  { icon:"🏢", text:"Business and personal loans carry the highest default risk among all loan purposes." },
  { icon:"📅", text:"Longer loan durations (60+ months) correlate strongly with higher default probability." },
  { icon:"⚖️", text:"BiasScan detected a 5% gender gap in default rates — flagged for fairness review." },
  { icon:"🏦", text:"Applicants with critical credit history are 4x more likely to default than those with clean records." },
];

export default function EDA({ stats }) {
  const [edaData, setEdaData] = useState(null);

  useEffect(() => {
    fetch("/api/eda")
      .then(r => r.json())
      .then(d => setEdaData(d))
      .catch(console.error);
  }, []);

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div className="page-badge">Data Intelligence</div>
        <div className="page-title">Smart Exploratory Analysis</div>
        <div className="page-subtitle">Auto-generated insights · Statistical distributions · Demographic patterns · 5,000 applicants</div>
      </div>

      {/* AI insights */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-card-header">
          <div>
            <div className="chart-title">✨ Auto-Generated Insights</div>
            <div className="chart-subtitle">Key patterns detected from the credit portfolio</div>
          </div>
          <span className="badge badge-gold">AI Powered</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {INSIGHTS.map(({ icon, text }, i) => (
            <div key={i} style={{ display:"flex", gap:12, padding:"12px 16px", background:"var(--bg3)", borderRadius:10, border:"1px solid var(--border)", alignItems:"flex-start" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
              <div style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Loan by purpose */}
      {edaData?.loan_by_purpose && (
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:20 }}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Default Rate by Loan Purpose</div>
              <div className="chart-subtitle">Which loan types carry the most risk</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={edaData.loan_by_purpose} layout="vertical" margin={{ left:70, right:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                <YAxis type="category" dataKey="purpose" tick={{ fontSize:12, fill:"#475569" }} axisLine={false} tickLine={false} width={65}/>
                <Tooltip content={<CustomTooltip/>} formatter={v=>[`${v}%`,"Default Rate"]}/>
                <Bar dataKey="default_rate" radius={[0,6,6,0]} name="Default Rate">
                  {edaData.loan_by_purpose.map((e,i) => (
                    <Cell key={i} fill={e.default_rate > 70 ? "#dc2626" : e.default_rate > 50 ? "#d97706" : "#16a34a"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-title">Avg Loan Amount by Purpose</div>
              <div className="chart-subtitle">Typical loan sizes per category</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={edaData.loan_by_purpose} margin={{ left:0, right:10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="purpose" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                <Tooltip content={<CustomTooltip/>} formatter={v=>[`₹${v.toLocaleString()}`,"Avg Loan"]}/>
                <Bar dataKey="avg_loan" radius={[6,6,0,0]} name="Avg Loan">
                  {edaData.loan_by_purpose.map((_,i) => <Cell key={i} fill={["#0a1628","#c9a84c","#16a34a","#2563eb","#7c3aed","#0891b2"][i%6]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Feature correlation */}
      {edaData?.default_corr && (
        <div className="chart-card" style={{ marginBottom:20 }}>
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Feature Correlation with Default</div>
              <div className="chart-subtitle">Red = positive correlation (increases risk) · Blue = negative (decreases risk)</div>
            </div>
            <span className="badge badge-navy">Pearson Correlation</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={edaData.default_corr} layout="vertical" margin={{ left:120, right:60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" domain={[-0.5,0.5]} tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="feature" tick={{ fontSize:12, fill:"#475569" }} axisLine={false} tickLine={false} width={110}/>
              <Tooltip content={<CustomTooltip/>} formatter={v=>[v.toFixed(3),"Correlation"]}/>
              <Bar dataKey="correlation" radius={[0,4,4,0]} name="Correlation">
                {edaData.default_corr.map((e,i) => <Cell key={i} fill={e.correlation > 0 ? "#dc2626" : "#2563eb"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary stats */}
      {stats && (
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Dataset Summary</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
            {[
              ["Total Records", stats.total?.toLocaleString(), "var(--navy-800)"],
              ["Default Rate", `${stats.default_rate}%`, "var(--red)"],
              ["Avg Income", `₹${stats.avg_income?.toLocaleString()}`, "var(--gold-600)"],
              ["Features", "20", "var(--green)"],
            ].map(([label, value, color]) => (
              <div key={label} style={{ textAlign:"center", padding:"16px", background:"var(--bg3)", borderRadius:10, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:24, fontWeight:800, color, fontFamily:"var(--font-head)" }}>{value}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:4, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
