import { useState } from "react";
import { Card, Btn, Input, Select, Badge, G } from "../components/UI.jsx";

const ROLES = [
  { role:"Super Admin", users:1,  access:"Full system access — all modules",              color:G.accent,  icon:"👑", perms:["employees","payroll","pms","documents","expenses","assets","settings","reports"] },
  { role:"HR Manager",  users:3,  access:"Employees, Payroll, Leave, PMS, Documents",      color:G.blue,    icon:"👩‍💼", perms:["employees","payroll","pms","documents","expenses","reports"] },
  { role:"Manager",     users:12, access:"Team attendance, Leave approvals, PMS",          color:G.green,   icon:"👔", perms:["attendance","leaves","pms"] },
  { role:"Finance",     users:4,  access:"Payroll, Reports, Expenses",                     color:G.purple,  icon:"💼", perms:["payroll","expenses","reports"] },
  { role:"Employee",    users:892,access:"Self-service — attendance, payslips, expenses",  color:G.yellow,  icon:"👤", perms:["attendance","payslips","expenses","assets"] },
];

const ALL_PERMS = [
  { key:"employees",  label:"Employees" },  { key:"payroll",   label:"Payroll" },
  { key:"pms",        label:"PMS" },         { key:"documents", label:"Documents" },
  { key:"expenses",   label:"Expenses" },    { key:"assets",    label:"Assets" },
  { key:"attendance", label:"Attendance" },  { key:"leaves",    label:"Leave Mgmt" },
  { key:"reports",    label:"Reports" },     { key:"settings",  label:"Settings" },
  { key:"payslips",   label:"Payslips" },
];

const SECURITY_ITEMS = [
  { icon:"🔑", title:"Two-Factor Authentication",  desc:"Require 2FA for all admin logins",              enabled:true  },
  { icon:"🔒", title:"Session Timeout (30 min)",   desc:"Auto-logout after inactivity",                  enabled:true  },
  { icon:"📧", title:"Security Email Alerts",      desc:"Notify admin on suspicious logins",             enabled:true  },
  { icon:"📝", title:"Audit Logs",                 desc:"Track every admin action with timestamp",       enabled:false },
  { icon:"🌐", title:"IP Whitelist",               desc:"Restrict login to company IP ranges only",      enabled:false },
  { icon:"🛡️", title:"Data Encryption (AES-256)",  desc:"Encrypt all stored employee data",              enabled:true  },
  { icon:"📱", title:"Mobile App Access",          desc:"Allow Android app login for employees",         enabled:true  },
  { icon:"🔗", title:"Single Sign-On (SSO)",       desc:"Integrate with Google/Microsoft SSO",           enabled:false },
];

