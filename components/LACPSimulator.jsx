const { useState, useEffect, useCallback, useRef, useMemo } = React;

function LACPSimulator() {
  const [method, setMethod] = useState('src-dst-ip');
  const [enhanced, setEnhanced] = useState(false);
  const [ingressPort, setIngressPort] = useState(1);
  const [sip, setSIP] = useState('192.168.1.10');
  const [dip, setDIP] = useState('10.0.0.50');
  const [sport, setSPORT] = useState('54321');
  const [dport, setDPORT] = useState('443');
  const [links, setLinks] = useState(4);
  const [portLabels, setPortLabels] = useState(['Gi1/0/1', 'Gi1/0/2', 'Gi1/0/3', 'Gi1/0/4', 'Gi1/0/5', 'Gi1/0/6', 'Gi1/0/7', 'Gi1/0/8']);
  const [namingTemplate, setNamingTemplate] = useState('ios');

  const applyTemplate = (type) => {
    setNamingTemplate(type);
    let newLabels = [...portLabels];
    if (type === 'nexus') {
      newLabels = [...Array(8)].map((_, i) => `Ethernet1/${i + 1}`);
    } else if (type === 'ios') {
      newLabels = [...Array(8)].map((_, i) => `Gi1/0/${i + 1}`);
    } else if (type === 'generic') {
      newLabels = [...Array(8)].map((_, i) => `Port ${i + 1}`);
    }
    setPortLabels(newLabels);
  };

  const calculateRBH = () => {
    let val = 0;
    const getIPVal = (ip) => {
      const parts = ip.split('.');
      return parts.length === 4 ? parseInt(parts[3]) : 0;
    };
    const getPortVal = (p) => parseInt(p) || 0;

    switch(method) {
      case 'src-ip': val = getIPVal(sip); break;
      case 'dst-ip': val = getIPVal(dip); break;
      case 'src-dst-ip': val = getIPVal(sip) ^ getIPVal(dip); break;
      case 'src-dst-mixed': val = getIPVal(sip) ^ getIPVal(dip) ^ getPortVal(sport) ^ getPortVal(dport); break;
      default: val = getIPVal(sip) ^ getIPVal(dip);
    }

    if (enhanced) val = val ^ ingressPort;
    return val % 8;
  };

  const rbh = calculateRBH();

  const getPortFromRBH = (r) => {
    if (links === 1) return 1;
    if (links === 2) return (r % 2 === 0) ? 1 : 2; // Interleaved: 0,2,4,6 -> P1; 1,3,5,7 -> P2
    if (links === 4) return (r % 4) + 1; // Interleaved: 0,4 -> P1; 1,5 -> P2...
    if (links === 8) return r + 1;
    if (links === 3) return [1,2,3,1,2,3,1,2][r]; // Uneven distribution
    return (r % links) + 1;
  };

  // Calculate the "Load Mask" (Hex representation of which RBH bits are handled by this link)
  const getLoadMask = (portIdx) => {
    let mask = 0;
    for (let i = 0; i < 8; i++) {
      if (getPortFromRBH(i) === portIdx + 1) {
        mask |= (1 << i);
      }
    }
    return '0x' + mask.toString(16).toUpperCase().padStart(2, '0');
  };

  const currentPort = getPortFromRBH(rbh);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Enterprise EtherChannel Hashing Simulator</div>

        <div className="two-col" style={{gap:20, marginBottom:16}}>
          <div className="field">
            <label className="label">Algorithm (Hashing Input)</label>
            <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="src-dst-ip">Source XOR Destination IP</option>
              <option value="src-dst-mixed">IP + Port Mixed (L4-Aware)</option>
              <option value="src-ip">Source IP Only</option>
              <option value="dst-ip">Destination IP Only</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Advanced Mode</label>
            <div style={{display:'flex', gap:10, marginTop:8}}>
              <label style={{display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer'}}>
                <input type="checkbox" checked={enhanced} onChange={e => setEnhanced(e.target.checked)} />
                Include Ingress Port (Prevent Polarization)
              </label>
            </div>
          </div>
        </div>

        {enhanced && (
          <div className="field fadein" style={{background:'rgba(167, 139, 250, 0.05)', padding:12, borderRadius:6, border:'1px solid var(--purple)', marginBottom:16}}>
            <label className="label" style={{color:'var(--purple)'}}>Ingress Port Index (1-8)</label>
            <input type="range" min="1" max="8" value={ingressPort} onChange={e => setIngressPort(parseInt(e.target.value))} style={{width:'100%', accentColor:'var(--purple)'}} />
            <div style={{fontSize:10, color:'var(--dim)', marginTop:4}}>This adds the physical ingress interface ID into the hash calculation.</div>
          </div>
        )}

        <div className="two-col" style={{gap:20}}>
          <div>
            <div className="field">
              <label className="label">Source IP</label>
              <input className="input" value={sip} onChange={e => setSIP(e.target.value)} />
            </div>
            {method.includes('mixed') && (
              <div className="field fadein">
                <label className="label">Source Port</label>
                <input className="input" value={sport} onChange={e => setSPORT(e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <div className="field">
              <label className="label">Destination IP</label>
              <input className="input" value={dip} onChange={e => setDIP(e.target.value)} />
            </div>
            {method.includes('mixed') && (
              <div className="field fadein">
                <label className="label">Destination Port</label>
                <input className="input" value={dport} onChange={e => setDPORT(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label className="label">Interface Naming Template</label>
          <div style={{display:'flex', gap:8}}>
            {['ios','nexus','generic'].map(t => (
              <button key={t} className={`btn btn-sm ${namingTemplate===t?'btn-primary':'btn-ghost'}`} onClick={()=>applyTemplate(t)} style={{flex:1, fontSize:10}}>
                {t === 'ios' ? 'Cisco IOS (Gi1/0/x)' : t === 'nexus' ? 'Cisco Nexus (Eth1/x)' : 'Generic (Port x)'}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Number of Links in Bundle</label>
          <div style={{display:'flex', gap:8}}>
            {[2,3,4,8].map(n => (
              <button key={n} className={`btn btn-sm ${links===n?'btn-primary':'btn-ghost'}`} onClick={()=>setLinks(n)} style={{flex:1}}>
                {n} Links {n===3 && '(Uneven)'}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginTop:24}}>
           <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', textAlign:'center', marginBottom:12}}>Bucket Assignment (8-Bucket RBH Model)</div>
           <div style={{display:'flex', gap:4, height:40, background:'var(--panel)', borderRadius:6, padding:4, border:'1px solid var(--border)'}}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                  flex:1, borderRadius:3, border:'1px solid var(--border)',
                  background: rbh === i ? 'var(--cyan)' : (getPortFromRBH(i) % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'),
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:rbh===i ? '#000' : 'var(--dim)',
                  fontWeight: rbh===i ? 700 : 400, transition:'all .3s'
                }}>
                  {i}
                </div>
              ))}
           </div>
           <div style={{fontSize:9, color:'var(--dim)', textAlign:'center', marginTop:4}}>Current RBH Hash Result: <span style={{color:'var(--cyan)'}}>{rbh}</span></div>
        </div>

        <div style={{marginTop:24}}>
           <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', textAlign:'center', marginBottom:12}}>Bundle Member Mapping</div>
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:10}}>
              {[...Array(links)].map((_, i) => (
                <div key={i} style={{
                  background:currentPort === i+1 ? 'var(--cyan)' : 'var(--panel)',
                  border:'1px solid var(--border)', borderRadius:8, padding:12, textAlign:'center', transition:'all .3s',
                  boxShadow: currentPort === i+1 ? '0 0 20px rgba(0, 212, 200, 0.4)' : 'none',
                  position:'relative'
                }}>
                  <div style={{fontSize:10, color:currentPort === i+1 ? '#000' : 'var(--muted)', fontWeight:600}}>LINK INDEX {i}</div>
                  <input style={{
                    width:'100%', background:'transparent', border:'none', borderBottom:currentPort === i+1 ? '1px solid #000' : '1px solid var(--border)',
                    textAlign:'center', fontSize:13, marginTop:4, color:currentPort === i+1 ? '#000' : 'var(--text)', fontWeight:700
                  }} value={portLabels[i]} onChange={e => {
                    const nl = [...portLabels]; nl[i] = e.target.value; setPortLabels(nl);
                  }} />
                  <div style={{marginTop:8, fontSize:10, color:currentPort === i+1 ? '#000' : 'var(--dim)', fontFamily:'var(--mono)'}}>
                    Mask: {getLoadMask(i)}
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div style={{marginTop:24, padding:16, background:'rgba(0, 212, 200, 0.05)', borderRadius:8, border:'1px solid var(--border)', fontSize:12}}>
          <strong style={{color:'var(--cyan)'}}>How the switch maps this:</strong><br/>
          <div style={{color:'var(--muted)', marginTop:8, lineHeight:1.6}}>
            1. The switch calculates a <strong style={{color:'var(--text)'}}>3-bit Hash (RBH)</strong> based on your selected algorithm.<br/>
            2. Each physical interface in the bundle is assigned a <strong style={{color:'var(--text)'}}>Link Index</strong> (0 to {links-1}). <br/>
               <span style={{fontSize:11, color:'var(--dim)'}}>💡 Note: Cisco hardware usually assigns Index 0 to the port with the lowest physical ID (e.g. Gi1/0/1 &lt; Gi1/0/2).</span><br/>
            3. The 8 hardware buckets (0-7) are distributed across these indices. In your current {links}-link config, the <strong style={{color:'var(--cyan)'}}>Load Mask</strong> shows which buckets belong to each interface.<br/>
            4. Since your hash result is <strong style={{color:'var(--text)'}}>{rbh}</strong>, the traffic is sent out of the interface at <strong style={{color:'var(--text)'}}>Index {currentPort-1}</strong> ({portLabels[currentPort-1]}).
          </div>
        </div>
      </div>
    </div>
  );
}

window.LACPSimulator = LACPSimulator;
