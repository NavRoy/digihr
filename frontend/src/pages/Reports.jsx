import { useState } from "react";
import { Card, StatCard, Btn, Select, G } from "../components/UI.jsx";

// ── Mock data ─────────────────────────────────────────────────────────────────
const HEADCOUNT_TREND = [
  { month:"Oct", total:82, joined:4, left:1 },
  { month:"Nov", total:85, joined:5, left:2 },
  { month:"Dec", total:87, joined:3, left:1 },
  { month:"Jan", total:90, joined:4, left:1 },
  { month:"Feb", total:94, joined:5, left:1 },
  { month:"Mar", total:97, joined:4, left:1 },
];

const DEPT_SALARY = [
  { dept:"Engineering", gross:842000, employees:28, avg:30071  },
  { dept:"Sales",       gross:516000, employees:18, avg:28667  },
  { dept:"Finance",     gross:386000, employees:12, avg:32167  },
  { dept:"Operations",  gross:352000, employees:14, avg:25143  },
  { dept:"HR",          gross:218000, employees:8,  avg:27250  },
  { dept:"Marketing",   gross:196000, employees:8,  avg:24500  },
];

const LEAVE_UTILIZATION = [
  { type:"Annual",   allotted:18, used:4.2,  remaining:13.8 },
  { type:"Sick",     allotted:12, used:2.1,  remaining:9.9  },
  { type:"Casual",   allotted:6,  used:1.4,  remaining:4.6  },
  { type:"WFH",      allotted:24, used:6.8,  remaining:17.2 },
];

const EXPENSE_BY_CAT = [
  { cat:"Travel",       amount:128500, count:24, color:G.blue   },
  { cat:"Client Meals", amount:96400,  count:18, color:G.yellow },
  { cat:"Software",     amount:74800,  count:12, color:G.purple },
  { cat:"Training",     amount:52000,  count:9,  color:G.accent },
  { cat:"Office",       amount:31200,  count:15, color:G.green  },
  { cat:"Medical",      amount:18600,  count:7,  color:"#EC4899"},
];

const ATTENDANCE_MONTHLY = [
  { month:"Oct", pct:92 }, { month:"Nov", pct:94 }, { month:"Dec", pct:88 },
  { month:"Jan", pct:91 }, { month:"Feb", pct:95 }, { month:"Mar", pct:93 },
];

const PAYROLL_TREND = [
  { month:"Oct", gross:4180000, net:3510000 },
  { month:"Nov", gross:4220000, net:3548000 },
  { month:"Dec", gross:4380000, net:3679000 },
  { month:"Jan", gross:4480000, net:3763000 },
  { month:"Feb", gross:4520000, net:3797000 },
  { month:"Mar", gross:4800000, net:4260000 },
];

const TURNOVER = [
  { month:"Oct", rate:1.2 }, { month:"Nov", rate:2.3 }, { month:"Dec", rate:1.1 },
  { month:"Jan", rate:1.1 }, { month:"Feb", rate:1.0 }, { month:"Mar", rate:1.0 },
];

// ── Chart components ──────────────────────────────────────────────────────────

// Vertical bar chart (pure CSS)
const BarChart = ({ data, valueKey, labelKey, color = G.accent, maxVal, formatVal = v => v, height = 140 }) => {
  const max = maxVal || Math.max(...data.map(d => d[valueKey]));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height, paddingBottom:24, position:"relative" }}>
      {/* Y-axis gridlines */}
      {[0, 25, 50, 75, 100].map(pct => (
        <div key={pct} style={{ position:"absolute", left:0, right:0, bottom: pct * height/100 + 24,
          borderTop:`1px dashed ${G.border}`, zIndex:0 }} />
      ))}
      {data.map((d, i) => {
        const h = Math.round((d[valueKey] / max) * height);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, zIndex:1 }}>
            <div style={{ fontSize:9, color:G.muted, fontWeight:600 }}>{formatVal(d[valueKey])}</div>
            <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0", background:color,
              transition:"height .6s cubic-bezier(.16,1,.3,1)", minHeight:4,
              boxShadow:`0 -2px 8px ${color}40` }} />
            <div style={{ fontSize:10, color:G.muted, textAlign:"center", position:"absolute", bottom:0, fontSize:9 }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
};

