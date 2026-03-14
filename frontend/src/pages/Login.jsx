import { useState } from "react";
import { auth, setToken } from "../utils/api";

export default function Login({ onLogin }) {

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");

const submit=(e)=>{
e.preventDefault();
onLogin(email,password);
};

return(

<div style={styles.wrapper}>

<div style={styles.blur1}></div>
<div style={styles.blur2}></div>

{/* LEFT SIDE */}

<div style={styles.left}>

<h1 style={styles.title}>
Streamline Your <br/> HR Operations
</h1>

<p style={styles.subtitle}>
Manage attendance, payroll and employee data
in one powerful platform.
</p>

<div style={styles.features}>
<div>⚡ Real-time attendance tracking</div>
<div>💰 Automated payroll processing</div>
<div>👥 Smart employee management</div>
<div>📊 Performance analytics</div>
</div>

</div>


{/* RIGHT SIDE */}

<div style={styles.right}>

<div style={styles.card}>

<h2 style={styles.formTitle}>Welcome back</h2>

<form onSubmit={submit} style={styles.form}>

<input
type="email"
placeholder="Email address"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={styles.input}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={styles.input}
/>

<button style={styles.button}>
Sign in →
</button>

</form>

<div style={styles.demo}>
Demo Login<br/>
admin@digihr.in / Admin@123
</div>

</div>

</div>

</div>

);

}

const styles={

wrapper:{
display:"flex",
height:"calc(100vh - 70px)",
background:"linear-gradient(135deg,#1e3a8a 0%, #2563eb 40%, #4f46e5 70%, #9333ea 100%)",
color:"#fff",
fontFamily:"Inter, sans-serif",
position:"relative",
overflow:"hidden"
},

blur1:{
position:"absolute",
width:400,
height:400,
background:"#3b82f6",
filter:"blur(160px)",
top:-120,
left:-120
},

blur2:{
position:"absolute",
width:400,
height:400,
background:"#9333ea",
filter:"blur(160px)",
bottom:-120,
right:-120
},

left:{
flex:1,
padding:"100px 80px",
zIndex:2
},

title:{
fontSize:52,
fontWeight:800,
lineHeight:1.1,
marginBottom:24,
letterSpacing:"-1px"
},

subtitle:{
opacity:.9,
marginBottom:32,
fontSize:17,
maxWidth:520
},

features:{
display:"flex",
flexDirection:"column",
gap:12,
fontSize:15
},

right:{
flex:1,
display:"flex",
alignItems:"center",
justifyContent:"center",
zIndex:2
},

card:{
width:400,
background:"rgba(255,255,255,0.15)",
backdropFilter:"blur(30px)",
padding:40,
borderRadius:18,
border:"1px solid rgba(255,255,255,0.25)",
boxShadow:"0 30px 80px rgba(0,0,0,0.25)",
transition:"all .3s ease"
},

formTitle:{
fontSize:28,
fontWeight:700,
marginBottom:30
},

form:{
display:"flex",
flexDirection:"column",
gap:14
},

input:{
padding:"14px",
borderRadius:12,
border:"1px solid rgba(255,255,255,0.4)",
background:"rgba(255,255,255,0.25)",
color:"#fff",
fontSize:14,
outline:"none",
transition:"all .2s"
},

button:{
marginTop:12,
padding:"14px",
borderRadius:12,
border:"none",
background:"linear-gradient(135deg,#ffffff,#f3f4f6)",
color:"#2563eb",
fontWeight:700,
cursor:"pointer",
transition:"all .25s ease",
boxShadow:"0 8px 24px rgba(0,0,0,0.2)"
},

demo:{
marginTop:20,
fontSize:12,
opacity:0.8
}

};