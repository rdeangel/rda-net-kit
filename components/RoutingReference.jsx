const { useState, useEffect, useCallback, useRef, useMemo } = React;

function RoutingReference() {
  const [search, setSearch] = useState('');
  const adData = AD_DATA;
  const filtered = adData.filter(r => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.ad.toString().includes(q);
  });

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">IP Protocol Reference & Administrative Distance</div>
        <div className="input-row">
          <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search protocol or AD value..." />
        </div>
        <div className="table-wrap hide-mobile" style={{marginTop:16}}>
          <table>
            <thead><tr><th>AD Value</th><th>Protocol</th><th>Type</th><th>Typical Use Case</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.ad}>
                  <td style={{color:'var(--cyan)',fontWeight:700,fontFamily:'var(--mono)'}}>{r.ad}</td>
                  <td style={{fontWeight:600}}>{r.name}</td>
                  <td><span className={`badge ${r.type==='IGP'?'badge-blue':r.type==='EGP'?'badge-purple':'badge-yellow'}`}>{r.type}</span></td>
                  <td style={{color:'var(--muted)',fontSize:12}}>{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="show-mobile mobile-cards" style={{marginTop:16}}>
          {filtered.map(r => (
            <div key={r.ad} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">AD: {r.ad}</span>
                <span className="mobile-card-value" style={{fontWeight:600, color:'var(--cyan)'}}>{r.name}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Type</span>
                <span className={`badge ${r.type==='IGP'?'badge-blue':r.type==='EGP'?'badge-purple':'badge-yellow'}`} style={{fontSize:10}}>{r.type}</span>
              </div>
              <div className="mobile-card-row" style={{borderBottom:'none'}}>
                <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{r.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hint" style={{marginTop:8}}>* AD determines route trustworthiness. Lower value wins when multiple protocols offer a route to the same destination.</div>
      </div>

      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title" style={{color:'var(--green)'}}>OSPF Deep Dive (Link-State)</div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
            <strong style={{color:'var(--text)'}}>LSA Types:</strong>
            <ul style={{marginTop:4,paddingLeft:16}}>
              <li><strong style={{color:'var(--cyan)'}}>Type 1:</strong> Router (Local Area)</li>
              <li><strong style={{color:'var(--cyan)'}}>Type 2:</strong> Network (DR-gen)</li>
              <li><strong style={{color:'var(--cyan)'}}>Type 3:</strong> Summary (From ABR)</li>
              <li><strong style={{color:'var(--cyan)'}}>Type 4:</strong> ASBR Summary (For Type 5)</li>
              <li><strong style={{color:'var(--cyan)'}}>Type 5:</strong> AS-External (Redist)</li>
              <li><strong style={{color:'var(--yellow)'}}>Type 7:</strong> NSSA External</li>
              <li><strong style={{color:'var(--muted)'}}>Type 8:</strong> Link-Local (OSPFv3)</li>
              <li><strong style={{color:'var(--muted)'}}>Type 9:</strong> Intra-Area-Prefix (OSPFv3)</li>
            </ul>
            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>Area Types:</strong>
            <ul style={{marginTop:4,paddingLeft:16}}>
              <li><strong style={{color:'var(--text)'}}>Backbone (0):</strong> Core. Connects all areas.</li>
              <li><strong style={{color:'var(--text)'}}>Stub:</strong> No Type 5. Uses default route.</li>
              <li><strong style={{color:'var(--text)'}}>Totally Stubby:</strong> No Type 3/4/5.</li>
              <li><strong style={{color:'var(--text)'}}>NSSA:</strong> Allows Type 7 (redist inside stub).</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{color:'var(--purple)'}}>BGP Deep Dive (Path Vector)</div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
            <strong style={{color:'var(--text)'}}>BGP Best Path Order:</strong>
            <ol style={{marginTop:4,paddingLeft:16}}>
              <li>Weight (Highest) — Cisco only</li>
              <li>Local Preference (Highest)</li>
              <li>Originate (Locally injected)</li>
              <li>AS Path (Shortest)</li>
              <li>Origin (IGP &lt; EGP &lt; Incomplete)</li>
              <li>MED (Lowest)</li>
              <li>eBGP over iBGP</li>
            </ol>
            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>Neighbor States:</strong>
            <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:4}}>
              <span className="badge badge-blue">Idle</span>
              <span className="badge badge-blue">Connect</span>
              <span className="badge badge-blue">Active</span>
              <span className="badge badge-blue">OpenSent</span>
              <span className="badge badge-blue">OpenConfirm</span>
              <span className="badge badge-green">Established</span>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title" style={{color:'var(--cyan)'}}>EIGRP (Advanced Dist. Vector)</div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
            <strong style={{color:'var(--text)'}}>Metric (Classic):</strong>
            <div style={{background:'var(--panel)',padding:8,borderRadius:4,fontFamily:'var(--mono)',color:'var(--cyan)',marginTop:4}}>
              256 * ((10⁷ / Bandwidth) + Delay)
            </div>
            <div style={{marginTop:4,fontSize:10}}>* Uses K-values (Default: K1=1, K3=1, others 0)</div>

            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>Packet Types:</strong>
            <ul style={{marginTop:4,paddingLeft:16}}>
              <li><strong style={{color:'var(--text)'}}>Hello:</strong> Form neighbors (multicast).</li>
              <li><strong style={{color:'var(--text)'}}>Update:</strong> Send routing info.</li>
              <li><strong style={{color:'var(--text)'}}>Query:</strong> Ask for alternate path.</li>
              <li><strong style={{color:'var(--text)'}}>Reply:</strong> Respond to Query.</li>
              <li><strong style={{color:'var(--text)'}}>ACK:</strong> Confirm receipt (unicast).</li>
            </ul>
            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>Key Concepts:</strong>
            <div style={{marginTop:4}}>Successor (Primary), Feasible Successor (Backup), Feasibility Condition.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{color:'var(--yellow)'}}>IS-IS (Link-State)</div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
            <strong style={{color:'var(--text)'}}>Hierarchy:</strong>
            <ul style={{marginTop:4,paddingLeft:16}}>
              <li><strong style={{color:'var(--text)'}}>Level 1 (L1):</strong> Within an area (similar to OSPF area).</li>
              <li><strong style={{color:'var(--text)'}}>Level 2 (L2):</strong> Between areas (the backbone).</li>
              <li><strong style={{color:'var(--text)'}}>L1/L2:</strong> Router that connects L1 and L2.</li>
            </ul>
            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>Addressing (NSAP):</strong>
            <div style={{background:'var(--panel)',padding:8,borderRadius:4,fontFamily:'var(--mono)',fontSize:11,marginTop:4}}>
              49.0001.<span style={{color:'var(--cyan)'}}>0000.0000.0001</span>.00
            </div>
            <div style={{marginTop:4,fontSize:10}}>ID: Area (49.0001) + System ID + SEL (00)</div>

            <strong style={{color:'var(--text)',marginTop:8,display:'block'}}>PDUs:</strong>
            <div style={{marginTop:4}}>IIH (Hello), LSP (Link-State PDU), CSNP (Full DB Sync), PSNP (Partial DB Sync).</div>
          </div>
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">Default Protocol Timers & Keepalives</div>
        <div className="table-wrap hide-mobile">
          <table>
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Hello / Keepalive</th>
                <th>Hold / Dead Time</th>
                <th>Update / Other</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{fontWeight:600,color:'var(--green)'}}>OSPF</td>
                <td>10s <span style={{fontSize:10,color:'var(--dim)'}}>(Bcast/P2P)</span> / 30s <span style={{fontSize:10,color:'var(--dim)'}}>(NBMA)</span></td>
                <td>40s <span style={{fontSize:10,color:'var(--dim)'}}>(Bcast/P2P)</span> / 120s <span style={{fontSize:10,color:'var(--dim)'}}>(NBMA)</span></td>
                <td>Wait: 40s / Rx: 5s</td>
              </tr>
              <tr>
                <td style={{fontWeight:600,color:'var(--cyan)'}}>EIGRP</td>
                <td>5s <span style={{fontSize:10,color:'var(--dim)'}}>(LAN/P2P)</span> / 60s <span style={{fontSize:10,color:'var(--dim)'}}>(Low Speed)</span></td>
                <td>15s <span style={{fontSize:10,color:'var(--dim)'}}>(LAN/P2P)</span> / 180s <span style={{fontSize:10,color:'var(--dim)'}}>(Low Speed)</span></td>
                <td>—</td>
              </tr>
              <tr>
                <td style={{fontWeight:600,color:'var(--purple)'}}>BGP</td>
                <td>60s</td>
                <td>180s</td>
                <td>Retry: 5s</td>
              </tr>
              <tr>
                <td style={{fontWeight:600,color:'var(--yellow)'}}>IS-IS</td>
                <td>10s <span style={{fontSize:10,color:'var(--dim)'}}>(L1/L2)</span> / 3.3s <span style={{fontSize:10,color:'var(--dim)'}}>(DIS)</span></td>
                <td>30s <span style={{fontSize:10,color:'var(--dim)'}}>(L1/L2)</span> / 10s <span style={{fontSize:10,color:'var(--dim)'}}>(DIS)</span></td>
                <td>—</td>
              </tr>
              <tr>
                <td style={{fontWeight:600}}>RIP</td>
                <td>—</td>
                <td>180s <span style={{fontSize:10,color:'var(--dim)'}}>(Invalid)</span></td>
                <td>Update: 30s / Flush: 240s</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {[
            {p:'OSPF', h:'10s / 30s', d:'40s / 120s', o:'Wait 40s', c:'var(--green)'},
            {p:'EIGRP', h:'5s / 60s', d:'15s / 180s', o:'-', c:'var(--cyan)'},
            {p:'BGP', h:'60s', d:'180s', o:'Retry 5s', c:'var(--purple)'},
            {p:'IS-IS', h:'10s / 3s', d:'30s / 10s', o:'-', c:'var(--yellow)'},
            {p:'RIP', h:'-', d:'180s', o:'Update 30s', c:'var(--text)'},
          ].map(t => (
            <div key={t.p} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Protocol</span>
                <span className="mobile-card-value" style={{fontWeight:600, color:t.c}}>{t.p}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Hello / Dead</span>
                <span className="mobile-card-value">{t.h} / {t.d}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Other</span>
                <span className="mobile-card-value">{t.o}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hint" style={{marginTop:8}}>* Timers are defaults for Cisco IOS. Dead time is typically 3x or 4x the Hello interval.</div>
      </div>
    </div>
  );
}

// ─── Tool: Switching & Infrastructure Reference ───────────
// ─── VPN / IPsec Architect ──────────────────────────────────────
window.RoutingReference = RoutingReference;
