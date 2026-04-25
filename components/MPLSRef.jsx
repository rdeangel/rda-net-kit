const { useState, useEffect, useCallback, useRef, useMemo } = React;

function MPLSRef() {
  const [activeLabel, setActiveLabel] = useState(null);

  const labelFields = [
    { id: 'label', name: 'Label', bits: 20, color: 'var(--cyan)',    desc: '20-bit forwarding label. Values 0–15 are reserved. Routers swap or pop this value at each LSR hop.' },
    { id: 'tc',    name: 'TC',    bits: 3,  color: 'var(--yellow)',  desc: 'Traffic Class (formerly EXP). 3 bits for QoS/CoS marking — maps to DSCP or queue priority inside the MPLS domain.' },
    { id: 's',     name: 'S',     bits: 1,  color: 'var(--green)',   desc: 'Bottom-of-Stack bit. Set to 1 on the innermost label. When S=1, the next header is the original IP packet.' },
    { id: 'ttl',   name: 'TTL',   bits: 8,  color: 'var(--red)',     desc: 'Time To Live. Decremented at each LSR, same role as IP TTL. Prevents label loops. Copied from IP TTL on ingress.' },
  ];

  const totalBits = labelFields.reduce((s, f) => s + f.bits, 0);

  return (
    <div className="fadein">

      {/* Overview */}
      <div className="card">
        <div className="card-title" style={{color:'var(--cyan)'}}>MPLS — Multi-Protocol Label Switching (<RFCLink rfc="RFC 3031" />)</div>
        <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.7, marginBottom:16}}>
          MPLS inserts a 32-bit <strong style={{color:'var(--text)'}}>label</strong> between the Layer 2 and Layer 3 headers, creating a "Layer 2.5" shim. Packets are forwarded by swapping labels at each <strong style={{color:'var(--text)'}}>LSR</strong> (Label Switching Router) rather than doing a full IP lookup — enabling fast forwarding, traffic engineering, and VPNs.
        </div>
        <div className="result-grid">
          <ResultItem label="Label Size"       value="32 bits (4 bytes)"  accent />
          <ResultItem label="Label field"      value="20 bits (1M labels)" green />
          <ResultItem label="Stack depth"      value="Unlimited (nested)"  />
          <ResultItem label="Reserved labels"  value="0 – 15"              red />
        </div>
      </div>

      {/* Label header illustration */}
      <div className="card">
        <div className="card-title">MPLS Label Header — 32 bits (4 bytes) <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>— click a field for details</span></div>

        {/* Bit ruler */}
        <div style={{display:'grid', gridTemplateColumns:`repeat(${totalBits}, 1fr)`, gap:0, fontFamily:'var(--mono)', fontSize:9, color:'var(--dim)', marginBottom:2, textAlign:'center'}}>
          {Array.from({length: totalBits}, (_, i) => (
            <div key={i} style={{borderLeft: i % 8 === 0 ? '1px solid var(--dim)' : 'none', paddingLeft:1}}>
              {i % 4 === 0 ? i : ''}
            </div>
          ))}
        </div>

        {/* Field blocks */}
        <div style={{display:'grid', gridTemplateColumns:`repeat(${totalBits}, 1fr)`, gap:0, background:'var(--border)', padding:1, borderRadius:6}}>
          {labelFields.map(f => (
            <div
              key={f.id}
              onClick={() => setActiveLabel(activeLabel === f.id ? null : f.id)}
              style={{
                gridColumn: `span ${f.bits}`,
                background: activeLabel === f.id ? f.color : 'var(--panel)',
                border: `2px solid ${f.color}`,
                borderRadius:4, padding:'10px 4px', textAlign:'center', cursor:'pointer',
                transition:'all 0.15s',
                boxShadow: activeLabel === f.id ? `0 0 12px ${f.color}66` : 'none',
              }}
            >
              <div style={{fontSize:12, fontWeight:700, color: activeLabel === f.id ? '#000' : f.color, fontFamily:'var(--mono)'}}>{f.name}</div>
              <div style={{fontSize:9, color: activeLabel === f.id ? '#000' : 'var(--muted)'}}>{f.bits}b</div>
            </div>
          ))}
        </div>

        {/* Field detail panel */}
        {activeLabel && (() => {
          const f = labelFields.find(x => x.id === activeLabel);
          return (
            <div style={{marginTop:12, padding:'10px 14px', background:'var(--panel)', border:`1px solid ${f.color}`, borderRadius:6, fontSize:13, color:'var(--muted)', lineHeight:1.6}}>
              <span style={{color: f.color, fontWeight:700, marginRight:8}}>{f.name} ({f.bits} bits)</span>
              {f.desc}
            </div>
          );
        })()}

        {/* Legend */}
        <div style={{display:'flex', gap:20, marginTop:14, flexWrap:'wrap'}}>
          {labelFields.map(f => (
            <div key={f.id} style={{display:'flex', alignItems:'center', gap:6, fontSize:12}}>
              <div style={{width:12, height:12, borderRadius:3, background:f.color}}></div>
              <span style={{color:'var(--muted)'}}>{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Packet stack */}
      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title">MPLS Encapsulation Stack</div>
          <div style={{display:'flex', flexDirection:'column', gap:2}}>
            {[
              { label:'Ethernet Header',       bytes:'14 B', color:'var(--layer-2)',  note:'EtherType 0x8847 (unicast) / 0x8848 (multicast)' },
              { label:'MPLS Label #1 (outer)', bytes:'4 B',  color:'var(--cyan)',     note:'Pushed by ingress LER — transport label', highlight: true },
              { label:'MPLS Label #2 (inner)', bytes:'4 B',  color:'var(--yellow)',   note:'VPN label (L3VPN / 6PE). S=1 on this label', highlight: true },
              { label:'IP Header',             bytes:'20 B', color:'var(--layer-3)',  note:'Original customer packet — unchanged in core' },
              { label:'TCP / UDP',             bytes:'≥8 B', color:'var(--layer-4)',  note:'Transport layer, untouched by MPLS' },
              { label:'Payload',               bytes:'— ',   color:'var(--dim)',      note:'Application data', dashed: true },
            ].map((row, i) => (
              <div key={i} style={{
                background: row.highlight ? 'rgba(0,212,200,0.06)' : 'var(--panel)',
                border: `1px solid ${row.highlight ? row.color : 'var(--border)'}`,
                borderRadius:4, padding:'7px 12px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                borderStyle: row.dashed ? 'dashed' : 'solid',
                gap: 12
              }}>
                <div style={{minWidth:0, flex:1}}>
                  <div style={{fontSize:12, fontWeight: row.highlight ? 700 : 400, color: row.highlight ? row.color : 'var(--text)'}}>{row.label}</div>
                  <div style={{fontSize:10, color:'var(--dim)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{row.note}</div>
                </div>
                <div style={{fontSize:12, color:'var(--dim)', fontFamily:'var(--mono)', whiteSpace:'nowrap', flexShrink:0}}>{row.bytes}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Label Operations</div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {[
              { op:'PUSH',  color:'var(--green)',  role:'Ingress LER', desc:'Adds one or more labels to an unlabelled IP packet entering the MPLS domain.' },
              { op:'SWAP',  color:'var(--cyan)',   role:'Transit LSR', desc:'Replaces the top label with a new outgoing label and forwards the packet.' },
              { op:'POP',   color:'var(--yellow)', role:'Egress LER',  desc:'Removes the top label. PHP (Penultimate Hop Popping) pops one hop before egress.' },
              { op:'PHP',   color:'var(--yellow)', role:'Penultimate', desc:'Last LSR before egress pops the transport label, reducing egress LER work. Implicit-null label (3) signals PHP.' },
            ].map(item => (
              <div key={item.op} style={{display:'flex', gap:10, alignItems:'flex-start', padding:'8px 10px', background:'var(--panel)', borderRadius:6, border:'1px solid var(--border)'}}>
                <div style={{minWidth:46, textAlign:'center', fontFamily:'var(--mono)', fontWeight:900, fontSize:13, color:item.color, padding:'2px 0', borderRadius:4, border:`1px solid ${item.color}`, background:`${item.color}18`}}>{item.op}</div>
                <div>
                  <div style={{fontSize:11, color:'var(--muted)', marginBottom:2}}>{item.role}</div>
                  <div style={{fontSize:12, color:'var(--text)', lineHeight:1.5}}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reserved labels + key protocols */}
      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title">Reserved Label Values (0–15)</div>
          <div style={{display:'flex', flexDirection:'column', gap:4}}>
            {[
              { val:'0',  name:'IPv4 Explicit Null',   desc:'Pop label, look at IPv4 header for forwarding.' },
              { val:'1',  name:'Router Alert',          desc:'Deliver to control plane of each LSR.' },
              { val:'2',  name:'IPv6 Explicit Null',    desc:'Pop label, look at IPv6 header for forwarding.' },
              { val:'3',  name:'Implicit Null (PHP)',   desc:'Signals penultimate hop to pop the label.' },
              { val:'13', name:'GAL (Generic Alert)',   desc:'OAM alert — next header is a G-ACh channel.' },
              { val:'14', name:'OAM Alert Label',       desc:'Used for MPLS OAM packets (deprecated by GAL).' },
            ].map(r => (
              <div key={r.val} style={{display:'flex', gap:10, alignItems:'baseline', fontSize:12}}>
                <div style={{minWidth:24, fontFamily:'var(--mono)', fontWeight:700, color:'var(--cyan)', textAlign:'right'}}>{r.val}</div>
                <div style={{color:'var(--text)', fontWeight:600}}>{r.name}</div>
                <div style={{color:'var(--dim)', fontSize:11}}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Label Distribution Protocols</div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {[
              { name:'LDP',      rfc:'RFC 5036', color:'var(--cyan)',   desc:'Label Distribution Protocol. Hop-by-hop label distribution for IGP-based paths. Most common for basic MPLS.' },
              { name:'RSVP-TE',  rfc:'RFC 3209', color:'var(--yellow)', desc:'Resource Reservation Protocol with Traffic Engineering extensions. Establishes explicit label-switched paths (LSPs) with bandwidth guarantees.' },
              { name:'BGP-LU',   rfc:'RFC 3107', color:'var(--green)',  desc:'BGP Labeled Unicast. Distributes labels with BGP prefixes — used in inter-AS MPLS VPNs and segment routing.' },
              { name:'SR-MPLS',  rfc:'RFC 8660', color:'var(--magenta)',desc:'Segment Routing over MPLS. Labels encode routing instructions (node/adjacency SIDs). No per-flow state in core.' },
            ].map(p => (
              <div key={p.name} style={{padding:'8px 10px', background:'var(--panel)', borderRadius:6, border:`1px solid var(--border)`, borderLeft:`3px solid ${p.color}`}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                  <span style={{fontWeight:700, color:p.color, fontSize:13}}>{p.name}</span>
                  <span style={{fontSize:10, color:'var(--dim)', fontFamily:'var(--mono)'}}>{p.rfc}</span>
                </div>
                <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.5}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

window.MPLSRef = MPLSRef;