// Stacked bar chart
const StackedBar = ({ data, keys, colors, labelKey, height = 140 }) => {
  const maxVal = Math.max(...data.map(d => keys.reduce((s,k) => s + (d[k]||0), 0)));
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height, paddingBottom:24, position:"relative" }}>
      {[0, 25, 50, 75, 100].map(pct => (
        <div key={pct} style={{ position:"absolute", left:0, right:0, bottom: pct * height/100 + 24, borderTop:`1px dashed ${G.border}` }} />
      ))}
      {data.map((d, i) => {
        const total = keys.reduce((s,k) => s + (d[k]||0), 0);
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column-reverse", alignItems:"center", zIndex:1 }}>
            <div style={{ fontSize:9, color:G.muted, position:"absolute", bottom:0 }}>{d[labelKey]}</div>
            <div style={{ width:"100%", display:"flex", flexDirection:"column-reverse", borderRadius:"4px 4px 0 0", overflow:"hidden" }}>
              {keys.map((k,ki) => {
                const h = Math.round((d[k]||0) / maxVal * height);
                return <div key={k} style={{ width:"100%", height:h, background:colors[ki], minHeight:d[k]?2:0 }} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Horizontal bar
const HBar = ({ label, value, max, color, formatVal = v => v, sub }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"flex-end" }}>
        <span style={{ fontSize:12, fontWeight:500, color:G.ink2 }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:G.fontHead }}>{formatVal(value)}</span>
      </div>
      <div style={{ height:8, borderRadius:4, background:G.bg, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, background:color,
          transition:"width .8s cubic-bezier(.16,1,.3,1)", boxShadow:`0 1px 4px ${color}40` }} />
      </div>
      {sub && <div style={{ fontSize:10, color:G.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
};

// Donut / pie chart (SVG)
const PieChart = ({ data, size = 140 }) => {
  const total  = data.reduce((s,d) => s + d.amount, 0);
  let startAngle = -90;
  const toRad = deg => deg * Math.PI / 180;
  const cx = size/2, cy = size/2, r = size/2 - 14, inner = r - 18;

  const slices = data.map(d => {
    const angle    = (d.amount / total) * 360;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const ix1 = cx + inner * Math.cos(toRad(startAngle));
    const iy1 = cy + inner * Math.sin(toRad(startAngle));
    const ix2 = cx + inner * Math.cos(toRad(endAngle));
    const iy2 = cy + inner * Math.sin(toRad(endAngle));
    const large = angle > 180 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
    startAngle = endAngle;
    return { ...d, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s,i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1} />)}
      <text x={cx} y={cy-4}  textAnchor="middle" fontSize={14} fontWeight={800} fontFamily={G.fontHead} fill={G.ink}>₹{(total/100000).toFixed(0)}L</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize={8}  fill={G.muted}>total</text>
    </svg>
  );
};

// Sparkline
const Sparkline = ({ data, valueKey, color = G.accent, height = 40, width = 120 }) => {
  const vals = data.map(d => d[valueKey]);
  const min  = Math.min(...vals), max = Math.max(...vals);
  const pts  = vals.map((v,i) => {
    const x = (i / (vals.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0}   />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`2,${height} ${pts} ${width-2},${height}`}
        fill={`url(#sg-${color.replace("#","")})`} stroke="none" />
    </svg>
  );
};

// ── Main Reports page ─────────────────────────────────────────────────────────
export default function Reports() {
  const [year, setYear]   = useState("2025");
  const [tab,  setTab]    = useState("overview");

  const TABS = [["overview","📊 Overview"],["headcount","👥 Headcount"],["payroll","💰 Payroll"],["attendance","📋 Attendance"],["expenses","🧾 Expenses"],["pms","📈 Performance"]];

  const totalExpenses = EXPENSE_BY_CAT.reduce((s,c) => s+c.amount, 0);

  return (
    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:4, background:G.bg, padding:4, borderRadius:10 }}>
          {TABS.map(([id,label]) => (
            <div key={id} onClick={() => setTab(id)}
              style={{ padding:"7px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500,
                background:tab===id ? G.card : "transparent",
                color:tab===id ? G.ink : G.muted,
                boxShadow:tab===id ? "0 1px 4px rgba(0,0,0,.07)" : "none",
                transition:"all .15s" }}>
              {label}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Select value={year} onChange={e => setYear(e.target.value)} options={["2025","2024","2023"]} />
          <Btn variant="secondary">📤 Export PDF</Btn>
          <Btn variant="secondary">📊 Export Excel</Btn>
        </div>
      </div>

      {/* ══ OVERVIEW ══════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <StatCard label="Total Employees" value={97}     icon="👥" color={G.accent} trend={5}  sub="vs last month" />
            <StatCard label="Monthly Payroll"  value="₹48L"  icon="💰" color={G.green}  trend={6}  sub="March 2025" />
            <StatCard label="Attendance Rate"  value="93%"   icon="✅" color={G.blue}   trend={2}  sub="March avg" />
            <StatCard label="Attrition Rate"   value="1.0%"  icon="📉" color={G.yellow}            sub="below industry avg" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:14 }}>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>Headcount Trend</div>
                <div style={{ display:"flex", gap:12, fontSize:11 }}>
                  <span style={{ color:G.accent }}>● Total</span>
                  <span style={{ color:G.green  }}>● Joined</span>
                  <span style={{ color:"#EF4444" }}>● Left</span>
                </div>
              </div>
              <StackedBar data={HEADCOUNT_TREND} keys={["joined","left"]} colors={[G.green,"#EF4444"]} labelKey="month" height={130} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Salary by Department</div>
              {DEPT_SALARY.map((d,i) => (
                <HBar key={d.dept} label={d.dept} value={d.gross}
                  max={Math.max(...DEPT_SALARY.map(x=>x.gross))}
                  color={[G.accent,G.blue,G.green,G.yellow,G.purple,"#EC4899"][i]}
                  formatVal={v => `₹${(v/100000).toFixed(1)}L`}
                  sub={`${d.employees} employees · avg ₹${d.avg.toLocaleString()}`} />
              ))}
            </Card>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:18 }}>Monthly Attendance %</div>
              <BarChart data={ATTENDANCE_MONTHLY} valueKey="pct" labelKey="month"
                color={G.blue} maxVal={100} height={110} formatVal={v => `${v}%`} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:18 }}>Expense Breakdown</div>
              <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                <PieChart data={EXPENSE_BY_CAT} size={120} />
                <div style={{ flex:1 }}>
                  {EXPENSE_BY_CAT.slice(0,4).map(c => (
                    <div key={c.cat} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:c.color, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:G.ink2, flex:1 }}>{c.cat}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:c.color }}>₹{(c.amount/1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:18 }}>Turnover Rate %</div>
              <BarChart data={TURNOVER} valueKey="rate" labelKey="month"
                color={G.yellow} maxVal={5} height={110} formatVal={v => `${v}%`} />
            </Card>
          </div>
        </>
      )}

      {/* ══ HEADCOUNT ══════════════════════════════════════════════════════════ */}
      {tab === "headcount" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[["Total",97,G.accent],["Active",92,G.green],["On Leave",3,G.yellow],["Inactive",2,G.muted]].map(([l,v,c]) => (
              <div key={l} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ fontSize:12, color:G.muted, marginBottom:8 }}>{l}</div>
                <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:28, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Monthly Headcount — {year}</div>
              <BarChart data={HEADCOUNT_TREND} valueKey="total" labelKey="month" color={G.accent} height={160} formatVal={v=>v} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Department Distribution</div>
              {DEPT_SALARY.map((d,i) => (
                <HBar key={d.dept} label={d.dept} value={d.employees} max={30}
                  color={[G.accent,G.blue,G.green,G.yellow,G.purple,"#EC4899"][i]}
                  formatVal={v => `${v} employees`} />
              ))}
            </Card>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:16 }}>Joiners vs Leavers</div>
              <div style={{ display:"flex", gap:24, marginBottom:16 }}>
                {[["Joiners (YTD)","25",G.green],["Leavers (YTD)","6","#EF4444"],["Net Growth","+19",G.accent]].map(([l,v,c])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:26, color:c }}>{v}</div>
                    <div style={{ fontSize:11, color:G.muted }}>{l}</div>
                  </div>
                ))}
              </div>
              <StackedBar data={HEADCOUNT_TREND} keys={["joined","left"]} colors={[G.green,"#EF4444"]} labelKey="month" height={120} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:16 }}>Employment Type</div>
              {[["Full-Time",82,G.blue],["Contract",10,G.accent],["Part-Time",5,G.green]].map(([l,v,c])=>(
                <HBar key={l} label={l} value={v} max={97} color={c} formatVal={v=>`${v} (${Math.round(v/97*100)}%)`} />
              ))}
            </Card>
          </div>
        </>
      )}

      {/* ══ PAYROLL ═══════════════════════════════════════════════════════════ */}
      {tab === "payroll" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <StatCard label="Total Gross (YTD)"     value="₹2.64Cr" icon="💰" color={G.accent} sub="Jan–Mar 2025" />
            <StatCard label="Total Net (YTD)"        value="₹2.22Cr" icon="✅" color={G.green}  sub="disbursed" />
            <StatCard label="Total PF (YTD)"         value="₹18.9L"  icon="🏦" color={G.blue}   sub="employee + employer" />
            <StatCard label="Total TDS (YTD)"        value="₹7.6L"   icon="📋" color={G.purple} sub="tax deducted" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:4 }}>Payroll Trend — Gross vs Net</div>
              <div style={{ fontSize:12, color:G.muted, marginBottom:18 }}>Last 6 months</div>
              <div style={{ display:"flex", gap:14, marginBottom:4 }}>
                <span style={{ fontSize:11, color:G.accent }}>■ Gross</span>
                <span style={{ fontSize:11, color:G.green  }}>■ Net</span>
              </div>
              <StackedBar data={PAYROLL_TREND.map(p=>({...p,gross:p.gross/100000,net:p.net/100000}))}
                keys={["gross","net"]} colors={[G.accent+"60",G.green]} labelKey="month" height={140} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Salary Distribution by Dept</div>
              {DEPT_SALARY.map((d,i) => (
                <HBar key={d.dept} label={d.dept} value={d.gross}
                  max={Math.max(...DEPT_SALARY.map(x=>x.gross))}
                  color={[G.accent,G.blue,G.green,G.yellow,G.purple,"#EC4899"][i]}
                  formatVal={v => `₹${(v/100000).toFixed(1)}L`} sub={`avg ₹${d.avg.toLocaleString()}/mo`} />
              ))}
            </Card>
          </div>
          <Card>
            <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:18 }}>Monthly Payroll Summary</div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${G.border}` }}>
                  {["Month","Gross","PF (Emp)","PF (Emp'r)","TDS","Net Pay","Employees"].map(c=>(
                    <th key={c} style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAYROLL_TREND.map((p,i)=>(
                  <tr key={p.month} style={{ borderBottom:`1px solid ${G.border}` }}
                    onMouseEnter={e=>e.currentTarget.style.background=G.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"12px 14px", fontWeight:600 }}>{p.month} {year}</td>
                    <td style={{ padding:"12px 14px" }}>₹{(p.gross/100000).toFixed(2)}L</td>
                    <td style={{ padding:"12px 14px", color:"#EF4444" }}>₹{(p.gross*0.12/100000).toFixed(2)}L</td>
                    <td style={{ padding:"12px 14px", color:G.muted }}>₹{(p.gross*0.12/100000).toFixed(2)}L</td>
                    <td style={{ padding:"12px 14px", color:"#EF4444" }}>₹{((p.gross-p.net)*0.4/100000).toFixed(2)}L</td>
                    <td style={{ padding:"12px 14px", fontWeight:700, color:G.green }}>₹{(p.net/100000).toFixed(2)}L</td>
                    <td style={{ padding:"12px 14px", color:G.muted }}>{88+i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ══ ATTENDANCE ════════════════════════════════════════════════════════ */}
      {tab === "attendance" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <StatCard label="Avg Attendance"  value="93%"  icon="✅" color={G.green}  sub="YTD average" />
            <StatCard label="Total Leave Days" value="312"  icon="🏖" color={G.yellow} sub="all employees, YTD" />
            <StatCard label="WFH Days"         value="186"  icon="🏠" color={G.blue}   sub="all employees, YTD" />
            <StatCard label="Avg Hours/Day"    value="8.9h" icon="⏱" color={G.accent} sub="per employee" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Monthly Attendance Rate</div>
              <BarChart data={ATTENDANCE_MONTHLY} valueKey="pct" labelKey="month"
                color={G.blue} maxVal={100} height={150} formatVal={v=>`${v}%`} />
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Leave Utilization — Avg per Employee</div>
              {LEAVE_UTILIZATION.map(l => (
                <div key={l.type} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                    <span style={{ fontWeight:500 }}>{l.type} Leave</span>
                    <span style={{ color:G.muted }}>{l.used} / {l.allotted} used ({Math.round(l.used/l.allotted*100)}%)</span>
                  </div>
                  <div style={{ height:10, borderRadius:5, background:G.bg, overflow:"hidden" }}>
                    <div style={{ width:`${(l.used/l.allotted)*100}%`, height:"100%", background:G.accent, borderRadius:5, transition:"width .8s" }} />
                  </div>
                  <div style={{ fontSize:10, color:G.muted, marginTop:3 }}>{l.remaining} days remaining avg.</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* ══ EXPENSES ══════════════════════════════════════════════════════════ */}
      {tab === "expenses" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <StatCard label="Total (YTD)"     value={`₹${(totalExpenses/100000).toFixed(1)}L`} icon="🧾" color={G.accent} sub="all expenses" />
            <StatCard label="Approved"        value="78%"    icon="✅" color={G.green}  sub="approval rate" />
            <StatCard label="Pending Amount"  value="₹15.6K" icon="⏳" color={G.yellow} sub="awaiting review" />
            <StatCard label="Avg per Employee"value={`₹${Math.round(totalExpenses/97).toLocaleString()}`} icon="👤" color={G.blue} sub="YTD average" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Expense by Category</div>
              {EXPENSE_BY_CAT.map(c => (
                <HBar key={c.cat} label={`${c.cat} (${c.count} claims)`} value={c.amount}
                  max={totalExpenses} color={c.color} formatVal={v=>`₹${(v/1000).toFixed(1)}K`} />
              ))}
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Category Breakdown</div>
              <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                <PieChart data={EXPENSE_BY_CAT} size={160} />
                <div style={{ flex:1 }}>
                  {EXPENSE_BY_CAT.map(c => (
                    <div key={c.cat} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span style={{ width:10, height:10, borderRadius:"50%", background:c.color, flexShrink:0 }} />
                      <span style={{ fontSize:12, color:G.ink2, flex:1 }}>{c.cat}</span>
                      <span style={{ fontSize:12, fontWeight:700 }}>₹{(c.amount/1000).toFixed(0)}K</span>
                      <span style={{ fontSize:11, color:G.muted, minWidth:32, textAlign:"right" }}>{Math.round(c.amount/totalExpenses*100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ══ PMS ═══════════════════════════════════════════════════════════════ */}
      {tab === "pms" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <StatCard label="Avg Rating"      value="3.9★"  icon="⭐" color={G.yellow} sub="Q1 2025" />
            <StatCard label="Goals Completed" value="64%"   icon="🎯" color={G.green}  sub="of all set goals" />
            <StatCard label="Reviews Done"    value="78/97"  icon="📝" color={G.blue}   sub="employees reviewed" />
            <StatCard label="Top Dept"        value="Finance"icon="🏆" color={G.accent} sub="avg 4.7 rating" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Rating Distribution — Q1 2025</div>
              {[["Outstanding (5★)",12,G.green],["Exceeds Expectations (4★)",38,G.blue],["Meets Expectations (3★)",35,G.yellow],["Needs Improvement (2★)",12,"#F97316"],["Unsatisfactory (1★)",3,"#EF4444"]].map(([l,v,c])=>(
                <HBar key={l} label={l} value={v} max={100} color={c} formatVal={v=>`${v}%`} />
              ))}
            </Card>
            <Card>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Avg Rating by Department</div>
              {[["Finance",4.7],["Engineering",4.2],["Marketing",4.0],["HR",3.9],["Operations",3.7],["Sales",3.4]].map(([dept,rating],i) => (
                <div key={dept} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ width:100, fontSize:12, fontWeight:500, color:G.ink2 }}>{dept}</div>
                  <div style={{ flex:1, height:10, borderRadius:5, background:G.bg, overflow:"hidden" }}>
                    <div style={{ width:`${(rating/5)*100}%`, height:"100%", background:[G.accent,G.blue,G.green,G.yellow,G.purple,"#EC4899"][i], borderRadius:5, transition:"width .8s" }} />
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, minWidth:28, textAlign:"right" }}>{rating}★</div>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
