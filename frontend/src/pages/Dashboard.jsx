import { useState, useEffect } from "react";
import { Card, StatCard, G } from "../components/UI.jsx";
import { dashboardApi, attendanceApi, leavesApi, expensesApi } from "../utils/api.js";

const DEPT_COLORS = ["#FF4E1A","#5B8DEF","#28C840","#FFB800","#A78BFA","#EC4899"];
const ACTIVITY = [
  { text:"System ready — all modules connected",  time:"Just now",   icon:"✅", color:G.green  },
  { text:"Database connected successfully",        time:"Just now",   icon:"🗄", color:G.blue   },
  { text:"Payroll engine initialised",             time:"On startup", icon:"💰", color:G.accent },
  { text:"Attendance tracking active",             time:"On startup", icon:"📋", color:G.yellow },
];

const MiniBar = ({ value, max, color }) => (
  <div style={{ flex:1, height:8, borderRadius:4, background:G.bg, overflow:"hidden" }}>
    <div style={{ width:`${max>0?(value/max)*100:0}%`, height:"100%", borderRadius:4, background:color, transition:"width .8s" }} />
  </div>
);

const DonutRing = ({ data, size=120 }) => {
  const total = data.reduce((s,d)=>s+d.value,0)||1;
  let offset = 0;
  const r=45,cx=60,cy=60,stroke=12,circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={G.border} strokeWidth={stroke}/>
      {data.map((d,i)=>{
        const pct=d.value/total, dashArr=circ*pct, dashOff=-offset*circ;
        offset+=pct;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={stroke}
          strokeDasharray={`${dashArr} ${circ-dashArr}`} strokeDashoffset={dashOff} strokeLinecap="round"
          style={{transform:"rotate(-90deg)",transformOrigin:"center"}}/>;
      })}
      <text x={cx} y={cy-4}  textAnchor="middle" fontSize={20} fontWeight={800} fontFamily={G.fontHead} fill={G.ink}>{total}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize={9}  fill={G.muted} fontFamily={G.font}>employees</text>
    </svg>
  );
};

