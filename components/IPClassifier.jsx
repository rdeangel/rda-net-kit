const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPClassifier() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');

  const presets = ['10.0.0.1','172.16.5.1','192.168.1.1','127.0.0.1','169.254.1.1','8.8.8.8','224.0.0.1','255.255.255.255','100.64.0.1','198.51.100.1'];

  const add = (ip) => {
    const val = ip || input.trim();
    if (!val) return;
    const parsed = IPv4.parse(val);
    if (parsed === null) {
      const v6 = IPv6.classify(val);
      if (!v6) { setErr('Invalid IP address'); return; }
      setResults(r => [...r, { ip: val, version: 6, ...v6 }]);
      setInput(''); setErr('');
      return;
    }
    const cls = IPv4.classify(parsed);
    setResults(r => [...r, { ip: val, version: 4, ...cls }]);
    setInput(''); setErr('');
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Classify IP Address</div>
        <div className="field">
          <label className="label">IPv4 or IPv6 Address</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. 192.168.1.1 or 2001:db8::1" />
            <button className="btn btn-primary" onClick={() => add()}>Classify</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{marginTop:10}}>
          <div className="label" style={{marginBottom:6}}>Quick presets</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {presets.map(p => <button key={p} className="btn btn-ghost btn-sm" onClick={() => add(p)}>{p}</button>)}
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="card fadein">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div className="card-title" style={{marginBottom:0}}>Results ({results.length})</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setResults([])}>Clear All</button>
          </div>
          <div className="table-wrap hide-mobile">
            <table>
              <thead><tr><th>IP Address</th><th>Ver</th><th>Class</th><th>Type</th><th>Scope</th><th>RFC</th><th></th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td style={{color:'var(--cyan)'}}>{r.ip}</td>
                    <td><span className={`badge ${r.version===4?'badge-blue':'badge-purple'}`}>IPv{r.version}</span></td>
                    <td>{r.ipClass || r.version}</td>
                    <td>{r.type}</td>
                    <td>{scopeBadge(r.scope)}</td>
                    <td style={{color:'var(--muted)'}}><RFCLink rfc={r.rfc} /></td>
                    <td><button className="btn btn-ghost btn-sm" style={{padding:'2px 6px',fontSize:11,color:'var(--red)'}} onClick={() => setResults(rs => rs.filter((_,j) => j !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {results.map((r, i) => (
              <div key={i} className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label" style={{color:'var(--cyan)', fontWeight:600}}>{r.ip}</span>
                  <span className={`badge ${r.version===4?'badge-blue':'badge-purple'}`}>IPv{r.version}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Type / Class</span>
                  <span className="mobile-card-value">{r.type} {r.ipClass ? `(Class ${r.ipClass})` : ''}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Scope / RFC</span>
                  <span className="mobile-card-value">{scopeBadge(r.scope)} (<RFCLink rfc={r.rfc} />)</span>
                </div>
                <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                  <button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={() => setResults(rs => rs.filter((_,j) => j !== i))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(results.map(r => ({ip:r.ip,version:r.version,class:r.ipClass||'-',type:r.type,scope:r.scope,rfc:r.rfc||'-'})),'ip-classification.csv')}>Export CSV</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: VLSM Planner ──────────────────────────────────────
window.IPClassifier = IPClassifier;
