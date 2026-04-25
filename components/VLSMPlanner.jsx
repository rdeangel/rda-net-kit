const { useState, useEffect, useCallback, useRef, useMemo } = React;

function VLSMPlanner() {
  const [network, setNetwork] = useState('192.168.1.0/24');
  const [reqs, setReqs] = useState([
    { name: 'Sales', hosts: 50 },
    { name: 'Engineering', hosts: 30 },
    { name: 'HR', hosts: 14 },
    { name: 'Servers', hosts: 6 },
    { name: 'Management', hosts: 2 },
  ]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const addReq = () => setReqs(r => [...r, { name: '', hosts: 10 }]);
  const remReq = i => setReqs(r => r.filter((_, j) => j !== i));
  const updateReq = (i, k, v) => setReqs(r => r.map((req, j) => j === i ? { ...req, [k]: k === 'hosts' ? parseInt(v) || 0 : v } : req));

  const calc = () => {
    setErr(''); setResult(null);
    const c = IPv4.parseCIDR(network);
    if (!c) { setErr('Invalid parent network CIDR'); return; }
    const filtered = reqs.filter(r => r.name || r.hosts > 0);
    if (!filtered.length) { setErr('Add at least one subnet requirement'); return; }
    const res = IPv4.vlsm(c.ip, c.prefix, filtered);
    setResult({ allocations: res, parent: IPv4.subnet(c.ip, c.prefix) });
  };

  useEffect(() => calc(), []);

  const PALETTE = ['var(--cyan)','var(--blue)','var(--green)','var(--yellow)','var(--purple)','#f97316','#ec4899','#14b8a6'];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Parent Network</div>
        <div className="field">
          <label className="label">Network CIDR</label>
          <input className="input" style={{maxWidth:220}} value={network} onChange={e => setNetwork(e.target.value)} placeholder="192.168.1.0/24" />
        </div>
        <div className="card-title" style={{marginTop:8}}>Subnet Requirements</div>
        {reqs.map((r, i) => (
          <div key={i} className="vlsm-row">
            <input className="input" value={r.name} onChange={e => updateReq(i,'name',e.target.value)} placeholder={`Subnet ${i+1} name`} />
            <input className="input" type="number" value={r.hosts} onChange={e => updateReq(i,'hosts',e.target.value)} placeholder="Hosts" min="1" />
            <button className="btn btn-danger btn-sm" onClick={() => remReq(i)}>✕</button>
          </div>
        ))}
        <Err msg={err} />
        <div className="btn-row" style={{marginTop:16}}>
          <button className="btn btn-ghost" onClick={addReq}>+ Add Subnet</button>
          <button className="btn btn-primary" onClick={calc}>Calculate VLSM</button>
        </div>
      </div>

      {result && (
        <>
          <div className="card fadein">
            <div className="card-title">Visual Map — {result.parent.cidr}</div>
            {/* Proportional bar */}
            <div style={{display:'flex',height:36,borderRadius:6,overflow:'hidden',border:'1px solid var(--border)',marginBottom:14,gap:1}}>
              {result.allocations.filter(a => a.subnet).map((a, i) => {
                const pct = (a.subnet.totalHosts / result.parent.totalHosts * 100);
                return (
                  <div key={i} title={`${a.name||'Subnet '+(i+1)}: ${a.subnet.cidr} (${a.subnet.hostCount} hosts)`}
                    style={{flex:`0 0 ${pct}%`,background:`${PALETTE[i%PALETTE.length]}33`,borderRight:`1px solid ${PALETTE[i%PALETTE.length]}66`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',minWidth:2}}
                  >
                    {pct > 8 && <span style={{fontSize:10,fontFamily:'var(--mono)',color:PALETTE[i%PALETTE.length],fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 4px'}}>{a.subnet.cidr}</span>}
                  </div>
                );
              })}
              {/* Unused space */}
              {(() => {
                const used = result.allocations.filter(a=>a.subnet).reduce((s,a)=>s+a.subnet.totalHosts,0);
                const pct = ((result.parent.totalHosts - used) / result.parent.totalHosts * 100);
                return pct > 0 ? <div style={{flex:`0 0 ${pct}%`,background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center'}}>{pct > 8 && <span style={{fontSize:10,color:'var(--dim)',fontFamily:'var(--mono)'}}>free</span>}</div> : null;
              })()}
            </div>
            {/* Legend */}
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
              {result.allocations.filter(a => a.subnet).map((a, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                  <div style={{width:10,height:10,borderRadius:2,background:PALETTE[i%PALETTE.length],flexShrink:0}}/>
                  <span style={{color:'var(--muted)'}}>{a.name||`Subnet ${i+1}`}</span>
                  <span style={{fontFamily:'var(--mono)',color:PALETTE[i%PALETTE.length],fontSize:11}}>{a.subnet.cidr}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card fadein">
            <div className="card-title">Allocation Table</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Required Hosts</th><th>CIDR</th><th>Usable Hosts</th><th>First Host</th><th>Last Host</th><th>Broadcast</th></tr></thead>
                <tbody>
                  {result.allocations.map((a, i) => (
                    <tr key={i}>
                      <td style={{color:'var(--dim)'}}>{i+1}</td>
                      <td style={{fontFamily:'var(--sans)',fontWeight:500}}>{a.name || `Subnet ${i+1}`}</td>
                      <td style={{color:'var(--yellow)'}}>{a.hosts}</td>
                      {a.error ? <td colSpan={5} style={{color:'var(--red)'}}>{a.error}</td> : <>
                        <td style={{color:'var(--cyan)'}}>{a.subnet.cidr}</td>
                        <td style={{color:'var(--green)'}}>{a.subnet.hostCount}</td>
                        <td>{a.subnet.firstHostStr}</td>
                        <td>{a.subnet.lastHostStr}</td>
                        <td>{a.subnet.broadcastStr}</td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(
                result.allocations.filter(a=>a.subnet).map(a=>({name:a.name,required:a.hosts,cidr:a.subnet.cidr,mask:a.subnet.maskStr,network:a.subnet.networkStr,firstHost:a.subnet.firstHostStr,lastHost:a.subnet.lastHostStr,broadcast:a.subnet.broadcastStr,usable:a.subnet.hostCount})),
                'vlsm.csv')}>Export CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportJSON(result.allocations,'vlsm.json')}>Export JSON</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tool: Wildcard Mask ─────────────────────────────────────
window.VLSMPlanner = VLSMPlanner;