export default function Dashboard() {
  const [time,       setTime]       = useState(new Date());
  const [stats,      setStats]      = useState({totalEmployees:0,presentToday:0,pendingLeaves:0,monthlyPayroll:0});
  const [attendance, setAttendance] = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [deptMap,    setDeptMap]    = useState({});

  useEffect(()=>{
    const t=setInterval(()=>setTime(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const today=new Date().toISOString().split("T")[0];
    Promise.all([dashboardApi.stats(),attendanceApi.list({date:today}),leavesApi.list({status:"Pending"}),expensesApi.list({status:"Pending"})])
      .then(([s,att,lv,ex])=>{
        setStats(s||{});
        const a=Array.isArray(att)?att:[];
        setAttendance(a);
        setLeaves(Array.isArray(lv)?lv:[]);
        setExpenses(Array.isArray(ex)?ex:[]);
        const dm={};
        a.forEach(r=>{dm[r.department]=(dm[r.department]||0)+1;});
        setDeptMap(dm);
      }).catch(()=>{});
  },[]);

  const present=attendance.filter(a=>a.status==="Present").length;
  const absent =attendance.filter(a=>a.status==="Absent").length;
  const onLeave=attendance.filter(a=>a.status==="On Leave").length;
  const total  =stats.totalEmployees||0;
  const pendingActions=[
    ...leaves.slice(0,3).map(l=>({type:"Leave",  emp:l.employee_name,detail:`${l.leave_type} · ${l.days} day(s)`,            icon:"🏖",color:G.yellow})),
    ...expenses.slice(0,3).map(e=>({type:"Expense",emp:e.employee_name,detail:`${e.category} · ₹${(+e.amount).toLocaleString()}`,icon:"🧾",color:G.blue})),
  ];
  const depts=Object.keys(deptMap);
  const donutData=[{label:"Present",value:present||1,color:G.green},{label:"On Leave",value:onLeave,color:G.yellow},{label:"Absent",value:absent,color:"#EF4444"}];
  const payrollDisplay=stats.monthlyPayroll?`₹${(stats.monthlyPayroll/100000).toFixed(1)}L`:"₹0";

  return (
    <div className="dashboard-page" style={{padding:28,display:"flex",flexDirection:"column",gap:20}}>
      <div style={{background:G.ink,borderRadius:14,padding:"18px 28px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:G.fontHead,fontWeight:800,fontSize:24,color:"#fff",letterSpacing:"-0.02em"}}>
            {time.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:2}}>
            {time.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        </div>
        <div style={{display:"flex",gap:24}}>
          {[["Present Today",`${present}/${attendance.length}`,G.green],["Pending Actions",pendingActions.length,G.yellow],["Monthly Payroll",payrollDisplay,G.accent]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"right"}}>
              <div style={{fontFamily:G.fontHead,fontWeight:800,fontSize:20,color:c}}>{v}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
        <StatCard label="Total Employees"   value={total}                 icon="👥" color={G.accent} sub="active employees"/>
        <StatCard label="Present Today"     value={present}               icon="✅" color={G.green}  sub={total>0?`${Math.round(present/total*100)}% attendance`:"no data"}/>
        <StatCard label="Pending Approvals" value={pendingActions.length} icon="⏳" color={G.yellow} sub="leaves & expenses"/>
        <StatCard label="Pending Leaves"    value={stats.pendingLeaves||0}icon="🏖" color={G.blue}   sub="awaiting approval"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14}}>Departments</div>
            <DonutRing data={donutData} size={60}/>
          </div>
          {depts.length>0?depts.map((d,i)=>{
            const cnt=deptMap[d]||0;
            return (
              <div key={d} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:DEPT_COLORS[i%DEPT_COLORS.length],display:"inline-block"}}/>
                    <span style={{fontSize:12,fontWeight:500,color:G.ink2}}>{d}</span>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:G.ink}}>{cnt}</span>
                </div>
                <MiniBar value={cnt} max={attendance.length} color={DEPT_COLORS[i%DEPT_COLORS.length]}/>
              </div>
            );
          }):<div style={{color:G.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No attendance data yet</div>}
        </Card>

        <Card>
          <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:4}}>Today's Attendance</div>
          <div style={{fontSize:12,color:G.muted,marginBottom:16}}>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long"})}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>
            {[["Present",present,G.green,"✅"],["Absent",absent,"#EF4444","❌"],["On Leave",onLeave,G.yellow,"🏖"]].map(([l,v,c,icon])=>(
              <div key={l} style={{background:c+"10",borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
                <div style={{fontFamily:G.fontHead,fontWeight:800,fontSize:20,color:c}}>{v}</div>
                <div style={{fontSize:10,color:G.muted,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          {attendance.length>0?(
            <>
              <div style={{display:"flex",gap:2,height:8,borderRadius:4,overflow:"hidden"}}>
                {attendance.map((a,i)=>(
                  <div key={i} title={`${a.name}: ${a.status}`}
                    style={{flex:1,background:a.status==="Present"?G.green:a.status==="Absent"?"#EF4444":G.yellow,cursor:"pointer"}}/>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:10,color:G.muted}}>
                <span>0%</span><span>{Math.round(present/attendance.length*100)}% present</span><span>100%</span>
              </div>
            </>
          ):<div style={{color:G.muted,fontSize:12,textAlign:"center",padding:"12px 0"}}>No check-ins recorded today</div>}
        </Card>

        <Card>
          <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:16}}>
            Pending Actions <span style={{background:G.accent,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 8px",marginLeft:6}}>{pendingActions.length}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {pendingActions.length>0?pendingActions.slice(0,5).map((p,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",paddingBottom:12,marginBottom:12,borderBottom:i<4?`1px solid ${G.border}`:"none"}}>
                <div style={{width:30,height:30,borderRadius:8,background:p.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{p.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:G.ink}}>{p.emp}</div>
                  <div style={{fontSize:11,color:G.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.detail}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:p.color,background:p.color+"15",padding:"2px 7px",borderRadius:6,flexShrink:0}}>{p.type}</span>
              </div>
            )):<div style={{color:G.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No pending actions 🎉</div>}
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:16}}>
        <Card>
          <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:18}}>Activity Feed</div>
          {ACTIVITY.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:12,paddingBottom:14,marginBottom:14,borderBottom:i<ACTIVITY.length-1?`1px solid ${G.border}`:"none"}}>
              <div style={{width:34,height:34,borderRadius:9,background:a.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{a.icon}</div>
              <div style={{flex:1,paddingTop:2}}>
                <div style={{fontSize:13,color:G.ink2}}>{a.text}</div>
                <div style={{fontSize:11,color:G.muted,marginTop:3}}>{a.time}</div>
              </div>
            </div>
          ))}
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card style={{padding:20}}>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:13,marginBottom:14}}>Live Snapshot</div>
            {[["Total Employees",total,G.ink],["Present Today",present,G.green],["On Leave",onLeave,G.yellow],["Monthly Payroll",payrollDisplay,G.accent],["Pending Leaves",stats.pendingLeaves||0,G.blue]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10,marginBottom:10,borderBottom:`1px solid ${G.border}`}}>
                <span style={{fontSize:12,color:G.muted}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,fontFamily:G.fontHead,color:c}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{padding:20}}>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:13,marginBottom:14}}>Quick Links</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Add Employee","👤",G.accent],["Run Payroll","💰",G.green],["View Reports","📊",G.blue],["Announcements","📢",G.yellow]].map(([l,icon,c])=>(
                <div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"12px 8px",borderRadius:10,background:G.bg,cursor:"pointer",border:`1px solid ${G.border}`,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=c+"10";e.currentTarget.style.borderColor=c;}}
                  onMouseLeave={e=>{e.currentTarget.style.background=G.bg;e.currentTarget.style.borderColor=G.border;}}>
                  <span style={{fontSize:20}}>{icon}</span>
                  <span style={{fontSize:11,fontWeight:600,color:G.ink2,textAlign:"center",lineHeight:1.3}}>{l}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
