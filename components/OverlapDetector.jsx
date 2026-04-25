const { useState, useEffect, useCallback, useRef, useMemo } = React;

function OverlapDetector() {
  const [lines, setLines] = useState('10.0.0.0/8\n10.1.0.0/16\n192.168.1.0/24\n192.168.1.128/25\n172.16.0.0/12\n10.5.5.0/24');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const overlaps = (a, b) => {
    return !(a.broadcast < b.network || b.broadcast < a.network);
  };

  const analyze = () => {
    setErr(''); setResult(null);
    const entries = lines.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (entries.length < 2) { setErr('Enter at least 2 networks'); return; }
    const parsed = entries.map(e => {
      const c = IPv4.parseCIDR(e);
      if (!c) return null;
      return { cidr: e, ...IPv4.subnet(c.ip, c.prefix) };
    });
    if (parsed.some(p => !p)) { setErr('One or more entries are invalid CIDR'); return; }
    const conflicts = [];
    const flagged = new Set();
    for (let i = 0; i < parsed.length; i++) {
      for (let j = i+1; j < parsed.length; j++) {
        if (overlaps(parsed[i], parsed[j])) {
          conflicts.push({ a: parsed[i], b: parsed[j] });
          flagged.add(i); flagged.add(j);
        }
      }
    }
    setResult({ networks: parsed, conflicts, flagged });
  };

  useEffect(() => analyze(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Networks to Check</div>
        <div className="field">
          <label className="label">One CIDR per line</label>
          <textarea className="input" rows={8} value={lines} onChange={e => setLines(e.target.value)} style={{resize:'vertical'}} />
        </div>
        <Err msg={err} />
        <button className="btn btn-primary" onClick={analyze}>Detect Overlaps</button>
      </div>
      {result && (
        <>
          <div className="card fadein">
            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:12}}>
              <div className="card-title" style={{marginBottom:0}}>Networks</div>
              {result.conflicts.length === 0
                ? <span className="badge badge-green">✓ No overlaps detected</span>
                : <span className="badge badge-red">⚠ {result.conflicts.length} overlap{result.conflicts.length>1?'s':''} found</span>}
            </div>
            <div className="table-wrap">
              <table><thead><tr><th>CIDR</th><th>Network</th><th>Broadcast</th><th>Hosts</th><th>Status</th></tr></thead>
              <tbody>{result.networks.map((n,i) => (
                <tr key={i} style={result.flagged.has(i)?{background:'rgba(239,68,68,.06)'}:{}}>
                  <td style={{color: result.flagged.has(i)?'var(--red)':'var(--cyan)'}}>{n.cidr}</td>
                  <td>{n.networkStr}</td><td>{n.broadcastStr}</td><td style={{color:'var(--green)'}}>{n.hostCount}</td>
                  <td>{result.flagged.has(i) ? <span className="badge badge-red">⚠ Conflict</span> : <span className="badge badge-green">✓ OK</span>}</td>
                </tr>
              ))}</tbody></table>
            </div>
          </div>
          {result.conflicts.length > 0 && (
            <div className="card fadein">
              <div className="card-title">Conflict Details</div>
              {result.conflicts.map((c,i) => (
                <div key={i} style={{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.2)',borderRadius:'var(--radius)',padding:'12px 14px',marginBottom:8}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                    <span style={{fontFamily:'var(--mono)',color:'var(--red)'}}>{c.a.cidr}</span>
                    <span style={{color:'var(--dim)'}}>overlaps with</span>
                    <span style={{fontFamily:'var(--mono)',color:'var(--red)'}}>{c.b.cidr}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>
                    {c.a.cidr} contains {c.b.networkStr} within range {c.a.firstHostStr}–{c.a.lastHostStr}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Tool: Subnet Split & Merge ───────────────────────────────
window.OverlapDetector = OverlapDetector;
