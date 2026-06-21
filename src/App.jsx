import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Minimal test - just routing, no providers
function Home() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:20,textAlign:'center'}}>
      <div style={{fontSize:64,marginBottom:16}}>🛒</div>
      <h1 style={{fontSize:28,fontWeight:800,color:'#ff385c',margin:'0 0 8px'}}>Omix Store</h1>
      <p style={{fontSize:16,color:'#666',margin:'0 0 24px'}}>Your Online Store in Kericho</p>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'16px 24px',color:'#166534'}}>
        <p style={{margin:0,fontWeight:600}}>✅ Routing works! Page: Home</p>
        <p style={{margin:'4px 0 0',fontSize:13,color:'#16a34a'}}>Test passed at {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

function About() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:20}}>
      <h1 style={{fontSize:28,fontWeight:800,color:'#ff385c'}}>About Omix</h1>
      <p style={{fontSize:16,color:'#666'}}>Your Online Store in Kericho, Kenya</p>
      <a href="/" style={{color:'#ff385c',marginTop:16}}>← Back to Home</a>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
