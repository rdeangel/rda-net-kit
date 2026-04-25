const { useState, useEffect, useCallback, useRef, useMemo } = React;

function RemoteDiagnostics() {
  const [target, setTarget] = useState('');
  const [results, setResults] = useState({ local: null });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const runLocalPing = async (override) => {
    let q = (override || target).trim();
    if (!q) { setErr('Enter a URL or IP'); return; }
    if (!q.startsWith('http')) q = 'https://' + q;
    setLoading(true); setErr('');
    const start = performance.now();
    try {
      await fetch(q, { mode: 'no-cors', cache: 'no-cache' });
      setResults({ local: Math.round(performance.now() - start) });
    } catch {
      setErr('Web Ping failed. Targets must be public web servers (HTTP/HTTPS).');
    }
    setLoading(false);
  };

  const openExternal = (site) => {
    const q = target.trim() || '8.8.8.8';
    const urls = {
      bgp: `https://bgp.tools/prefix/${q}`,
      ping: `https://ping.pe/${q}`,
      he: `https://bgpview.io/ip/${q}`,
      ripe: `https://atlas.ripe.net/measurements/?search=${q}`
    };
    window.open(urls[site], '_blank');
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Remote Ping / MTR</div>
        <div className="field">
          <label className="label">Target IP or Hostname</label>
          <div className="input-row">
            <input className="input" placeholder="e.g. 8.8.8.8 or google.com" value={target} onChange={e=>setTarget(e.target.value)} onKeyDown={e => e.key === 'Enter' && runLocalPing()} />
            <button className="btn btn-primary" onClick={() => runLocalPing()} disabled={loading}>Web Ping</button>
            <button className="btn btn-ghost" onClick={() => openExternal('ping')} title="Real ICMP Trace from global nodes">Deep Trace ↗</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:4}}>
           <button className="btn btn-ghost btn-sm" onClick={() => { setTarget('1.1.1.1'); runLocalPing('1.1.1.1'); }} style={{fontSize:10}}>Test Connection (via Cloudflare)</button>
           <button className="btn btn-ghost btn-sm" onClick={() => openExternal('bgp')} style={{fontSize:10}}>Verify on BGP.tools ↗</button>
        </div>
      </div>

      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title">Local Web Latency</div>
          {results.local ? (
            <div style={{textAlign:'center', padding:'10px 0'}}>
              <div style={{fontSize:42, fontWeight:700, color:results.local < 50 ? 'var(--green)' : results.local < 150 ? 'var(--yellow)' : 'var(--red)'}}>
                {results.local}<span style={{fontSize:16, fontWeight:400, color:'var(--muted)', marginLeft:4}}>ms</span>
              </div>
              <div style={{fontSize:11, color:'var(--muted)', marginTop:4}}>Round-trip via HTTPS</div>
            </div>
          ) : <div style={{padding:20, textAlign:'center', color:'var(--dim)', fontSize:12}}>Requires target with Web Server</div>}
        </div>
        <div className="card">
          <div className="card-title">Remote Path Logic</div>
          <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.5}}>
             Browsers cannot perform native ICMP/TTL traces directly.
             <br/><br/>
             Use <strong>Web Ping</strong> for rapid latency checks, or <strong>Deep Trace</strong> for a real ICMP MTR from 30+ global locations simultaneously.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tool: DNS Lookup ─────────────────────────────────────────
window.RemoteDiagnostics = RemoteDiagnostics;
