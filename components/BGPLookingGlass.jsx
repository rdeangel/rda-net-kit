const { useState, useEffect, useCallback, useRef, useMemo } = React;

function BGPLookingGlass() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const query = async () => {
    if (!target) return;
    setLoading(true);
    setSelectedIdx(0);
    try {
      const [ovRes, statRes, bgpRes] = await Promise.all([
        fetch(`https://stat.ripe.net/data/prefix-overview/data.json?resource=${target}`),
        fetch(`https://stat.ripe.net/data/routing-status/data.json?resource=${target}`),
        fetch(`https://stat.ripe.net/data/bgp-state/data.json?resource=${target}`)
      ]);

      const ov = await ovRes.json();
      const status = await statRes.json();
      const bgp = await bgpRes.json();

      setData({
        overview: ov.data,
        status: status.data,
        bgp: bgp.data
      });
    } catch (e) {
      setData({ error: 'Failed to query RIPE API' });
    }
    setLoading(false);
  };

  const renderResult = () => {
    if (data.error) return <Err msg={data.error} />;

    const ov = data.overview;
    const st = data.status;
    const bgp = data.bgp;

    // Visibility calculation
    const v4 = st.visibility?.v4;
    const visibilityText = v4 ? `${v4.ris_peers_seeing} / ${v4.total_ris_peers} RIS Peers (${Math.round(v4.ris_peers_seeing/v4.total_ris_peers*100)}%)` : 'N/A';

    // Sample BGP Paths
    const states = bgp.bgp_state || [];
    const currentPath = states[selectedIdx];
    const asPath = currentPath?.path?.join(' → ') || 'N/A';
    const communities = currentPath?.community?.join(', ') || 'None';

    // Unique Paths Summary
    const pathCounts = {};
    states.forEach(s => {
      const p = s.path.join(' ');
      pathCounts[p] = (pathCounts[p] || 0) + 1;
    });
    const uniquePaths = Object.keys(pathCounts).length;

    return (
      <div className="fadein" style={{marginTop:20}}>
        <div className="result-grid">
          <ResultItem label="Resource" value={ov.resource} />
          <ResultItem label="Status" value={ov.announced ? '✅ Announced' : '❌ Not Announced'} />
          <ResultItem label="Global Visibility" value={visibilityText} />
          <ResultItem label="Path Diversity" value={`${uniquePaths} unique paths across ${states.length} peers`} />

          {ov.asns && ov.asns.map((as, i) => (
            <ResultItem key={i} label={`Origin AS${as.asn}`} value={as.holder} />
          ))}

          <ResultItem label="First Seen" value={st.first_seen?.time?.split('T')[0] || 'Unknown'} />
          <ResultItem label="Registry" value={ov.block?.desc || 'N/A'} />
        </div>

        <div style={{marginTop:24, padding:16, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
             <div style={{fontSize:10, color:'var(--muted)', textTransform:'uppercase', fontWeight:600}}>BGP Observation Point (Perspective)</div>
             <select
                className="input"
                style={{width:'auto', minWidth:200, fontSize:11, padding:'2px 8px', height:24}}
                value={selectedIdx}
                onChange={e => setSelectedIdx(parseInt(e.target.value))}
              >
                {states.map((s, i) => (
                  <option key={i} value={i}>Peer IP: {s.source_id.split('-')[1]} (RRC{s.source_id.split('-')[0]})</option>
                ))}
              </select>
          </div>

          <div className="field">
            <label className="label">Full AS Path from this Peer</label>
            <div style={{fontFamily:'monospace', fontSize:13, color:'var(--purple)', wordBreak:'break-all', lineHeight:1.4, background:'rgba(167, 139, 250, 0.05)', padding:8, borderRadius:4, border:'1px solid rgba(167, 139, 250, 0.2)'}}>
              {currentPath?.path?.map((asn, i) => (
                <span key={i}>
                  <span title={`ASN: ${asn}`} style={{fontWeight:600}}>{asn}</span>
                  {i < currentPath.path.length - 1 && <span style={{color:'var(--dim)', margin:'0 6px'}}>→</span>}
                </span>
              )) || 'No path data'}
            </div>
          </div>

          <div className="field" style={{marginTop:12}}>
            <label className="label">BGP Communities</label>
            <div style={{fontFamily:'monospace', fontSize:11, color:'var(--dim)', wordBreak:'break-all'}}>{communities}</div>
          </div>
        </div>

        {(st.less_specifics?.length > 0 || st.more_specifics?.length > 0) && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:10, color:'var(--muted)', textTransform:'uppercase', marginBottom:8, fontWeight:600}}>Related Prefixes</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {st.less_specifics.map((p, i) => <span key={i} className="badge" style={{background:'var(--blue-glass)', border:'1px solid var(--blue)'}}>Parent: {p.prefix}</span>)}
              {st.more_specifics.slice(0, 10).map((p, i) => <span key={i} className="badge" style={{background:'var(--purple-glass)', border:'1px solid var(--purple)'}}>{p.prefix}</span>)}
              {st.more_specifics.length > 10 && <span className="badge">+{st.more_specifics.length - 10} more...</span>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Global Route Visibility (RIPE Stat)</div>
        <div className="input-row">
          <input
            className="input"
            value={target}
            onChange={e => setTarget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query()}
            placeholder="ASN or IP Prefix (e.g. 1.1.1.0/24)"
          />
          <button className="btn btn-primary" onClick={query} disabled={loading}>{loading ? 'Querying...' : 'Query'}</button>
        </div>
        {data && renderResult()}
        <div className="hint" style={{marginTop:12}}>
          <strong>About Peer IPs:</strong> These are the IP addresses of global ISPs and Internet Exchange (IXP) routers that share their full BGP tables with RIPE's Routing Information Service (RIS). Selecting a peer shows you the exact path and policy (communities) as seen from that specific network's perspective.
        </div>
      </div>
    </div>
  );
}

// ─── LACP Simulator ─────────────────────────────────────────────
window.BGPLookingGlass = BGPLookingGlass;
