const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastCollision() {
  const [input, setInput] = useState('239.1.1.1\n224.1.1.1\n239.129.1.1\n224.0.0.1\n239.0.0.1');
  const [macInput, setMacInput] = useState('01:00:5E:01:01:01');
  const [result, setResult] = useState(null);
  const [selectedMac, setSelectedMac] = useState(null);
  const [macResult, setMacResult] = useState(null);

  const calc = () => {
    const lines = input.split(/[\n,;]/).map(l => l.trim()).filter(Boolean);
    const groups = {};
    let totalFound = 0;

    lines.forEach(line => {
      const ip = IPv4.parse(line);
      if (ip !== null) {
        const a = (ip >>> 24) & 0xFF;
        if (a >= 224 && a <= 239) {
          const mac = Multicast.ipv4ToMac(ip);
          if (!groups[mac]) groups[mac] = [];
          if (!groups[mac].includes(line)) groups[mac].push(line);
          totalFound++;
        }
      }
    });

    const collisions = Object.entries(groups)
      .map(([mac, ips]) => ({ mac, ips }))
      .sort((a, b) => b.ips.length - a.ips.length);

    setResult({
      collisions,
      totalMACs: Object.keys(groups).length,
      totalIPs: totalFound,
      hasCollisions: collisions.some(c => c.ips.length > 1)
    });
  };

  const calcMac = () => {
    const ips = Multicast.macToIpv4Set(macInput);
    if (!ips) { setMacResult({ error: 'Invalid Multicast MAC (Must be 01:00:5E:xx:xx:xx)' }); return; }
    setMacResult({ ips });
  };

  useEffect(() => calc(), []);
  useEffect(() => calcMac(), []);

  return (
    <div className="fadein">
      <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap:24, alignItems:'start'}}>

        {/* Main Column: Analyzer & Results */}
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          <div className="card">
            <div className="card-title">Group Collision Analyzer</div>
            <div className="field">
              <label className="label">Enter Multicast IPs (List)</label>
              <textarea className="input" style={{height:100,fontFamily:'var(--mono)',fontSize:12}}
                value={input} onChange={e => setInput(e.target.value)} placeholder="239.1.1.1\n224.1.1.1..." />
            </div>
            <div className="btn-row">
              <button className="btn btn-primary btn-sm" onClick={calc}>Analyze Collisions</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setInput('239.1.1.1\n224.1.1.1\n239.129.1.1\n224.0.0.1\n239.0.0.1')}>Load Example</button>
            </div>
          </div>

          {result && (
            <div className="card fadein">
              <div className="card-title">Analysis Results</div>
              <div className="result-grid" style={{marginBottom:16}}>
                <ResultItem label="Total IPs Found" value={result.totalIPs} />
                <ResultItem label="Unique MACs" value={result.totalMACs} accent />
                <ResultItem label="Status" value={result.hasCollisions ? '⚠️ Collisions' : '✅ Clear'} red={result.hasCollisions} green={!result.hasCollisions} />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ethernet MAC Address</th>
                      <th>Associated IPs</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.collisions.map((c, i) => (
                      <tr key={i} style={{background: c.ips.length > 1 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}}>
                        <td style={{fontFamily:'var(--mono)',color: c.ips.length > 1 ? 'var(--red)' : 'var(--cyan)'}}>{c.mac}</td>
                        <td>
                          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                            {c.ips.map(ip => (
                              <span key={ip} style={{fontFamily:'var(--mono)',fontSize:11,padding:'1px 4px',background:'var(--panel)',borderRadius:4,border:'1px solid var(--border)'}}>{ip}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{padding:'2px 6px'}} onClick={() => setSelectedMac(c.mac)}>🔍 View 32:1</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Reverse Lookup & Info */}
        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          <div className="card" style={{borderTop:'4px solid var(--accent)'}}>
            <div className="card-title">Reverse MAC Lookup (32:1)</div>
            <div className="field">
              <label className="label">Enter Multicast MAC</label>
              <div className="input-row">
                <input className="input" style={{fontFamily:'var(--mono)', fontSize:12}} value={macInput}
                  onChange={e => setMacInput(e.target.value)} placeholder="01:00:5E:xx:xx:xx" />
                <button className="btn btn-primary btn-sm" onClick={calcMac}>Expand</button>
              </div>
            </div>
            {macResult && macResult.error && <div className="err-msg">{macResult.error}</div>}
            {macResult && !macResult.error && (
              <div style={{marginTop:10}}>
                <div style={{fontSize:11, color:'var(--muted)', marginBottom:6}}>All 32 related IPs for this MAC:</div>
                <div style={{maxHeight:250, overflowY:'auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4}}>
                  {macResult.ips.map(ip => (
                    <div key={ip} style={{fontSize:11, fontFamily:'var(--mono)', background:'var(--panel)', padding:'2px 6px', borderRadius:4, border:'1px solid var(--border)', textAlign:'center'}}>
                      {ip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px'}}>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
              <strong style={{color:'var(--text)'}}>The 32:1 Overlap:</strong> In IPv4 Multicast (<RFCLink rfc="RFC 1112" />), only the <strong style={{color:'var(--text)'}}>lower 23 bits</strong> of the IP are mapped to the MAC. This creates a <strong style={{color:'var(--text)'}}>5-bit discrepancy</strong> (2⁵ = 32).
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Impact:</strong> Layer 2 switches use the MAC for forwarding. Multiple IPs sharing a MAC causes "silent" CPU load as hosts must process and then discard traffic for groups they haven't joined.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Historical Note:</strong> This collision exists because IANA was only assigned half of a 24-bit OUI for multicast, forcing the 23-bit mapping limit.
            </div>
          </div>
        </div>
      </div>

      {selectedMac && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={() => setSelectedMac(null)}>
          <div className="card fadein" style={{width:'90%',maxWidth:600,maxHeight:'90vh',display:'flex',flexDirection:'column'}} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>Full 32:1 Relation for {selectedMac}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMac(null)}>&times;</button>
            </div>
            <div style={{padding:'10px 0',color:'var(--muted)',fontSize:13}}>
              These 32 multicast IPs all share the same Layer 2 MAC address:
            </div>
            <div style={{flex:1,overflowY:'auto',display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))',gap:8,padding:'4px'}}>
              {Multicast.macToIpv4Set(selectedMac).map(ip => (
                <div key={ip} style={{fontFamily:'var(--mono)',fontSize:12,padding:'6px 8px',background:'var(--panel)',borderRadius:4,border:'1px solid var(--border)',textAlign:'center'}}>
                  {ip}
                </div>
              ))}
            </div>
            <div style={{marginTop:20,textAlign:'right'}}>
              <button className="btn btn-primary" onClick={() => setSelectedMac(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IPv6 Multicast Builder ───────────────────────────
window.McastCollision = McastCollision;
