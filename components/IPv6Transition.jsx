const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPv6Transition() {
  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Transition Technologies Cheat Sheet</div>
        <div className="result-grid grid-mobile-1" style={{gap:16}}>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--cyan)'}}>
            <strong style={{color:'var(--cyan)', fontSize:14}}>Dual-Stack</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Nodes run IPv4 and IPv6 simultaneously. Most common and preferred method. Requires global addresses for both protocol stacks.</p>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--green)'}}>
            <strong style={{color:'var(--green)', fontSize:14}}>NAT64 / DNS64</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Allows IPv6-only clients to talk to IPv4-only servers via translation. DNS64 synthesizes AAAA records from A records using a prefix.</p>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--yellow)'}}>
            <strong style={{color:'var(--yellow)', fontSize:14}}>464XLAT</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Combines client-side (CLAT) and provider-side (PLAT) translation. Common in mobile networks to support legacy IPv4-only applications.</p>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--blue)'}}>
            <strong style={{color:'var(--blue)', fontSize:14}}>DS-Lite</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Dual-Stack Lite. Tunnels IPv4 over IPv6-only core (<RFCLink rfc="RFC 6333" />). Moves NAT from the customer device to the carrier (AFTR).</p>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--red)'}}>
            <strong style={{color:'var(--red)', fontSize:14}}>MAP-E / MAP-T</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Mapping of Address and Port. Stateless transition mechanism that distributes IPv4 port ranges across IPv6 users at scale.</p>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, borderLeft:'4px solid var(--purple)'}}>
            <strong style={{color:'var(--purple)', fontSize:14}}>6in4 / GRE</strong>
            <p style={{fontSize:11, color:'var(--muted)', marginTop:6, lineHeight:1.4}}>Static tunneling of IPv6 packets inside IPv4 headers (Proto 41). Often used for connecting home labs to tunnel brokers.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Transition Mechanics Comparison</div>
        <div className="table-wrap hide-mobile">
          <table>
            <thead>
              <tr>
                <th>Mechanism</th>
                <th>Type</th>
                <th>State</th>
                <th>Key Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-cyan">Dual-Stack</span></td>
                <td>Native</td>
                <td>N/A</td>
                <td>Preferred standard for all modern networks</td>
              </tr>
              <tr>
                <td><span className="badge badge-green">NAT64/DNS64</span></td>
                <td>Translation</td>
                <td>Stateful</td>
                <td>IPv6-only data centers and public WiFi</td>
              </tr>
              <tr>
                <td><span className="badge badge-yellow">464XLAT</span></td>
                <td>Translation</td>
                <td>Stateful</td>
                <td>Mobile (Android/iOS) on IPv6-only carriers</td>
              </tr>
              <tr>
                <td><span className="badge badge-blue">DS-Lite</span></td>
                <td>Tunneling</td>
                <td>Stateful</td>
                <td>Cable/FTTH ISPs with IPv6 core backbones</td>
              </tr>
              <tr>
                <td><span className="badge badge-red">MAP-E/T</span></td>
                <td>Encaps/Trans</td>
                <td>Stateless</td>
                <td>High-scale ISP infrastructure (Japan, Europe)</td>
              </tr>
              <tr>
                <td><span className="badge badge-purple">6in4</span></td>
                <td>Tunneling</td>
                <td>Static</td>
                <td>Legacy sites needing IPv6 over IPv4-only WAN</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="show-mobile mobile-cards">
          {[
            {m:'Dual-Stack', t:'Native', s:'N/A', c:'badge-cyan'},
            {m:'NAT64/DNS64', t:'Translation', s:'Stateful', c:'badge-green'},
            {m:'464XLAT', t:'Translation', s:'Stateful', c:'badge-yellow'},
            {m:'DS-Lite', t:'Tunneling', s:'Stateful', c:'badge-blue'},
            {m:'MAP-E/T', t:'Trans', s:'Stateless', c:'badge-red'},
            {m:'6in4', t:'Tunneling', s:'Static', c:'badge-purple'}
          ].map(v => (
            <div key={v.m} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">Mechanism</span>
                <span className={`badge ${v.c}`}>{v.m}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Type / State</span>
                <span className="mobile-card-value">{v.t} / {v.s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title">Flow Visualization: NAT64</div>
          <div style={{fontFamily:'var(--mono)', fontSize:11, padding:15, background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8, color:'var(--dim)'}}>
            <div style={{color:'var(--text)'}}>[ IPv6 Client ] ----&gt; [ NAT64 GW ] ----&gt; [ IPv4 Server ]</div>
            <div style={{marginTop:10}}>
              <span style={{color:'var(--cyan)'}}>SRC: 2001:db8::1</span><br/>
              <span style={{color:'var(--green)'}}>DST: 64:ff9b::1.1.1.1</span> (Synthesized)
            </div>
            <div style={{margin:'10px 0', borderLeft:'2px dashed var(--dim)', marginLeft:60, paddingLeft:10}}>
               Stateful Translation
            </div>
            <div>
              <span style={{color:'var(--yellow)'}}>SRC: 203.0.113.5</span> (Pool IPv4)<br/>
              <span style={{color:'var(--text)'}}>DST: 1.1.1.1</span> (Actual IPv4)
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Flow Visualization: DS-Lite</div>
          <div style={{fontFamily:'var(--mono)', fontSize:11, padding:15, background:'var(--panel)', border:'1px solid var(--border)', borderRadius:8, color:'var(--dim)'}}>
            <div style={{color:'var(--text)'}}>[ CPE (B4) ] ===== IPv6 Tunnel ===== [ Carrier (AFTR) ]</div>
            <div style={{marginTop:10}}>
              <span style={{color:'var(--yellow)'}}>Inner v4: 192.168.1.10 -&gt; 8.8.8.8</span><br/>
              <span style={{color:'var(--blue)'}}>Outer v6: 2001:db8::B4 -&gt; 2001:db8::AFTR</span>
            </div>
            <div style={{margin:'10px 0', borderLeft:'2px dashed var(--dim)', marginLeft:60, paddingLeft:10}}>
               Decapsulate & NAT at Core
            </div>
            <div>
              <span style={{color:'var(--cyan)'}}>Public: 198.51.100.1 -&gt; 8.8.8.8</span><br/>
              <span style={{color:'var(--dim)'}}>(Shared ISP Public IP Pool)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Terminology Reference</div>
        <div className="result-grid grid-mobile-1" style={{gap:20}}>
          <div>
            <div style={{fontSize:12, fontWeight:600, color:'var(--cyan)', marginBottom:4}}>B4 (Basic Bridging BroadBand)</div>
            <p style={{fontSize:11, color:'var(--muted)'}}>The customer-side device (CPE) that encapsulates IPv4 traffic inside an IPv6 tunnel for transmission to the ISP.</p>
          </div>
          <div>
            <div style={{fontSize:12, fontWeight:600, color:'var(--green)', marginBottom:4}}>AFTR (Address Family Transition Router)</div>
            <p style={{fontSize:11, color:'var(--muted)'}}>The ISP device that terminates IPv6 tunnels, decapsulates traffic, and performs NAT to the public IPv4 internet.</p>
          </div>
          <div>
            <div style={{fontSize:12, fontWeight:600, color:'var(--yellow)', marginBottom:4}}>CLAT / PLAT</div>
            <p style={{fontSize:11, color:'var(--muted)'}}>Customer-side (CLAT) and Provider-side (PLAT) translators used in 464XLAT to provide IPv4 connectivity.</p>
          </div>
          <div>
            <div style={{fontSize:12, fontWeight:600, color:'var(--purple)', marginBottom:4}}><RFCLink rfc="RFC 6052" /> Prefix</div>
            <p style={{fontSize:11, color:'var(--muted)'}}>The Well-Known Prefix (64:ff9b::/96) used for synthesized IPv4-embedded IPv6 addresses in NAT64.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BGP Looking Glass ──────────────────────────────────────────
window.IPv6Transition = IPv6Transition;
