import React from 'react';

function App() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,sans-serif',padding:20,textAlign:'center'}}>
      <div style={{fontSize:64,marginBottom:16}}>🛒</div>
      <h1 style={{fontSize:28,fontWeight:800,color:'#ff385c',margin:'0 0 8px'}}>Omix Store</h1>
      <p style={{fontSize:16,color:'#666',margin:'0 0 24px'}}>Your Online Store in Kericho</p>
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'16px 24px',color:'#166534'}}>
        <p style={{margin:0,fontWeight:600}}>✅ App is loading correctly!</p>
        <p style={{margin:'4px 0 0',fontSize:13,color:'#16a34a'}}>React render test passed at {new Date().toLocaleTimeString()}</p>
      </div>
      <div style={{marginTop:32}}>
        <a href="/listings" style={{display:'inline-block',background:'#ff385c',color:'#fff',padding:'12px 32px',borderRadius:8,textDecoration:'none',fontWeight:600,marginRight:8}}>Browse Products</a>
        <a href="/about" style={{display:'inline-block',background:'#f3f4f6',color:'#374151',padding:'12px 32px',borderRadius:8,textDecoration:'none',fontWeight:600}}>About</a>
      </div>
    </div>
  );
}

export default App;
