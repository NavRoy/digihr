// frontend/src/App.jsx
import { useState } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import Login          from "./pages/Login.jsx";
import Dashboard      from "./pages/Dashboard.jsx";
import Employees      from "./pages/Employees.jsx";
import AttendancePage from "./pages/Attendance.jsx";
import Payroll        from "./pages/Payroll.jsx";
import PMS            from "./pages/PMS.jsx";
import Documents      from "./pages/Documents.jsx";
import Expenses       from "./pages/Expenses.jsx";
import Assets         from "./pages/Assets.jsx";
import Settings       from "./pages/Settings.jsx";
import Reports        from "./pages/Reports.jsx";
import { G }          from "./components/UI.jsx";

const NAV = [
  { id:"dashboard",  label:"Dashboard",         icon:"▦",  roles:["super_admin","hr_manager","manager","finance","employee"] },
  { id:"employees",  label:"Employees",          icon:"👥",  roles:["super_admin","hr_manager","manager"] },
  { id:"attendance", label:"Attendance & Leave", icon:"🕐",  roles:["super_admin","hr_manager","manager","employee"] },
  { id:"payroll",    label:"Payroll",            icon:"💰",  roles:["super_admin","hr_manager","finance"] },
  { id:"pms",        label:"Performance",        icon:"📈",  roles:["super_admin","hr_manager","manager","employee"] },
  { id:"documents",  label:"Documents",          icon:"📁",  roles:["super_admin","hr_manager","manager","employee"] },
  { id:"expenses",   label:"Expenses",           icon:"🧾",  roles:["super_admin","hr_manager","finance","employee"] },
  { id:"assets",     label:"Assets",             icon:"💼",  roles:["super_admin","hr_manager","manager"] },
  { id:"reports",    label:"Reports",            icon:"📊",  roles:["super_admin","hr_manager","finance"] },
  { id:"settings",   label:"Settings",           icon:"⚙",  roles:["super_admin","hr_manager"] },
];

const PAGE_META = {
  dashboard:  { title:"Dashboard",            sub:"Welcome back 👋" },
  employees:  { title:"Employee Management",  sub:"Manage your workforce" },
  attendance: { title:"Attendance & Leave",   sub:"Track presence and leave" },
  payroll:    { title:"Payroll",              sub:"Process salaries and payslips" },
  pms:        { title:"Performance (PMS)",    sub:"Goals, reviews and appraisals" },
  documents:  { title:"Documents",            sub:"Employee and company documents" },
  expenses:   { title:"Expenses",             sub:"Track and approve reimbursements" },
  assets:     { title:"Asset Management",     sub:"Track company assets and requests" },
  reports:    { title:"Reports & Analytics",  sub:"Insights across your organisation" },
  settings:   { title:"Settings",             sub:"Access, security and org configuration" },
};

