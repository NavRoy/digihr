// ── DIGIHR Shared UI Component Library ─────────────────────────────────────

export const G = {
  bg:        "#F7F7F5",
  sidebar:   "#FFFFFF",
  card:      "#FFFFFF",
  border:    "#EBEBEA",
  ink:       "#1A1A1A",
  ink2:      "#3D3D3D",
  muted:     "#8C8C8C",
  accent:    "#FF4E1A",
  accentBg:  "#FFF3EF",
  blue:      "#5B8DEF",
  green:     "#28C840",
  yellow:    "#FFB800",
  purple:    "#A78BFA",
  font:      "'DM Sans', 'Geist', sans-serif",
  fontHead:  "'Syne', sans-serif",
};

export const avatarColors = [G.accent, G.blue, G.green, G.yellow, G.purple, "#EC4899", "#14B8A6"];
export const getColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

export const Badge = ({ children, color = G.muted, bg }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:"0.04em", color, background:bg||color+"18" }}>
    {children}
  </span>
);

export const StatusBadge = ({ status }) => {
  const map = {
    "Active":      { color: G.green,   label:"Active" },
    "Inactive":    { color: G.muted,   label:"Inactive" },
    "On Leave":    { color: G.yellow,  label:"On Leave" },
    "Present":     { color: G.green,   label:"Present" },
    "Absent":      { color:"#EF4444",  label:"Absent" },
    "Approved":    { color: G.green,   label:"Approved" },
    "Pending":     { color: G.yellow,  label:"Pending" },
    "Rejected":    { color:"#EF4444",  label:"Rejected" },
    "Processed":   { color: G.green,   label:"Processed" },
    "On Hold":     { color: G.muted,   label:"On Hold" },
    "On Track":    { color: G.green,   label:"On Track" },
    "At Risk":     { color: G.yellow,  label:"At Risk" },
    "Behind":      { color:"#EF4444",  label:"Behind" },
    "Completed":   { color: G.blue,    label:"Completed" },
    "Pending HR":  { color: G.purple,  label:"Pending HR" },
    "Assigned":    { color: G.blue,    label:"Assigned" },
    "Available":   { color: G.green,   label:"Available" },
    "Under Repair":{ color: G.yellow,  label:"Under Repair" },
    "Confidential":{ color:"#EF4444",  label:"Confidential" },
  };
  const s = map[status] || { color: G.muted, label: status };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, color:s.color, background:s.color+"18" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.color, display:"inline-block" }} />
      {s.label}
    </span>
  );
};

export const Avatar = ({ initials, size = 36, color = G.accent }) => (
  <div style={{ width:size, height:size, borderRadius:size*0.3, background:color+"18", color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.33, fontWeight:700, flexShrink:0, fontFamily:G.fontHead }}>
    {initials}
  </div>
);

export const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background:G.card, border:`1px solid ${G.border}`, borderRadius:12, padding:24, cursor:onClick?"pointer":"default", ...style }}>
    {children}
  </div>
);

export const StatCard = ({ label, value, sub, icon, color = G.accent, trend }) => (
  <Card style={{ display:"flex", flexDirection:"column", gap:12 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div style={{ fontSize:12, color:G.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
      <div style={{ width:36, height:36, borderRadius:10, background:color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{icon}</div>
    </div>
    <div style={{ fontFamily:G.fontHead, fontSize:28, fontWeight:800, color:G.ink, letterSpacing:"-0.02em" }}>{value}</div>
    {(sub || trend != null) && (
      <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
        {trend != null && <span style={{ color:trend>0?G.green:"#EF4444", fontWeight:600 }}>{trend>0?"↑":"↓"} {Math.abs(trend)}%</span>}
        {sub && <span style={{ color:G.muted }}>{sub}</span>}
      </div>
    )}
  </Card>
);

export const Btn = ({ children, onClick, variant = "primary", style = {}, disabled, type = "button" }) => {
  const variants = {
    primary:  { background:G.accent,         color:"#fff"         },
    secondary:{ background:G.border,         color:G.ink2         },
    ghost:    { background:"transparent",    color:G.ink2         },
    danger:   { background:"#FEE2E2",        color:"#EF4444"      },
    success:  { background:"#DCFCE7",        color:G.green        },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:disabled?"not-allowed":"pointer", fontSize:13, fontWeight:600, fontFamily:G.font, display:"inline-flex", alignItems:"center", gap:6, transition:"opacity .15s", opacity:disabled?0.5:1, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

export const Input = ({ value, onChange, placeholder, style = {}, type = "text" }) => (
  <input value={value} onChange={onChange} type={type} placeholder={placeholder}
    style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${G.border}`, fontSize:13, color:G.ink, background:"#fff", outline:"none", fontFamily:G.font, ...style }} />
);

export const Select = ({ value, onChange, options, style = {} }) => (
  <select value={value} onChange={onChange}
    style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${G.border}`, fontSize:13, color:G.ink, background:"#fff", outline:"none", fontFamily:G.font, cursor:"pointer", ...style }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

export const Table = ({ cols, rows, renderRow }) => (
  <div style={{ overflowX:"auto" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
      <thead>
        <tr style={{ borderBottom:`1px solid ${G.border}` }}>
          {cols.map(c => (
            <th key={c} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:G.muted, textTransform:"uppercase", letterSpacing:"0.06em", whiteSpace:"nowrap" }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom:`1px solid ${G.border}`, transition:"background .1s" }}
            onMouseEnter={e => e.currentTarget.style.background = G.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {renderRow(row)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Td = ({ children, style = {} }) => (
  <td style={{ padding:"12px 16px", color:G.ink2, verticalAlign:"middle", ...style }}>{children}</td>
);
