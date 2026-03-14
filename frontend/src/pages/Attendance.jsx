import { useState, useEffect, useCallback } from "react";
import { Card, StatCard, Table, Td, Btn, Avatar, Badge, getColor, G } from "../components/UI.jsx";
import { attendanceApi, leavesApi, employeesApi } from "../utils/api.js";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const safeArray = v => {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.data)) return v.data;
  if (v && Array.isArray(v.rows)) return v.rows;
  return [];
};

const statusColor = s =>
  s === "Present"  ? G.green  :
  s === "Absent"   ? "#EF4444":
  s === "On Leave" ? G.yellow :
  s === "Half Day" ? G.blue   : G.muted;

const pill = (s) => (
  <span style={{
    background: statusColor(s) + "18",
    color:      statusColor(s),
    padding:    "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
  }}>{s}</span>
);

const BalanceBar = ({ used, total, color }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:100 }}>
    <div style={{ flex:1, height:6, borderRadius:3, background:G.bg, overflow:"hidden" }}>
      <div style={{ width:`${total>0?Math.min((used/total)*100,100):0}%`, height:"100%", background:color, borderRadius:3 }} />
    </div>
    <span style={{ fontSize:11, color:G.muted, whiteSpace:"nowrap" }}>{used}/{total}</span>
  </div>
);

// Dark-panel dropdown (for the check-in card)
const DarkSelect = ({ value, onChange, children, placeholder }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: "100%",
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,.18)",
      background: "rgba(255,255,255,.09)",
      color: value ? "#fff" : "rgba(255,255,255,.5)",
      fontSize: 13,
      outline: "none",
      cursor: "pointer",
      appearance: "auto",
    }}
  >
    <option value="" style={{ background:"#1e1e1e", color:"#aaa" }}>{placeholder}</option>
    {children}
  </select>
);

