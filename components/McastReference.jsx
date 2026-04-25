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
        <div className="table-wrap hide-mobile" style={{maxHeight:360,overflowY:'auto'}}>
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
        {/* Mobile View */}
        <div className="show-mobile mobile-cards" style={{padding:16, maxHeight:400, overflowY:'auto'}}>
          {filtered.map((e, i) => (
            <div key={i} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Address</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{e.addr}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Protocol</span>
                <span className={`badge ${e.ver===4?'badge-blue':'badge-purple'}`} style={{fontSize:10}}>{e.proto}</span>
              </div>
              <div className="mobile-card-row" style={{flexDirection:'column', alignItems:'flex-start', borderBottom:'none'}}>
                <span className="mobile-card-label" style={{marginBottom:4}}>Description</span>
                <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{e.desc}</span>
              </div>
              <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                <CopyBtn text={e.addr} label="Copy Addr" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IPv4 Multicast Block Allocations</div>
        <div className="table-wrap hide-mobile">
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
        {/* Mobile View for Blocks */}
        <div className="show-mobile mobile-cards">
          {Multicast.IPV4_BLOCKS.map((b, i) => (
            <div key={i} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Range</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{b.range}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Name</span>
                <span className="mobile-card-value" style={{fontWeight:500}}>{b.name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Scope / TTL</span>
                <span className="mobile-card-value">{b.scope} / {b.ttl || 'varies'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">TTL Scope Thresholds</div>
        <div className="table-wrap hide-mobile">
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
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {Multicast.TTL_THRESHOLDS.map((t, i) => (
            <div key={i} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">TTL</span>
                <span className="mobile-card-value" style={{fontWeight:600, color:t.color}}>{t.ttl}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Scope</span>
                <span className="mobile-card-value">{t.scope}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IPv6 Multicast Scope Values</div>
        <div className="table-wrap hide-mobile">
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
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {Multicast.IPv6_SCOPES.map((s, i) => (
            <div key={i} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Value (Hex)</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{s.value} (0x{s.value.toString(16).padStart(2,'0')})</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Scope Name</span>
                <span className="mobile-card-value" style={{fontWeight:500}}>{s.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">IGMP & MLD Protocol Comparison</div>
        <div className="table-wrap hide-mobile">
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
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {[
            {v:'IGMPv1', sf:'No', lm:'No', lat:'~Full', rfc:'1112'},
            {v:'IGMPv2', sf:'No', lm:'Yes', lat:'~3s', rfc:'2236'},
            {v:'IGMPv3', sf:'Yes (SSM)', lm:'Yes', lat:'~3s', rfc:'3376'},
            {v:'MLDv1', sf:'No', lm:'Yes', lat:'~3s', rfc:'2710'},
            {v:'MLDv2', sf:'Yes', lm:'Yes', lat:'~3s', rfc:'3810'}
          ].map(p => (
            <div key={p.v} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Version</span>
                <span className="mobile-card-value" style={{fontWeight:600}}>{p.v}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Source Filtering</span>
                <span className="mobile-card-value" style={{color:p.sf.includes('Yes')?'var(--green)':'var(--muted)'}}>{p.sf}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Leave Msg / Latency</span>
                <span className="mobile-card-value">{p.lm} / {p.lat}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">RFC</span>
                <span className="mobile-card-value">{p.rfc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">PIM Protocol Decision Guide</div>
        <div className="table-wrap hide-mobile">
          <table>
            <thead><tr><th>Mode</th><th>RP Needed</th><th>Source Discovery</th><th>Best For</th><th>Scaling</th></tr></thead>
            <tbody>
              <tr><td>PIM-SM</td><td>Yes</td><td>RP-based</td><td>General purpose</td><td>Medium</td></tr>
              <tr><td>PIM-SSM</td><td>No</td><td>Receiver specifies</td><td>1-to-many</td><td style={{color:'var(--green)'}}>High</td></tr>
              <tr><td>BIDIR-PIM</td><td>Yes</td><td>Built-in</td><td>Many-to-many</td><td style={{color:'var(--cyan)'}}>Very High</td></tr>
            </tbody>
          </table>
        </div>
        <div className="show-mobile mobile-cards">
          {[
            {m:'PIM-SM', rp:'Yes', sd:'RP-based', b:'General', s:'Med'},
            {m:'PIM-SSM', rp:'No', sd:'Receiver spec', b:'1-to-many', s:'High'},
            {m:'BIDIR-PIM', rp:'Yes', sd:'Built-in', b:'Many-to-many', s:'V. High'}
          ].map(p => (
            <div key={p.m} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Mode / RP</span>
                <span className="mobile-card-value" style={{fontWeight:600}}>{p.m} ({p.rp === 'Yes' ? 'RP Needed' : 'No RP'})</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Best For</span>
                <span className="mobile-card-value">{p.b}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Scaling</span>
                <span className="mobile-card-value" style={{color:p.s.includes('High')?'var(--green)':'inherit'}}>{p.s}</span>
              </div>
            </div>
          ))}
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
        <div className="table-wrap hide-mobile">
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
        <div className="show-mobile mobile-cards">
          {[
            {r:'239.0.0.0/10', s:'Reserved'},
            {r:'239.192.0.0/10', s:'Org-Local', u:'Organization-wide'},
            {r:'239.255.0.0/16', s:'Site-Local', u:'Local site only'}
          ].map(b => (
            <div key={b.r} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Range</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{b.r}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Scope</span>
                <span className="mobile-card-value">{b.s} {b.u ? `(${b.u})` : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">Common Application Ports</div>
        <div className="table-wrap hide-mobile">
          <table>
            <thead><tr><th>Protocol</th><th>Default Ports</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td style={{fontWeight:500}}>RTP / RTCP</td><td>Even/Odd pairs</td><td>Media Streaming (e.g. 5004/5005)</td></tr>
              <tr><td style={{fontWeight:500}}>SAP</td><td>9875</td><td>Session Announcement Protocol</td></tr>
              <tr><td style={{fontWeight:500}}>PTP</td><td>319, 320</td><td>Precision Time Protocol (Event/General)</td></tr>
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {[
            {p:'RTP / RTCP', d:'Even/Odd', u:'Media Streaming'},
            {p:'SAP', d:'9875', u:'Session Announce'},
            {p:'PTP', d:'319, 320', u:'Precision Time'}
          ].map(m => (
            <div key={m.p} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">{m.p}</span>
                <span className="mobile-card-value" style={{fontWeight:600}}>{m.d}</span>
              </div>
              <div className="mobile-card-row" style={{borderBottom:'none'}}>
                <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{m.u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tool: Multicast Planner ─────────────────────────────────
window.McastReference = McastReference;
