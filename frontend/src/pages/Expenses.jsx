import { useState, useEffect } from "react";
import { Card, StatCard, Table, Td, Btn, Input, Select, StatusBadge, Avatar, Badge, getColor, G } from "../components/UI.jsx";
import { expensesApi } from "../utils/api.js";

const CATEGORIES = ["All","Travel","Client Meals","Software","Office","Training","Medical","Other"];
const CAT_ICONS  = { "Travel":"✈️","Client Meals":"🍽️","Software":"💻","Office":"🖊️","Training":"📚","Medical":"🏥","Other":"📦" };
const CAT_COLORS = { "Travel":G.blue,"Client Meals":G.yellow,"Software":G.purple,"Office":G.green,"Training":G.accent,"Medical":"#EF4444","Other":G.muted };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("all");
  const [cat,      setCat]      = useState("All");
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ description:"", amount:"", category:"Travel", utr_number:"", expense_date:"" });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    expensesApi.list()
      .then(res => setExpenses(Array.isArray(res) ? res : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const approve = id => expensesApi.updateStatus(id,"Approved","").then(()=>setExpenses(e=>e.map(x=>x.id===id?{...x,status:"Approved"}:x))).catch(console.error);
  const reject  = id => expensesApi.updateStatus(id,"Rejected","").then(()=>setExpenses(e=>e.map(x=>x.id===id?{...x,status:"Rejected"}:x))).catch(console.error);

  const submit = () => {
    if (!form.description||!form.amount) return;
    setSaving(true);
    expensesApi.submit({ description:form.description, amount:+form.amount, category:form.category, utr_number:form.utr_number, expense_date:form.expense_date })
      .then(newExp => { setExpenses(p=>[newExp,...p]); setShowForm(false); setForm({ description:"", amount:"", category:"Travel", utr_number:"", expense_date:"" }); })
      .catch(console.error).finally(()=>setSaving(false));
  };

  const filtered = expenses.filter(e=>
    (cat==="All"||e.category===cat)&&
    (tab==="all"||e.status?.toLowerCase()===tab)&&
    ((e.employee_name||"").toLowerCase().includes(search.toLowerCase())||(e.description||"").toLowerCase().includes(search.toLowerCase())||(e.utr_number||"").includes(search))
  );

  const totalPending  = expenses.filter(e=>e.status==="Pending").reduce((s,e)=>s+(+e.amount||0),0);
  const totalApproved = expenses.filter(e=>e.status==="Approved").reduce((s,e)=>s+(+e.amount||0),0);
  const totalRejected = expenses.filter(e=>e.status==="Rejected").reduce((s,e)=>s+(+e.amount||0),0);
  const pendingCount  = expenses.filter(e=>e.status==="Pending").length;

  const TABS = [["all","All"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"]];

  return (
    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        <StatCard label="Pending Approval" value={loading?"…":`₹${(totalPending/1000).toFixed(1)}K`}  icon="⏳" color={G.yellow} sub={`${pendingCount} requests`} />
        <StatCard label="Approved (MTD)"   value={loading?"…":`₹${(totalApproved/1000).toFixed(1)}K`} icon="✅" color={G.green}  sub="this month" />
        <StatCard label="Rejected"         value={loading?"…":`₹${(totalRejected/1000).toFixed(1)}K`} icon="❌" color="#EF4444" sub="this month" />
        <StatCard label="Total Submitted"  value={loading?"…":expenses.length}                        icon="📋" color={G.accent} sub="all time" />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:4, background:G.bg, padding:4, borderRadius:10 }}>
          {TABS.map(([id,label])=>{
            const cnt=id==="all"?expenses.length:expenses.filter(e=>e.status?.toLowerCase()===id).length;
            return <div key={id} onClick={()=>setTab(id)}
              style={{ padding:"6px 16px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:500,
                background:tab===id?G.card:"transparent", color:tab===id?G.ink:G.muted,
                boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.07)":"none", display:"flex", alignItems:"center", gap:6 }}>
              {label} <span style={{ fontSize:11, color:tab===id?G.muted:"transparent", background:G.bg, borderRadius:10, padding:"1px 7px" }}>{cnt}</span>
            </div>;
          })}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee, desc, UTR…" style={{ width:240 }} />
          <Select value={cat} onChange={e=>setCat(e.target.value)} options={CATEGORIES} />
          <Btn onClick={()=>setShowForm(true)}>+ Submit Expense</Btn>
        </div>
      </div>

      {showForm&&(
        <Card style={{ border:`1.5px solid ${G.accent}`, background:G.accentBg }}>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14, marginBottom:18, color:G.accent }}>Submit New Expense</div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:14, alignItems:"flex-end" }}>
            {[["Description","description","text"],["Amount (₹)","amount","number"],["UTR Number","utr_number","text"],["Date","expense_date","date"]].map(([l,k,t])=>(
              <div key={k}>
                <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 }}>{l}</div>
                <Input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={l} style={{ width:"100%" }} />
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5 }}>Category</div>
              <Select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} options={CATEGORIES.slice(1)} style={{ width:"100%" }} />
            </div>
          </div>
          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <Btn onClick={submit} disabled={saving}>{saving?"Submitting…":"Submit Expense"}</Btn>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {CATEGORIES.map(c=>(
          <div key={c} onClick={()=>setCat(c)}
            style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer",
              background:cat===c?G.ink:G.card, color:cat===c?"#fff":G.ink2,
              border:`1px solid ${cat===c?G.ink:G.border}`, transition:"all .15s", display:"flex", alignItems:"center", gap:6 }}>
            {c!=="All"&&<span>{CAT_ICONS[c]}</span>} {c}
          </div>
        ))}
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>Expense Requests <span style={{ color:G.muted, fontWeight:400, fontSize:12 }}>({filtered.length})</span></div>
          <Btn variant="secondary" style={{ fontSize:12 }}>📤 Export</Btn>
        </div>
        {loading?<div style={{ padding:40, textAlign:"center", color:G.muted }}>Loading expenses…</div>
          :filtered.length===0?<div style={{ padding:40, textAlign:"center", color:G.muted }}>No expense records found.</div>
          :<Table cols={["ID","Employee","Category","Description","Amount","UTR","Date","Status","Actions"]} rows={filtered}
            renderRow={exp=>[
              <Td key="id"><span style={{ color:G.muted, fontSize:11 }}>{exp.id}</span></Td>,
              <Td key="e"><div style={{ display:"flex", gap:8, alignItems:"center" }}><Avatar initials={(exp.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={28} color={getColor(exp.employee_name||"")} /><div><div style={{ fontWeight:500 }}>{exp.employee_name}</div><div style={{ fontSize:11, color:G.muted }}>{exp.department}</div></div></div></Td>,
              <Td key="c"><div style={{ display:"flex", alignItems:"center", gap:6 }}><span>{CAT_ICONS[exp.category]}</span><Badge color={CAT_COLORS[exp.category]||G.muted}>{exp.category}</Badge></div></Td>,
              <Td key="d"><span style={{ color:G.ink2, maxWidth:200, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{exp.description}</span></Td>,
              <Td key="a"><span style={{ fontFamily:G.fontHead, fontWeight:700 }}>₹{(+exp.amount||0).toLocaleString()}</span></Td>,
              <Td key="u"><span style={{ fontSize:11, fontFamily:"monospace", color:G.blue }}>{exp.utr_number||"—"}</span></Td>,
              <Td key="dt"><span style={{ color:G.muted, fontSize:12 }}>{exp.expense_date}</span></Td>,
              <Td key="s"><StatusBadge status={exp.status} /></Td>,
              <Td key="ac"><div style={{ display:"flex", gap:6 }}>
                <Btn variant="ghost" style={{ padding:"3px 9px", fontSize:11 }} onClick={()=>setSelected(exp)}>View</Btn>
                {exp.status==="Pending"&&<><Btn variant="success" style={{ padding:"3px 9px", fontSize:11 }} onClick={()=>approve(exp.id)}>✓</Btn><Btn variant="danger" style={{ padding:"3px 9px", fontSize:11 }} onClick={()=>reject(exp.id)}>✗</Btn></>}
              </div></Td>,
            ]} />
        }
      </Card>

      {selected&&(
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:G.card, borderRadius:20, padding:36, width:480, boxShadow:"0 24px 80px rgba(0,0,0,.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:16 }}>Expense Details</div>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>✕</Btn>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:28 }}>{CAT_ICONS[selected.category]||"📦"}</span>
                  <div>
                    <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:17 }}>₹{(+selected.amount||0).toLocaleString()}</div>
                    <div style={{ fontSize:12, color:G.muted }}>{selected.category}</div>
                  </div>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              {[["Description",selected.description],["Employee",selected.employee_name],["Department",selected.department],["UTR Number",selected.utr_number||"—"],["Expense Date",selected.expense_date],["Submitted On",selected.submitted_on]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", paddingBottom:10, borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ fontSize:12, color:G.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{k}</span>
                  <span style={{ fontSize:13, color:G.ink2, fontWeight:500 }}>{v}</span>
                </div>
              ))}
              {selected.status==="Pending"&&(
                <div style={{ display:"flex", gap:10, marginTop:8 }}>
                  <Btn style={{ flex:1, justifyContent:"center" }} onClick={()=>{approve(selected.id);setSelected(null);}}>✅ Approve</Btn>
                  <Btn variant="danger" style={{ flex:1, justifyContent:"center" }} onClick={()=>{reject(selected.id);setSelected(null);}}>❌ Reject</Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
