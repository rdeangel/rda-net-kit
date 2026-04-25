const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPFMRef() {
  const [copied, setCopied] = useState(null);
  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const commands = [
    {
      cat: 'TCAM Carving (Required for N9K)',
      cmds: [
        { c: 'hardware access-list tcam region ing-nbm 1536', d: 'Mandatory: Allocate TCAM for NBM (Requires reload)' },
        { c: 'show hardware access-list tcam region', d: 'Verify TCAM allocation' }
      ]
    },
    {
      cat: 'Enable Infrastructure',
      cmds: [
        { c: 'feature ptp', d: 'Enable Precision Time Protocol' },
        { c: 'feature nbm', d: 'Enable Non-Blocking Multicast' },
        { c: 'feature ospf', d: 'Typical IGP for IPFM fabric' }
      ]
    },
    {
      cat: 'PTP Global Configuration',
      cmds: [
        { c: 'ptp source-ip 1.1.1.1', d: 'Set PTP source IP (usually Loopback0)' },
        { c: 'ptp domain 0', d: 'Set PTP domain (0 is standard for SMPTE 2059-2)' },
        { c: 'ptp profile smpte-2059-2', d: 'Apply the SMPTE 2059-2 broadcast profile' },
        { c: 'ptp priority1 128', d: 'Priority 1 (0-255, lower is better for GM election)' },
        { c: 'ptp offload', d: 'Offload PTP processing to line card CPU (N9500-R)' },
        { c: 'ptp clock-mode one-step', d: 'One-step timestamp mode for BC (recommended)' }
      ]
    },
    {
      cat: 'Interface Configuration',
      cmds: [
        { c: 'interface Eth1/1\n  ptp\n  nbm external-link', d: 'Border port facing an external non-NBM network — NBM applies host-like policing and BW reservation on this link. Not used for host ports or internal fabric links.' },
        { c: 'interface Eth1/54\n  ptp', d: 'Internal fabric/spine uplinks only need PTP — no nbm external-link. For a plain PIM network on the other side, PIM on the link is sufficient.' },
        { c: 'interface Eth1/1\n  nbm bandwidth 10000000', d: 'Reserve 10 Gbps multicast bandwidth on external link (value in kbps)' },
        { c: 'interface Eth1/1\n  nbm host-policy sender SENDER_POLICY\n  nbm host-policy receiver RECEIVER_POLICY', d: 'Apply sender and receiver host policies on an external link' }
      ]
    },
    {
      cat: 'PTP Verification',
      cmds: [
        { c: 'show ptp brief', d: 'Quick PTP status (Role, Source, Offset)' },
        { c: 'show ptp clock', d: 'Clock details — Offset from Master should be < 100ns' },
        { c: 'show ptp parent', d: 'Verify upstream clock source and GM info' },
        { c: 'show ptp interfaces', d: 'Interface-level PTP state and port status' },
        { c: 'show ptp corrections', d: 'Recent PTP correction values for sync health' }
      ]
    },
    {
      cat: 'NBM Verification & Troubleshooting',
      cmds: [
        { c: 'show nbm flows vrf all', d: 'List all active multicast flows with status and bandwidth' },
        { c: 'show nbm flows summary vrf all', d: 'Aggregated flow counts by category' },
        { c: 'show nbm flows statistics vrf all', d: 'Packet/byte counters including drops' },
        { c: 'show nbm flow-policy vrf all', d: 'Verify flow policy bandwidth allocations' },
        { c: 'show nbm defaults vrf all', d: 'Default flow/host policies per VRF' },
        { c: 'show nbm host-policy applied sender all vrf all', d: 'Verify sender host policy enforcement' },
        { c: 'show nbm host-policy applied receiver local all vrf all', d: 'Verify receiver host policy enforcement' },
        { c: 'show nbm flows static', d: 'View pre-configured static flow table' }
      ]
    }
  ];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title" style={{color:'var(--red)'}}>IP Fabric for Media (IPFM) Architecture</div>
        <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:16}}>
          IPFM is a Cisco Nexus-based fabric designed for professional SDI-to-IP migration. It replaces traditional crosspoint routers with a deterministic, high-bandwidth IP network using SMPTE ST 2110 for essence flows and ST 2022-7 for redundancy.
        </div>
        <div className="result-grid">
          <ResultItem label="Sync Standard" value="IEEE 1588 (PTPv2)" accent />
          <ResultItem label="Broadcast Profile" value="SMPTE 2059-2" />
          <ResultItem label="Media Standards" value="ST 2110 / ST 2022-6" green />
          <ResultItem label="Control Logic" value="NBM (Active/Passive)" yellow />
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Precision Time Protocol (PTP)</div>
          <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
            PTP is the heartbeat of an IPFM fabric. It provides sub-microsecond sync to ensure all A/V nodes remain in phase.
            <br/><br/>
            <strong style={{color:'var(--text)'}}>Node Roles:</strong>
            <ul style={{paddingLeft:16, marginTop:8}}>
              <li><strong style={{color:'var(--yellow)'}}>Grandmaster (GM):</strong> Reference clock (GPS-synced).</li>
              <li><strong style={{color:'var(--cyan)'}}>Boundary Clock (BC):</strong> Nexus switch role. Terminates and regenerates PTP, preventing jitter accumulation.</li>
              <li><strong style={{color:'var(--dim)'}}>Slave / Follower:</strong> End-nodes (Cameras, Mixers) that sync to the BC.</li>
            </ul>
            <br/>
            <strong style={{color:'var(--text)'}}>Key Parameters:</strong>
            <ul style={{paddingLeft:16, marginTop:4}}>
              <li>Domain: Logical isolation group (SMPTE 2059-2 uses domain 0)</li>
              <li>Priority 1/2: Controls BMCA (Best Master Clock Algorithm)</li>
              <li>Announce / Sync Intervals: Frequency of PTP messages</li>
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Non-Blocking Multicast (NBM)</div>
          <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
            NBM is a specialized multicast engine for Nexus 9000 that ensures "SDI-like" deterministic behavior.
            <br/><br/>
            <strong style={{color:'var(--text)'}}>Core Benefits:</strong>
            <ul style={{paddingLeft:16, marginTop:8}}>
              <li><strong style={{color:'var(--green)'}}>Zero Packet Loss:</strong> Strict bandwidth admission control.</li>
              <li><strong style={{color:'var(--cyan)'}}>Active Mode:</strong> Bandwidth admission control based on configured flow policy values (not actual traffic). Switch reserves bandwidth per NDFC flow policy.</li>
              <li><strong style={{color:'var(--yellow)'}}>Passive Mode:</strong> Flow management is orchestrated by an external controller (NDFC/DCNM/ND) for global path reservation.</li>
            </ul>
            <br/>
            <strong style={{color:'var(--text)'}}>Operational Constraints:</strong>
            <ul style={{paddingLeft:16, marginTop:4}}>
              <li>Requires specific Nexus 9000 Cloud Scale ASICs</li>
              <li>Flow-policing prevents "rogue" multicast sources from flooding</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">PTP Timing Hierarchy (BMCA)</div>
        <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.5, marginBottom:14}}>
          The PTP hierarchy is determined by the Best Master Clock Algorithm (BMCA). Lower priority values win GM election. Each Boundary Clock terminates and regenerates PTP, isolating downstream devices from upstream jitter. In IPFM, the GM (a dedicated GPS appliance) connects <em>directly into the Spine layer</em> — Spines are the first BC tier and the diagram correctly shows the GM above them.
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:20, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)'}}>
          {/* Tier 0 — GM */}
          <div style={{display:'flex', gap:20, alignItems:'center'}}>
            <div style={{padding:'8px 14px', background:'var(--red)', color:'#000', borderRadius:4, fontWeight:700, fontSize:11, border:'2px solid #fff'}}>
              GM — Grandmaster (GPS)
              <div style={{fontSize:9, fontWeight:400, marginTop:2, opacity:0.8}}>Ordinary Clock • priority1: 1-127 • Clock Class: 6</div>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <div style={{width:2, height:20, background:'var(--red)'}} />
            <div style={{fontSize:9, color:'var(--red)', fontFamily:'var(--mono)'}}>Sync / Announce / Delay_Req</div>
            <div style={{width:2, height:20, background:'var(--red)'}} />
          </div>
          {/* Tier 1 — Spine BC */}
          <div style={{padding:'10px 20px', background:'var(--card)', border:'1px solid var(--cyan)', borderRadius:6, fontWeight:600, fontSize:12, color:'var(--cyan)'}}>
            Spine — Boundary Clock (Slave upstream, Master downstream)
            <div style={{fontSize:9, fontWeight:400, color:'var(--dim)', marginTop:2}}>priority1: 128 • Terminates PTP from GM • Serves time to all Leafs</div>
          </div>
          <div style={{display:'flex', gap:80, marginTop:-4}}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <div style={{width:2, height:18, background:'var(--dim)', transform:'rotate(25deg)'}} />
              <div style={{fontSize:8, color:'var(--dim)', fontFamily:'var(--mono)'}}>Slave port</div>
            </div>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <div style={{width:2, height:18, background:'var(--dim)', transform:'rotate(-25deg)'}} />
              <div style={{fontSize:8, color:'var(--dim)', fontFamily:'var(--mono)'}}>Slave port</div>
            </div>
          </div>
          {/* Tier 2 — Leaf BC */}
          <div style={{display:'flex', gap:30}}>
             <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
               <div style={{padding:'8px 14px', border:'1px solid var(--cyan)', borderRadius:4, fontSize:11, fontWeight:500, textAlign:'center'}}>
                 Leaf — Boundary Clock
                 <div style={{fontSize:9, fontWeight:400, color:'var(--dim)', marginTop:2}}>priority1: 128 • Master to endpoints</div>
               </div>
               <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                 <div style={{width:2, height:14, background:'var(--dim)'}} />
                 <div style={{fontSize:8, color:'var(--dim)', fontFamily:'var(--mono)'}}>Master ports</div>
               </div>
               <div style={{padding:'6px 10px', background:'rgba(0,212,200,0.08)', border:'1px solid var(--border)', borderRadius:4, fontSize:10, color:'var(--muted)'}}>
                 Endpoints (Ordinary Clock Slaves)
                 <div style={{fontSize:8, color:'var(--dim)'}}>Cameras, Mixers, Encoders (ST 2110)</div>
               </div>
             </div>
             <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
               <div style={{padding:'8px 14px', border:'1px solid var(--cyan)', borderRadius:4, fontSize:11, fontWeight:500, textAlign:'center'}}>
                 Leaf — Boundary Clock
                 <div style={{fontSize:9, fontWeight:400, color:'var(--dim)', marginTop:2}}>priority1: 128 • Master to endpoints</div>
               </div>
               <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                 <div style={{width:2, height:14, background:'var(--dim)'}} />
                 <div style={{fontSize:8, color:'var(--dim)', fontFamily:'var(--mono)'}}>Master ports</div>
               </div>
               <div style={{padding:'6px 10px', background:'rgba(0,212,200,0.08)', border:'1px solid var(--border)', borderRadius:4, fontSize:10, color:'var(--muted)'}}>
                 Endpoints (Ordinary Clock Slaves)
                 <div style={{fontSize:8, color:'var(--dim)'}}>Monitors, Decoders, Audio (AES67)</div>
               </div>
             </div>
          </div>
          {/* Notes */}
          <div style={{marginTop:12, display:'flex', gap:20, fontSize:10, color:'var(--dim)'}}>
            <div style={{display:'flex', gap:4, alignItems:'center'}}><div style={{width:8, height:3, background:'var(--red)', borderRadius:1}} /> Sync flow direction</div>
            <div>Dual-plane A/B fabrics required for ST 2022-7 seamless protection</div>
            <div>Offset from Master &lt; 100ns = healthy sync</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">CLOS Dual-Plane Fabric (ST 2022-7 Redundancy)</div>
        <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.5, marginBottom:14}}>
          Production IPFM fabrics deploy two independent spine-leaf planes (A &amp; B), each with a <strong style={{color:'var(--text)'}}>double-spine</strong> design for intra-plane resiliency. Each ST 2110 flow traverses both planes simultaneously — if any spine or leaf fails, the receiver continues seamlessly from the surviving plane with zero packet loss.
        </div>
        <div style={{padding:20, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)', overflowX:'auto'}}>
          <svg viewBox="0 0 800 295" style={{width:'100%', maxWidth:820, display:'block', margin:'0 auto'}}>
            {/* === PLANE A === */}
            <text x="175" y="11" textAnchor="middle" fontSize="9" fill="var(--red)" fontWeight="700" letterSpacing="2" fontFamily="var(--mono)">PLANE A</text>
            <rect x="95" y="16" width="160" height="24" rx="3" fill="var(--red)" />
            <text x="175" y="32" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000">GM-A (GPS)</text>
            <line x1="155" y1="40" x2="85" y2="82" stroke="var(--red)" strokeWidth="1.5" />
            <line x1="195" y1="40" x2="265" y2="82" stroke="var(--red)" strokeWidth="1.5" />
            <rect x="25" y="82" width="120" height="32" rx="4" fill="var(--card)" stroke="var(--red)" strokeWidth="2" />
            <rect x="25" y="82" width="120" height="32" rx="4" fill="var(--red)" opacity="0.12" />
            <text x="85" y="97" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--red)">Spine-A1</text>
            <text x="85" y="109" textAnchor="middle" fontSize="7" fill="var(--dim)">N9500-R · BC</text>
            <rect x="205" y="82" width="120" height="32" rx="4" fill="var(--card)" stroke="var(--red)" strokeWidth="2" />
            <rect x="205" y="82" width="120" height="32" rx="4" fill="var(--red)" opacity="0.12" />
            <text x="265" y="97" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--red)">Spine-A2</text>
            <text x="265" y="109" textAnchor="middle" fontSize="7" fill="var(--dim)">N9500-R · BC</text>
            <line x1="85" y1="114" x2="50" y2="178" stroke="var(--red)" strokeWidth="1" />
            <line x1="85" y1="114" x2="175" y2="178" stroke="var(--red)" strokeWidth="1" />
            <line x1="85" y1="114" x2="300" y2="178" stroke="var(--red)" strokeWidth="1" opacity="0.4" />
            <line x1="265" y1="114" x2="50" y2="178" stroke="var(--red)" strokeWidth="1" opacity="0.4" />
            <line x1="265" y1="114" x2="175" y2="178" stroke="var(--red)" strokeWidth="1" />
            <line x1="265" y1="114" x2="300" y2="178" stroke="var(--red)" strokeWidth="1" />
            <text x="175" y="150" textAnchor="middle" fontSize="7" fill="var(--dim)" fontFamily="var(--mono)">ECMP full mesh</text>
            <rect x="5" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="var(--red)" strokeWidth="1" />
            <text x="50" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--red)">Leaf-A1</text>
            <text x="50" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <rect x="130" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="var(--red)" strokeWidth="1" />
            <text x="175" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--red)">Leaf-A2</text>
            <text x="175" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <rect x="255" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="var(--red)" strokeWidth="1" />
            <text x="300" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--red)">Leaf-A3</text>
            <text x="300" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <line x1="50" y1="204" x2="50" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <line x1="175" y1="204" x2="175" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <line x1="300" y1="204" x2="300" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <rect x="5" y="242" width="90" height="22" rx="3" fill="rgba(239,68,68,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="50" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Cameras / Enc</text>
            <rect x="130" y="242" width="90" height="22" rx="3" fill="rgba(239,68,68,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="175" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Mixers / Proc</text>
            <rect x="255" y="242" width="90" height="22" rx="3" fill="rgba(239,68,68,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="300" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Audio / Ctrl</text>

            {/* === PLANE B === */}
            <text x="625" y="11" textAnchor="middle" fontSize="9" fill="#3388ff" fontWeight="700" letterSpacing="2" fontFamily="var(--mono)">PLANE B</text>
            <rect x="545" y="16" width="160" height="24" rx="3" fill="#3388ff" />
            <text x="625" y="32" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000">GM-B (GPS)</text>
            <line x1="605" y1="40" x2="535" y2="82" stroke="#3388ff" strokeWidth="1.5" />
            <line x1="645" y1="40" x2="715" y2="82" stroke="#3388ff" strokeWidth="1.5" />
            <rect x="475" y="82" width="120" height="32" rx="4" fill="var(--card)" stroke="#3388ff" strokeWidth="2" />
            <rect x="475" y="82" width="120" height="32" rx="4" fill="#3388ff" opacity="0.12" />
            <text x="535" y="97" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3388ff">Spine-B1</text>
            <text x="535" y="109" textAnchor="middle" fontSize="7" fill="var(--dim)">N9500-R · BC</text>
            <rect x="655" y="82" width="120" height="32" rx="4" fill="var(--card)" stroke="#3388ff" strokeWidth="2" />
            <rect x="655" y="82" width="120" height="32" rx="4" fill="#3388ff" opacity="0.12" />
            <text x="715" y="97" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3388ff">Spine-B2</text>
            <text x="715" y="109" textAnchor="middle" fontSize="7" fill="var(--dim)">N9500-R · BC</text>
            <line x1="535" y1="114" x2="500" y2="178" stroke="#3388ff" strokeWidth="1" />
            <line x1="535" y1="114" x2="625" y2="178" stroke="#3388ff" strokeWidth="1" />
            <line x1="535" y1="114" x2="750" y2="178" stroke="#3388ff" strokeWidth="1" opacity="0.4" />
            <line x1="715" y1="114" x2="500" y2="178" stroke="#3388ff" strokeWidth="1" opacity="0.4" />
            <line x1="715" y1="114" x2="625" y2="178" stroke="#3388ff" strokeWidth="1" />
            <line x1="715" y1="114" x2="750" y2="178" stroke="#3388ff" strokeWidth="1" />
            <text x="625" y="150" textAnchor="middle" fontSize="7" fill="var(--dim)" fontFamily="var(--mono)">ECMP full mesh</text>
            <rect x="455" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="#3388ff" strokeWidth="1" />
            <text x="500" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="#3388ff">Leaf-B1</text>
            <text x="500" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <rect x="580" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="#3388ff" strokeWidth="1" />
            <text x="625" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="#3388ff">Leaf-B2</text>
            <text x="625" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <rect x="705" y="178" width="90" height="26" rx="3" fill="var(--card)" stroke="#3388ff" strokeWidth="1" />
            <text x="750" y="190" textAnchor="middle" fontSize="9" fontWeight="600" fill="#3388ff">Leaf-B3</text>
            <text x="750" y="200" textAnchor="middle" fontSize="7" fill="var(--dim)">N9300 · BC</text>
            <line x1="500" y1="204" x2="500" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <line x1="625" y1="204" x2="625" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <line x1="750" y1="204" x2="750" y2="242" stroke="var(--dim)" strokeWidth="1" />
            <rect x="455" y="242" width="90" height="22" rx="3" fill="rgba(51,136,255,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="500" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Monitors / Dec</text>
            <rect x="580" y="242" width="90" height="22" rx="3" fill="rgba(51,136,255,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="625" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Decoders / Mon</text>
            <rect x="705" y="242" width="90" height="22" rx="3" fill="rgba(51,136,255,0.06)" stroke="var(--border)" strokeWidth="1" />
            <text x="750" y="257" textAnchor="middle" fontSize="8" fill="var(--muted)">Audio (AES67)</text>

            {/* === ST 2022-7 INTER-PLANE REDUNDANCY === */}
            <line x1="325" y1="98" x2="475" y2="98" stroke="var(--dim)" strokeWidth="1.5" strokeDasharray="5,3" />
            <text x="400" y="93" textAnchor="middle" fontSize="7" fill="var(--dim)" fontFamily="var(--mono)">ST 2022-7</text>
            <text x="400" y="109" textAnchor="middle" fontSize="7" fill="var(--dim)" fontFamily="var(--mono)">redundancy</text>

            {/* === LEGEND === */}
            <rect x="105" y="278" width="10" height="3" rx="1" fill="var(--red)" />
            <text x="120" y="282" fontSize="9" fill="var(--dim)">Plane A</text>
            <rect x="185" y="278" width="10" height="3" rx="1" fill="#3388ff" />
            <text x="200" y="282" fontSize="9" fill="var(--dim)">Plane B</text>
            <text x="400" y="282" textAnchor="middle" fontSize="9" fill="var(--dim)">Each leaf uplinks to both spines in its plane (ECMP)</text>
            <text x="695" y="282" textAnchor="middle" fontSize="9" fill="var(--dim)">NBM per-link BW admission</text>
          </svg>
        </div>

        {/* Non-blocking formula card */}
        <div style={{marginTop:12, padding:14, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)'}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--yellow)', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>CLOS Non-Blocking Formula</div>
          <div style={{fontFamily:'var(--mono)', fontSize:11, color:'var(--text)', lineHeight:2}}>
            <div><span style={{color:'var(--cyan)'}}>Sender side:</span> sum(all sender BW on leaf) ≤ sum(uplink BW to each spine)</div>
            <div><span style={{color:'var(--cyan)'}}>Receiver side:</span> sum(all receiver BW on leaf) ≤ sum(downlink BW from each spine)</div>
            <div style={{color:'var(--dim)', fontSize:10, marginTop:4}}>Example: 4x 3G-SDI senders = 12 Gbps total. 2x 100G uplinks = 200 Gbps. 12 ≤ 200 — non-blocking.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Nexus 9000 IPFM Configuration & Monitoring</div>
        <div className="result-grid" style={{gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))'}}>
          {commands.map(g => (
            <div key={g.cat} style={{background:'var(--panel)', padding:16, borderRadius:8, border:'1px solid var(--border)'}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--cyan)', textTransform:'uppercase', letterSpacing:1, marginBottom:12}}>{g.cat}</div>
              <div style={{display:'flex', flexDirection:'column', gap:12}}>
                {g.cmds.map(c => (
                  <div key={c.c} style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'var(--mono)', color:'var(--green)', fontSize:12, marginBottom:4, whiteSpace:'pre-wrap'}}>{c.c}</div>
                      <div style={{fontSize:11, color:'var(--dim)'}}>{c.d}</div>
                    </div>
                    <button className={`btn btn-ghost btn-sm ${copied === c.c ? 'badge-green' : ''}`}
                            style={{padding:'2px 6px', fontSize:10}}
                            onClick={() => copy(c.c)}>
                      {copied === c.c ? '✓' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.IPFMRef = IPFMRef;
