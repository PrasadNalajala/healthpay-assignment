import React, { useEffect, useMemo, useState } from "react";

function Money({ value }) {
  return <span>${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>;
}

export default function ClaimPanel({ onJumpToPage }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [showNmeOnly, setShowNmeOnly] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);
  // derive safe defaults so hooks order is stable even before data loads
  const edited_data = data?.edited_data ?? {};
  const audit_analysis = data?.audit_analysis ?? {};
  const segments = data?.segments ?? {};
  const claim_id = data?.claim_id ?? "";
  const claim_type = data?.claim_type ?? "";
  const status = data?.status ?? "";

  const bills = edited_data?.nme_analysis?.bills || [];
  const claimed = edited_data?.patient_summary?.hospitalization_details?.claimed_amount ?? 0;
  const totalBills = audit_analysis?.true_total_of_bills ?? 0;
  const discrepancy = audit_analysis?.discrepancy_amount ?? totalBills - claimed;
  const nmeCount = useMemo(
    () => bills.reduce((acc, b) => acc + (b.items?.filter((i) => i.is_nme).length || 0), 0),
    [bills]
  );
 
  function highlight(text) {
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${safe})`, "i"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark> : <span key={i}>{part}</span>
    );
  }

  function expandAll() {
    const obj = {};
    bills.forEach((b) => {
      if (b.bill?.bill_id) obj[b.bill.bill_id] = true;
    });
    setExpanded(obj);
  }

  function collapseAll() {
    setExpanded({});
  }

  const filteredBills = useMemo(() => {
    return bills
      .map((b) => {
        const items = (b.items || []).filter((it) => {
          if (showNmeOnly && !it.is_nme) return false;
          if (!q) return true;
          return it.item_name?.toLowerCase().includes(q.toLowerCase());
        });
        return { ...b, items };
      })
      .filter((b) => b.items.length > 0);
  }, [bills, q, showNmeOnly]);

  if (!data) return <div>Loading claim data… Place data.json in the repo root /public folder.</div>;

  function toggleExpand(id) {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  }

  return (
    <div className="space-y-6">
      <section className="p-4 bg-white rounded shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Claim Summary</h2>
            <div className="text-sm text-gray-500">Claim {claim_id} — {claim_type}</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Status</div>
            <div className="font-medium">{status}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Claimed</div>
            <div className="font-semibold"><Money value={claimed} /></div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Bills total</div>
            <div className="font-semibold"><Money value={totalBills} /></div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-500">Discrepancy</div>
            <div className="font-semibold text-red-600"><Money value={discrepancy} /></div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">{audit_analysis?.discrepancy_reason}</div>
      </section>

      <section className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold">Patient</h3>
        <div className="mt-2 text-sm">
          <div><strong>{edited_data.patient_summary.patient_details.patient_name}</strong></div>
          <div>DOB: {edited_data.patient_summary.patient_details.patient_dob} • Policy: {edited_data.patient_summary.patient_details.patient_policy_no}</div>
          <div className="text-gray-500">Contact: {edited_data.patient_summary.patient_details.patient_mobile} • {edited_data.patient_summary.patient_details.patient_email}</div>
        </div>
      </section>

      <section className="p-4 bg-white rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bills ({bills.length})</h3>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">NME items: <span className="text-red-600 font-medium">{nmeCount}</span></div>
            <div className="flex items-center space-x-2">
              <button onClick={expandAll} className="px-2 py-1 bg-white border rounded text-sm">Expand all</button>
              <button onClick={collapseAll} className="px-2 py-1 bg-white border rounded text-sm">Collapse all</button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button onClick={() => setQ("")} className="px-3 py-2 bg-white border rounded">Clear</button>
          <label className="inline-flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={showNmeOnly} onChange={(e) => setShowNmeOnly(e.target.checked)} />
            <span>Show NME only</span>
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {filteredBills.map((b) => {
            const bill = b.bill;
            const isOpen = expanded[bill.bill_id];
            return (
              <div key={bill.bill_id} className="border rounded">
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{bill.invoice_number}</div>
                    <div className="text-sm text-gray-500">{bill.bill_date} • {bill.facility_details?.name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono"><Money value={bill.net_amount} /></div>
                      <div className="text-sm">Page: <button className="text-blue-600 underline" onClick={() => onJumpToPage(bill.page_number)}>{bill.page_number}</button></div>
                    </div>
                    <div>
                      <button onClick={() => toggleExpand(bill.bill_id)} className="px-3 py-1 bg-white border rounded">
                        {isOpen ? "Collapse" : "Expand"}
                      </button>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="p-3 bg-gray-50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-600">
                          <th className="w-1/12">#</th>
                          <th className="w-5/12">Name</th>
                          <th className="w-3/12">Category</th>
                          <th className="w-2/12">Amount</th>
                          <th className="w-1/12">Flag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.items.map((it) => (
                          <tr key={it.item_id} className={it.is_nme ? "bg-red-50" : ""}>
                            <td className="py-2">{it["s.no."]}</td>
                            <td className="py-2">{highlight(it.item_name)}</td>
                            <td className="py-2 text-sm text-gray-700">{it.category}</td>
                            <td className="py-2"><Money value={it.final_amount} /></td>
                            <td className="py-2">
                              {it.is_nme ? <span className="text-xs px-2 py-1 bg-red-600 text-white rounded">NME</span> : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold">Audit Issues</h3>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500">Medical legibility</div>
            <div className="font-medium">{audit_analysis.medical_legibility_issues}</div>
            <ul className="mt-2 list-disc ml-5 text-sm text-gray-700">
              {audit_analysis.medical_legibility?.flagged_items?.map((f, i) => (
                <li key={i}>{f.item_name} — {f.flag_reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-gray-500">Policy violations</div>
            <div className="font-medium">{audit_analysis.policy_violations_count}</div>
            <ul className="mt-2 list-disc ml-5 text-sm text-gray-700">
              {audit_analysis.policy_violations?.map((p, i) => (
                <li key={i}>{p.item_name} — {p.violation_details} — <strong><Money value={p.amount_impacted} /></strong></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="p-4 bg-white rounded shadow-sm">
        <h3 className="font-semibold">Document Segments</h3>
        <div className="mt-2 space-y-2">
          {Object.entries(segments.aggregated_segments).map(([key, seg]) => (
            <div key={key} className="flex items-center justify-between">
              <div className="capitalize">{key.replace(/_/g, " ")}</div>
              <div className="space-x-2">
                {seg.page_ranges.map((r, idx) => {
                  const label = r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`;
                  return (
                    <button
                      key={idx}
                      className="text-sm text-blue-600 underline"
                      onClick={() => onJumpToPage(r.start)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