// Light-panel dropdown
const LightSelect = ({ value, onChange, children, placeholder }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: "100%",
      padding: "9px 12px",
      borderRadius: 8,
      border: `1px solid ${G.border}`,
      background: G.card,
      color: G.ink,
      fontSize: 13,
      outline: "none",
      cursor: "pointer",
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [tab,         setTab]         = useState("today");
  const [employees,   setEmployees]   = useState([]);
  const [attendance,  setAttendance]  = useState([]);
  const [leaves,      setLeaves]      = useState([]);
  const [monthly,     setMonthly]     = useState([]);
  const [balances,    setBalances]    = useState([]);

  const [loading,     setLoading]     = useState(true);
  const [loadingMon,  setLoadingMon]  = useState(false);
  const [loadingBal,  setLoadingBal]  = useState(false);

  const [leaveFilter, setLeaveFilter] = useState("All");
  const [monthSel,    setMonthSel]    = useState(new Date().getMonth() + 1);
  const [yearSel,     setYearSel]     = useState(new Date().getFullYear());

  // Check-in/out
  const [checkinEmp,  setCheckinEmp]  = useState("");
  const [checkoutEmp, setCheckoutEmp] = useState("");
  const [ciLoading,   setCiLoading]   = useState(false);
  const [coLoading,   setCoLoading]   = useState(false);
  const [ciMsg,       setCiMsg]       = useState({ text:"", ok:true });

  // Leave form
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm,     setLeaveForm]     = useState({
    employeeId:"", leaveType:"Annual Leave",
    fromDate:"", toDate:"", days:1, reason:"",
  });
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [leaveErr,    setLeaveErr]    = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ── Initial load ──────────────────────────────────────────
  const refreshToday = useCallback(() =>
    attendanceApi.list({ date: today })
      .then(d => setAttendance(safeArray(d)))
      .catch(console.error),
  [today]);

  useEffect(() => {
    Promise.all([
      employeesApi.list({ limit:200 }),
      attendanceApi.list({ date: today }),
      leavesApi.list(),
    ]).then(([emps, att, lv]) => {
      setEmployees(safeArray(emps));
      setAttendance(safeArray(att));
      setLeaves(safeArray(lv));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Monthly report ────────────────────────────────────────
  useEffect(() => {
    if (tab !== "monthly") return;
    setLoadingMon(true);
    attendanceApi.monthly(monthSel, yearSel)
      .then(d => setMonthly(safeArray(d)))
      .catch(console.error)
      .finally(() => setLoadingMon(false));
  }, [tab, monthSel, yearSel]);

  // ── Leave balances ────────────────────────────────────────
  useEffect(() => {
    if (tab !== "balance") return;
    setLoadingBal(true);
    leavesApi.balances()
      .then(d => setBalances(safeArray(d)))
      .catch(console.error)
      .finally(() => setLoadingBal(false));
  }, [tab]);

  // ── Check-In ──────────────────────────────────────────────
  const handleCheckIn = () => {
    if (!checkinEmp) { setCiMsg({ text:"Please select an employee first.", ok:false }); return; }
    setCiLoading(true); setCiMsg({ text:"", ok:true });
    attendanceApi.checkIn({ employeeId: checkinEmp })
      .then(() => {
        setCiMsg({ text:"✅ Check-in recorded successfully.", ok:true });
        setCheckinEmp("");
        refreshToday();
      })
      .catch(e => setCiMsg({ text:"⚠️  " + e.message, ok:false }))
      .finally(() => setCiLoading(false));
  };

  // ── Check-Out ─────────────────────────────────────────────
  const handleCheckOut = () => {
    if (!checkoutEmp) { setCiMsg({ text:"Please select an employee first.", ok:false }); return; }
    setCoLoading(true); setCiMsg({ text:"", ok:true });
    attendanceApi.checkOut({ employeeId: checkoutEmp })
      .then(() => {
        setCiMsg({ text:"✅ Check-out recorded successfully.", ok:true });
        setCheckoutEmp("");
        refreshToday();
      })
      .catch(e => setCiMsg({ text:"⚠️  " + e.message, ok:false }))
      .finally(() => setCoLoading(false));
  };

  // ── Leave actions ─────────────────────────────────────────
  const approveLeave = id =>
    leavesApi.updateStatus(id, "Approved", "")
      .then(() => setLeaves(l => l.map(x => x.id===id ? {...x, status:"Approved"} : x)))
      .catch(console.error);

  const rejectLeave = id =>
    leavesApi.updateStatus(id, "Rejected", "")
      .then(() => setLeaves(l => l.map(x => x.id===id ? {...x, status:"Rejected"} : x)))
      .catch(console.error);

  const submitLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.fromDate || !leaveForm.toDate) {
      setLeaveErr("Employee, From Date and To Date are required."); return;
    }
    setLeaveSaving(true); setLeaveErr("");
    leavesApi.apply({
      employeeId: leaveForm.employeeId,
      leaveType:  leaveForm.leaveType,
      fromDate:   leaveForm.fromDate,
      toDate:     leaveForm.toDate,
      days:       +leaveForm.days || 1,
      reason:     leaveForm.reason,
    }).then(lv => {
      setLeaves(p => [lv, ...p]);
      setShowLeaveForm(false);
      setLeaveForm({ employeeId:"", leaveType:"Annual Leave", fromDate:"", toDate:"", days:1, reason:"" });
    }).catch(e => setLeaveErr(e.message || "Failed to submit leave"))
      .finally(() => setLeaveSaving(false));
  };

  // ── Derived ───────────────────────────────────────────────
  const present  = attendance.filter(a => a.status === "Present").length;
  const absent   = attendance.filter(a => a.status === "Absent").length;
  const onLeave  = attendance.filter(a => a.status === "On Leave").length;
  const pending  = leaves.filter(l => l.status === "Pending").length;

  const checkedInEmpIds = new Set(attendance.filter(a => a.check_in && !a.check_out).map(a => a.employee_id));
  const notCheckedIn    = employees.filter(e => !attendance.find(a => a.employee_id === e.id));
  const alreadyIn       = attendance.filter(a => a.check_in && !a.check_out);

  const filteredLeaves  = leaves.filter(l => leaveFilter === "All" || l.status === leaveFilter);

  const TABS = [
    ["today",   "📋 Today"],
    ["leaves",  "🏖 Leave Requests"],
    ["monthly", "📅 Monthly Report"],
    ["balance", "📊 Leave Balance"],
  ];

  return (
    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Tab Bar ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:4, background:G.bg, padding:4, borderRadius:12, border:`1px solid ${G.border}` }}>
          {TABS.map(([id, label]) => (
            <div key={id} onClick={() => setTab(id)}
              style={{
                padding:"8px 20px", borderRadius:9, cursor:"pointer",
                fontSize:13, fontWeight:500,
                background: tab===id ? G.card : "transparent",
                color:      tab===id ? G.ink  : G.muted,
                boxShadow:  tab===id ? "0 1px 6px rgba(0,0,0,.08)" : "none",
                transition: "all .15s", position:"relative",
              }}>
              {label}
              {id==="leaves" && pending>0 && (
                <span style={{ marginLeft:6, background:G.accent, color:"#fff", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 7px" }}>{pending}</span>
              )}
            </div>
          ))}
        </div>
        {tab==="leaves" && (
          <Btn onClick={() => setShowLeaveForm(true)}>+ Apply Leave</Btn>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          TODAY'S ATTENDANCE
      ══════════════════════════════════════════════════════ */}
      {tab === "today" && (
        <>
          {/* Check-In / Check-Out Panel */}
          <div style={{
            background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
            borderRadius: 16, padding: 28,
            border: "1px solid rgba(255,255,255,.08)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <div>
                <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:18, color:"#fff" }}>
                  🕐 Mark Attendance
                </div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>
                  {new Date().toLocaleDateString("en-IN",{ weekday:"long", day:"numeric", month:"long", year:"numeric" })}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Employees Loaded</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:28, color: employees.length > 0 ? G.green : G.yellow }}>
                  {loading ? "…" : employees.length}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* Check-In */}
              <div style={{ background:"rgba(40,200,64,.08)", border:"1px solid rgba(40,200,64,.2)", borderRadius:12, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>✅</span>
                  <span style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:G.green }}>Check In</span>
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7 }}>
                    SELECT EMPLOYEE
                  </div>
                  {loading ? (
                    <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:13 }}>
                      Loading employees…
                    </div>
                  ) : employees.length === 0 ? (
                    <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(255,100,100,.1)", color:"#ff6b6b", fontSize:13 }}>
                      No active employees found. Add employees first.
                    </div>
                  ) : (
                    <DarkSelect value={checkinEmp} onChange={e => setCheckinEmp(e.target.value)} placeholder="— Select Employee —">
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id} style={{ background:"#1e1e1e", color:"#fff" }}>
                          {emp.first_name} {emp.last_name} ({emp.emp_code})
                        </option>
                      ))}
                    </DarkSelect>
                  )}
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={ciLoading || !checkinEmp}
                  style={{
                    width:"100%", padding:"11px", borderRadius:8,
                    background: checkinEmp ? G.green : "rgba(40,200,64,.3)",
                    color:"#fff", border:"none", cursor: checkinEmp ? "pointer" : "not-allowed",
                    fontFamily:G.fontHead, fontWeight:700, fontSize:14,
                    transition:"all .2s",
                  }}>
                  {ciLoading ? "Checking in…" : "🟢 Check In"}
                </button>
              </div>

              {/* Check-Out */}
              <div style={{ background:"rgba(255,149,0,.08)", border:"1px solid rgba(255,149,0,.2)", borderRadius:12, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <span style={{ fontSize:20 }}>🔴</span>
                  <span style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:"#FF9500" }}>Check Out</span>
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:7 }}>
                    SELECT EMPLOYEE
                  </div>
                  {loading ? (
                    <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:13 }}>
                      Loading…
                    </div>
                  ) : alreadyIn.length === 0 ? (
                    <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.4)", fontSize:13 }}>
                      No employees currently checked in
                    </div>
                  ) : (
                    <DarkSelect value={checkoutEmp} onChange={e => setCheckoutEmp(e.target.value)} placeholder="— Select Employee —">
                      {alreadyIn.map(a => (
                        <option key={a.employee_id} value={a.employee_id} style={{ background:"#1e1e1e", color:"#fff" }}>
                          {a.name} ({a.emp_code}) — in at {a.check_in}
                        </option>
                      ))}
                    </DarkSelect>
                  )}
                </div>

                <button
                  onClick={handleCheckOut}
                  disabled={coLoading || !checkoutEmp}
                  style={{
                    width:"100%", padding:"11px", borderRadius:8,
                    background: checkoutEmp ? "#FF9500" : "rgba(255,149,0,.3)",
                    color:"#fff", border:"none", cursor: checkoutEmp ? "pointer" : "not-allowed",
                    fontFamily:G.fontHead, fontWeight:700, fontSize:14,
                    transition:"all .2s",
                  }}>
                  {coLoading ? "Checking out…" : "🔴 Check Out"}
                </button>
              </div>
            </div>

            {/* Status message */}
            {ciMsg.text && (
              <div style={{
                marginTop:14, padding:"10px 16px", borderRadius:8,
                background: ciMsg.ok ? "rgba(40,200,64,.15)" : "rgba(239,68,68,.15)",
                border: `1px solid ${ciMsg.ok ? "rgba(40,200,64,.3)" : "rgba(239,68,68,.3)"}`,
                color: ciMsg.ok ? G.green : "#EF4444",
                fontSize:13, fontWeight:600,
              }}>
                {ciMsg.text}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              ["Present",  present,                                                    "✅", G.green,  "today"],
              ["Absent",   absent,                                                     "❌", "#EF4444", "today"],
              ["On Leave", onLeave,                                                    "🏖", G.yellow,  "approved leave"],
              ["Rate",     attendance.length>0?`${Math.round(present/attendance.length*100)}%`:"0%","📊",G.blue,"attendance rate"],
            ].map(([label,value,icon,color,sub]) => (
              <div key={label} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:14, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
                  <div style={{ width:32, height:32, borderRadius:8, background:color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{icon}</div>
                </div>
                <div style={{ fontFamily:G.fontHead, fontWeight:900, fontSize:32, color, lineHeight:1 }}>{loading?"…":value}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:6 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Today's table */}
          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>Today's Attendance</span>
                <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>
                  {new Date().toLocaleDateString("en-IN",{ day:"numeric", month:"long", year:"numeric" })}
                </span>
                <span style={{ marginLeft:8, background:G.bg, color:G.muted, borderRadius:10, fontSize:11, padding:"2px 8px" }}>
                  {attendance.length} records
                </span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Btn variant="secondary" style={{ fontSize:12 }}>📤 Export</Btn>
              </div>
            </div>

            {loading ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
                Loading attendance records…
              </div>
            ) : attendance.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:16, color:G.ink2, marginBottom:8 }}>No attendance records today</div>
                <div style={{ fontSize:13 }}>Use the Check-In panel above to mark attendance</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${G.border}`, background:G.bg }}>
                      {["Employee","Department","Check In","Check Out","Hours","Status"].map(c => (
                        <th key={c} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(r => (
                      <tr key={r.id} style={{ borderBottom:`1px solid ${G.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=G.bg}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"13px 16px" }}>
                          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                            <Avatar initials={(r.name||"?").split(" ").map(w=>w[0]).join("")} size={32} color={getColor(r.name||"")} />
                            <div>
                              <div style={{ fontWeight:600 }}>{r.name}</div>
                              <div style={{ fontSize:11, color:G.muted }}>{r.emp_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"13px 16px", color:G.muted }}>{r.department}</td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ color:r.check_in?G.green:G.muted, fontWeight:r.check_in?700:400, fontFamily:"monospace" }}>
                            {r.check_in || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          <span style={{ color:r.check_out?G.ink2:G.muted, fontFamily:"monospace" }}>
                            {r.check_out || "—"}
                          </span>
                        </td>
                        <td style={{ padding:"13px 16px" }}>
                          {r.worked_hours
                            ? <span style={{ fontWeight:700, color:G.ink }}>{r.worked_hours}h</span>
                            : <span style={{ color:G.muted }}>—</span>}
                        </td>
                        <td style={{ padding:"13px 16px" }}>{pill(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          LEAVE REQUESTS
      ══════════════════════════════════════════════════════ */}
      {tab === "leaves" && (
        <>
          {/* Apply Leave Form */}
          {showLeaveForm && (
            <Card style={{ border:`2px solid ${G.accent}`, background:G.accentBg }}>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:G.accent, marginBottom:20 }}>
                🏖 Apply Leave
              </div>
              {leaveErr && (
                <div style={{ background:"#FEE2E2", color:"#EF4444", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:16 }}>
                  ⚠️ {leaveErr}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
                {/* Employee */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Employee *</div>
                  <LightSelect value={leaveForm.employeeId} onChange={e => setLeaveForm(p=>({...p,employeeId:e.target.value}))} placeholder="— Select Employee —">
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_code})</option>
                    ))}
                  </LightSelect>
                </div>

                {/* Leave Type */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Leave Type</div>
                  <LightSelect value={leaveForm.leaveType} onChange={e => setLeaveForm(p=>({...p,leaveType:e.target.value}))}>
                    {["Annual Leave","Sick Leave","Casual Leave","Work From Home","Maternity Leave","Paternity Leave","Unpaid Leave"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </LightSelect>
                </div>

                {/* Days */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Number of Days</div>
                  <input type="number" min={1} value={leaveForm.days}
                    onChange={e => setLeaveForm(p=>({...p,days:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }} />
                </div>

                {/* From Date */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>From Date *</div>
                  <input type="date" value={leaveForm.fromDate}
                    onChange={e => setLeaveForm(p=>({...p,fromDate:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }} />
                </div>

                {/* To Date */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>To Date *</div>
                  <input type="date" value={leaveForm.toDate}
                    onChange={e => setLeaveForm(p=>({...p,toDate:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }} />
                </div>

                {/* Reason */}
                <div>
                  <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>Reason</div>
                  <input type="text" value={leaveForm.reason} placeholder="Brief reason…"
                    onChange={e => setLeaveForm(p=>({...p,reason:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }} />
                </div>
              </div>

              <div style={{ marginTop:18, display:"flex", gap:10 }}>
                <Btn onClick={submitLeave} disabled={leaveSaving}>{leaveSaving?"Submitting…":"Submit Leave Request"}</Btn>
                <Btn variant="secondary" onClick={() => { setShowLeaveForm(false); setLeaveErr(""); }}>Cancel</Btn>
              </div>
            </Card>
          )}

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {[
              ["Pending",  leaves.filter(l=>l.status==="Pending").length,  G.yellow,  "⏳"],
              ["Approved", leaves.filter(l=>l.status==="Approved").length, G.green,   "✅"],
              ["Rejected", leaves.filter(l=>l.status==="Rejected").length, "#EF4444", "❌"],
            ].map(([label,count,color,icon]) => (
              <div key={label} onClick={() => setLeaveFilter(label)}
                style={{
                  background:G.card, borderRadius:12, padding:"16px 20px",
                  border:`1px solid ${leaveFilter===label?color:G.border}`,
                  borderLeft:`4px solid ${color}`,
                  cursor:"pointer", transition:"all .15s",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                }}>
                <div>
                  <div style={{ fontSize:12, color:G.muted, fontWeight:600 }}>{label} Requests</div>
                  <div style={{ fontFamily:G.fontHead, fontWeight:900, fontSize:30, color, marginTop:4 }}>{count}</div>
                </div>
                <div style={{ fontSize:32, opacity:.6 }}>{icon}</div>
              </div>
            ))}
          </div>

          {/* Leave table */}
          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>
                Leave Requests
                <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>({filteredLeaves.length})</span>
              </div>
              <select value={leaveFilter} onChange={e => setLeaveFilter(e.target.value)}
                style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }}>
                {["All","Pending","Approved","Rejected","Cancelled"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>

            {filteredLeaves.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏖</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:G.ink2, marginBottom:8 }}>No leave requests found</div>
                <div style={{ fontSize:13 }}>Click "+ Apply Leave" to add one</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${G.border}`, background:G.bg }}>
                      {["Employee","Dept","Leave Type","From","To","Days","Reason","Applied","Status","Actions"].map(c => (
                        <th key={c} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map(r => (
                      <tr key={r.id} style={{ borderBottom:`1px solid ${G.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=G.bg}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"12px 14px" }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <Avatar initials={(r.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={30} color={getColor(r.employee_name||"")} />
                            <div>
                              <div style={{ fontWeight:600 }}>{r.employee_name}</div>
                              <div style={{ fontSize:11, color:G.muted }}>{r.emp_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"12px 14px", color:G.muted }}>{r.department}</td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ background:G.blue+"15", color:G.blue, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>
                            {r.leave_type}
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px", color:G.muted, fontSize:12 }}>{r.from_date}</td>
                        <td style={{ padding:"12px 14px", color:G.muted, fontSize:12 }}>{r.to_date}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ fontWeight:700, color:G.ink }}>{r.days}d</span></td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ color:G.muted, maxWidth:140, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.reason||"—"}</span>
                        </td>
                        <td style={{ padding:"12px 14px", color:G.muted, fontSize:11 }}>{r.applied_on?.split("T")[0]}</td>
                        <td style={{ padding:"12px 14px" }}>{pill(r.status)}</td>
                        <td style={{ padding:"12px 14px" }}>
                          {r.status==="Pending" ? (
                            <div style={{ display:"flex", gap:6 }}>
                              <button onClick={() => approveLeave(r.id)}
                                style={{ padding:"5px 12px", borderRadius:7, border:"none", background:G.green, color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                                ✓ Approve
                              </button>
                              <button onClick={() => rejectLeave(r.id)}
                                style={{ padding:"5px 12px", borderRadius:7, border:"none", background:"#EF4444", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                                ✗ Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color:G.muted, fontSize:12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          MONTHLY REPORT
      ══════════════════════════════════════════════════════ */}
      {tab === "monthly" && (
        <>
          <Card>
            <div style={{ display:"flex", gap:16, alignItems:"flex-end", flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:7 }}>Month</div>
                <select value={monthSel} onChange={e => setMonthSel(+e.target.value)}
                  style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }}>
                  {MONTHS.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:G.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:7 }}>Year</div>
                <select value={yearSel} onChange={e => setYearSel(+e.target.value)}
                  style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${G.border}`, background:G.card, fontSize:13, color:G.ink, outline:"none" }}>
                  {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <Btn variant="secondary">📤 Export Report</Btn>
              <div style={{ marginLeft:"auto", display:"flex", gap:16, alignItems:"center" }}>
                {[["Total Employees",monthly.length,G.ink],["Avg Present",(monthly.length>0?Math.round(monthly.reduce((s,e)=>s+e.present_days,0)/monthly.length):0)+"d",G.green],["Avg Absent",(monthly.length>0?Math.round(monthly.reduce((s,e)=>s+e.absent_days,0)/monthly.length):0)+"d","#EF4444"]].map(([l,v,c]) => (
                  <div key={l} style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:20, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:G.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${G.border}`, fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>
              Monthly Report — {MONTHS[monthSel-1]} {yearSel}
              <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>({monthly.length} employees)</span>
            </div>

            {loadingMon ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📅</div>Loading monthly report…
              </div>
            ) : monthly.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:G.ink2, marginBottom:8 }}>No records for {MONTHS[monthSel-1]} {yearSel}</div>
                <div style={{ fontSize:13 }}>Attendance must be marked for records to appear here</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${G.border}`, background:G.bg }}>
                      {["Employee","Department","Present Days","Absent Days","Leave Days","Total Hours","Attendance %"].map(c => (
                        <th key={c} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.map(emp => {
                      const totalDays = emp.present_days + emp.absent_days;
                      const pct = totalDays > 0 ? Math.round(emp.present_days / totalDays * 100) : 0;
                      const leaveDays = (emp.days||[]).filter(d => d.status==="On Leave").length;
                      return (
                        <tr key={emp.employee_id} style={{ borderBottom:`1px solid ${G.border}` }}
                          onMouseEnter={e => e.currentTarget.style.background=G.bg}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"13px 16px" }}>
                            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                              <Avatar initials={(emp.name||"?").split(" ").map(w=>w[0]).join("")} size={32} color={getColor(emp.name||"")} />
                              <div>
                                <div style={{ fontWeight:600 }}>{emp.name}</div>
                                <div style={{ fontSize:11, color:G.muted }}>{emp.emp_code}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"13px 16px", color:G.muted }}>{emp.department}</td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontWeight:800, fontSize:16, color:G.green }}>{emp.present_days}</span>
                            <span style={{ color:G.muted, fontSize:11, marginLeft:4 }}>days</span>
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontWeight:800, fontSize:16, color:"#EF4444" }}>{emp.absent_days}</span>
                            <span style={{ color:G.muted, fontSize:11, marginLeft:4 }}>days</span>
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            {leaveDays > 0
                              ? <span style={{ fontWeight:700, color:G.yellow }}>{leaveDays} days</span>
                              : <span style={{ color:G.muted }}>—</span>}
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            <span style={{ fontWeight:700 }}>{emp.total_hours}h</span>
                          </td>
                          <td style={{ padding:"13px 16px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <div style={{ width:70, height:6, borderRadius:3, background:G.bg, overflow:"hidden" }}>
                                <div style={{ width:`${pct}%`, height:"100%", borderRadius:3, background:pct>=80?G.green:pct>=60?G.yellow:"#EF4444", transition:"width .6s" }} />
                              </div>
                              <span style={{ fontSize:13, fontWeight:800, color:pct>=80?G.green:pct>=60?G.yellow:"#EF4444", minWidth:36 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          LEAVE BALANCE
      ══════════════════════════════════════════════════════ */}
      {tab === "balance" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              ["Annual Leave","18 days/year",G.blue,"📅"],
              ["Sick Leave","12 days/year","#EF4444","🤒"],
              ["Casual Leave","6 days/year",G.yellow,"🌴"],
              ["Work From Home","24 days/year",G.green,"🏠"],
            ].map(([l,sub,c,icon]) => (
              <div key={l} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:"16px 20px" }}>
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, color:G.ink }}>{l}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:3 }}>{sub}</div>
              </div>
            ))}
          </div>

          <Card style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"16px 22px", borderBottom:`1px solid ${G.border}`, fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>
              Leave Balances — {new Date().getFullYear()}
              <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>({balances.length} employees)</span>
            </div>

            {loadingBal ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>Loading balances…</div>
            ) : balances.length === 0 ? (
              <div style={{ padding:60, textAlign:"center", color:G.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📊</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:15, color:G.ink2, marginBottom:8 }}>No leave balance records</div>
                <div style={{ fontSize:13 }}>Balances are created automatically when employees are added</div>
              </div>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${G.border}`, background:G.bg }}>
                      {["Employee","Department","Annual Leave","Sick Leave","Casual Leave","WFH"].map(c => (
                        <th key={c} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map(row => (
                      <tr key={row.id} style={{ borderBottom:`1px solid ${G.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background=G.bg}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", gap:9, alignItems:"center" }}>
                            <Avatar initials={(row.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={30} color={getColor(row.employee_name||"")} />
                            <div>
                              <div style={{ fontWeight:600 }}>{row.employee_name}</div>
                              <div style={{ fontSize:11, color:G.muted }}>{row.emp_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"14px 16px", color:G.muted }}>{row.department}</td>
                        <td style={{ padding:"14px 16px" }}><BalanceBar used={row.annual_used||0} total={row.annual_total||18} color={G.blue} /></td>
                        <td style={{ padding:"14px 16px" }}><BalanceBar used={row.sick_used||0}   total={row.sick_total||12}   color="#EF4444" /></td>
                        <td style={{ padding:"14px 16px" }}><BalanceBar used={row.casual_used||0} total={row.casual_total||6}  color={G.yellow} /></td>
                        <td style={{ padding:"14px 16px" }}><BalanceBar used={row.wfh_used||0}    total={row.wfh_total||24}    color={G.green} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
