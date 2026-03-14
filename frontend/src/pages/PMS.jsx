import { useState, useEffect } from "react";
import { Card, StatCard, Table, Td, Btn, Input, Select, StatusBadge, Avatar, Badge, getColor, G } from "../components/UI";
import { pmsApi } from "../utils/api.js";

const CYCLES = ["Q1 2025","Q2 2025","Q3 2025","Q4 2025","Q1 2026"];
const RATING_LABELS = {5:"Outstanding",4:"Exceeds Expectations",3:"Meets Expectations",2:"Needs Improvement",1:"Unsatisfactory"};

const ProgressBar=({value,color=G.accent})=>(
  <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{flex:1,height:6,borderRadius:3,background:G.bg,overflow:"hidden"}}>
      <div style={{width:`${value||0}%`,height:"100%",borderRadius:3,background:value===100?G.green:value<50?"#EF4444":color,transition:"width .8s"}}/>
    </div>
    <span style={{fontSize:11,fontWeight:600,color:G.muted,minWidth:30}}>{value||0}%</span>
  </div>
);

const StarRating=({value,onChange,size=18})=>(
  <div style={{display:"flex",gap:3}}>
    {[1,2,3,4,5].map(s=>(
      <span key={s} onClick={()=>onChange&&onChange(s)}
        style={{fontSize:size,cursor:onChange?"pointer":"default",color:s<=(value||0)?G.yellow:G.border,transition:"color .15s"}}>★</span>
    ))}
    {value?<span style={{fontSize:12,color:G.muted,marginLeft:4}}>{(+value).toFixed(1)} — {RATING_LABELS[Math.round(value)]}</span>:null}
  </div>
);

