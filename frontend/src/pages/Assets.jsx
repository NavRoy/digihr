import { useState, useEffect } from "react";
import { Card, StatCard, Table, Td, Btn, Input, Select, StatusBadge, Avatar, Badge, getColor, G } from "../components/UI";
import { assetsApi } from "../utils/api.js";

const CATEGORIES = ["All","Laptop","Monitor","Phone","Tablet","Accessory","Furniture","Headphones","Printer"];
const CAT_ICONS  = {"Laptop":"💻","Monitor":"🖥","Phone":"📱","Tablet":"📱","Accessory":"🖱","Furniture":"🪑","Headphones":"🎧","Printer":"🖨","Default":"📦"};
const PRIORITY_COLORS = {"Urgent":"#EF4444","High":G.yellow,"Medium":G.blue,"Low":G.muted};

export default function Assets() {
  const [assets,      setAssets]      = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("inventory");
  const [cat,         setCat]         = useState("All");
  const [search,      setSearch]      = useState("");
  const [selected,    setSelected]    = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm,     setAddForm]     = useState({name:"",category:"Laptop",brand:"",serialNumber:"",purchaseValue:"",warrantyUntil:"",condition:"New"});

  useEffect(()=>{
    Promise.all([assetsApi.list(),assetsApi.getRequests()])
      .then(([a,r])=>{setAssets(Array.isArray(a)?a:[]);setRequests(Array.isArray(r)?r:[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const approveReq = id=>assetsApi.updateRequest(id,"Approved","").then(()=>setRequests(r=>r.map(x=>x.id===id?{...x,status:"Approved"}:x))).catch(()=>{});
  const rejectReq  = id=>assetsApi.updateRequest(id,"Rejected","").then(()=>setRequests(r=>r.map(x=>x.id===id?{...x,status:"Rejected"}:x))).catch(()=>{});
  const returnAsset= id=>assetsApi.return_(id).then(()=>setAssets(a=>a.map(x=>x.id===id?{...x,status:"Available",assigned_to_name:null}:x))).catch(()=>{});

  const addAsset=()=>{
    if(!addForm.name||!addForm.serialNumber) return;
    assetsApi.create({...addForm,purchaseValue:+addForm.purchaseValue||0})
      .then(a=>{setAssets(p=>[a,...p]);setShowAddForm(false);setAddForm({name:"",category:"Laptop",brand:"",serialNumber:"",purchaseValue:"",warrantyUntil:"",condition:"New"});})
      .catch(()=>{});
  };

  const filteredAssets=assets.filter(a=>
    (cat==="All"||a.category===cat)&&
    ((a.name||"").toLowerCase().includes(search.toLowerCase())||
     (a.assigned_to_name||"").toLowerCase().includes(search.toLowerCase())||
     (a.serial_number||"").toLowerCase().includes(search.toLowerCase()))
  );

  const totalValue  = assets.reduce((s,a)=>s+(+a.purchase_value||0),0);
  const available   = assets.filter(a=>a.status==="Available").length;
  const assigned    = assets.filter(a=>a.status==="Assigned").length;
  const underRepair = assets.filter(a=>a.status==="Under Repair").length;
  const pendingReqs = requests.filter(r=>r.status==="Pending").length;

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14}}>
        <StatCard label="Total Assets"  value={assets.length}                         icon="📦" color={G.accent}  sub="all categories"/>
        <StatCard label="Assigned"      value={assigned}                              icon="✅" color={G.green}   sub="in use"/>
        <StatCard label="Available"     value={available}                             icon="🟢" color={G.blue}    sub="ready to assign"/>
        <StatCard label="Under Repair"  value={underRepair}                           icon="🔧" color={G.yellow}  sub="being fixed"/>
        <StatCard label="Asset Value"   value={`₹${(totalValue/100000).toFixed(1)}L`} icon="💰" color={G.purple}  sub="total portfolio"/>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,background:G.bg,padding:4,borderRadius:10}}>
          {[["inventory","📦 Inventory"],["requests","📋 Requests"]].map(([id,label])=>(
            <div key={id} onClick={()=>setTab(id)}
              style={{padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,
                background:tab===id?G.card:"transparent",color:tab===id?G.ink:G.muted,
                boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.07)":"none"}}>
              {label}
              {id==="requests"&&pendingReqs>0&&<span style={{marginLeft:6,background:G.accent,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{pendingReqs}</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets…" style={{width:220}}/>
          <Select value={cat} onChange={e=>setCat(e.target.value)} options={CATEGORIES}/>
          <Btn onClick={()=>setShowAddForm(true)}>+ Add Asset</Btn>
        </div>
      </div>

      {showAddForm&&(
        <Card style={{border:`1.5px solid ${G.accent}`,background:G.accentBg}}>
          <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:16,color:G.accent}}>Register New Asset</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {[["Asset Name","name","text"],["Serial Number","serialNumber","text"],["Brand","brand","text"],["Purchase Value (₹)","purchaseValue","number"],["Warranty Until","warrantyUntil","date"],["Condition","condition","text"]].map(([l,k,t])=>(
              <div key={k}><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>{l}</div><Input type={t} value={addForm[k]} onChange={e=>setAddForm(p=>({...p,[k]:e.target.value}))} placeholder={l} style={{width:"100%"}}/></div>
            ))}
            <div><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Category</div><Select value={addForm.category} onChange={e=>setAddForm(p=>({...p,category:e.target.value}))} options={CATEGORIES.slice(1)} style={{width:"100%"}}/></div>
          </div>
          <div style={{marginTop:16,display:"flex",gap:10}}>
            <Btn onClick={addAsset}>Save Asset</Btn>
            <Btn variant="secondary" onClick={()=>setShowAddForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {tab==="inventory"&&(
        <>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {CATEGORIES.map(c=>(
              <div key={c} onClick={()=>setCat(c)}
                style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",
                  background:cat===c?G.ink:G.card,color:cat===c?"#fff":G.ink2,
                  border:`1px solid ${cat===c?G.ink:G.border}`,transition:"all .15s",display:"flex",alignItems:"center",gap:6}}>
                {c!=="All"&&<span>{CAT_ICONS[c]}</span>} {c}
              </div>
            ))}
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${G.border}`,fontFamily:G.fontHead,fontWeight:700,fontSize:14}}>
              Asset Inventory <span style={{color:G.muted,fontWeight:400,fontSize:12}}>({filteredAssets.length})</span>
            </div>
            {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>
              :filteredAssets.length===0?<div style={{padding:40,textAlign:"center",color:G.muted}}>No assets found. Add your first asset above.</div>
              :<Table cols={["Asset","Category","Serial No.","Brand","Assigned To","Condition","Value","Warranty","Status","Actions"]} rows={filteredAssets}
                renderRow={a=>[
                  <Td key="n"><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>{CAT_ICONS[a.category]||"📦"}</span><span style={{fontWeight:500}}>{a.name}</span></div></Td>,
                  <Td key="c"><Badge color={G.blue}>{a.category}</Badge></Td>,
                  <Td key="s"><span style={{fontSize:11,fontFamily:"monospace",color:G.muted}}>{a.serial_number}</span></Td>,
                  <Td key="b"><span style={{color:G.ink2}}>{a.brand}</span></Td>,
                  <Td key="at">{a.assigned_to_name?<div style={{display:"flex",gap:8,alignItems:"center"}}><Avatar initials={a.assigned_to_name.split(" ").map(w=>w[0]).join("")} size={26} color={getColor(a.assigned_to_name)}/><span style={{color:G.ink2}}>{a.assigned_to_name}</span></div>:<span style={{color:G.muted}}>—</span>}</Td>,
                  <Td key="cond"><Badge color={a.condition==="New"?G.green:a.condition==="Good"?G.blue:a.condition==="Fair"?G.yellow:"#EF4444"}>{a.condition}</Badge></Td>,
                  <Td key="v"><span style={{fontFamily:G.fontHead,fontWeight:700}}>₹{(+a.purchase_value||0).toLocaleString()}</span></Td>,
                  <Td key="w"><span style={{fontSize:12,color:a.warranty_until&&new Date(a.warranty_until)<new Date()?"#EF4444":G.muted}}>{a.warranty_until||"—"}</span></Td>,
                  <Td key="st"><StatusBadge status={a.status==="Under Repair"?"On Leave":a.status==="Available"?"Active":a.status}/></Td>,
                  <Td key="ac"><div style={{display:"flex",gap:6}}>
                    <Btn variant="ghost" style={{padding:"3px 10px",fontSize:11}} onClick={()=>setSelected(a)}>Details</Btn>
                    {a.status==="Assigned"&&<Btn variant="secondary" style={{padding:"3px 10px",fontSize:11}} onClick={()=>returnAsset(a.id)}>↩ Return</Btn>}
                  </div></Td>,
                ]}/>}
          </Card>
        </>
      )}

      {tab==="requests"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>
            :requests.length===0?<div style={{padding:40,textAlign:"center",color:G.muted,background:G.card,borderRadius:12}}>No asset requests yet.</div>
            :requests.map(req=>(
              <Card key={req.id} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{width:44,height:44,borderRadius:12,background:(PRIORITY_COLORS[req.priority]||G.muted)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {CAT_ICONS[req.item_requested]||"📦"}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14}}>{req.item_requested} Request</div>
                      <div style={{fontSize:12,color:G.muted,marginTop:2}}>{req.employee_name} · {req.department} · {req.requested_on}</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <Badge color={PRIORITY_COLORS[req.priority]||G.muted}>{req.priority}</Badge>
                      <StatusBadge status={req.status==="Approved"?"Active":req.status==="Pending"?"Pending":"Inactive"}/>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:G.ink2,background:G.bg,borderRadius:8,padding:"10px 14px",marginBottom:10}}>"{req.description}"</div>
                  {req.status==="Pending"&&(
                    <div style={{display:"flex",gap:8}}>
                      <Btn variant="success" style={{padding:"5px 16px"}} onClick={()=>approveReq(req.id)}>✓ Approve</Btn>
                      <Btn variant="danger"  style={{padding:"5px 16px"}} onClick={()=>rejectReq(req.id)}>✗ Reject</Btn>
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}

      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:G.card,borderRadius:20,padding:36,width:480,boxShadow:"0 24px 80px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:16}}>Asset Details</div>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>✕</Btn>
            </div>
            <div style={{fontSize:48,textAlign:"center",marginBottom:12}}>{CAT_ICONS[selected.category]||"📦"}</div>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:18,textAlign:"center",marginBottom:20}}>{selected.name}</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[["Asset Code",selected.asset_code],["Serial Number",selected.serial_number],["Brand",selected.brand],["Category",selected.category],["Assigned To",selected.assigned_to_name||"—"],["Purchase Value",`₹${(+selected.purchase_value||0).toLocaleString()}`],["Warranty Until",selected.warranty_until||"—"],["Condition",selected.condition],["Status",selected.status]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",paddingBottom:10,borderBottom:`1px solid ${G.border}`}}>
                  <span style={{fontSize:12,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</span>
                  <span style={{fontSize:13,color:G.ink2,fontWeight:500}}>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:8}}>
                {selected.status==="Assigned"&&<Btn variant="secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>{returnAsset(selected.id);setSelected(null);}}>↩ Return</Btn>}
                <Btn variant="ghost" style={{flex:1,justifyContent:"center"}} onClick={()=>setSelected(null)}>Close</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
