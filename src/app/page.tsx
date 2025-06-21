"use client";


import { useState } from "react";

function formatReason(raw: string): string {
  const match = raw.match(/^(.+?)_(.+?) \(\+?([-.0-9]+)\)$/);
  if (!match) return raw;

  const [, field, value, score] = match;

  const fieldMap: Record<string, string> = {
    icd_code: "ICD code",
    cpt_code: "CPT code",
    payer: "Payer",
    provider_type: "Provider type",
  };

  const fieldLabel = fieldMap[field] || field;
  return `${fieldLabel} "${value}" is associated with higher denial risk. This feature alone contributes +${parseFloat(score).toFixed(2)} to the model's prediction.`;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [risk, setRisk] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    icd_code: "S43.421A",
    cpt_code: "73721",
    payer: "Blue Cross",
    provider_type: "Chiropractor",
  });

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setRisk(null);
    setReasons([]);

    try {
      const res = await fetch("https://claimguard-v1.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setRisk(data.denial_risk);
      setReasons(data.reasons || []);
    } catch (err: any) {
      setError("Failed to get prediction.");
    }

    setLoading(false);
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">🧠 ClaimGuard v1</h1>
      <p className="mb-6 text-gray-600">Check denial risk for a medical claim.</p>

      {/* Form */}
      <div className="space-y-4">
        <Dropdown label="ICD Code" field="icd_code" value={form.icd_code} options={["S43.421A", "M54.5", "J45.909", "E11.9", "I10"]} onChange={handleChange} />
        <Dropdown label="CPT Code" field="cpt_code" value={form.cpt_code} options={["73721", "99213", "70450", "97110", "93000"]} onChange={handleChange} />
        <Dropdown label="Payer" field="payer" value={form.payer} options={["Blue Cross", "Aetna", "UnitedHealthcare", "Medicare", "Cigna"]} onChange={handleChange} />
        <Dropdown label="Provider Type" field="provider_type" value={form.provider_type} options={["Orthopedic", "Chiropractor", "Radiologist", "Physical Therapist", "Primary Care"]} onChange={handleChange} />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? "Predicting..." : "Check Denial Risk"}
        </button>
      </div>

      {/* Output */}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {risk !== null && (
        <div className="mt-6">
          <h2 className="text-xl font-bold">📊 Denial Risk: {Math.round(risk * 100)}%</h2>
          <ul className="mt-2 list-disc list-inside text-gray-700">
            {reasons.map((r, i) => (
              <li key={i}>{formatReason(r)}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

// Component for reusability
function Dropdown({ label, field, value, options, onChange }: {
  label: string;
  field: string;
  value: string;
  options: string[];
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
