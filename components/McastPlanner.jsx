const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastPlanner() {
  const [baseBlock, setBaseBlock] = useState('239.0.0.0/16');
  const [groups, setGroups] = useState([
    { name: 'Video Stream', prefix: 24 },
    { name: 'Audio Stream', prefix: 24 },
    { name: 'Data Feed', prefix: 28 },
  ]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const addGroup = () => setGroups(g => [...g, { name: '', prefix: 28 }]);
  const remGroup = i => setGroups(g => g.filter((_, j) => j !== i));
  const updateGroup = (i, k, v) => setGroups(g => g.map((grp, j) => j === i ? { ...grp, [k]: k === 'prefix' ? parseInt(v) || 24 : v } : grp));

  const calc = () => {
    setErr(''); setResult(null);
    const c = IPv4.parseCIDR(baseBlock);
    if (!c) { setErr('Invalid base CIDR'); return; }
    const a = (c.ip >>> 24) & 0xFF;
    if (a !== 239) { setErr('Base block must be within 239.0.0.0/8 (administratively scoped)'); return; }
    const filtered = groups.filter(g => g.name || g.prefix);
    if (!filtered.length) { setErr('Add at least one group'); return; }

    const parent = IPv4.subnet(c.ip, c.prefix);
    let curIP = parent.network;
    const parentEnd = parent.broadcast;
    const allocations = [];

    for (const grp of filtered) {
      const p = grp.prefix;
      if (p < c.prefix || p > 32) {
        allocations.push({ ...grp, error: `Prefix /${p} outside parent /${c.prefix}` });
        continue;
      }
      const blockSize = Math.pow(2, 32 - p);
      curIP = (Math.ceil(curIP / blockSize) * blockSize) >>> 0;
      const sn = IPv4.subnet(curIP, p);
      if (sn.broadcast > parentEnd) {
        allocations.push({ ...grp, error: 'No space remaining' });
        continue;
      }
      allocations.push({ ...grp, subnet: sn, error: null });
      curIP = (sn.broadcast + 1) >>> 0;
    }
    setResult({ allocations, parent });
  };

  useEffect(() => calc(), []);

  const PALETTE = ['var(--cyan)','var(--blue)','var(--green)','var(--yellow)','var(--purple)','#f97316','#ec4899','#14b8a6'];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Base Block (239/8 Admin-Scoped)</div>
        <div className="field">
          <label className="label">Network CIDR</label>
          <input className="input" style={{maxWidth:220}} value={baseBlock} onChange={e => setBaseBlock(e.target.value)} placeholder="239.0.0.0/16" />
        </div>
        <div className="card-title" style={{marginTop:8}}>Multicast Groups</div>
        {groups.map((g, i) => (
          <div key={i} className="vlsm-row">
            <input className="input" value={g.name} onChange={e => updateGroup(i,'name',e.target.value)} placeholder={`Group ${i+1} name`} />
            <select className="select" value={g.prefix} onChange={e => updateGroup(i,'prefix',e.target.value)} style={{width:80}}>
              {Array.from({length:9},(_,k)=>24+k).filter(p=>p<=32).map(p => <option key={p} value={p}>/{p}</option>)}
            </select>
            <button className="btn btn-danger btn-sm" onClick={() => remGroup(i)}>✕</button>
          </div>
        ))}
        <Err msg={err} />
        <div className="btn-row" style={{marginTop:16}}>
          <button className="btn btn-ghost" onClick={addGroup}>+ Add Group</button>
          <button className="btn btn-primary" onClick={calc}>Allocate</button>
        </div>
      </div>

      {result && (<>
        <div className="card fadein">
          <div className="card-title">Visual Map — {result.parent.cidr}</div>
          <div style={{display:'flex',height:36,borderRadius:6,overflow:'hidden',border:'1px solid var(--border)',marginBottom:14,gap:1}}>
            {result.allocations.filter(a => a.subnet).map((a, i) => {
              const pct = (a.subnet.totalHosts / result.parent.totalHosts * 100);
              return (
                <div key={i} title={`${a.name}: ${a.subnet.cidr}`}
                  style={{flex:`0 0 ${pct}%`,background:`${PALETTE[i%PALETTE.length]}33`,borderRight:`1px solid ${PALETTE[i%PALETTE.length]}66`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',minWidth:2}}>
                  {pct > 6 && <span style={{fontSize:10,fontFamily:'var(--mono)',color:PALETTE[i%PALETTE.length],fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 4px'}}>{a.subnet.cidr}</span>}
                </div>
              );
            })}
            {(() => {
              const used = result.allocations.filter(a=>a.subnet).reduce((s,a)=>s+a.subnet.totalHosts,0);
              const pct = ((result.parent.totalHosts - used) / result.parent.totalHosts * 100);
              return pct > 0 ? <div style={{flex:`0 0 ${pct}%`,background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center'}}>{pct > 6 && <span style={{fontSize:10,color:'var(--dim)',fontFamily:'var(--mono)'}}>free</span>}</div> : null;
            })()}
          </div>
        </div>
        <div className="card fadein">
          <div className="card-title">Allocation Table</div>
          <div className="table-wrap hide-mobile">
            <table>
              <thead><tr><th>#</th><th>Name</th><th>CIDR</th><th>Range</th><th>Addresses</th><th>MAC</th></tr></thead>
              <tbody>
                {result.allocations.map((a, i) => (
                  <tr key={i}>
                    <td style={{color:'var(--dim)'}}>{i+1}</td>
                    <td style={{fontWeight:500}}>{a.name || `Group ${i+1}`}</td>
                    {a.error ? <td colSpan={4} style={{color:'var(--red)'}}>{a.error}</td> : <>
                      <td style={{color:'var(--cyan)'}}>{a.subnet.cidr}</td>
                      <td>{a.subnet.firstHostStr} – {a.subnet.lastHostStr}</td>
                      <td style={{color:'var(--green)'}}>{a.subnet.totalHosts}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--dim)'}}>{Multicast.ipv4ToMac(a.subnet.network)}</td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {result.allocations.map((a, i) => (
              <div key={i} className="mobile-card" style={{borderLeft: a.error ? '3px solid var(--red)' : 'none'}}>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Group {i+1}</span>
                  <span className="mobile-card-value" style={{fontWeight:600}}>{a.name || 'Unnamed'}</span>
                </div>
                {a.error ? (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label" style={{color:'var(--red)'}}>Error</span>
                    <span className="mobile-card-value" style={{color:'var(--red)'}}>{a.error}</span>
                  </div>
                ) : (
                  <>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">CIDR</span>
                      <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{a.subnet.cidr}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Range</span>
                      <span className="mobile-card-value" style={{fontSize:11}}>{a.subnet.firstHostStr} - {a.subnet.lastHostStr}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Hosts / MAC</span>
                      <span className="mobile-card-value">{a.subnet.totalHosts} / {Multicast.ipv4ToMac(a.subnet.network).slice(-8)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(
              result.allocations.filter(a=>a.subnet).map(a=>({name:a.name,cidr:a.subnet.cidr,network:a.subnet.networkStr,broadcast:a.subnet.broadcastStr,addresses:a.subnet.totalHosts,mac:Multicast.ipv4ToMac(a.subnet.network)})),
              'multicast-plan.csv')}>Export CSV</button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportJSON(result.allocations,'multicast-plan.json')}>Export JSON</button>
          </div>
        </div>
      </>)}
    </div>
  );
}

// ─── Tool: Solicited-Node Calc ───────────────────────────────
window.McastPlanner = McastPlanner;
