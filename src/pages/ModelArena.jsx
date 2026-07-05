import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from "recharts";

const COLORS = ["#0a1628","#c9a84c","#16a34a","#dc2626"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 14px", boxShadow:"0 4px 16px rgba(0,0,0,0.1)" }}>
      <div style={{ fontWeight:700, marginBottom:4, color:"#0a1628" }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ fontSize:12, color:p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}</div>
      ))}
    </div>
  );
};

export default function ModelArena({ stats }) {
  if (!stats?.models) return <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>Loading models...</div>;

  const models = stats.models;
  const best = stats.best_model;

  const radarData = ["Accuracy","AUC","F1","Precision","Recall"].map(metric => {
    const row = { metric };
    Object.entries(models).forEach(([name, res]) => {
      row[name] = metric === "Accuracy" ? res.accuracy/100 : res[metric.toLowerCase().replace(" ","_")] || res[metric.toLowerCase()];
    });
    return row;
  });

  const barData = Object.entries(models).map(([name, res]) => ({
    name, Accuracy: res.accuracy/100, AUC: res.auc, F1: res.f1, Precision: res.precision,
  }));

  const fi = stats.feature_importances || {};
  const fiData = Object.entries(fi)
    .sort((a,b) => b[1]-a[1]).slice(0,12)
    .map(([feature, importance]) => ({ feature, importance: parseFloat(importance.toFixed(4)) }));

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div className="page-badge">ML Competition</div>
        <div className="page-title">Model Arena</div>
        <div className="page-subtitle">4 models head-to-head · Logistic Regression · Random Forest · XGBoost · SVM</div>
      </div>

      {/* Winner banner */}
      <div style={{ background:"linear-gradient(135deg, #0a1628, #1e3a5f)", borderRadius:16, padding:"20px 28px", marginBottom:20, border:"1px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ fontSize:40 }}>🏆</div>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:"#94a3b8", textTransform:"uppercase", marginBottom:4 }}>Champion Model</div>
          <div style={{ fontFamily:"var(--font-head)", fontSize:24, fontWeight:800, color:"var(--gold-400)" }}>{best}</div>
          <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>
            AUC: <span style={{ color:"var(--gold-500)", fontWeight:700 }}>{models[best]?.auc}</span> &nbsp;|&nbsp;
            Accuracy: <span style={{ color:"var(--gold-500)", fontWeight:700 }}>{models[best]?.accuracy}%</span> &nbsp;|&nbsp;
            F1: <span style={{ color:"var(--gold-500)", fontWeight:700 }}>{models[best]?.f1}</span>
          </div>
        </div>
      </div>

      {/* Model cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
        {Object.entries(models).map(([name, res], i) => (
          <div key={name} className="kpi-card" style={{ borderTopColor: name===best ? "var(--gold-500)" : COLORS[i] }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div className="kpi-label">{name}</div>
              {name === best && <span className="badge badge-gold">⭐ Best</span>}
            </div>
            <div className="kpi-value" style={{ fontSize:"1.6rem", color: name===best ? "var(--gold-600)" : "var(--navy-800)" }}>{res.accuracy}%</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>Accuracy</div>
            <hr className="divider" style={{ margin:"10px 0" }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {[["AUC",res.auc],["F1",res.f1],["Precision",res.precision],["Recall",res.recall]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:9, fontWeight:700, letterSpacing:1, color:"var(--faint)", textTransform:"uppercase" }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:700, fontFamily:"var(--font-mono)", color:"var(--navy-700)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        {/* Radar */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Performance Radar</div>
            <div className="chart-subtitle">Multi-metric comparison</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0"/>
              <PolarAngleAxis dataKey="metric" tick={{ fontSize:12, fill:"#475569" }}/>
              {Object.keys(models).map((name,i) => (
                <Radar key={name} name={name} dataKey={name} stroke={COLORS[i]}
                       fill={COLORS[i]} fillOpacity={0.08} strokeWidth={2}/>
              ))}
              <Legend iconSize={10} formatter={v=><span style={{ fontSize:11, color:"#475569" }}>{v}</span>}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar comparison */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-title">Metric Comparison</div>
            <div className="chart-subtitle">Side-by-side scores</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ left:0, right:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{ fontSize:10, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,1]} tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend iconSize={10} formatter={v=><span style={{ fontSize:11, color:"#475569" }}>{v}</span>}/>
              <Bar dataKey="AUC" fill="#c9a84c" radius={[4,4,0,0]}/>
              <Bar dataKey="F1" fill="#0a1628" radius={[4,4,0,0]}/>
              <Bar dataKey="Precision" fill="#16a34a" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature importance */}
      {fiData.length > 0 && (
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <div className="chart-title">Feature Importance (Random Forest)</div>
              <div className="chart-subtitle">Which variables drive credit default predictions most</div>
            </div>
            <span className="badge badge-navy">Top 12 Features</span>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={fiData} layout="vertical" margin={{ left:120, right:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="feature" tick={{ fontSize:12, fill:"#475569" }} axisLine={false} tickLine={false} width={110}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="importance" radius={[0,6,6,0]}>
                {fiData.map((_, i) => <Cell key={i} fill={i === 0 ? "#c9a84c" : i < 3 ? "#0a1628" : "#94a3b8"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