export default function Settings() {
  const [tab, setTab]         = useState("roles");
  const [security, setSecurity] = useState(SECURITY_ITEMS);
  const [orgData, setOrgData] = useState({
    name:     "DIGIHR Technologies Pvt Ltd",
    website:  "www.digihr.in",
    industry: "HR Technology",
    size:     "501–1000 employees",
    city:     "Bangalore",
    state:    "Karnataka",
    email:    "admin@digihr.in",
    phone:    "+91 80 4567 8900",
    pan:      "AABCD1234E",
    gst:      "29AABCD1234E1ZK",
    timezone: "Asia/Kolkata (IST UTC+5:30)",
    currency: "INR (₹)",
    dateFormat:"DD/MM/YYYY",
  });
  const [saved, setSaved]     = useState(false);
  const [editRole, setEditRole] = useState(null);

  const toggleSecurity = (i) => setSecurity(s => s.map((x,idx)=>idx===i?{...x,enabled:!x.enabled}:x));

  const saveOrg = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  const TABS = [["roles","👥 Roles"],["org","🏢 Organization"],["payroll-cfg","💰 Payroll Config"],["security","🔒 Security"],["notifications","🔔 Notifications"]];

  return (
    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", gap:4, background:G.bg, padding:4, borderRadius:10, width:"fit-content" }}>
        {TABS.map(([id,label])=>(
          <div key={id} onClick={()=>setTab(id)}
            style={{ padding:"7px 18px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500,
              background:tab===id?G.card:"transparent", color:tab===id?G.ink:G.muted,
              boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.07)":"none" }}>
            {label}
          </div>
        ))}
      </div>

      {/* ── ROLES ── */}
      {tab==="roles" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>Role-Based Access Control</div>
            <Btn>+ Create Role</Btn>
          </div>
          {ROLES.map(r=>(
            <Card key={r.role} style={{ padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:r.color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{r.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:G.ink, marginBottom:4 }}>{r.role}</div>
                  <div style={{ fontSize:12, color:G.muted, marginBottom:10 }}>{r.access}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {r.perms.map(p=>(
                      <span key={p} style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:6, background:r.color+"15", color:r.color }}>
                        {ALL_PERMS.find(x=>x.key===p)?.label||p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <Badge color={r.color}>{r.users} {r.users===1?"user":"users"}</Badge>
                  <div style={{ marginTop:10 }}>
                    <Btn variant="ghost" style={{ fontSize:12, padding:"5px 12px" }} onClick={()=>setEditRole(r)}>Edit Permissions</Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Edit role modal */}
          {editRole && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
              onClick={()=>setEditRole(null)}>
              <div onClick={e=>e.stopPropagation()}
                style={{ background:G.card, borderRadius:20, padding:32, width:500, boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
                  <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:16 }}>Edit — {editRole.role}</div>
                  <Btn variant="ghost" onClick={()=>setEditRole(null)}>✕</Btn>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {ALL_PERMS.map(p=>(
                    <label key={p.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1px solid ${G.border}`, cursor:"pointer" }}>
                      <input type="checkbox" defaultChecked={editRole.perms.includes(p.key)} style={{ accentColor:editRole.color, width:15, height:15 }} />
                      <span style={{ fontSize:13, fontWeight:500, color:G.ink2 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop:20, display:"flex", gap:10 }}>
                  <Btn style={{ flex:1, justifyContent:"center" }} onClick={()=>setEditRole(null)}>Save Permissions</Btn>
                  <Btn variant="secondary" onClick={()=>setEditRole(null)}>Cancel</Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORGANIZATION ── */}
      {tab==="org" && (
        <Card style={{ maxWidth:700 }}>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:24 }}>Organization Settings</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {[["Company Name","name","text"],["Website","website","text"],["Industry","industry","text"],["Company Size","size","text"],["City","city","text"],["State","state","text"],["Contact Email","email","email"],["Phone","phone","text"],["PAN Number","pan","text"],["GST Number","gst","text"]].map(([l,k,t])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 }}>{l}</div>
                <Input type={t} value={orgData[k]} onChange={e=>setOrgData(p=>({...p,[k]:e.target.value}))} style={{ width:"100%" }} />
              </div>
            ))}
            {[["Timezone","timezone",["Asia/Kolkata (IST UTC+5:30)","Asia/Dubai (GST UTC+4)"]],["Currency","currency",["INR (₹)","USD ($)","EUR (€)"]],["Date Format","dateFormat",["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"]]].map(([l,k,opts])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 }}>{l}</div>
                <Select value={orgData[k]} onChange={e=>setOrgData(p=>({...p,[k]:e.target.value}))} options={opts} style={{ width:"100%" }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:24, display:"flex", gap:10 }}>
            <Btn onClick={saveOrg}>{saved?"✅ Saved!":"Save Changes"}</Btn>
            <Btn variant="secondary">Reset</Btn>
          </div>
        </Card>
      )}

      {/* ── PAYROLL CONFIG ── */}
      {tab==="payroll-cfg" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:720 }}>
          <Card>
            <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:13, marginBottom:18 }}>Pay Cycles</div>
            {[["Monthly","1st – Last day of month",true],["21–20","21st to 20th next month",false],["26–25","26th to 25th next month",false]].map(([name,desc,active])=>(
              <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${G.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{name}</div>
                  <div style={{ fontSize:12, color:G.muted }}>{desc}</div>
                </div>
                <div style={{ width:36, height:20, borderRadius:10, background:active?G.green:G.border, position:"relative", cursor:"pointer" }}>
                  <div style={{ width:14, height:14, borderRadius:7, background:"#fff", position:"absolute", top:3, left:active?19:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:13, marginBottom:18 }}>Deduction Rules</div>
            {[["PF (Employee)","12% of Basic"],["PF (Employer)","12% of Basic"],["ESI (Employee)","0.75% if Gross ≤ ₹21,000"],["ESI (Employer)","3.25% if Gross ≤ ₹21,000"],["TDS","As per income tax slab"],["Professional Tax","As per state rules"]].map(([rule,val])=>(
              <div key={rule} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, marginBottom:10, borderBottom:`1px solid ${G.border}` }}>
                <span style={{ fontSize:12, color:G.ink2 }}>{rule}</span>
                <span style={{ fontSize:12, fontWeight:600, color:G.accent }}>{val}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab==="security" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, maxWidth:760 }}>
          {security.map((item,i)=>(
            <Card key={item.title} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"18px 20px" }}>
              <div style={{ fontSize:22, flexShrink:0 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:G.ink }}>{item.title}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:3 }}>{item.desc}</div>
              </div>
              <div onClick={()=>toggleSecurity(i)}
                style={{ width:38, height:22, borderRadius:11, background:item.enabled?G.green:G.border, position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
                <div style={{ width:16, height:16, borderRadius:8, background:"#fff", position:"absolute", top:3, left:item.enabled?19:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab==="notifications" && (
        <Card style={{ maxWidth:600 }}>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:20 }}>Notification Preferences</div>
          {[["Leave request submitted","Email + In-app",true],["Leave approved/rejected","Email + In-app",true],["Payroll processed","Email",true],["Expense approved","In-app",true],["New employee added","Email",false],["Asset request raised","In-app",true],["PMS review pending","Email + In-app",true],["Announcements","In-app",true]].map(([event,channel,on],i)=>(
            <div key={event} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${G.border}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:G.ink }}>{event}</div>
                <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>{channel}</div>
              </div>
              <div style={{ width:36, height:20, borderRadius:10, background:on?G.green:G.border, position:"relative", cursor:"pointer" }}>
                <div style={{ width:14, height:14, borderRadius:7, background:"#fff", position:"absolute", top:3, left:on?19:3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
