import { useState, useEffect } from "react";
import { Card, StatCard, Table, Td, Btn, Select, StatusBadge, Avatar, getColor, G } from "../components/UI.jsx";
import { payrollApi } from "../utils/api.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MO_SHORT = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Payroll() {
  const [runs,     setRuns]     = useState([]);
  const [records,  setRecords]  = useState([]);
  const [selRun,   setSelRun]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [month,    setMonth]    = useState(MONTHS[new Date().getMonth()]);
  const [cycle,    setCycle]    = useState("Monthly");
  const [slip,     setSlip]     = useState(null);
  const [runMsg,   setRunMsg]   = useState("");

  useEffect(() => {
    payrollApi.getRuns()
      .then(r => {
        const list = Array.isArray(r) ? r : [];
        setRuns(list);
        if (list.length > 0) {
          setSelRun(list[0]);
          return payrollApi.getRecords(list[0].id);
        }
        return [];
      })
      .then(rows => setRecords(Array.isArray(rows) ? rows : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadRun = (run) => {
    setSelRun(run);
    setLoading(true);
    payrollApi.getRecords(run.id)
      .then(rows => setRecords(Array.isArray(rows) ? rows : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const runPayroll = () => {
    setRunning(true); setRunMsg("");
    const monthIdx = MONTHS.indexOf(month) + 1;
    payrollApi.runPayroll({ month: monthIdx, year: new Date().getFullYear(), payCycle: cycle })
      .then(run => {
        setRunMsg(`✅ Payroll processed for ${month} ${new Date().getFullYear()} — ${run.employeesProcessed||0} employees`);
        return payrollApi.getRuns().then(list => {
          setRuns(Array.isArray(list) ? list : []);
          const fresh = Array.isArray(list) ? list[0] : null;
          if (fresh) { setSelRun(fresh); return payrollApi.getRecords(fresh.id); }
          return [];
        });
      })
      .then(rows => setRecords(Array.isArray(rows) ? rows : []))
      .catch(e => setRunMsg("⚠️ " + e.message))
      .finally(() => setRunning(false));
  };

  // Totals
  const total   = records.reduce((s,p) => s + (+p.net_pay  || 0), 0);
  const gross   = records.reduce((s,p) => s + (+p.gross    || 0), 0);
  const deduct  = records.reduce((s,p) => s + (+p.total_deduct || 0), 0);
  const processed = records.filter(p => p.status === "Processed").length;

  // ── Payslip Modal ──────────────────────────────────────────────────────────
  if (slip) {
    const g = +slip.gross || 0;
    const d = +slip.total_deduct || 0;
    const MONTHS_LONG = MONTHS;
    const slipMonth = selRun ? MONTHS_LONG[(selRun.month||1)-1] : month;
    const slipYear  = selRun?.year || new Date().getFullYear();

    return (
      <div style={{ padding:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <Btn variant="ghost" onClick={() => setSlip(null)}>← Back to Payroll</Btn>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:17 }}>
            Payslip — {slip.employee_name} — {slipMonth} {slipYear}
          </div>
          <Btn style={{ marginLeft:"auto" }} onClick={() => window.print()}>🖨 Print</Btn>
        </div>

        <div style={{ maxWidth:720, margin:"0 auto", background:G.card, border:`1px solid ${G.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.1)" }}>
          {/* Header */}
          <div style={{ background:G.ink, padding:"28px 40px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:24, color:"#fff", letterSpacing:"-0.02em" }}>
                DIGI<span style={{ color:G.accent }}>HR</span>
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", marginTop:3 }}>www.digihr.in</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:18, color:"#fff" }}>SALARY SLIP</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:3 }}>{slipMonth} {slipYear}</div>
            </div>
          </div>

          {/* Employee info */}
          <div style={{ padding:"24px 40px", borderBottom:`1px solid ${G.border}`, display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            {[
              ["Employee Name", slip.employee_name],
              ["Employee ID",   slip.emp_code],
              ["Department",    slip.department],
              ["Designation",   slip.designation||"—"],
              ["Bank Account",  slip.bank_account||"—"],
              ["Pay Period",    `${slipMonth} ${slipYear}`],
              ["Days Worked",   slip.days_worked != null ? `${slip.days_worked} days` : "—"],
              ["LOP Days",      slip.lop_days > 0 ? `${slip.lop_days} days` : "0 days"],
            ].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:10, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:600, color:G.ink }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Earnings / Deductions */}
          <div style={{ padding:"28px 40px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:36 }}>
            <div>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:12, letterSpacing:"0.1em", color:G.muted, textTransform:"uppercase", marginBottom:16 }}>EARNINGS</div>
              {[
                ["Basic Salary",     +slip.basic    || 0],
                ["HRA",              +slip.hra      || 0],
                ["Special Allowance",+slip.special_allow || 0],
                ["Other Allowances", +slip.other_allow   || 0],
              ].map(([l,v]) => v > 0 && (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, marginBottom:10, borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ fontSize:13, color:G.ink2 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>₹{v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:6 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Gross Earnings</span>
                <span style={{ fontSize:15, fontWeight:800, fontFamily:G.fontHead, color:G.green }}>₹{g.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:12, letterSpacing:"0.1em", color:G.muted, textTransform:"uppercase", marginBottom:16 }}>DEDUCTIONS</div>
              {[
                ["PF (Employee 12%)",  +slip.pf_employee  || 0],
                ["ESI (Employee 0.75%)",+slip.esi_employee || 0],
                ["TDS",                +slip.tds           || 0],
                ["LOP Deduction",      +slip.other_deduct  || 0],
              ].map(([l,v]) => v > 0 && (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, marginBottom:10, borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ fontSize:13, color:G.ink2 }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:"#EF4444" }}>-₹{v.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", paddingTop:6 }}>
                <span style={{ fontSize:13, fontWeight:700 }}>Total Deductions</span>
                <span style={{ fontSize:15, fontWeight:800, fontFamily:G.fontHead, color:"#EF4444" }}>-₹{d.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net pay */}
          <div style={{ background:G.accentBg, borderTop:`2px solid ${G.accent}`, padding:"24px 40px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:16, color:G.ink }}>NET PAY</div>
              <div style={{ fontSize:12, color:G.muted, marginTop:3 }}>After all deductions</div>
            </div>
            <div style={{ fontFamily:G.fontHead, fontWeight:900, fontSize:36, color:G.accent }}>
              ₹{(+slip.net_pay||0).toLocaleString()}
            </div>
          </div>

          {/* Employer contributions note */}
          <div style={{ padding:"16px 40px", borderTop:`1px solid ${G.border}`, background:G.bg }}>
            <div style={{ fontSize:11, color:G.muted }}>
              Employer Contributions — PF: ₹{(+slip.pf_employer||0).toLocaleString()} &nbsp;|&nbsp;
              ESI: ₹{(+slip.esi_employer||0).toLocaleString()} &nbsp;|&nbsp;
              Total CTC: ₹{((+slip.gross||0)+(+slip.pf_employer||0)+(+slip.esi_employer||0)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main List ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>

      {/* Run payroll control */}
      <Card>
        <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, marginBottom:18 }}>🏃 Run Payroll</div>
        <div style={{ display:"flex", gap:16, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Month</div>
            <select value={month} onChange={e=>setMonth(e.target.value)}
              style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Pay Cycle</div>
            <select value={cycle} onChange={e=>setCycle(e.target.value)}
              style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }}>
              {["Monthly","21-20","26-25"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            <Btn variant="secondary">🏦 Bank File</Btn>
            <Btn variant="secondary">📊 Reports</Btn>
            <Btn onClick={runPayroll} disabled={running}
              style={{ minWidth:200, justifyContent:"center", background:running?G.muted:G.accent }}>
              {running ? "⏳ Processing payroll…" : `▶ Run ${month} ${new Date().getFullYear()} Payroll`}
            </Btn>
          </div>
        </div>
        {runMsg && (
          <div style={{ marginTop:14, padding:"10px 14px", background:runMsg.startsWith("✅")?G.green+"15":"#FEE2E2",
            borderRadius:8, fontSize:13, color:runMsg.startsWith("✅")?G.green:"#EF4444", fontWeight:600 }}>
            {runMsg}
          </div>
        )}
      </Card>

      {/* Previous runs */}
      {runs.length > 0 && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {runs.slice(0,6).map(run => (
            <div key={run.id} onClick={() => loadRun(run)}
              style={{ padding:"10px 16px", borderRadius:10, border:`1.5px solid ${selRun?.id===run.id?G.accent:G.border}`,
                background:selRun?.id===run.id?G.accentBg:G.card, cursor:"pointer", transition:"all .15s" }}>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:13, color:selRun?.id===run.id?G.accent:G.ink }}>
                {MO_SHORT[run.month]} {run.year}
              </div>
              <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>{run.status} · {run.employee_count||0} emp</div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <StatCard label="Net Payroll"   value={loading?"…":`₹${(total/100000).toFixed(2)}L`}   icon="💰" color={G.accent} sub="total disbursement" />
        <StatCard label="Gross Payroll" value={loading?"…":`₹${(gross/100000).toFixed(2)}L`}   icon="📊" color={G.blue}   sub="before deductions" />
        <StatCard label="Deductions"    value={loading?"…":`₹${(deduct/1000).toFixed(1)}K`}    icon="📋" color={G.purple} sub="PF + ESI + TDS" />
        <StatCard label="Processed"     value={loading?"…":`${processed}/${records.length}`}   icon="✅" color={G.green}  sub="payslips ready" />
      </div>

      {/* Records table */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>
            {selRun ? `${MO_SHORT[selRun.month]} ${selRun.year}` : "No run selected"} — Payroll Register
            <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>({records.length} employees)</span>
          </div>
        </div>
        {loading
          ? <div style={{ padding:40, textAlign:"center", color:G.muted }}>Loading payroll records…</div>
          : records.length === 0
            ? <div style={{ padding:40, textAlign:"center", color:G.muted }}>
                No payroll records. Click "Run Payroll" to generate salaries.
              </div>
            : <>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${G.border}` }}>
                        {["Employee","Dept","Basic","HRA","Allow.","Gross","PF","ESI","TDS","LOP","Net Pay","Days","Status","Payslip"].map(c => (
                          <th key={c} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:600, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id} style={{ borderBottom:`1px solid ${G.border}` }}
                          onMouseEnter={e=>e.currentTarget.style.background=G.bg}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 14px" }}>
                            <div style={{ display:"flex", gap:9, alignItems:"center" }}>
                              <Avatar initials={(r.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={28} color={getColor(r.employee_name||"")} />
                              <div><div style={{ fontWeight:500 }}>{r.employee_name}</div><div style={{ fontSize:11, color:G.muted }}>{r.emp_code}</div></div>
                            </div>
                          </td>
                          <td style={{ padding:"12px 14px", color:G.muted }}>{r.department}</td>
                          <td style={{ padding:"12px 14px" }}>₹{(+r.basic||0).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px" }}>₹{(+r.hra||0).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px" }}>₹{((+r.special_allow||0)+(+r.other_allow||0)).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px" }}><span style={{ fontWeight:600 }}>₹{(+r.gross||0).toLocaleString()}</span></td>
                          <td style={{ padding:"12px 14px", color:"#EF4444" }}>-₹{(+r.pf_employee||0).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px", color:"#EF4444" }}>-₹{(+r.esi_employee||0).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px", color:"#EF4444" }}>-₹{(+r.tds||0).toLocaleString()}</td>
                          <td style={{ padding:"12px 14px", color:r.lop_days>0?"#EF4444":G.muted }}>
                            {r.lop_days > 0 ? <span style={{ fontWeight:700 }}>{r.lop_days}d</span> : "—"}
                          </td>
                          <td style={{ padding:"12px 14px" }}>
                            <span style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:14, color:G.ink }}>₹{(+r.net_pay||0).toLocaleString()}</span>
                          </td>
                          <td style={{ padding:"12px 14px", color:G.muted }}>{r.days_worked ?? "—"}</td>
                          <td style={{ padding:"12px 14px" }}>
                            <span style={{ background:G.green+"18", color:G.green, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ padding:"12px 14px" }}>
                            <Btn variant="ghost" style={{ padding:"3px 12px", fontSize:11 }} onClick={() => setSlip(r)}>📄 Payslip</Btn>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding:"14px 20px", borderTop:`1px solid ${G.border}`, display:"flex", justifyContent:"flex-end", gap:40, background:G.bg }}>
                  <span style={{ fontSize:12, color:G.muted }}>Gross: <strong style={{ color:G.ink }}>₹{gross.toLocaleString()}</strong></span>
                  <span style={{ fontSize:12, color:G.muted }}>Deductions: <strong style={{ color:"#EF4444" }}>-₹{deduct.toLocaleString()}</strong></span>
                  <span style={{ fontSize:14, fontWeight:800, fontFamily:G.fontHead }}>Net Total: <span style={{ color:G.accent }}>₹{total.toLocaleString()}</span></span>
                </div>
              </>
        }
      </Card>
    </div>
  );
}
