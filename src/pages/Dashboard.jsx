import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
         XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const COLORS = ["#c9a84c","#dc2626","#16a34a","#2563eb","#7c3aed","#0891b2"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10,
                  padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight:700, marginBottom:4, color:"#0a1628" }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Dashboard({ stats }) {
  if (!stats) return (
    <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
      <div style={{ fontWeight:600 }}>Loading portfolio data...</div>
    </div>
  );

  const kpis = [
    { label:"Total Applications", value:stats.total?.toLocaleString(), delta:"+5,000 records", type:"neutral" },
    { label:"Approved",           value:stats.approved?.toLocaleString(), delta:`${(100-stats.default_rate).toFixed(1)}% rate`, type:"positive" },
    { label:"Defaulted",          value:stats.defaults?.toLocaleString(), delta:`${stats.default_rate}% rate`, type:"negative" },
    { label:"Avg Annual Income",  value:`₹${stats.avg_income?.toLocaleString()}`, delta:"Across all applicants", type:"neutral" },
    { label:"Best AUC Score",     value:stats.best_auc, delta:stats.best_model, type:"positive" },
  ];

  return (
    <div className="fade-in-up">
      {/* Page header */}
      <div className="page-header">
        <div className="page-badge">PRISM Analytics</div>
        <div className="page-title">Executive Dashboard</div>
        <div className="page-subtitle">
          Real-time portfolio overview · {stats.total?.toLocaleString()} credit applicants · 4 ML models trained
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {kpis.map(({ label, value, delta, type }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            <div className={`kpi-delta ${type}`}>
              {type === "positive" ? "↑" : type === "negative" ? "↓" : "·"} {delta}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20, marginBottom:20 }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Default Rate by Loan Purpose</div>
              <div className="chart-subtitle">% of applicants who defaulted per category</div>
            </div>
            <span className="badge badge-gold">Live Data</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.purpose_default_rates} layout="vertical" margin={{ left:20, right:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8" }} tickFormatter={v=>`${v}%`} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="purpose" tick={{ fontSize:12, fill:"#475569" }} axisLine={false} tickLine={false} width={80}/>
              <Tooltip content={<CustomTooltip/>} formatter={(v) => [`${v}%`,"Default Rate"]}/>
              <Bar dataKey="rate" radius={[0,6,6,0]} fill="#c9a84c"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Portfolio Risk Split</div>
              <div className="chart-subtitle">Approved vs defaulted applicants</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={[
                  { name:"Approved", value:stats.approved },
                  { name:"Defaulted", value:stats.defaults },
                ]}
                cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                dataKey="value" paddingAngle={3}>
                <Cell fill="#16a34a"/>
                <Cell fill="#dc2626"/>
              </Pie>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend iconType="circle" iconSize={10}
                formatter={(v) => <span style={{ fontSize:12, color:"#475569" }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Default Rate by Age Group</div>
              <div className="chart-subtitle">Younger applicants carry higher risk</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.age_default_rates} margin={{ left:0, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="age" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CustomTooltip/>} formatter={v=>[`${v}%`,"Default Rate"]}/>
              <Bar dataKey="rate" radius={[6,6,0,0]}>
                {stats.age_default_rates?.map((entry, i) => (
                  <Cell key={i} fill={entry.rate > 60 ? "#dc2626" : entry.rate > 40 ? "#d97706" : "#16a34a"}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Default Rate by Gender</div>
              <div className="chart-subtitle">BiasScan detected gender disparity</div>
            </div>
            <span className="badge badge-red">Bias Alert</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.gender_default_rates} margin={{ left:0, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="gender" tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
              <Tooltip content={<CustomTooltip/>} formatter={v=>[`${v}%`,"Default Rate"]}/>
              <Bar dataKey="rate" radius={[6,6,0,0]}>
                <Cell fill="#2563eb"/>
                <Cell fill="#7c3aed"/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Summary */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <div className="chart-title">Model Performance Summary</div>
            <div className="chart-subtitle">4 models trained and evaluated · Best: {stats.best_model}</div>
          </div>
          <span className="badge badge-green">Trained ✓</span>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {["Model","Accuracy","AUC","F1 Score","Precision","Recall"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.models && Object.entries(stats.models).map(([name, res]) => (
                <tr key={name}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontWeight:600 }}>{name}</span>
                      {name === stats.best_model && <span className="badge badge-gold">⭐ Best</span>}
                    </div>
                  </td>
                  <td><span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--navy-800)" }}>{res.accuracy}%</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)", fontWeight:700, color:"var(--gold-600)" }}>{res.auc}</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)" }}>{res.f1}</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)" }}>{res.precision}</span></td>
                  <td><span style={{ fontFamily:"var(--font-mono)" }}>{res.recall}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
