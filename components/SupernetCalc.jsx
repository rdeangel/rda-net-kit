const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SupernetCalc() {
  const [lines, setLines] = useState('192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    const entries = lines.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (!entries.length) { setErr('Enter at least one network'); return; }
    const parsed = entries.map(e => {
      const c = IPv4.parseCIDR(e);
      if (!c) { const ip = IPv4.parse(e); return ip !== null ? { ip, prefix: 32 } : null; }
      return c;
    });
    if (parsed.some(p => !p)) { setErr('One or more entries are invalid'); return; }
    const networks = parsed.map(p => IPv4.subnet(p.ip, p.prefix));
    const allIPs = networks.flatMap(n => [n.network, n.broadcast]);
    const sup = IPv4.supernet(allIPs);
    setResult({ networks, supernet: sup, inputs: entries });
  };

  useEffect(() => calc(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Networks to Summarize</div>
        <div className="field">
          <label className="label">One network per line (CIDR or IP)</label>
          <textarea className="input" rows={6} value={lines} onChange={e => setLines(e.target.value)} style={{resize:'vertical'}} />
        </div>
        <Err msg={err} />
        <button className="btn btn-primary" onClick={calc}>Summarize</button>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">Supernet / Summary Route</div>
          <div className="result-grid grid-mobile-1" style={{marginBottom:16}}>
            <ResultItem label="Supernet CIDR" value={result.supernet.cidr} accent />
            <ResultItem label="Network Address" value={result.supernet.networkStr} />
            <ResultItem label="Broadcast" value={result.supernet.broadcastStr} />
            <ResultItem label="Subnet Mask" value={result.supernet.maskStr} />
            <ResultItem label="Total Addresses" value={result.supernet.totalCount} />
            <ResultItem label="Prefix Length" value={`/${result.supernet.prefix}`} />
          </div>
          <div className="card-title">Input Networks</div>
          <div className="table-wrap hide-mobile">
            <table>
              <thead><tr><th>Network</th><th>First Host</th><th>Last Host</th><th>Hosts</th></tr></thead>
              <tbody>
                {result.networks.map((n, i) => (
                  <tr key={i}><td style={{color:'var(--cyan)'}}>{n.cidr}</td><td>{n.firstHostStr}</td><td>{n.lastHostStr}</td><td style={{color:'var(--green)'}}>{n.hostCount}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {result.networks.map((n, i) => (
              <div key={i} className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Network</span>
                  <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{n.cidr}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Range</span>
                  <span className="mobile-card-value" style={{fontSize:11}}>{n.firstHostStr} - {n.lastHostStr}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Usable Hosts</span>
                  <span className="mobile-card-value" style={{color:'var(--green)'}}>{n.hostCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IPv6 Tools ─────────────────────────────────────────
window.SupernetCalc = SupernetCalc;