const BADGES = { attendance:3, expenses:4, assets:2, pms:2 };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'DM Sans',sans-serif; background:#F7F7F5; color:#1A1A1A; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:#EBEBEA; border-radius:2px; }
  input,select,textarea,button { font-family:'DM Sans',sans-serif; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .fade { animation:fadeIn .18s ease; }
`;

function Sidebar({ active, setActive }) {
  const { user, logout } = useAuth();
  const visible = NAV;
  const initials = user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2) || "?";

  return (
    <div style={{ width:240, minHeight:"100vh", background:G.card, borderRight:`1px solid ${G.border}`,
      display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, zIndex:50 }}>
      <div style={{ padding:"18px 22px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:G.accent,
          display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 12px ${G.accent}40`, flexShrink:0 }}>
          <span style={{ color:"#fff", fontSize:15, fontWeight:800, fontFamily:G.fontHead }}>D</span>
        </div>
        <div>
          <div style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:17, color:G.ink, letterSpacing:"-0.02em" }}>
            DIGI<span style={{ color:G.accent }}>HR</span>
          </div>
          <div style={{ fontSize:10, color:G.muted }}>Admin Panel</div>
        </div>
      </div>

      <nav style={{ padding:"10px", flex:1, overflowY:"auto" }}>
        {visible.map(item => {
          const on = active === item.id;
          return (
            <div key={item.id} onClick={() => setActive(item.id)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:9,
                marginBottom:1, cursor:"pointer", fontSize:13, fontWeight:on?600:400,
                background:on ? G.accentBg : "transparent",
boxShadow:on ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                color:on ? G.accent : G.ink2, transition:"all .12s",
                border:`1px solid ${on ? G.accent+"30":"transparent"}` }}
              onMouseEnter={e=>{ if(!on){ e.currentTarget.style.background=G.bg; e.currentTarget.style.color=G.ink; }}}
              onMouseLeave={e=>{ if(!on){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=G.ink2; }}}>
              <span style={{ fontSize:15, width:20, textAlign:"center" }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {BADGES[item.id] && (
                <span style={{ background:on?G.accent:G.border, color:on?"#fff":G.muted,
                  borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 7px" }}>
                  {BADGES[item.id]}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding:"12px", borderTop:`1px solid ${G.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
          background:G.bg, borderRadius:9, marginBottom:8 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:G.accent+"20", color:G.accent,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
            fontFamily:G.fontHead, flexShrink:0 }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:G.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {user?.name || "User"}
            </div>
            <div style={{ fontSize:10, color:G.muted, textTransform:"capitalize" }}>
              {(user?.role||"employee").replace(/_/g," ")}
            </div>
          </div>
        </div>
        <button onClick={logout}
          style={{ width:"100%", padding:"8px", borderRadius:8, border:`1px solid ${G.border}`,
            background:"transparent", cursor:"pointer", fontSize:12, color:G.muted,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .12s" }}
          onMouseEnter={e=>{ e.currentTarget.style.background="#FEE2E2"; e.currentTarget.style.color="#EF4444"; e.currentTarget.style.borderColor="#FECACA"; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color=G.muted; e.currentTarget.style.borderColor=G.border; }}>
          ↩ Sign Out
        </button>
      </div>
    </div>
  );
}

function Topbar({ title, sub }) {
  const { user } = useAuth();
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  return (
    <div style={{ height:60, background:G.card, borderBottom:`1px solid ${G.border}`,
      display:"flex", alignItems:"center", padding:"0 28px", gap:16,
      position:"sticky", top:0, zIndex:40 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:16, color:G.ink }}>{title}</div>
        <div style={{ fontSize:11, color:G.muted, marginTop:1 }}>{sub} — Logged in as {user?.name}</div>
      </div>
      <div style={{ fontSize:12, color:G.muted }}>{dateStr}</div>
      <div style={{ position:"relative", width:34, height:34, borderRadius:9,
        background:G.bg, border:`1px solid ${G.border}`,
        display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>
        🔔
        <span style={{ position:"absolute", top:6, right:6, width:7, height:7, borderRadius:"50%",
          background:G.accent, border:"1.5px solid #fff" }} />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:G.bg, flexDirection:"column", gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:14, background:G.accent,
        display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 24px ${G.accent}40` }}>
        <span style={{ color:"#fff", fontSize:22, fontWeight:800, fontFamily:"serif" }}>D</span>
      </div>
      <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:20, color:G.ink }}>
        DIGI<span style={{ color:G.accent }}>HR</span>
      </div>
      <div style={{ width:28, height:28, border:`3px solid ${G.border}`, borderTopColor:G.accent,
        borderRadius:"50%", animation:"spin .8s linear infinite" }} />
    </div>
  );
}

function InnerApp() {
  const { user, loading, isAuthenticated, mockLogin } = useAuth();
  const [page,setPage] = useState("home");
  const [active, setActive] = useState("dashboard");

 
if(page==="home"){
  return <Home goLogin={()=>setPage("login")} />;
}

if(page==="login"){
  return (
    <>
      <Header goLogin={()=>setPage("login")} />
      <Login
        onLogin={(email,password)=>{
          mockLogin(email,password);
          setPage("app");
        }}
      />
    </>
  );
}

  const meta  = PAGE_META[active] || { title:"DIGIHR", sub:"" };
  const PAGES = {
    dashboard:  <Dashboard />,
    employees:  <Employees />,
    attendance: <AttendancePage />,
    payroll:    <Payroll />,
    pms:        <PMS />,
    documents:  <Documents />,
    expenses:   <Expenses />,
    assets:     <Assets />,
    reports:    <Reports />,
    settings:   <Settings />,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar active={active} setActive={setActive} />
      <div style={{ marginLeft:240, flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <Topbar title={meta.title} sub={meta.sub} />
        <div style={{ flex:1, overflowY:"auto" }} key={active} className="fade">
          {PAGES[active]}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <style>{CSS}</style>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </>
  );
}
