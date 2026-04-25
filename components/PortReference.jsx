const { useState, useEffect, useCallback, useRef, useMemo } = React;

function PortReference() {
  const [activeTab, setActiveTab] = useState('ports');
  const [search, setSearch] = useState('');
  const [filterProto, setFilterProto] = useState('All');

  // Reset search when switching tabs to ensure a clean view
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearch('');
    setFilterProto('All');
  };

  const filteredPorts = activeTab === 'ports' ? PORT_DATA.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.port.toString().includes(q) || p.service.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.proto.toLowerCase().includes(q);
    const matchesProto = filterProto === 'All' || p.proto.includes(filterProto);
    return matchesSearch && matchesProto;
  }) : [];

  const filteredProtocols = activeTab === 'protocols' ? PROTOCOL_DATA.filter(p => {
    const q = search.toLowerCase();
    return !q || p.num.toString().includes(q) || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
  }) : [];

  const categoryColor = s => {
    if (['HTTP','HTTPS','HTTP Alt','HTTPS Alt'].includes(s)) return 'var(--cyan)';
    if (['SSH','SFTP','SMTPS','IMAPS','POP3S','HTTPS','LDAPS','DNS-over-TLS'].includes(s)) return 'var(--green)';
    if (['Telnet','FTP Control','FTP Data'].includes(s)) return 'var(--red)';
    if (['MySQL','PostgreSQL','MongoDB','MSSQL','Oracle DB','Redis','Elasticsearch'].includes(s)) return 'var(--yellow)';
    if (['BGP','OSPF','RIP','LDP'].includes(s)) return 'var(--purple)';
    return 'var(--text)';
  };

  return (
    <div className="fadein">
      <style>{`
        .port-tabs { display: flex; gap: 4px; background: var(--border); padding: 4px; borderRadius: 8px; }
        .port-tab {
          flex: 1; padding: 8px; border: none; background: transparent; color: var(--muted);
          cursor: pointer; border-radius: 6px; font-size: 12px; font-weight: 600; transition: all .2s;
        }
        .port-tab.active { background: var(--card); color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      `}</style>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <div className="card-title" style={{marginBottom:0}}>{activeTab === 'ports' ? 'TCP/UDP Port Reference' : 'IP Protocol Reference (L3)'}</div>
          <div className="port-tabs" style={{width:240}}>
            <button className={`port-tab ${activeTab === 'ports' ? 'active' : ''}`} onClick={() => switchTab('ports')}>L4 Ports</button>
            <button className={`port-tab ${activeTab === 'protocols' ? 'active' : ''}`} onClick={() => switchTab('protocols')}>L3 Protocols</button>
          </div>
        </div>

        <div className="input-row">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'ports' ? "Search port, service, or description..." : "Search protocol name or number..."} />

          {activeTab === 'ports' && (
            <select className="select" value={filterProto} onChange={e => setFilterProto(e.target.value)} style={{width:'auto',flexShrink:0}}>
              {['All','TCP','UDP'].map(p => <option key={p}>{p}</option>)}
            </select>
          )}
        </div>
        <div className="hint" style={{marginTop:6}}>
          {activeTab === 'ports' ? `${filteredPorts.length} of ${PORT_DATA.length} ports shown` : `${filteredProtocols.length} of ${PROTOCOL_DATA.length} protocols shown`}
        </div>
      </div>

      <div className="card fadein" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap hide-mobile" style={{maxHeight:'calc(100vh - 280px)',overflowY:'auto'}}>
          {activeTab === 'ports' && (
            <table>
              <thead><tr><th>Port</th><th>Transport</th><th>Service</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {filteredPorts.map(p => (
                  <tr key={`${p.port}-${p.proto}`}>
                    <td style={{color:'var(--cyan)',fontWeight:600,fontFamily:'var(--mono)'}}>{p.port}</td>
                    <td><span className={`badge ${p.proto.includes('TCP')&&p.proto.includes('UDP')?'badge-purple':p.proto==='TCP'?'badge-blue':'badge-yellow'}`}>{p.proto}</span></td>
                    <td style={{color:categoryColor(p.service),fontFamily:'var(--sans)',fontWeight:500}}>{p.service}</td>
                    <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{p.desc}</td>
                    <td><CopyBtn text={String(p.port)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'protocols' && (
            <table>
              <thead><tr><th>ID #</th><th>Protocol Name</th><th>Full Name / Description</th><th>RFC</th><th></th></tr></thead>
              <tbody>
                {filteredProtocols.map(p => (
                  <tr key={p.num}>
                    <td style={{color:'var(--cyan)',fontWeight:600,fontFamily:'var(--mono)'}}>{p.num}</td>
                    <td style={{fontWeight:600,color:'var(--green)'}}>{p.name}</td>
                    <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{p.desc}</td>
                    <td style={{color:'var(--dim)',fontSize:12}}><RFCLink rfc={p.rfc} /></td>
                    <td><CopyBtn text={String(p.num)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View */}
        <div className="show-mobile mobile-cards" style={{padding:16, maxHeight:'calc(100vh - 280px)', overflowY:'auto'}}>
          {activeTab === 'ports' && filteredPorts.map(p => (
            <div key={`${p.port}-${p.proto}`} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Port</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{p.port} ({p.proto})</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Service</span>
                <span className="mobile-card-value" style={{color:categoryColor(p.service)}}>{p.service}</span>
              </div>
              <div className="mobile-card-row" style={{flexDirection:'column', alignItems:'flex-start', borderBottom:'none'}}>
                <span className="mobile-card-label" style={{marginBottom:4}}>Description</span>
                <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{p.desc}</span>
              </div>
              <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                <CopyBtn text={String(p.port)} label="Copy Port" />
              </div>
            </div>
          ))}
          {activeTab === 'protocols' && filteredProtocols.map(p => (
            <div key={p.num} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">ID #</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{p.num}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Protocol</span>
                <span className="mobile-card-value" style={{color:'var(--green)', fontWeight:600}}>{p.name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">RFC</span>
                <span className="mobile-card-value"><RFCLink rfc={p.rfc} /></span>
              </div>
              <div className="mobile-card-row" style={{flexDirection:'column', alignItems:'flex-start', borderBottom:'none'}}>
                <span className="mobile-card-label" style={{marginBottom:4}}>Description</span>
                <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{p.desc}</span>
              </div>
              <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                <CopyBtn text={String(p.num)} label="Copy ID" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeTab === 'protocols' && (
        <div className="card fadein hint" style={{marginTop:12}}>
          <strong>Note:</strong> IP Protocol numbers are used in the "Protocol" field of the IPv4 header and the "Next Header" field of IPv6. They identify which protocol (Layer 4) is encapsulated in the IP packet.
        </div>
      )}
    </div>
  );
}

// ─── Tool: BGP / ASN Lookup ───────────────────────────────────
window.PortReference = PortReference;
