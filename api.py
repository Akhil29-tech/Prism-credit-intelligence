"""
backend/api.py — PRISM Flask API
Run: python3 api.py
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)
CORS(app)

# ── Load models ───────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

def load_artifacts():
    with open(f"{MODELS_DIR}/meta.json") as f:
        meta = json.load(f)
    models = {}
    for name in ["logistic_regression","random_forest","xgboost","svm"]:
        path = f"{MODELS_DIR}/{name}.pkl"
        if os.path.exists(path):
            models[name] = joblib.load(path)
    scaler   = joblib.load(f"{MODELS_DIR}/scaler.pkl")
    encoders = joblib.load(f"{MODELS_DIR}/encoders.pkl")
    return models, scaler, encoders, meta

models, scaler, encoders, meta = load_artifacts()

def get_cibil(prob):
    return int(900 - prob * 600)

def encode_row(raw):
    row = pd.DataFrame([raw])
    cat_cols = ["savings","checking_account","purpose","gender","marital_status",
                "housing","job","foreign_worker","credit_history","telephone","property"]
    for col in cat_cols:
        le = encoders.get(col)
        if le:
            val = str(row[col].iloc[0])
            row[col] = le.transform([val])[0] if val in le.classes_ else 0
    row["debt_to_income"] = round(raw["loan_amount"] / raw["income"], 2)
    return row[meta["feature_names"]]

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "best_model": meta["best_model"]})

@app.route("/api/stats")
def stats():
    """Portfolio statistics for dashboard."""
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "data", "credit_data.csv"))
    total    = len(df)
    defaults = int(df["default"].sum())
    approved = total - defaults

    purpose_dr = df.groupby("purpose")["default"].agg(["mean","count"]).reset_index()
    purpose_dr["rate"] = (purpose_dr["mean"] * 100).round(1)

    age_groups = pd.cut(df["age"], bins=[17,25,35,45,55,75],
                        labels=["18-25","26-35","36-45","46-55","56+"])
    age_dr = df.groupby(age_groups, observed=True)["default"].mean().reset_index()
    age_dr["rate"] = (age_dr["default"] * 100).round(1)

    gender_dr = df.groupby("gender")["default"].agg(["mean","count"]).reset_index()
    gender_dr["rate"] = (gender_dr["mean"] * 100).round(1)

    return jsonify({
        "total": total,
        "defaults": defaults,
        "approved": approved,
        "default_rate": round(defaults/total*100, 1),
        "avg_income": int(df["income"].mean()),
        "avg_loan": int(df["loan_amount"].mean()),
        "best_model": meta["best_model"],
        "best_auc": meta["results"][meta["best_model"]]["auc"],
        "best_accuracy": meta["results"][meta["best_model"]]["accuracy"],
        "purpose_default_rates": purpose_dr[["purpose","rate","count"]].to_dict("records"),
        "age_default_rates": age_dr[["age","rate"]].to_dict("records"),
        "gender_default_rates": gender_dr[["gender","rate","count"]].to_dict("records"),
        "models": meta["results"],
        "feature_importances": meta.get("feature_importances", {}),
    })

@app.route("/api/predict", methods=["POST"])
def predict():
    """Predict credit risk for a single applicant."""
    data = request.json
    try:
        row = encode_row(data)
        row_sc = scaler.transform(row)

        best_key = meta["best_model"].replace(" ","_").lower()
        model = models[best_key]

        prob  = float(model.predict_proba(row_sc)[0][1])
        pred  = int(model.predict(row_sc)[0])
        cibil = get_cibil(prob)

        # All model predictions
        all_preds = {}
        for name, m in models.items():
            p = float(m.predict_proba(row_sc)[0][1])
            all_preds[name] = {
                "probability": round(p, 4),
                "cibil": get_cibil(p),
                "prediction": int(m.predict(row_sc)[0])
            }

        # SHAP values
        shap_values = []
        try:
            import shap
            explainer = shap.TreeExplainer(model)
            sv = explainer.shap_values(row_sc)
            if isinstance(sv, list):
                sv = sv[1]
            sv = sv[0]
            feature_names = meta["feature_names"]
            shap_data = sorted(
                [{"feature": f, "value": round(float(v), 4)} for f, v in zip(feature_names, sv)],
                key=lambda x: abs(x["value"]), reverse=True
            )[:10]
            shap_values = shap_data
        except Exception:
            pass

        risk_label = ("Low Risk" if prob < 0.25 else
                      "Medium Risk" if prob < 0.50 else
                      "High Risk" if prob < 0.75 else "Very High Risk")

        decision = ("APPROVED" if prob < 0.35 else
                    "CONDITIONAL" if prob < 0.55 else "DECLINED")

        return jsonify({
            "probability": round(prob, 4),
            "prediction": pred,
            "cibil_score": cibil,
            "risk_label": risk_label,
            "decision": decision,
            "all_models": all_preds,
            "shap_values": shap_values,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/whatif", methods=["POST"])
def whatif():
    """Simulate how changing a variable affects risk."""
    data = request.json
    base = data["base"]
    variable = data["variable"]
    values = data["values"]

    results = []
    best_key = meta["best_model"].replace(" ","_").lower()
    model = models[best_key]

    for v in values:
        sim = base.copy()
        sim[variable] = v
        if variable in ["income", "loan_amount"]:
            sim["debt_to_income"] = round(sim["loan_amount"] / sim["income"], 2)
        try:
            row = encode_row(sim)
            row_sc = scaler.transform(row)
            prob = float(model.predict_proba(row_sc)[0][1])
            results.append({"value": v, "probability": round(prob, 4), "cibil": get_cibil(prob)})
        except:
            pass

    return jsonify({"results": results})

@app.route("/api/fairness")
def fairness():
    """BiasScan fairness metrics."""
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "data", "credit_data.csv"))
    best_key = meta["best_model"].replace(" ","_").lower()
    model = models[best_key]

    df_enc = df.copy()
    cat_cols = ["savings","checking_account","purpose","gender","marital_status",
                "housing","job","foreign_worker","credit_history","telephone","property"]
    for col in cat_cols:
        le = encoders.get(col)
        if le:
            df_enc[col] = df_enc[col].astype(str).map(
                lambda x, le=le: le.transform([x])[0] if x in le.classes_ else 0
            )
    X = df_enc[meta["feature_names"]]
    X_sc = scaler.transform(X)
    df["predicted"] = model.predict(X_sc)
    df["probability"] = model.predict_proba(X_sc)[:, 1]

    results = {}
    for attr in ["gender", "marital_status", "job"]:
        groups = []
        for g in df[attr].unique():
            mask = df[attr] == g
            g_df = df[mask]
            groups.append({
                "group": g,
                "count": int(len(g_df)),
                "approval_rate": round(float((g_df["predicted"] == 0).mean()) * 100, 1),
                "actual_default_rate": round(float(g_df["default"].mean()) * 100, 1),
                "predicted_default_rate": round(float(g_df["predicted"].mean()) * 100, 1),
            })
        approval_rates = [g["approval_rate"]/100 for g in groups]
        di = round(min(approval_rates)/max(approval_rates), 3) if max(approval_rates) > 0 else 1.0
        dp_diff = round(max(approval_rates) - min(approval_rates), 3)
        results[attr] = {
            "groups": groups,
            "disparate_impact": di,
            "dp_difference": dp_diff,
            "di_pass": di >= 0.8,
            "dp_pass": dp_diff <= 0.1,
        }

    return jsonify(results)

@app.route("/api/eda")
def eda():
    """EDA data for charts."""
    df = pd.read_csv(os.path.join(os.path.dirname(__file__), "..", "data", "credit_data.csv"))

    income_bins = pd.cut(df["income"], bins=20)
    income_dist = df.groupby([income_bins, "default"], observed=True).size().reset_index(name="count")
    income_dist["income_range"] = income_dist["income"].astype(str)

    loan_dist = df.groupby("purpose").agg(
        count=("loan_amount","count"),
        avg_loan=("loan_amount","mean"),
        default_rate=("default","mean")
    ).reset_index()
    loan_dist["default_rate"] = (loan_dist["default_rate"] * 100).round(1)
    loan_dist["avg_loan"] = loan_dist["avg_loan"].round(0).astype(int)

    corr = df[["age","income","employment_years","loan_amount","loan_duration","debt_to_income","default"]].corr()
    default_corr = corr["default"].drop("default").sort_values().reset_index()
    default_corr.columns = ["feature","correlation"]
    default_corr["correlation"] = default_corr["correlation"].round(3)

    return jsonify({
        "loan_by_purpose": loan_dist.to_dict("records"),
        "default_corr": default_corr.to_dict("records"),
        "total": len(df),
        "default_rate": round(df["default"].mean() * 100, 1),
        "avg_income": int(df["income"].mean()),
    })

if __name__ == "__main__":
    app.run(debug=True, port=5001)
