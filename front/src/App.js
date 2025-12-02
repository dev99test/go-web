import React, { useEffect, useState } from 'react';

function App() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/hello')
      .then(res => res.json())
      .then(data => setMsg(data.text));
  }, []);

  return (
    <div style={{textAlign: 'center', marginTop: '60px'}}>
      <h1>{msg}</h1>
    </div>
  );
}

export default App;
