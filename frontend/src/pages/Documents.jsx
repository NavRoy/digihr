import { useState, useEffect } from "react";
import { Card, StatCard, Btn, Input, Select, Badge, Avatar, getColor, G } from "../components/UI";
import { documentsApi } from "../utils/api.js";

const CATEGORIES = ["All","Onboarding","Legal","Performance","Policy","Payroll","Disciplinary","Training","Assets"];
const DOC_TYPES  = ["All","Offer Letter","Contract","Appraisal","Policy","Handbook","Payslip","Warning","NDA","Certificate","Agreement"];
const TYPE_ICONS = {"Offer Letter":"📄","Contract":"📋","Appraisal":"⭐","Policy":"📘","Handbook":"📗","Payslip":"💰","Warning":"⚠️","NDA":"🔏","Certificate":"🏆","Agreement":"✍️","Default":"📎"};
const CAT_COLORS = {"Onboarding":G.blue,"Legal":"#8B5CF6","Performance":G.yellow,"Policy":G.green,"Payroll":G.accent,"Disciplinary":"#EF4444","Training":"#14B8A6","Assets":G.muted};

export default function Documents() {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [cat,        setCat]        = useState("All");
  const [type,       setType]       = useState("All");
  const [selected,   setSelected]   = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode,   setViewMode]   = useState("table");
  const [newDoc,     setNewDoc]     = useState({name:"",type:"Offer Letter",category:"Onboarding",emp:""});

  useEffect(()=>{
    documentsApi.list().then(d=>setDocs(Array.isArray(d)?d:[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const deleteDoc = id=>documentsApi.delete(id).then(()=>setDocs(d=>d.filter(x=>x.id!==id))).catch(()=>{});

  const handleUpload=()=>{
    if(!newDoc.name) return;
    documentsApi.upload({name:newDoc.name,docType:newDoc.type,category:newDoc.category,isGlobal:!newDoc.emp,fileUrl:"#",fileSize:0,mimeType:"application/pdf",tags:[]})
      .then(d=>{setDocs(p=>[d,...p]);setShowUpload(false);setNewDoc({name:"",type:"Offer Letter",category:"Onboarding",emp:""}); })
      .catch(()=>{});
  };

  const filtered=docs.filter(d=>
    (cat==="All"||d.category===cat)&&
    (type==="All"||d.doc_type===type)&&
    ((d.name||"").toLowerCase().includes(search.toLowerCase())||(d.employee_name||"").toLowerCase().includes(search.toLowerCase()))
  );

  const today=new Date().toISOString().split("T")[0];

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <StatCard label="Total Documents" value={docs.length}                                      icon="📁" color={G.accent} sub="all categories"/>
        <StatCard label="Employee Docs"   value={docs.filter(d=>!d.is_global).length}              icon="👤" color={G.blue}   sub="personal files"/>
        <StatCard label="Confidential"    value={docs.filter(d=>d.status==="Confidential").length} icon="🔒" color="#EF4444"  sub="restricted access"/>
        <StatCard label="Uploaded Today"  value={docs.filter(d=>(d.created_at||"").startsWith(today)).length} icon="⬆️" color={G.green} sub="new documents"/>
      </div>

      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents or employee…" style={{width:260}}/>
        <Select value={cat}  onChange={e=>setCat(e.target.value)}  options={CATEGORIES}/>
        <Select value={type} onChange={e=>setType(e.target.value)} options={DOC_TYPES}/>
        <div style={{marginLeft:"auto",display:"flex",gap:8}}>
          <div style={{display:"flex",background:G.bg,borderRadius:8,overflow:"hidden",border:`1px solid ${G.border}`}}>
            {[["table","☰"],["grid","⊞"]].map(([m,icon])=>(
              <div key={m} onClick={()=>setViewMode(m)} style={{padding:"7px 13px",cursor:"pointer",background:viewMode===m?G.card:"transparent",color:viewMode===m?G.ink:G.muted,fontSize:14,transition:"all .15s"}}>{icon}</div>
            ))}
          </div>
          <Btn onClick={()=>setShowUpload(true)}>⬆ Upload Document</Btn>
        </div>
      </div>

      {showUpload&&(
        <Card style={{border:`1.5px solid ${G.accent}`,background:G.accentBg}}>
          <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:16,color:G.accent}}>Upload New Document</div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:14,alignItems:"flex-end"}}>
            <div><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Document Name</div><Input value={newDoc.name} onChange={e=>setNewDoc(p=>({...p,name:e.target.value}))} placeholder="e.g. Offer Letter — John.pdf" style={{width:"100%"}}/></div>
            <div><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Type</div><Select value={newDoc.type} onChange={e=>setNewDoc(p=>({...p,type:e.target.value}))} options={DOC_TYPES.slice(1)} style={{width:"100%"}}/></div>
            <div><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Category</div><Select value={newDoc.category} onChange={e=>setNewDoc(p=>({...p,category:e.target.value}))} options={CATEGORIES.slice(1)} style={{width:"100%"}}/></div>
            <div><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>Employee (optional)</div><Input value={newDoc.emp} onChange={e=>setNewDoc(p=>({...p,emp:e.target.value}))} placeholder="Leave blank for global" style={{width:"100%"}}/></div>
          </div>
          <div style={{marginTop:16,border:`2px dashed ${G.border}`,borderRadius:10,padding:"24px",textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:24,marginBottom:8}}>📂</div>
            <div style={{fontSize:13,color:G.muted}}>Drag & drop files here, or <span style={{color:G.accent,cursor:"pointer",fontWeight:600}}>browse files</span></div>
            <div style={{fontSize:11,color:G.muted,marginTop:4}}>PDF, DOC, DOCX, XLS, PNG up to 10MB</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleUpload}>Upload</Btn>
            <Btn variant="secondary" onClick={()=>setShowUpload(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {CATEGORIES.map(c=>(
          <div key={c} onClick={()=>setCat(c)}
            style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:500,cursor:"pointer",
              background:cat===c?G.ink:G.card,color:cat===c?"#fff":G.ink2,
              border:`1px solid ${cat===c?G.ink:G.border}`,transition:"all .15s"}}>
            {c} {c!=="All"&&<span style={{color:cat===c?"rgba(255,255,255,.5)":G.muted,marginLeft:4}}>{docs.filter(d=>d.category===c).length}</span>}
          </div>
        ))}
      </div>

      {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>:viewMode==="grid"?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {filtered.map(doc=>(
            <Card key={doc.id} onClick={()=>setSelected(doc)} style={{cursor:"pointer",padding:20,transition:"transform .15s,box-shadow .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontSize:36,marginBottom:12,textAlign:"center"}}>{TYPE_ICONS[doc.doc_type]||TYPE_ICONS.Default}</div>
              <div style={{fontSize:12,fontWeight:600,color:G.ink,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div>
              <div style={{fontSize:11,color:G.muted,marginBottom:10}}>{doc.created_at?.split("T")[0]}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Badge color={CAT_COLORS[doc.category]||G.muted}>{doc.category}</Badge>
                {doc.status==="Confidential"&&<span style={{fontSize:11}}>🔒</span>}
              </div>
            </Card>
          ))}
        </div>
      ):(
        <Card style={{padding:0,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${G.border}`,display:"flex",justifyContent:"space-between"}}>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14}}>Documents <span style={{color:G.muted,fontWeight:400,fontSize:12}}>({filtered.length})</span></div>
          </div>
          {filtered.length===0?<div style={{padding:40,textAlign:"center",color:G.muted}}>No documents found. Upload your first document above.</div>:(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${G.border}`}}>
                    {["Document","Type","Employee","Category","Uploaded","Status","Actions"].map(c=>(
                      <th key={c} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:G.muted,textTransform:"uppercase",letterSpacing:"0.06em",whiteSpace:"nowrap"}}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc=>(
                    <tr key={doc.id} style={{borderBottom:`1px solid ${G.border}`,cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background=G.bg}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      onClick={()=>setSelected(doc)}>
                      <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:18}}>{TYPE_ICONS[doc.doc_type]||TYPE_ICONS.Default}</span><span style={{fontWeight:500,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</span></div></td>
                      <td style={{padding:"12px 16px"}}><Badge color={G.blue}>{doc.doc_type}</Badge></td>
                      <td style={{padding:"12px 16px"}}>{doc.is_global?<Badge color={G.green}>All Employees</Badge>:<div style={{display:"flex",alignItems:"center",gap:8}}><Avatar initials={(doc.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={24} color={getColor(doc.employee_name||"")}/><span style={{color:G.ink2}}>{doc.employee_name||"—"}</span></div>}</td>
                      <td style={{padding:"12px 16px"}}><Badge color={CAT_COLORS[doc.category]||G.muted}>{doc.category}</Badge></td>
                      <td style={{padding:"12px 16px",color:G.muted}}>{doc.created_at?.split("T")[0]}</td>
                      <td style={{padding:"12px 16px"}}>{doc.status==="Confidential"?<Badge color="#EF4444">🔒 Confidential</Badge>:<Badge color={G.green}>Active</Badge>}</td>
                      <td style={{padding:"12px 16px"}} onClick={e=>e.stopPropagation()}>
                        <div style={{display:"flex",gap:6}}>
                          <Btn variant="ghost" style={{padding:"3px 10px",fontSize:11}}>⬇ Download</Btn>
                          <Btn variant="ghost" style={{padding:"3px 10px",fontSize:11}} onClick={()=>deleteDoc(doc.id)}>🗑</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:G.card,borderRadius:20,padding:36,width:520,boxShadow:"0 24px 80px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:16}}>Document Details</div>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>✕</Btn>
            </div>
            <div style={{fontSize:48,textAlign:"center",marginBottom:16}}>{TYPE_ICONS[selected.doc_type]||TYPE_ICONS.Default}</div>
            <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:16,textAlign:"center",marginBottom:20}}>{selected.name}</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[["Type",selected.doc_type],["Category",selected.category],["Employee",selected.employee_name||"All Employees"],["Uploaded",selected.created_at?.split("T")[0]],["Status",selected.status]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",paddingBottom:10,borderBottom:`1px solid ${G.border}`}}>
                  <span style={{fontSize:12,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</span>
                  <span style={{fontSize:13,color:G.ink2,fontWeight:500}}>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <Btn style={{flex:1,justifyContent:"center"}}>⬇ Download</Btn>
                <Btn variant="danger" onClick={()=>{deleteDoc(selected.id);setSelected(null);}}>🗑 Delete</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
