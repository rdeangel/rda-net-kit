const { useState, useEffect, useCallback, useRef, useMemo } = React;

function MTUCalc() {
  const [baseMtu, setBaseMtu] = useState('1500');
  const [encaps, setEncaps] = useState({
    dot1q:false, qinq:false, pppoe:false,
    mpls1:false, mpls2:false, mpls3:false,
    gre:false, gre6:false,
    ipsec_ah:false, ipsec_esp:false,
    vxlan:false, geneve:false,
  });

  const ENCAP_DEFS = [
    {key:'dot1q',    label:'802.1Q VLAN Tag',        bytes:4,  std:'IEEE 802.1Q',  note:'4-byte VLAN tag added to Ethernet frame'},
    {key:'qinq',     label:'QinQ / 802.1ad (outer)', bytes:4,  std:'IEEE 802.1ad', note:'Second VLAN tag for provider bridging (S-VLAN)'},
    {key:'pppoe',    label:'PPPoE Header',            bytes:8,  std:'RFC 2516',     note:'6-byte PPPoE + 2-byte PPP protocol field'},
    {key:'mpls1',    label:'MPLS Label (1st)',         bytes:4,  std:'RFC 3032',     note:'Label 20b, TC 3b, S-bit 1b, TTL 8b = 4 bytes'},
    {key:'mpls2',    label:'MPLS Label (2nd)',         bytes:4,  std:'RFC 3032',     note:'Additional label — each entry adds 4 bytes'},
    {key:'mpls3',    label:'MPLS Label (3rd)',         bytes:4,  std:'RFC 3032',     note:'Third label (e.g. VPN + TE + implicit-null)'},
    {key:'gre',      label:'GRE Tunnel (IPv4 outer)',  bytes:24, std:'RFC 2784',     note:'20B outer IPv4 + 4B GRE header (no options/key)'},
    {key:'gre6',     label:'GRE Tunnel (IPv6 outer)',  bytes:44, std:'RFC 7676',     note:'40B outer IPv6 + 4B GRE header'},
    {key:'ipsec_ah', label:'IPsec AH (Transport)',     bytes:28, std:'RFC 4302',     note:'Next-hdr(1)+len(1)+res(2)+SPI(4)+seq(4)+ICV(16)'},
    {key:'ipsec_esp',label:'IPsec ESP + Trailer',      bytes:57, std:'RFC 4303',     note:'SPI(4)+Seq(4)+IV(16)+trailer(2)+ICV(16)+pad≈15'},
    {key:'vxlan',    label:'VXLAN',                    bytes:50, std:'RFC 7348',     note:'Outer Eth(14)+IP(20)+UDP(8)+VXLAN hdr(8)'},
    {key:'geneve',   label:'GENEVE',                   bytes:50, std:'RFC 8926',     note:'Outer Eth(14)+IP(20)+UDP(8)+GENEVE hdr(8 min)'},
  ];

  const toggle = k => setEncaps(p=>({...p,[k]:!p[k]}));
  const base    = parseInt(baseMtu)||1500;
  const active  = ENCAP_DEFS.filter(e=>encaps[e.key]);
  const overhead= active.reduce((s,e)=>s+e.bytes,0);
  const payload = base - overhead;
  const tcpMss  = Math.max(0, payload - 40);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Base MTU</div>
        <div className="field">
          <label className="label">Starting MTU (bytes)</label>
          <div className="input-row">
            <input className="input" value={baseMtu} onChange={e=>setBaseMtu(e.target.value)} placeholder="1500" style={{maxWidth:120}}/>
            <select className="input" style={{width:240}} value={baseMtu} onChange={e=>setBaseMtu(e.target.value)}>
              <option value="1500">1500 — Ethernet Standard</option>
              <option value="9000">9000 — Jumbo Frame</option>
              <option value="4470">4470 — FDDI / ATM</option>
              <option value="1492">1492 — PPPoE over Ethernet</option>
              <option value="576">576 — IPv4 Minimum (RFC 791)</option>
              <option value="1280">1280 — IPv6 Minimum (RFC 8200)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Encapsulation Layers</div>
        <div className="hint" style={{marginBottom:12}}>Click to toggle encapsulation headers. Overhead is cumulative — order matters in practice but bytes are additive here.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:8}}>
          {ENCAP_DEFS.map(e=>(
            <div key={e.key} onClick={()=>toggle(e.key)} style={{
              padding:'10px 14px',borderRadius:'var(--radius)',cursor:'pointer',
              border:`1px solid ${encaps[e.key]?'var(--cyan)':'var(--border)'}`,
              background:encaps[e.key]?'rgba(0,212,200,.08)':'var(--card)',
              transition:'border-color .15s,background .15s',userSelect:'none',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={{fontWeight:600,fontSize:13,color:encaps[e.key]?'var(--cyan)':'var(--text)'}}>{e.label}</span>
                <span className={`badge ${encaps[e.key]?'badge-red':'badge-blue'}`}>+{e.bytes}B</span>
              </div>
              <div style={{fontSize:11,color:'var(--muted)'}}>{e.std} — {e.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card fadein">
        <div className="card-title">MTU Budget</div>
        <div className="result-grid grid-mobile-1">
          <ResultItem label="Base MTU"            value={`${base} B`}/>
          <ResultItem label="Total Overhead"      value={`${overhead} B`} red={overhead>0}/>
          <ResultItem label="Available Payload"   value={`${payload} B`} accent/>
          <ResultItem label="Recommended TCP MSS" value={`${tcpMss} B`} green={tcpMss>0}/>
        </div>

        {active.length>0 && (
          <div style={{marginTop:16}}>
            <div className="label" style={{marginBottom:8}}>Overhead Breakdown</div>
            <div className="table-wrap hide-mobile"><table>
              <thead><tr><th>Layer</th><th>Standard</th><th>Overhead</th><th>Running MTU</th></tr></thead>
              <tbody>
                <tr><td>Base</td><td>—</td><td>—</td><td style={{fontFamily:'var(--mono)',color:'var(--cyan)'}}>{base} B</td></tr>
                {active.map((e,i)=>{
                  const run=base-active.slice(0,i+1).reduce((s,x)=>s+x.bytes,0);
                  return (
                    <tr key={e.key}>
                      <td>{e.label}</td>
                      <td><span className="badge badge-blue">{e.std}</span></td>
                      <td style={{fontFamily:'var(--mono)',color:'var(--red)'}}>−{e.bytes} B</td>
                      <td style={{fontFamily:'var(--mono)',color:run<576?'var(--red)':run<1280?'var(--yellow)':'var(--cyan)'}}>{run} B</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
            {/* Mobile View */}
            <div className="show-mobile mobile-cards">
              <div className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Base</span>
                  <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{base} B</span>
                </div>
              </div>
              {active.map((e,i) => {
                const run=base-active.slice(0,i+1).reduce((s,x)=>s+x.bytes,0);
                return (
                  <div key={e.key} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{e.label}</span>
                      <span className="mobile-card-value" style={{color:'var(--red)'}}>-{e.bytes} B</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Running MTU</span>
                      <span className="mobile-card-value" style={{color:run<576?'var(--red)':run<1280?'var(--yellow)':'var(--cyan)', fontWeight:600}}>{run} B</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{marginTop:16}}>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:6}}>MTU UTILIZATION</div>
          <div style={{height:12,background:'var(--border)',borderRadius:'var(--radius)',overflow:'hidden',display:'flex'}}>
            <div style={{width:`${base>0?Math.min(100,(overhead/base)*100):0}%`,background:'var(--red)',transition:'width .3s'}}/>
            <div style={{width:`${base>0?Math.min(100,(Math.max(0,payload)/base)*100):0}%`,background:'var(--green)',transition:'width .3s'}}/>
          </div>
          <div style={{display:'flex',gap:20,marginTop:6,fontSize:12}}>
            <span style={{color:'var(--red)'}}>Overhead: {overhead}B ({base>0?((overhead/base)*100).toFixed(1):0}%)</span>
            <span style={{color:'var(--green)'}}>Payload: {Math.max(0,payload)}B ({base>0?((Math.max(0,payload)/base)*100).toFixed(1):0}%)</span>
          </div>
          {payload<576 && <div style={{marginTop:8,padding:'8px 12px',background:'rgba(239,68,68,.1)',border:'1px solid var(--red)',borderRadius:'var(--radius)',color:'var(--red)',fontSize:12}}>⚠ Payload MTU {payload}B is below the IPv4 minimum (576B). Fragmentation or drops will occur.</div>}
          {payload>=576 && payload<1280 && <div style={{marginTop:8,padding:'8px 12px',background:'rgba(245,158,11,.1)',border:'1px solid var(--yellow)',borderRadius:'var(--radius)',color:'var(--yellow)',fontSize:12}}>⚠ Payload MTU {payload}B is below the IPv6 minimum (1280B). IPv6 traffic will be dropped.</div>}
          {payload>=1280 && overhead>0 && (
            <div style={{marginTop:8,padding:'10px 14px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',fontFamily:'var(--mono)',fontSize:12}}>
              <div style={{color:'var(--muted)',marginBottom:4}}># Cisco IOS — apply on tunnel/WAN interface</div>
              <div style={{color:'var(--cyan)'}}>ip mtu {payload}</div>
              <div style={{color:'var(--cyan)'}}>ip tcp adjust-mss {tcpMss}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tool: DHCP Scope Planner ─────────────────────────────────
window.MTUCalc = MTUCalc;