export default function PMS() {
  const [tab,      setTab]      = useState("overview");
  const [goals,    setGoals]    = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [cycle,    setCycle]    = useState("Q1 2025");
  const [selected, setSelected] = useState(null);
  const [hrRating, setHrRating] = useState({});
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({employeeId:"",title:"",kpiMetric:"",weight:"",dueDate:"",cycle:"Q1 2025"});

  useEffect(()=>{
    Promise.all([pmsApi.getGoals(),pmsApi.getReviews()])
      .then(([g,r])=>{setGoals(Array.isArray(g)?g:[]);setReviews(Array.isArray(r)?r:[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const approveReview=(id)=>{
    const rating=hrRating[id];
    if(!rating) return;
    pmsApi.approveReview(id,{hrRating:rating,status:"Completed"})
      .then(r=>setReviews(prev=>prev.map(x=>x.id===id?r:x))).catch(()=>{});
  };

  const saveGoal=()=>{
    if(!goalForm.title) return;
    pmsApi.createGoal({...goalForm,weight:+goalForm.weight||0,cycle})
      .then(g=>{setGoals(p=>[g,...p]);setShowGoalForm(false);setGoalForm({employeeId:"",title:"",kpiMetric:"",weight:"",dueDate:"",cycle:"Q1 2025"});})
      .catch(()=>{});
  };

  const cycleGoals    = goals.filter(g=>(g.cycle||"")===(cycle||""));
  const onTrack       = cycleGoals.filter(g=>g.status==="On Track").length;
  const atRisk        = cycleGoals.filter(g=>g.status==="At Risk"||g.status==="Behind").length;
  const completed     = cycleGoals.filter(g=>g.status==="Completed").length;
  const avgProgress   = Math.round(cycleGoals.reduce((s,g)=>s+(+g.progress||0),0)/(cycleGoals.length||1));
  const pendingReviews= reviews.filter(r=>r.status==="Pending HR").length;

  const TABS=[["overview","📊 Overview"],["goals","🎯 Goals & KPIs"],["reviews","📝 Reviews"],["analytics","📈 Analytics"]];

  return(
    <div style={{padding:28,display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:4,background:G.bg,padding:4,borderRadius:10}}>
          {TABS.map(([id,label])=>(
            <div key={id} onClick={()=>setTab(id)}
              style={{padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,
                background:tab===id?G.card:"transparent",color:tab===id?G.ink:G.muted,
                boxShadow:tab===id?"0 1px 4px rgba(0,0,0,.07)":"none"}}>
              {label}
              {id==="reviews"&&pendingReviews>0&&<span style={{marginLeft:6,background:G.accent,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>{pendingReviews}</span>}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <Select value={cycle} onChange={e=>setCycle(e.target.value)} options={CYCLES}/>
          <Btn onClick={()=>setShowGoalForm(true)}>+ Add Goal</Btn>
        </div>
      </div>

      {tab==="overview"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            <StatCard label="Avg Progress"    value={`${avgProgress}%`}  icon="📊" color={G.blue}   sub={`${cycle} goals`}/>
            <StatCard label="On Track"        value={onTrack}             icon="✅" color={G.green}  sub="goals"/>
            <StatCard label="At Risk / Behind"value={atRisk}              icon="⚠️" color={G.yellow} sub="goals"/>
            <StatCard label="Pending Reviews" value={pendingReviews}      icon="📝" color={G.accent} sub="awaiting HR"/>
          </div>
          {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>:(
            <>
              <Card>
                <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:20}}>Goal Progress by Employee — {cycle}</div>
                {cycleGoals.length===0?<div style={{color:G.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No goals set for {cycle} yet.</div>:(
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {[...new Set(cycleGoals.map(g=>g.employee_name))].map(emp=>{
                      const eg=cycleGoals.filter(g=>g.employee_name===emp);
                      const avg=Math.round(eg.reduce((s,g)=>s+(+g.progress||0),0)/eg.length);
                      return(
                        <div key={emp} style={{display:"flex",alignItems:"center",gap:14}}>
                          <Avatar initials={(emp||"?").split(" ").map(w=>w[0]).join("")} size={34} color={getColor(emp||"")}/>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <span style={{fontSize:13,fontWeight:500}}>{emp}</span>
                              <span style={{fontSize:12,color:G.muted}}>{eg.length} goals</span>
                            </div>
                            <ProgressBar value={avg} color={avg>=75?G.green:avg>=50?G.yellow:"#EF4444"}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Card>
                  <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:16}}>Goal Status Distribution</div>
                  {[["On Track",G.green],["At Risk",G.yellow],["Behind","#EF4444"],["Completed",G.blue]].map(([s,c])=>{
                    const cnt=cycleGoals.filter(g=>g.status===s).length;
                    const pct=Math.round(cnt/(cycleGoals.length||1)*100);
                    return(
                      <div key={s} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span style={{color:G.ink2,fontWeight:500}}>{s}</span>
                          <span style={{color:G.muted}}>{cnt} ({pct}%)</span>
                        </div>
                        <div style={{height:8,borderRadius:4,background:G.bg,overflow:"hidden"}}>
                          <div style={{width:`${pct}%`,height:"100%",borderRadius:4,background:c}}/>
                        </div>
                      </div>
                    );
                  })}
                </Card>
                <Card>
                  <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:16}}>Recent Reviews</div>
                  {reviews.length===0?<div style={{color:G.muted,fontSize:13}}>No reviews yet.</div>:reviews.slice(0,4).map(r=>(
                    <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${G.border}`}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{r.employee_name}</div>
                        <div style={{fontSize:11,color:G.muted}}>{r.cycle} · {r.manager_name}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        {r.final_rating?<StarRating value={+r.final_rating} size={13}/>:<StatusBadge status={r.status}/>}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {tab==="goals"&&(
        <>
          {showGoalForm&&(
            <Card style={{border:`1.5px solid ${G.accent}`,background:G.accentBg}}>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:18,color:G.accent}}>Add New Goal</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                {[["Goal Title","title","text"],["KPI Metric","kpiMetric","text"],["Weight (%)","weight","number"],["Due Date","dueDate","date"]].map(([l,k,t])=>(
                  <div key={k}><div style={{fontSize:11,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5}}>{l}</div><Input type={t} value={goalForm[k]} onChange={e=>setGoalForm(p=>({...p,[k]:e.target.value}))} placeholder={l} style={{width:"100%"}}/></div>
                ))}
              </div>
              <div style={{marginTop:16,display:"flex",gap:10}}>
                <Btn onClick={saveGoal}>Save Goal</Btn>
                <Btn variant="secondary" onClick={()=>setShowGoalForm(false)}>Cancel</Btn>
              </div>
            </Card>
          )}
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"16px 20px",borderBottom:`1px solid ${G.border}`,fontFamily:G.fontHead,fontWeight:700,fontSize:14}}>Goals & KPIs — {cycle}</div>
            {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>
              :cycleGoals.length===0?<div style={{padding:40,textAlign:"center",color:G.muted}}>No goals for {cycle} yet. Add the first goal above.</div>
              :<Table cols={["Goal","Employee","Dept","KPI","Weight","Progress","Due","Status","Actions"]} rows={cycleGoals}
                renderRow={g=>[
                  <Td key="t"><span style={{fontWeight:500}}>{g.title}</span></Td>,
                  <Td key="e"><div style={{display:"flex",gap:8,alignItems:"center"}}><Avatar initials={(g.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={28} color={getColor(g.employee_name||"")}/>{g.employee_name}</div></Td>,
                  <Td key="d"><span style={{color:G.muted}}>{g.department}</span></Td>,
                  <Td key="k"><span style={{fontSize:12,color:G.muted}}>{g.kpi_metric}</span></Td>,
                  <Td key="w"><Badge color={G.blue}>{g.weight}%</Badge></Td>,
                  <Td key="p" style={{minWidth:140}}><ProgressBar value={+g.progress||0}/></Td>,
                  <Td key="due"><span style={{fontSize:12,color:G.muted}}>{g.due_date}</span></Td>,
                  <Td key="s"><StatusBadge status={g.status}/></Td>,
                  <Td key="a"><Btn variant="ghost" style={{padding:"3px 10px",fontSize:11}} onClick={()=>setSelected(g)}>Details</Btn></Td>,
                ]}/>}
          </Card>
        </>
      )}

      {tab==="reviews"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {loading?<div style={{padding:40,textAlign:"center",color:G.muted}}>Loading…</div>
            :reviews.length===0?<Card><div style={{padding:20,textAlign:"center",color:G.muted}}>No reviews yet.</div></Card>
            :reviews.map(r=>(
              <Card key={r.id}>
                <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                  <Avatar initials={(r.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={44} color={getColor(r.employee_name||"")}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:15}}>{r.employee_name}</div>
                        <div style={{fontSize:12,color:G.muted,marginTop:2}}>Reviewed by {r.manager_name} · {r.cycle}</div>
                      </div>
                      <StatusBadge status={r.status}/>
                    </div>
                    <div style={{display:"flex",gap:32,marginTop:16,paddingTop:16,borderTop:`1px solid ${G.border}`}}>
                      <div>
                        <div style={{fontSize:11,color:G.muted,fontWeight:600,marginBottom:6}}>MANAGER RATING</div>
                        <StarRating value={+r.manager_rating||0} size={16}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,color:G.muted,fontWeight:600,marginBottom:6}}>HR RATING</div>
                        {r.hr_rating
                          ?<StarRating value={+r.hr_rating} size={16}/>
                          :r.status==="Pending HR"
                            ?<div style={{display:"flex",gap:10,alignItems:"center"}}>
                                <StarRating value={hrRating[r.id]||0} onChange={v=>setHrRating(prev=>({...prev,[r.id]:v}))} size={16}/>
                                <Btn style={{padding:"4px 12px",fontSize:12}} onClick={()=>approveReview(r.id)} disabled={!hrRating[r.id]}>Approve</Btn>
                              </div>
                            :<span style={{fontSize:12,color:G.muted}}>—</span>}
                      </div>
                      {r.final_rating&&(
                        <div>
                          <div style={{fontSize:11,color:G.muted,fontWeight:600,marginBottom:6}}>FINAL RATING</div>
                          <StarRating value={+r.final_rating} size={16}/>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}

      {tab==="analytics"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            <StatCard label="Avg Final Rating" value={reviews.filter(r=>r.final_rating).length>0?`${(reviews.filter(r=>r.final_rating).reduce((s,r)=>s+(+r.final_rating),0)/reviews.filter(r=>r.final_rating).length).toFixed(1)}★`:"—"} icon="⭐" color={G.yellow} sub="completed reviews"/>
            <StatCard label="Goals Completed"  value={`${cycleGoals.length>0?Math.round(completed/cycleGoals.length*100):0}%`} icon="🎯" color={G.green} sub="of total set"/>
            <StatCard label="Total Goals"       value={cycleGoals.length} icon="📋" color={G.blue}   sub={cycle}/>
            <StatCard label="Review Coverage"   value={reviews.length}    icon="📝" color={G.accent} sub="total reviews"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Card>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:20}}>Goal Status — {cycle}</div>
              {[["On Track",G.green],["Completed",G.blue],["At Risk",G.yellow],["Behind","#EF4444"]].map(([s,c])=>{
                const cnt=cycleGoals.filter(g=>g.status===s).length;
                const pct=Math.round(cnt/(cycleGoals.length||1)*100);
                return(
                  <div key={s} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{color:G.ink2}}>{s}</span><span style={{color:G.muted}}>{cnt} goals ({pct}%)</span>
                    </div>
                    <div style={{height:8,borderRadius:4,background:G.bg,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:4}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:14,marginBottom:20}}>Top Performers</div>
              {reviews.filter(r=>r.final_rating).sort((a,b)=>(+b.final_rating)-(+a.final_rating)).slice(0,5).map((r,i)=>(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,paddingBottom:12,marginBottom:12,borderBottom:`1px solid ${G.border}`}}>
                  <div style={{fontFamily:G.fontHead,fontWeight:800,fontSize:18,color:i===0?G.yellow:i===1?"#C0C0C0":i===2?"#CD7F32":G.muted,minWidth:24}}>{i+1}</div>
                  <Avatar initials={(r.employee_name||"?").split(" ").map(w=>w[0]).join("")} size={34} color={getColor(r.employee_name||"")}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500,fontSize:13}}>{r.employee_name}</div>
                    <div style={{fontSize:11,color:G.muted}}>{r.cycle}</div>
                  </div>
                  <StarRating value={+r.final_rating} size={13}/>
                </div>
              ))}
              {reviews.filter(r=>r.final_rating).length===0&&<div style={{color:G.muted,fontSize:13}}>No completed reviews yet.</div>}
            </Card>
          </div>
        </>
      )}

      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSelected(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:G.card,borderRadius:16,padding:32,width:480,boxShadow:"0 24px 80px rgba(0,0,0,.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:16}}>Goal Details</div>
              <Btn variant="ghost" onClick={()=>setSelected(null)}>✕</Btn>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontFamily:G.fontHead,fontWeight:700,fontSize:18,color:G.ink}}>{selected.title}</div>
              {[["Employee",selected.employee_name],["Department",selected.department],["KPI Metric",selected.kpi_metric],["Weight",`${selected.weight}%`],["Due Date",selected.due_date],["Cycle",selected.cycle]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${G.border}`,paddingBottom:10}}>
                  <span style={{fontSize:12,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em"}}>{k}</span>
                  <span style={{fontSize:13,color:G.ink2,fontWeight:500}}>{v}</span>
                </div>
              ))}
              <div>
                <div style={{fontSize:12,color:G.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:8}}>Progress</div>
                <ProgressBar value={+selected.progress||0}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
