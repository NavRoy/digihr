import { useState, useEffect } from "react";
import { Card, StatCard, Table, Td, Btn, Input, Select, StatusBadge, Avatar, Badge, getColor, G } from "../components/UI.jsx";
import { employeesApi, attendanceApi } from "../utils/api.js";

const DEPTS = ["All","Engineering","HR","Sales","Finance","Marketing","Operations"];

const EMPTY = {
  firstName:"",
  lastName:"",
  email:"",
  phone:"",
  dept:"Engineering",
  role:"",
  joinDate:"",
  salary:"",
  manager:""
};

export default function Employees() {

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");

  const [selected, setSelected] = useState(null);

  const [empLogs, setEmpLogs] = useState([]);

  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState(EMPTY);

  const [formErr, setFormErr] = useState("");

  const [saving, setSaving] = useState(false);


  useEffect(() => {
    employeesApi.list()
      .then(res => setEmployees(res.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  useEffect(() => {

    if (!selected) {
      setEmpLogs([]);
      return;
    }

    const from = new Date();
    from.setDate(from.getDate() - 30);

    attendanceApi.list({
      employeeId: selected,
      from: from.toISOString().split("T")[0]
    })
    .then(rows => setEmpLogs(Array.isArray(rows) ? rows.slice(0,5) : []))
    .catch(() => setEmpLogs([]));

  }, [selected]);


  const filtered = employees.filter(e => {

    const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();

    return (
      (dept === "All" || e.department === dept) &&
      (status === "All" || e.status === status) &&
      (
        name.includes(search.toLowerCase()) ||
        (e.emp_code || "").includes(search) ||
        (e.email || "").includes(search)
      )
    );
  });



  // ✅ FIXED ADD EMPLOYEE FUNCTION

  const submitAdd = () => {

    if (!form.firstName || !form.email) {
      setFormErr("First name and email are required.");
      return;
    }

    setSaving(true);

    employeesApi.create({

      first_name: form.firstName,
      last_name: form.lastName,

      email: form.email,

      phone: form.phone,

      designation: form.role,

      department: form.dept,

      date_of_joining: form.joinDate,

      basic_salary: Number(form.salary) || 0

    })
    .then(newEmp => {

      setEmployees(prev => [newEmp, ...prev]);

      setShowAdd(false);

      setForm(EMPTY);

      setFormErr("");

    })
    .catch(e => {

      console.error(e);

      setFormErr(e.message || "Failed to create employee");

    })
    .finally(() => setSaving(false));

  };



  const deactivate = (id) => {

    employeesApi.delete(id)
      .then(() => {
        setEmployees(list =>
          list.map(emp =>
            emp.id === id ? { ...emp, status:"Inactive" } : emp
          )
        );
      })
      .catch(console.error);

  };



  return (

    <div style={{ padding:28, display:"flex", flexDirection:"column", gap:20 }}>

      {/* TOP STATS */}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>

        {[
          ["Total", employees.length, G.accent],

          ["Active", employees.filter(e=>e.status==="Active").length, G.green],

          ["On Leave", employees.filter(e=>e.status==="On Leave").length, G.yellow],

          ["Inactive", employees.filter(e=>e.status==="Inactive").length, G.muted],

        ].map(([label,value,color]) => (

          <div key={label}
            style={{
              background:G.card,
              border:`1px solid ${G.border}`,
              borderRadius:10,
              padding:"14px 18px",
              display:"flex",
              justifyContent:"space-between"
            }}>

            <span style={{ fontSize:13, color:G.muted }}>{label}</span>

            <span style={{ fontFamily:G.fontHead, fontWeight:800, fontSize:22, color }}>
              {loading ? "…" : value}
            </span>

          </div>

        ))}

      </div>



      {/* FILTER BAR */}

      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>

        <Input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Search name, ID or email…"
          style={{ width:260 }}
        />

        <Select
          value={dept}
          onChange={e=>setDept(e.target.value)}
          options={DEPTS}
        />

        <Select
          value={status}
          onChange={e=>setStatus(e.target.value)}
          options={["All","Active","On Leave","Inactive"]}
        />

        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>

          <Btn variant="secondary">Export CSV</Btn>

          <Btn onClick={()=>setShowAdd(true)}>+ Add Employee</Btn>

        </div>

      </div>



      {/* ADD EMPLOYEE FORM */}

      {showAdd && (

        <Card style={{ border:`1.5px solid ${G.accent}`, background:G.accentBg }}>

          <div style={{ fontWeight:700, marginBottom:18 }}>New Employee</div>

          {formErr && (
            <div style={{
              background:"#FEE2E2",
              color:"#EF4444",
              borderRadius:8,
              padding:"8px 12px",
              fontSize:12,
              marginBottom:14
            }}>
              ⚠ {formErr}
            </div>
          )}


          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>

            {[
              ["First Name","firstName","text"],
              ["Last Name","lastName","text"],
              ["Email","email","email"],
              ["Phone","phone","text"],
              ["Job Title","role","text"],
              ["Join Date","joinDate","date"],
              ["Salary","salary","number"],
              ["Manager","manager","text"]
            ].map(([label,key,type]) => (

              <div key={key}>

                <div style={{ fontSize:11, color:G.muted, marginBottom:5 }}>
                  {label}
                </div>

                <Input
                  type={type}
                  value={form[key]}
                  onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                  style={{ width:"100%" }}
                />

              </div>

            ))}


            <div>

              <div style={{ fontSize:11, color:G.muted, marginBottom:5 }}>
                Department
              </div>

              <Select
                value={form.dept}
                onChange={e=>setForm(p=>({...p,dept:e.target.value}))}
                options={DEPTS.slice(1)}
              />

            </div>

          </div>


          <div style={{ marginTop:18, display:"flex", gap:10 }}>

            <Btn onClick={submitAdd} disabled={saving}>
              {saving ? "Saving..." : "Save Employee"}
            </Btn>

            <Btn variant="secondary" onClick={()=>setShowAdd(false)}>
              Cancel
            </Btn>

          </div>

        </Card>

      )}

<Card style={{ padding:0, overflow:"hidden" }}>
  <div style={{ padding:"16px 20px", borderBottom:`1px solid ${G.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
    <div style={{ fontFamily:G.fontHead, fontWeight:700, fontSize:14 }}>
      All Employees
      <span style={{ color:G.muted, fontWeight:400, fontSize:12, marginLeft:8 }}>
        ({filtered.length})
      </span>
    </div>
  </div>

  {loading
    ? <div style={{ padding:40, textAlign:"center", color:G.muted }}>
        Loading employees…
      </div>

    : filtered.length === 0
      ? <div style={{ padding:40, textAlign:"center", color:G.muted }}>
          No employees found.
        </div>

      : <Table
          cols={[
            "Employee",
            "ID",
            "Department",
            "Role",
            "Salary",
            "Joined",
            "Status",
            "Actions"
          ]}
          rows={filtered}
          renderRow={emp => [
            <Td key="name">
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Avatar
                  initials={`${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`}
                  size={32}
                  color={getColor(`${emp.first_name} ${emp.last_name}`)}
                />
                <div>
                  <div style={{ fontWeight:500 }}>
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div style={{ fontSize:11, color:G.muted }}>
                    {emp.email}
                  </div>
                </div>
              </div>
            </Td>,

            <Td key="id">
              <span style={{ color:G.muted, fontFamily:"monospace" }}>
                {emp.emp_code}
              </span>
            </Td>,

            <Td key="dept">{emp.department}</Td>,

            <Td key="role">
              <span style={{ color:G.muted }}>
                {emp.designation}
              </span>
            </Td>,

            <Td key="salary">
              ₹{(+emp.basic_salary || 0).toLocaleString()}
            </Td>,

            <Td key="join">
              <span style={{ color:G.muted }}>
                {emp.date_of_joining}
              </span>
            </Td>,

            <Td key="status">
              <StatusBadge status={emp.status} />
            </Td>,

            <Td key="action">
              <Btn
                variant="ghost"
                style={{ padding:"4px 10px", fontSize:12 }}
                onClick={() => setSelected(emp.id)}
              >
                View →
              </Btn>
            </Td>
          ]}
        />
  }
</Card>


    </div>

  );

}