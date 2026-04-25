const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastReference() {
  const [search, setSearch] = useState('');
  const [filterVer, setFilterVer] = useState('All');

  const allEntries = [
    ...Multicast.WELL_KNOWN_IPV4.map(e => ({ ...e, ver: 4 })),
    ...Multicast.WELL_KNOWN_IPV6.map(e => ({ ...e, ver: 6 })),
  ];

  const filtered = allEntries.filter(e => {
    const q = search.toLowerCase();
    const mSearch = !q || e.addr.toLowerCase().includes(q) || e.proto.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q);
    const mVer = filterVer === 'All' || (filterVer === 'IPv4' && e.ver === 4) || (filterVer === 'IPv6' && e.ver === 6);
    return mSearch && mVer;
  });

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Well-Known Multicast Addresses</div>
        <div className="input-row">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address, protocol, or description..." />
          <select className="select" value={filterVer} onChange={e => setFilterVer(e.target.value)} style={{width:'auto',flexShrink:0}}>
            {['All','IPv4','IPv6'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div className="hint" style={{marginTop:6}}>{filtered.length} entries shown</div>
      </div>
      <div className="card fadein" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap" style={{maxHeight:360,overflowY:'auto'}}>
          <table>
            <thead><tr><th>Address</th><th>Protocol</th><th>Description</th><th>RFC</th><th></th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i}>
                  <td style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontWeight:600,whiteSpace:'nowrap'}}>{e.addr}</td>
                  <td><span className={`badge ${e.ver===4?'badge-blue':'badge-purple'}`}>{e.proto}</span></td>
                  <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{e.desc}</td>
                  <td style={{color:'var(--dim)',fontSize:12}}>{e.rfc}</td>
                  <td><CopyBtn text={e.addr} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IPv4 Multicast Block Allocations</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Range</th><th>Name</th><th>Scope</th><th>TTL</th><th>RFC</th></tr></thead>
            <tbody>
              {Multicast.IPV4_BLOCKS.map((b, i) => (
                <tr key={i}>
                  <td style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontSize:12,whiteSpace:'nowrap'}}>{b.range}</td>
                  <td style={{fontFamily:'var(--sans)',fontWeight:500}}>{b.name}</td>
                  <td><span className="badge badge-blue">{b.scope}</span></td>
                  <td style={{color:'var(--yellow)',fontFamily:'var(--mono)'}}>{b.ttl || 'varies'}</td>
                  <td style={{color:'var(--dim)',fontSize:12}}>{b.rfc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">TTL Scope Thresholds</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>TTL</th><th>Scope</th></tr></thead>
            <tbody>
              {Multicast.TTL_THRESHOLDS.map((t, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'var(--mono)',fontWeight:600,color:t.color}}>{t.ttl}</td>
                  <td style={{fontFamily:'var(--sans)'}}>{t.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IPv6 Multicast Scope Values</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Value</th><th>Hex</th><th>Scope Name</th><th>RFC</th></tr></thead>
            <tbody>
              {Multicast.IPv6_SCOPES.map((s, i) => (
                <tr key={i}>
                  <td style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--cyan)'}}>{s.value}</td>
                  <td style={{fontFamily:'var(--mono)',color:'var(--dim)'}}>0x{s.value.toString(16).padStart(2,'0')}</td>
                  <td style={{fontFamily:'var(--sans)',fontWeight:500}}>{s.name}</td>
                  <td style={{color:'var(--dim)',fontSize:12}}>{s.rfc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IGMP & MLD Protocol Comparison</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Feature</th><th>IGMPv1</th><th>IGMPv2</th><th>IGMPv3</th><th>MLDv1</th><th>MLDv2</th></tr></thead>
            <tbody>
              <tr><td>Source Filtering</td><td>No</td><td>No</td><td style={{color:'var(--green)'}}>Yes (SSM)</td><td>No</td><td style={{color:'var(--green)'}}>Yes</td></tr>
              <tr><td>Leave Message</td><td>No</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
              <tr><td>Leave Latency</td><td>~Full Timeout</td><td>~3s</td><td>~3s</td><td>~3s</td><td>~3s</td></tr>
              <tr><td>RFC</td><td>1112</td><td>2236</td><td>3376</td><td>2710</td><td>3810</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">PIM Protocol Decision Guide</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mode</th><th>RP Needed</th><th>Source Discovery</th><th>Best For</th><th>Scaling</th></tr></thead>
            <tbody>
              <tr><td>PIM-SM</td><td>Yes</td><td>RP-based</td><td>General purpose</td><td>Medium</td></tr>
              <tr><td>PIM-SSM</td><td>No</td><td>Receiver specifies</td><td>1-to-many</td><td style={{color:'var(--green)'}}>High</td></tr>
              <tr><td>BIDIR-PIM</td><td>Yes</td><td>Built-in</td><td>Many-to-many</td><td style={{color:'var(--cyan)'}}>Very High</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">Reverse Path Forwarding (RPF)</div>
        <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
          Multicast routers use <strong style={{color:'var(--text)'}}>RPF</strong> to prevent loops and ensure traffic is received on the correct interface.
          <br/><br/>
          <strong style={{color:'var(--text)'}}>The Check:</strong> A router accepts a multicast packet only if it arrives on the interface it would use to reach the <strong style={{color:'var(--text)'}}>source IP</strong> of that packet (based on the unicast routing table).
          <br/><br/>
          <strong style={{color:'var(--red)'}}>#1 Failure Cause:</strong> Asymmetric routing. If the path to the source differs from the path the source uses to send traffic, the RPF check fails and traffic is dropped.
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">Admin-Scoped Boundary (<RFCLink rfc="RFC 2365" />)</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Range</th><th>Scope</th><th>Usage</th></tr></thead>
            <tbody>
              <tr><td>239.0.0.0/10</td><td>Reserved</td><td>—</td></tr>
              <tr><td>239.64.0.0/10</td><td>Reserved</td><td>—</td></tr>
              <tr><td>239.128.0.0/10</td><td>Reserved</td><td>—</td></tr>
              <tr><td style={{color:'var(--cyan)'}}>239.192.0.0/10</td><td>Org-Local</td><td>Organization-wide scope</td></tr>
              <tr><td style={{color:'var(--cyan)'}}>239.255.0.0/16</td><td>Site-Local</td><td>Restricted to local site</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">Common Application Ports</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Protocol</th><th>Default Ports</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td style={{fontWeight:500}}>RTP / RTCP</td><td>Even/Odd pairs</td><td>Media Streaming (e.g. 5004/5005)</td></tr>
              <tr><td style={{fontWeight:500}}>SAP</td><td>9875</td><td>Session Announcement Protocol</td></tr>
              <tr><td style={{fontWeight:500}}>PTP</td><td>319, 320</td><td>Precision Time Protocol (Event/General)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tool: Multicast Planner ─────────────────────────────────
window.McastReference = McastReference;
