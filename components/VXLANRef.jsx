const { useState, useEffect, useCallback, useRef, useMemo } = React;

function VXLANRef() {
  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title" style={{color:'var(--cyan)'}}>VXLAN (Virtual Extensible LAN) — <RFCLink rfc="RFC 7348" /></div>
        <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:16}}>
          VXLAN is a MAC-in-UDP encapsulation protocol that allows Layer 2 segments to be extended over a Layer 3 network. It solves the 4096 VLAN limit and allows for massive scalability in multi-tenant data centers.
        </div>
        <div className="result-grid">
          <ResultItem label="Standard Port" value="UDP 4789" accent />
          <ResultItem label="Legacy Port" value="UDP 8472" />
          <ResultItem label="Address Space" value="24-bit VNI (16.7M)" green />
          <ResultItem label="Total Overhead" value="50 Bytes" red />
        </div>
      </div>

      <div className="card">
        <div className="card-title">VXLAN Header Illustration (8 Bytes)</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap:2, background:'var(--border)', padding:2, borderRadius:4, fontFamily:'var(--mono)', fontSize:11, textAlign:'center'}}>
          {/* Row 1: Bits 0-31 */}
          <div style={{gridColumn:'span 1', background:'var(--panel)', padding:8, color:'var(--cyan)'}} title="Flags (Bit 3 = I bit)">Flags</div>
          <div style={{gridColumn:'span 3', background:'var(--panel)', padding:8, color:'var(--dim)'}}>Reserved (24 bits)</div>
          <div style={{gridColumn:'span 3', background:'var(--panel)', padding:8, color:'var(--yellow)'}} title="VXLAN Network Identifier">VNI (24 bits)</div>
          <div style={{gridColumn:'span 1', background:'var(--panel)', padding:8, color:'var(--dim)'}}>Reserved</div>
        </div>
        <div style={{marginTop:12, fontSize:12, color:'var(--muted)', display:'flex', gap:20}}>
          <div><span style={{color:'var(--cyan)', fontWeight:600}}>I-Flag:</span> Must be set to 1 for a valid VNI.</div>
          <div><span style={{color:'var(--yellow)', fontWeight:600}}>VNI:</span> Identifies the L2 segment globally.</div>
        </div>
      </div>

      <div className="two-col grid-mobile-1">
        <div className="card">
          <div className="card-title">MTU & Fragmentation Requirements</div>
          <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
            Because VXLAN adds <strong style={{color:'var(--text)'}}>50 bytes</strong> of overhead to the original Ethernet frame, the physical "underlay" network must support larger packets.
            <br/><br/>
            <ul style={{paddingLeft:16}}>
              <li><strong style={{color:'var(--text)'}}>Standard Ethernet:</strong> 1500 bytes</li>
              <li><strong style={{color:'var(--cyan)'}}>Minimum Underlay MTU:</strong> 1550 bytes</li>
              <li><strong style={{color:'var(--green)'}}>Best Practice:</strong> 1600 or 9216 (Jumbo)</li>
            </ul>
            <br/>
            <div style={{padding:10, background:'rgba(239, 68, 68, 0.05)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:6}}>
              <strong style={{color:'var(--red)'}}>Warning:</strong> If the underlay MTU is not increased, the outer IP packet will be <strong style={{color:'var(--text)'}}>fragmented</strong>, causing severe performance degradation and high CPU usage on VTEPs.
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Full Encapsulation Stack</div>
          <div style={{display:'flex', flexDirection:'column', gap:2}}>
            <div style={{background:'var(--panel)', padding:'6px 12px', border:'1px solid var(--border)', borderRadius:4, fontSize:11, display:'flex', justifyContent:'space-between'}}>
              <span>Outer Ethernet Header</span><span style={{color:'var(--dim)'}}>14 Bytes</span>
            </div>
            <div style={{background:'var(--panel)', padding:'6px 12px', border:'1px solid var(--border)', borderRadius:4, fontSize:11, display:'flex', justifyContent:'space-between'}}>
              <span>Outer IPv4 Header (UDP)</span><span style={{color:'var(--dim)'}}>20 Bytes</span>
            </div>
            <div style={{background:'var(--panel)', padding:'6px 12px', border:'1px solid var(--border)', borderRadius:4, fontSize:11, display:'flex', justifyContent:'space-between'}}>
              <span>UDP Header (Dest 4789)</span><span style={{color:'var(--dim)'}}>8 Bytes</span>
            </div>
            <div style={{background:'rgba(0, 212, 200, 0.1)', padding:'6px 12px', border:'1px solid var(--cyan)', borderRadius:4, fontSize:11, display:'flex', justifyContent:'space-between', fontWeight:600}}>
              <span>VXLAN Header</span><span style={{color:'var(--cyan)'}}>8 Bytes</span>
            </div>
            <div style={{background:'var(--card)', padding:'12px', border:'1px dashed var(--dim)', borderRadius:4, fontSize:11, textAlign:'center', marginTop:4}}>
              <span style={{color:'var(--dim)'}}>Original Inner L2 Frame (1500B Payload)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Typical Deployment Model</div>
        <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.7}}>
          <strong style={{color:'var(--text)'}}>Spine-Leaf Architecture:</strong> VTEPs are typically located on the <strong style={{color:'var(--text)'}}>Leaf</strong> switches. The <strong style={{color:'var(--text)'}}>Spines</strong> only need to route the outer IP packets and don't need to know about the VNIs or MAC addresses inside the tunnels.
        </div>
      </div>
    </div>
  );
}

window.VXLANRef = VXLANRef;
