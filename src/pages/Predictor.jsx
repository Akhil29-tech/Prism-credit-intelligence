import { useState } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const FIELDS = {
  age: { label:"Age", type:"number", min:18, max:75, default:35 },
  income: { label:"Annual Income (₹)", type:"number", min:15000, max:500000, default:50000, step:5000 },
  employment_years: { label:"Employment Years", type:"number", min:0, max:40, default:5 },
  loan_amount: { label:"Loan Amount (₹)", type:"number", min:10000, max:1000000, default:100000, step:10000 },
  loan_duration: { label:"Loan Duration (months)", type:"select", options:[12,24,36,48,60,84], default:36 },
  purpose: { label:"Loan Purpose", type:"select", options:["car","furniture","education","business","home","personal"], default:"car" },
  credit_history: { label:"Credit History", type:"select", options:["existing paid","all paid","delayed","critical","no credits"], default:"existing paid" },
  checking_account: { label:"Checking Account", type:"select", options:["< 0","0-200","> 200","no account"], default:"0-200" },
  savings: { label:"Savings Account", type:"select", options:["< 100","100-500","500-1000","1000-5000","> 5000"], default:"100-500" },
  job: { label:"Employment Type", type:"select", options:["skilled","unskilled","management","unemployed"], default:"skilled" },
  gender: { label:"Gender", type:"select", options:["Male","Female"], default:"Male" },
  marital_status: { label:"Marital Status", type:"select", options:["Single","Married","Divorced"], default:"Single" },
  housing: { label:"Housing", type:"select", options:["own","rent","free"], default:"own" },
};

export default function Predictor() {
  const [form, setForm] = useState(Object.fromEntries(Object.entries(FIELDS).map(([k,v])=>[k,v.default])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: isNaN(v) ? v : (FIELDS[k]?.type === "select" ? v : Number(v)) }));

  const predict = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        num_credits: 2, existing_credits: 1, dependents: 1,
        foreign_worker: "yes", telephone: "yes", property: "real estate",
        debt_to_income: parseFloat((form.loan_amount / form.income).toFixed(2)),
      };
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const getCibilColor = (score) => {
    if (score >= 750) return "var(--green)";
    if (score >= 600) return "var(--yellow)";
    return "var(--red)";
  };

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div className="page-badge">AI Decision Engine</div>
        <div className="page-title">Loan Risk Predictor</div>
        <div className="page-subtitle">Enter applicant details → CIBIL score + SHAP explanation + instant decision</div>
      </div>

      {/* Form */}
      <div className="chart-card" style={{ marginBottom:20 }}>
        <div className="chart-card-header">
          <div>
            <div className="chart-title">Applicant Profile</div>
            <div className="chart-subtitle">Fill in the details below to get an instant credit risk assessment</div>
          </div>
        </div>
        <div className="form-grid">
          {Object.entries(FIELDS).map(([key, field]) => (
            <div className="form-group" key={key}>
              <label className="form-label">{field.label}</label>
              {field.type === "select" ? (
                <select className="form-select" value={form[key]} onChange={e => set(key, e.target.value)}>
                  {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type="number" className="form-input" value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  min={field.min} max={field.max} step={field.step || 1}/>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop:24 }}>
          <button className="btn btn-primary btn-full" onClick={predict} disabled={loading}>
            {loading ? "⏳ Analysing..." : "🔍 Analyse Credit Risk"}
          </button>
        </div>
        {error && <div style={{ marginTop:12, color:"var(--red)", fontSize:13, padding:"10px 14px", background:"#fee2e2", borderRadius:8 }}>{error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in">
          {/* CIBIL score + decision */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:20 }}>
            {[
              { label:"CIBIL Score", value:result.cibil_score, color:getCibilColor(result.cibil_score) },
              { label:"Default Probability", value:`${(result.probability*100).toFixed(1)}%`, color:result.probability > 0.5 ? "var(--red)" : "var(--green)" },
              { label:"Risk Category", value:result.risk_label, color:"var(--navy-800)" },
              { label:"Decision", value:result.decision, color:result.decision==="APPROVED"?"var(--green)":result.decision==="CONDITIONAL"?"var(--yellow)":"var(--red)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-label">{label}</div>
                <div className="kpi-value" style={{ fontSize:"1.5rem", color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Decision banner */}
          <div className={`decision-${result.decision.toLowerCase()}`}>
            <div className="decision-title" style={{ color: result.decision==="APPROVED"?"var(--green)":result.decision==="CONDITIONAL"?"var(--yellow)":"var(--red)" }}>
              {result.decision === "APPROVED" ? "✅ LOAN APPROVED" : result.decision === "CONDITIONAL" ? "⚠️ CONDITIONAL APPROVAL" : "❌ LOAN DECLINED"}
            </div>
            <div className="decision-subtitle">
              {result.decision === "APPROVED" && "Low default risk. Applicant meets all lending criteria."}
              {result.decision === "CONDITIONAL" && "Medium risk. Consider additional collateral or guarantor before proceeding."}
              {result.decision === "DECLINED" && "High default risk. Applicant does not meet minimum lending criteria."}
            </div>
          </div>

          {/* SHAP explanation */}
          {result.shap_values?.length > 0 && (
            <div className="chart-card" style={{ marginBottom:20 }}>
              <div className="chart-card-header">
                <div>
                  <div className="chart-title">🔍 Why this decision? (SHAP Explanation)</div>
                  <div className="chart-subtitle">Red = increases default risk · Green = decreases risk</div>
                </div>
                <span className="badge badge-navy">XAI Powered</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={result.shap_values} layout="vertical" margin={{ left:120, right:40 }}>
                  <XAxis type="number" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="feature" tick={{ fontSize:12, fill:"#475569" }} axisLine={false} tickLine={false} width={110}/>
                  <Tooltip formatter={(v) => [`${v.toFixed(4)}`, "SHAP Value"]}
                    contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8 }}/>
                  <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={2}/>
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {result.shap_values.map((d, i) => (
                      <Cell key={i} fill={d.value > 0 ? "#dc2626" : "#16a34a"}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* All models comparison */}
          {result.all_models && (
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title">All Models Comparison</div>
                <div className="chart-subtitle">Risk assessment across all 4 trained models</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                {Object.entries(result.all_models).map(([name, m]) => (
                  <div key={name} style={{ background:"var(--bg3)", borderRadius:10, padding:"16px", textAlign:"center", border:"1px solid var(--border)" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>{name.replace("_"," ")}</div>
                    <div style={{ fontSize:24, fontWeight:800, color:getCibilColor(m.cibil), fontFamily:"var(--font-head)" }}>{m.cibil}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>CIBIL Score</div>
                    <div style={{ fontSize:13, fontWeight:600, color:m.probability > 0.5 ? "var(--red)" : "var(--green)", marginTop:6 }}>
                      {(m.probability*100).toFixed(1)}% risk
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
