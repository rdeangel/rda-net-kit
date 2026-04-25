const { useState, useEffect, useCallback, useRef, useMemo } = React;

function RangeCIDR() {
  const [mode, setMode] = useState('range2cidr');
  const [start, setStart] = useState('10.0.0.0');
  const [end, setEnd] = useState('10.0.0.255');
  const [cidrIn, setCidrIn] = useState('10.0.1.0/24');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    if (mode === 'range2cidr') {
      const s = IPv4.parse(start), e = IPv4.parse(end);
      if (s === null) { setErr('Invalid start IP'); return; }
      if (e === null) { setErr('Invalid end IP'); return; }
      if (s > e) { setErr('Start must be ≤ end'); return; }
      const cidrs = IPv4.rangeToCIDRs(s, e);
      setResult({ mode, cidrs, count: cidrs.length });
    } else {
      const c = IPv4.parseCIDR(cidrIn);
      if (!c) { setErr('Invalid CIDR'); return; }
      const sn = IPv4.subnet(c.ip, c.prefix);
      setResult({ mode, start: sn.networkStr, end: sn.broadcastStr, firstHost: sn.firstHostStr, lastHost: sn.lastHostStr, hosts: sn.hostCount });
    }
  };

  useEffect(() => calc(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Mode</div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[['range2cidr','Range → CIDR'],['cidr2range','CIDR → Range']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => { setMode(v); setResult(null); setErr(''); }}>{l}</button>
          ))}
        </div>
        {mode === 'range2cidr' ? (
          <div className="two-col">
            <div className="field"><label className="label">Start IP</label>
              <input className="input" value={start} onChange={e => setStart(e.target.value)} placeholder="10.0.0.0" /></div>
            <div className="field"><label className="label">End IP</label>
              <input className="input" value={end} onChange={e => setEnd(e.target.value)} placeholder="10.0.0.255" /></div>
          </div>
        ) : (
          <div className="field"><label className="label">CIDR</label>
            <input className="input" value={cidrIn} onChange={e => setCidrIn(e.target.value)} placeholder="10.0.1.0/24" /></div>
        )}
        <Err msg={err} />
        <button className="btn btn-primary" onClick={calc}>Convert</button>
      </div>

      {result && (
        <div className="card fadein">
          {result.mode === 'range2cidr' ? (
            <>
              <div className="card-title">CIDR Blocks ({result.count})</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>CIDR</th><th>Network</th><th>Broadcast</th><th>Hosts</th><th></th></tr></thead>
                  <tbody>
                    {result.cidrs.map((cidr, i) => {
                      const c = IPv4.parseCIDR(cidr);
                      const sn = IPv4.subnet(c.ip, c.prefix);
                      return (
                        <tr key={i}>
                          <td style={{color:'var(--dim)'}}>{i+1}</td>
                          <td style={{color:'var(--cyan)'}}>{cidr}</td>
                          <td>{sn.networkStr}</td>
                          <td>{sn.broadcastStr}</td>
                          <td style={{color:'var(--green)'}}>{sn.hostCount}</td>
                          <td><CopyBtn text={cidr} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="btn-row">
                <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(result.cidrs.map((c,i)=>({index:i+1,cidr:c})),'range-cidrs.csv')}>Export CSV</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(result.cidrs.join('\n'))}>Copy All</button>
              </div>
            </>
          ) : (
            <>
              <div className="card-title">Range Details</div>
              <div className="result-grid">
                <ResultItem label="Start (Network)" value={result.start} accent />
                <ResultItem label="End (Broadcast)" value={result.end} red />
                <ResultItem label="First Host" value={result.firstHost} green />
                <ResultItem label="Last Host" value={result.lastHost} green />
                <ResultItem label="Usable Hosts" value={result.hosts} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: Supernet Calculator ───────────────────────────────
window.RangeCIDR = RangeCIDR;
