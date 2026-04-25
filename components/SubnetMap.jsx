const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SubnetMap() {
  const [input, setInput] = useState('10.0.0.0/22');
  const [splitTo, setSplitTo] = useState(24);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    const c = IPv4.parseCIDR(input);
    if (!c) { setErr('Invalid CIDR'); return; }
    if (splitTo <= c.prefix) { setErr(`Split prefix must be > /${c.prefix}`); return; }
    if (splitTo - c.prefix > 12) { setErr('Max split depth is /+12 to avoid too many subnets'); return; }
    const parent = IPv4.subnet(c.ip, c.prefix);
    const count = Math.pow(2, splitTo - c.prefix);
    const subnets = [];
    for (let i = 0; i < count; i++) {
      const subNet = (parent.network + i * Math.pow(2, 32 - splitTo)) >>> 0;
      subnets.push(IPv4.subnet(subNet, splitTo));
    }
    setResult({ parent, subnets, splitTo });
  };

  useEffect(() => calc(), []);

  const COLORS = ['#00d4c8','#4a9eff','#22c55e','#f59e0b','#a78bfa','#f97316','#ec4899','#14b8a6','#e11d48','#6366f1'];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Configuration</div>
        <div className="two-col">
          <div className="field"><label className="label">Parent Network</label>
            <input className="input" value={input} onChange={e => setInput(e.target.value)} placeholder="10.0.0.0/22" /></div>
          <div className="field"><label className="label">Split into /{splitTo}</label>
            <input className="input" type="number" min="1" max="32" value={splitTo} onChange={e => setSplitTo(parseInt(e.target.value)||24)} /></div>
        </div>
        <Err msg={err} />
        <button className="btn btn-primary" onClick={calc}>Generate Map</button>
      </div>

      {result && (
        <>
          <div className="card fadein">
            <div className="card-title">Visual Map — {result.parent.cidr} split into {result.subnets.length} × /{result.splitTo}</div>
            <div style={{display:'flex',gap:2,flexWrap:'wrap',marginBottom:8}}>
              {result.subnets.map((sn, i) => (
                <div key={i} title={`${sn.cidr}\n${sn.firstHostStr} – ${sn.lastHostStr}`}
                  style={{
                    flex:`0 0 ${(100/result.subnets.length).toFixed(2)}%`,
                    minWidth:20,height:36,background:`${COLORS[i%COLORS.length]}22`,
                    border:`1px solid ${COLORS[i%COLORS.length]}44`,borderRadius:3,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:9,fontFamily:'var(--mono)',color:COLORS[i%COLORS.length],
                    cursor:'default',transition:'all .15s',overflow:'hidden',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background=`${COLORS[i%COLORS.length]}44`}
                  onMouseLeave={e => e.currentTarget.style.background=`${COLORS[i%COLORS.length]}22`}
                >
                  {result.subnets.length <= 16 ? sn.networkStr.split('.').slice(-2).join('.') : ''}
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'var(--dim)'}}>Hover over each block for details • {result.subnets.length} subnets × {result.subnets[0].hostCount} usable hosts each</div>
          </div>
          <div className="card fadein">
            <div className="card-title">Subnet Table ({result.subnets.length} subnets)</div>
            <div className="table-wrap" style={{maxHeight:400,overflowY:'auto'}}>
              <table>
                <thead><tr><th>#</th><th>Network</th><th>CIDR</th><th>First Host</th><th>Last Host</th><th>Broadcast</th><th>Hosts</th></tr></thead>
                <tbody>
                  {result.subnets.map((sn, i) => (
                    <tr key={i}>
                      <td style={{color:'var(--dim)'}}>{i+1}</td>
                      <td style={{color:`${COLORS[i%COLORS.length]}`}}>{sn.networkStr}</td>
                      <td>{sn.cidr}</td>
                      <td>{sn.firstHostStr}</td>
                      <td>{sn.lastHostStr}</td>
                      <td style={{color:'var(--red)'}}>{sn.broadcastStr}</td>
                      <td style={{color:'var(--green)'}}>{sn.hostCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(result.subnets.map((sn,i)=>({index:i+1,cidr:sn.cidr,network:sn.networkStr,firstHost:sn.firstHostStr,lastHost:sn.lastHostStr,broadcast:sn.broadcastStr,hosts:sn.hostCount})),'subnet-map.csv')}>Export CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportJSON(result.subnets,'subnet-map.json')}>Export JSON</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tool: Remote Diagnostics ────────────────────────────────
window.SubnetMap = SubnetMap;
