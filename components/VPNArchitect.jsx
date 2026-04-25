const { useState, useEffect, useCallback, useRef, useMemo } = React;

function VPNArchitect() {
  const dhGroups = [
    { g: 2,  bits: 1024, name: 'MODP', status: 'legacy', rec: '❌ Obsolete' },
    { g: 5,  bits: 1536, name: 'MODP', status: 'legacy', rec: '❌ Obsolete' },
    { g: 14, bits: 2048, name: 'MODP', status: 'secure', rec: '✅ Min. Standard' },
    { g: 15, bits: 3072, name: 'MODP', status: 'secure', rec: '✅ Secure' },
    { g: 16, bits: 4096, name: 'MODP', status: 'secure', rec: '✅ Very Secure' },
    { g: 19, bits: 256,  name: 'ECP (NIST P-256)', status: 'fast', rec: '🚀 Recommended' },
    { g: 20, bits: 384,  name: 'ECP (NIST P-384)', status: 'fast', rec: '🚀 Recommended' },
    { g: 21, bits: 521,  name: 'ECP (NIST P-521)', status: 'fast', rec: '🛡️ High Security' },
    { g: 24, bits: 2048, name: 'MODP (256-bit Prime Order)', status: 'secure', rec: '✅ Secure' },
  ];
  const [selectedDH, setSelectedDH] = useState(14);
  const dh = dhGroups.find(d => d.g === parseInt(selectedDH)) || dhGroups[2];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title" style={{color:'var(--purple)'}}>IPsec Architecture & Cryptography</div>
        <div style={{fontSize:13, color:'var(--muted)', lineHeight:1.6, marginBottom:16}}>
          IPsec (Internet Protocol Security) is a suite of protocols used to secure IP communications by authenticating and encrypting each IP packet in a communication session.
        </div>

        <div className="two-col" style={{gap:16}}>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, border:'1px solid var(--border)'}}>
            <div style={{fontSize:11, fontWeight:700, color:'var(--cyan)', textTransform:'uppercase', letterSpacing:1, marginBottom:12}}>Phase 1: IKE SA</div>
            <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
              Establishes a secure channel between peers to protect future negotiations.
              <ul style={{marginTop:8, paddingLeft:16}}>
                <li><strong style={{color:'var(--text)'}}>Purpose:</strong> Peer authentication and management channel.</li>
                <li><strong style={{color:'var(--text)'}}>Exchange:</strong> 6 messages (Main) or 3 (Aggressive).</li>
                <li><strong style={{color:'var(--text)'}}>Default Lifetime:</strong> 24 Hours (86,400s).</li>
                <li><strong style={{color:'var(--text)'}}>Negotiates:</strong> Encryption, Hash, DH Group, Auth Method.</li>
              </ul>
            </div>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, border:'1px solid var(--border)'}}>
            <div style={{fontSize:11, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:1, marginBottom:12}}>Phase 2: IPsec SA</div>
            <div style={{fontSize:12, color:'var(--muted)', lineHeight:1.6}}>
              Negotiates the parameters for the actual data-carrying tunnel (Child SA).
              <ul style={{marginTop:8, paddingLeft:16}}>
                <li><strong style={{color:'var(--text)'}}>Purpose:</strong> Protect data traffic (ESP/AH).</li>
                <li><strong style={{color:'var(--text)'}}>Exchange:</strong> 3 messages (Quick Mode).</li>
                <li><strong style={{color:'var(--text)'}}>Default Lifetime:</strong> 1 Hour (3,600s).</li>
                <li><strong style={{color:'var(--text)'}}>PFS (Perfect Forward Secrecy):</strong> Requires new DH for P2.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">DH Group Reference</div>
          <div className="field">
            <label className="label">Select DH Group</label>
            <select className="input" value={selectedDH} onChange={e => setSelectedDH(e.target.value)}>
              {dhGroups.map(d => <option key={d.g} value={d.g}>DH Group {d.g} ({d.name})</option>)}
            </select>
          </div>
          <div className="result-grid" style={{marginTop:16}}>
            <ResultItem label="Security Strength" value={`${dh.bits}-bit`} accent />
            <ResultItem label="Type" value={dh.name} />
            <ResultItem label="Recommendation" value={dh.rec} green={dh.status!=='legacy'} red={dh.status==='legacy'} />
          </div>
          <div style={{marginTop:16, padding:12, background:'rgba(0, 212, 200, 0.05)', borderRadius:6, border:'1px solid var(--border)', fontSize:12}}>
            <strong style={{color:'var(--cyan)'}}>Modern Suite-B:</strong> Pair <strong style={{color:'var(--text)'}}>DH Group 19+</strong> with <strong style={{color:'var(--text)'}}>AES-256-GCM</strong> and <strong style={{color:'var(--text)'}}>SHA-384</strong> for optimal performance and security.
          </div>
        </div>

        <div className="card">
          <div className="card-title">IKEv1 vs IKEv2 Comparison</div>
          <div className="table-wrap">
            <table style={{fontSize:11}}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>IKEv1</th>
                  <th>IKEv2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{color:'var(--text)'}}>Complexity</td>
                  <td>High (Multi-mode)</td>
                  <td style={{color:'var(--green)'}}>Low (Unified)</td>
                </tr>
                <tr>
                  <td style={{color:'var(--text)'}}>Init Exchange</td>
                  <td>6-9 Messages</td>
                  <td style={{color:'var(--green)'}}>4 Messages</td>
                </tr>
                <tr>
                  <td style={{color:'var(--text)'}}>NAT-T</td>
                  <td>Optional Add-on</td>
                  <td style={{color:'var(--green)'}}>Built-in</td>
                </tr>
                <tr>
                  <td style={{color:'var(--text)'}}>Mobility</td>
                  <td>Not Supported</td>
                  <td style={{color:'var(--green)'}}>MOBIKE (Native)</td>
                </tr>
                <tr>
                  <td style={{color:'var(--text)'}}>Reliability</td>
                  <td>No Seq Numbers</td>
                  <td style={{color:'var(--green)'}}>Sequence & Ack</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">IPsec Protocol Comparison</div>
        <div className="two-col" style={{gap:20}}>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, border:'1px solid var(--border)'}}>
            <div style={{fontSize:12, fontWeight:700, color:'var(--yellow)', marginBottom:8}}>ESP (Encapsulating Security Payload)</div>
            <div style={{fontSize:11, color:'var(--muted)', lineHeight:1.6}}>
              <strong style={{color:'var(--text)'}}>Protocol 50.</strong> Provides encryption, integrity, and origin authentication. The industry standard for VPNs.
              <br/><br/>
              <span style={{color:'var(--green)'}}>✔ Encryption</span><br/>
              <span style={{color:'var(--green)'}}>✔ Authentication</span><br/>
              <span style={{color:'var(--green)'}}>✔ Anti-Replay</span>
            </div>
          </div>
          <div style={{background:'var(--panel)', padding:16, borderRadius:8, border:'1px solid var(--border)'}}>
            <div style={{fontSize:12, fontWeight:700, color:'var(--dim)', marginBottom:8}}>AH (Authentication Header)</div>
            <div style={{fontSize:11, color:'var(--muted)', lineHeight:1.6}}>
              <strong style={{color:'var(--text)'}}>Protocol 51.</strong> Provides integrity and origin authentication ONLY. No encryption (payload sent in cleartext).
              <br/><br/>
              <span style={{color:'var(--red)'}}>✖ No Encryption</span><br/>
              <span style={{color:'var(--green)'}}>✔ Authentication</span><br/>
              <span style={{color:'var(--red)'}}>✖ Fails with NAT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── QoS / DSCP Engineering Suite ──────────────────────────────
window.VPNArchitect = VPNArchitect;
