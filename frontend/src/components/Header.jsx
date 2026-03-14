export default function Header({ goLogin }) {
  return (
    <div style={styles.header}>
      <div style={styles.left}>
        <div style={styles.logo}>D</div>

        <div>
          <div style={styles.brand}>
            DIGI<span style={{ color: "#FF4E1A" }}>HR</span>
          </div>
          <div style={styles.sub}>Complete HR Platform</div>
        </div>
      </div>

      <div style={styles.right}>
        <button onClick={goLogin} style={styles.loginBtn}>
          Login
        </button>
      </div>
    </div>
  );
}

const styles = {

header:{
height:70,
display:"flex",
alignItems:"center",
justifyContent:"space-between",
padding:"0 40px",
background:"rgba(255,255,255,0.85)",
backdropFilter:"blur(14px)",
boxShadow:"0 10px 30px rgba(0,0,0,0.08)",
borderBottom:"1px solid rgba(0,0,0,0.05)",
position:"sticky",
top:0,
zIndex:20
},

left:{
display:"flex",
alignItems:"center",
gap:12
},

logo:{
width:38,
height:38,
borderRadius:12,
background:"linear-gradient(135deg,#FF4E1A,#FF7A3D)",
display:"flex",
alignItems:"center",
justifyContent:"center",
color:"#fff",
fontWeight:"bold"
},

brand:{
fontSize:20,
fontWeight:800
},

sub:{
fontSize:11,
color:"#888"
},

loginBtn:{
padding:"9px 20px",
background:"linear-gradient(135deg,#3b82f6,#2563eb)",
color:"#fff",
border:"none",
borderRadius:10,
cursor:"pointer",
fontWeight:600,
boxShadow:"0 6px 16px rgba(37,99,235,0.35)",
transition:"all .25s ease"
},

right:{
display:"flex",
alignItems:"center",
gap:10
}

};