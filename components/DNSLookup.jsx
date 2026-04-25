const { useState, useEffect, useCallback, useRef, useMemo } = React;

function DNSLookup() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const lookup = async () => {
    if (!query.trim()) { setErr('Enter a domain name'); return; }
    setErr(''); setResult(null); setLoading(true);
    try {
      const url = `https://dns.google/resolve?name=${encodeURIComponent(query.trim())}&type=${type}`;
      const res = await fetch(url);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setErr('DNS lookup failed. Check network or try again.');
    }
    setLoading(false);
  };

  const statusMap = { 0:'NOERROR',1:'FORMERR',2:'SERVFAIL',3:'NXDOMAIN',4:'NOTIMP',5:'REFUSED' };
  const typeMap = { 1:'A',2:'NS',5:'CNAME',6:'SOA',12:'PTR',15:'MX',16:'TXT',28:'AAAA',33:'SRV',257:'CAA' };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">DNS Lookup <span className="badge badge-blue" style={{marginLeft:8,fontSize:10}}>via DNS-over-HTTPS</span></div>
        <div className="field">
          <label className="label">Domain Name or IP (for PTR)</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="example.com" />
            <select className="select" value={type} onChange={e => setType(e.target.value)} style={{width:'auto',flexShrink:0}}>
              {['A','AAAA','CNAME','MX','NS','PTR','SOA','SRV','TXT','CAA'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button className="btn btn-primary" onClick={lookup} disabled={loading}>{loading ? '...' : 'Lookup'}</button>
          </div>
          <Err msg={err} />
          <div className="hint">⚠ Ping and traceroute are not available in the browser — use your terminal for those</div>
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
            <div className="card-title" style={{marginBottom:0}}>Results for <span style={{color:'var(--cyan)',fontFamily:'var(--mono)'}}>{query}</span></div>
            <span className={`badge ${result.Status===0?'badge-green':'badge-red'}`}>{statusMap[result.Status] || result.Status}</span>
          </div>
          {result.Answer?.length ? (
            <>
              <div className="table-wrap hide-mobile">
                <table>
                  <thead><tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th><th></th></tr></thead>
                  <tbody>
                    {result.Answer.map((r, i) => (
                      <tr key={i}>
                        <td style={{color:'var(--muted)'}}>{r.name}</td>
                        <td><span className="badge badge-blue">{typeMap[r.type] || r.type}</span></td>
                        <td style={{color:'var(--dim)'}}>{r.TTL}s</td>
                        <td style={{color:'var(--cyan)'}}>{r.data}</td>
                        <td><CopyBtn text={r.data} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards">
                {result.Answer.map((r, i) => (
                  <div key={i} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{r.name}</span>
                      <span className="badge badge-blue">{typeMap[r.type] || r.type}</span>
                    </div>
                    <div style={{paddingTop:6, fontFamily:'var(--mono)', fontSize:11, color:'var(--cyan)', wordBreak:'break-all'}}>
                      {r.data}
                    </div>
                    <div style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{fontSize:10, color:'var(--dim)'}}>TTL: {r.TTL}s</span>
                      <CopyBtn text={r.data} label="Copy" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{color:'var(--muted)',fontSize:13}}>No records found for type {type}.</div>
          )}
          {result.Authority?.length > 0 && (
            <>
              <div className="card-title" style={{marginTop:14}}>Authority Records</div>
              <div className="table-wrap hide-mobile">
                <table><thead><tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr></thead>
                <tbody>{result.Authority.map((r,i) => <tr key={i}><td>{r.name}</td><td>{typeMap[r.type]||r.type}</td><td>{r.TTL}s</td><td style={{color:'var(--muted)'}}>{r.data}</td></tr>)}</tbody></table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards">
                {result.Authority.map((r, i) => (
                  <div key={i} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{r.name}</span>
                      <span className="badge badge-gray">{typeMap[r.type] || r.type}</span>
                    </div>
                    <div style={{paddingTop:6, fontSize:11, color:'var(--muted)', wordBreak:'break-all'}}>
                      {r.data}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: SSL/TLS Certificate Inspector ──────────────────────
const SSL_DEFAULT_PROXY = 'http://localhost:8080/proxy/fetch?url=';

window.DNSLookup = DNSLookup;
