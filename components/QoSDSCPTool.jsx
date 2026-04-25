const { useState, useEffect, useCallback, useRef, useMemo } = React;

function QoSDSCPTool() {
  const [activeTab, setActiveTab] = useState('dscp');
  const [dscpInput, setDscpInput] = useState('EF');

  // Latency State
  const [pktSize, setPktSize] = useState(1500);
  const [linkSpeed, setLinkSpeed] = useState(100); // Mbps
  const [distance, setDistance] = useState(1000); // km

  // VoIP State
  const [codec, setCodec] = useState('g711');
  const [loss, setLoss] = useState(0);
  const [jitter, setJitter] = useState(20);
  const [latency, setLatency] = useState(100);

  // Policer State
  const [cir, setCir] = useState(1000); // kbps
  const [bc, setBc] = useState(8000); // bits

  const dscpMap = {
    'CS0':0,'BE':0,'CS1':8,'AF11':10,'AF12':12,'AF13':14,'CS2':16,'AF21':18,'AF22':20,'AF23':22,
    'CS3':24,'AF31':26,'AF32':28,'AF33':30,'CS4':32,'AF41':34,'AF42':36,'AF43':38,'CS5':40,'EF':46,'CS6':48,'CS7':56
  };

  const getDscpVal = () => {
    const v = dscpMap[dscpInput.toUpperCase()];
    return v !== undefined ? v : parseInt(dscpInput) || 0;
  };

  const calcMOS = () => {
    const effLatency = latency + (jitter * 2) + 10;
    let r = 0;
    if (effLatency < 160) r = 94.2 - (effLatency / 40);
    else r = 94.2 - (effLatency - 120) / 10;
    r = r - (loss * 2.5);
    const mos = 1 + (0.035) * r + (0.000007) * r * (r-60) * (100-r);
    return Math.max(1, Math.min(4.5, mos)).toFixed(2);
  };

  const getMOSLabel = (m) => {
    if (m >= 4.0) return { t:'Excellent', c:'var(--green)' };
    if (m >= 3.0) return { t:'Good / Fair', c:'var(--cyan)' };
    if (m >= 2.0) return { t:'Poor', c:'var(--yellow)' };
    return { t:'Unusable', c:'var(--red)' };
  };

  return (
    <div className="fadein">
      <div className="grid-mobile-1" style={{display:'flex', gap:8, marginBottom:20}}>
        {[
          {id:'dscp', l:'DSCP Decoder'},
          {id:'delay', l:'Delay & Latency'},
          {id:'voip', l:'VoIP & MOS'},
          {id:'bucket', l:'Token Bucket'}
        ].map(t => (
          <button key={t.id} className={`btn btn-sm ${activeTab===t.id?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveTab(t.id)} style={{flex:1}}>
            {t.l}
          </button>
        ))}
      </div>

      {activeTab === 'dscp' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Bit-Level ToS/DSCP Decoder</div>
            <div className="two-col grid-mobile-1" style={{gap:20}}>
              <div className="field">
                <label className="label">Standard DSCP / PHB Select</label>
                <select className="input" value={dscpInput} onChange={e => setDscpInput(e.target.value)}>
                  <optgroup label="Best Effort">
                    <option value="BE">BE / CS0 (0)</option>
                  </optgroup>
                  <optgroup label="Expedited Forwarding (Voice)">
                    <option value="EF">EF (46)</option>
                  </optgroup>
                  <optgroup label="Class Selector (IP Precedence)">
                    <option value="CS1">CS1 (8)</option>
                    <option value="CS2">CS2 (16)</option>
                    <option value="CS3">CS3 (24)</option>
                    <option value="CS4">CS4 (32)</option>
                    <option value="CS5">CS5 (40)</option>
                    <option value="CS6">CS6 (48)</option>
                    <option value="CS7">CS7 (56)</option>
                  </optgroup>
                  <optgroup label="Assured Forwarding (Class 4)">
                    <option value="AF41">AF41 (34) - High Drop</option>
                    <option value="AF42">AF42 (36) - Med Drop</option>
                    <option value="AF43">AF43 (38) - Low Drop</option>
                  </optgroup>
                  <optgroup label="Assured Forwarding (Class 3)">
                    <option value="AF31">AF31 (26)</option>
                    <option value="AF32">AF32 (28)</option>
                    <option value="AF33">AF33 (30)</option>
                  </optgroup>
                  <optgroup label="Assured Forwarding (Class 2)">
                    <option value="AF21">AF21 (18)</option>
                    <option value="AF22">AF20 (20)</option>
                    <option value="AF23">AF23 (22)</option>
                  </optgroup>
                  <optgroup label="Assured Forwarding (Class 1)">
                    <option value="AF11">AF11 (10)</option>
                    <option value="AF12">AF12 (12)</option>
                    <option value="AF13">AF13 (14)</option>
                  </optgroup>
                </select>
              </div>
              <div className="field">
                <label className="label">Custom Decimal (0-63)</label>
                <input className="input" type="number" min="0" max="63" value={getDscpVal()} onChange={e => setDscpInput(e.target.value)} />
              </div>
            </div>

            <div style={{marginTop:20}}>
              <div className="label" style={{marginBottom:10, textAlign:'center'}}>IP Type of Service (ToS) Byte Structure</div>
              <div style={{display:'flex', gap:2, background:'var(--border)', padding:2, borderRadius:6, overflow:'hidden', border:'1px solid var(--border)'}}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{
                    flex:1, height:50, background: i < 6 ? 'rgba(0, 212, 200, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    borderRight: i === 5 ? '2px solid var(--purple)' : 'none'
                  }}>
                    <div style={{fontSize:9, color:'var(--dim)'}}>{i}</div>
                    <div style={{fontSize:16, fontWeight:700, color: i < 6 ? 'var(--cyan)' : 'var(--purple)'}}>
                      {i < 6 ? (getDscpVal().toString(2).padStart(6,'0')[i]) : '0'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid-mobile-1" style={{display:'flex', justifyContent:'space-between', marginTop:8, fontSize:10}}>
                <div style={{color:'var(--cyan)'}}>DSCP bits (Differentiated Services)</div>
                <div style={{color:'var(--purple)'}}>ECN bits (Congestion)</div>
              </div>
            </div>
            <div className="result-grid grid-mobile-1" style={{marginTop:24}}>
              <ResultItem label="ToS Hex" value={'0x' + (getDscpVal() << 2).toString(16).toUpperCase().padStart(2,'0')} />
              <ResultItem label="IP Precedence" value={Math.floor(getDscpVal() / 8)} />
              <ResultItem label="CoS Mapping" value={Math.floor(getDscpVal() / 8)} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Standard Application Markings <span style={{color:'var(--purple)', marginLeft:4}}>(<RFCLink rfc="RFC 4594" />)</span></div>
            <div className="table-wrap hide-mobile">
              <table>
                <thead><tr><th>App Type</th><th>DSCP</th><th>Decimal</th><th>CoS</th><th>Priority</th></tr></thead>
                <tbody style={{fontSize:11, color:'var(--muted)'}}>
                  <tr><td style={{color:'var(--text)'}}>Network Control</td><td>CS6</td><td>48</td><td>6</td><td>Critical</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Voice (VoIP)</td><td>EF</td><td>46</td><td>5</td><td>Highest</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Broadcast Video</td><td>CS4</td><td>32</td><td>4</td><td>High</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Real-Time Interactive</td><td>AF41</td><td>34</td><td>4</td><td>High</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Multimedia Streaming</td><td>AF31</td><td>26</td><td>3</td><td>Medium</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Signaling (SIP/H.323)</td><td>CS3</td><td>24</td><td>3</td><td>Medium</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Transactional Data</td><td>AF21</td><td>18</td><td>2</td><td>Normal</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Bulk Data</td><td>AF11</td><td>10</td><td>1</td><td>Low</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Scavenger</td><td>CS1</td><td>8</td><td>1</td><td>Lowest</td></tr>
                  <tr><td style={{color:'var(--text)'}}>Best Effort</td><td>BE</td><td>0</td><td>0</td><td>None</td></tr>
                </tbody>
              </table>
            </div>
            {/* Mobile View */}
            <div className="show-mobile mobile-cards">
              {[
                {a:'Network Control', d:'CS6', dec:48, p:'Critical'},
                {a:'Voice (VoIP)', d:'EF', dec:46, p:'Highest'},
                {a:'Broadcast Video', d:'CS4', dec:32, p:'High'},
                {a:'Real-Time Interactive', d:'AF41', dec:34, p:'High'},
                {a:'Multimedia Streaming', d:'AF31', dec:26, p:'Medium'},
                {a:'Signaling', d:'CS3', dec:24, p:'Medium'},
                {a:'Transactional Data', d:'AF21', dec:18, p:'Normal'},
                {a:'Bulk Data', d:'AF11', dec:10, p:'Low'},
                {a:'Scavenger', d:'CS1', dec:8, p:'Lowest'},
                {a:'Best Effort', d:'BE', dec:0, p:'None'}
              ].map(m => (
                <div key={m.a} className="mobile-card">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{m.a}</span>
                    <span className="mobile-card-value" style={{fontWeight:600}}>{m.d} ({m.dec})</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Priority</span>
                    <span className="mobile-card-value" style={{color:m.p==='Critical'||m.p==='Highest'?'var(--red)':m.p.includes('High')?'var(--yellow)':'inherit'}}>{m.p}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'delay' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Serialization & Propagation Delay</div>
            <div className="result-grid" style={{marginBottom:20}}>
              <div className="field">
                <label className="label">Packet Size (Bytes)</label>
                <input type="number" className="input" value={pktSize} onChange={e=>setPktSize(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Link Speed (Mbps)</label>
                <input type="number" className="input" value={linkSpeed} onChange={e=>setLinkSpeed(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Distance (km)</label>
                <input type="number" className="input" value={distance} onChange={e=>setDistance(e.target.value)} />
              </div>
            </div>

            {/* Formulas:
                Serialization = (Size * 8) / Speed
                Propagation = Distance / (300,000 * 0.7)
            */}
            <div className="result-grid">
              <ResultItem label="Serialization Delay" value={`${((pktSize * 8) / (linkSpeed * 1000)).toFixed(3)} ms`} accent />
              <ResultItem label="Propagation Delay" value={`${(distance / 210).toFixed(3)} ms`} />
              <ResultItem label="Total L1/L2 Delay" value={`${(((pktSize * 8) / (linkSpeed * 1000)) + (distance / 210)).toFixed(3)} ms`} green />
            </div>
            <div className="hint" style={{marginTop:12}}>Serialization delay is "clocking" bits onto the wire. Propagation is the "speed of light" through fiber (approx. 0.7c).</div>
          </div>
        </div>
      )}

      {activeTab === 'voip' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">VoIP Quality & Bandwidth Estimator</div>
            <div className="result-grid" style={{marginBottom:20}}>
              <div className="field">
                <label className="label">Codec</label>
                <select className="input" value={codec} onChange={e=>setCodec(e.target.value)}>
                  <option value="g711">G.711 (64k - Uncompressed)</option>
                  <option value="g729">G.729 (8k - Compressed)</option>
                  <option value="opus">Opus (Variable)</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Latency (ms)</label>
                <input type="number" className="input" value={latency} onChange={e=>setLatency(parseInt(e.target.value))} />
              </div>
              <div className="field">
                <label className="label">Jitter (ms)</label>
                <input type="number" className="input" value={jitter} onChange={e=>setJitter(parseInt(e.target.value))} />
              </div>
              <div className="field">
                <label className="label">Packet Loss (%)</label>
                <input type="number" className="input" value={loss} onChange={e=>setLoss(parseFloat(e.target.value))} />
              </div>
            </div>

            <div style={{textAlign:'center', padding:24, background:'var(--panel)', borderRadius:12, border:`1px solid ${getMOSLabel(calcMOS()).c}`}}>
              <div style={{fontSize:11, color:'var(--muted)', textTransform:'uppercase', marginBottom:4}}>Estimated MOS Score</div>
              <div style={{fontSize:42, fontWeight:700, color:getMOSLabel(calcMOS()).c}}>{calcMOS()}</div>
              <div style={{fontSize:14, fontWeight:600, color:getMOSLabel(calcMOS()).c, marginTop:4}}>{getMOSLabel(calcMOS()).t}</div>
            </div>

            <div className="result-grid" style={{marginTop:24}}>
              <ResultItem label="IP Bandwidth / Call" value={codec === 'g711' ? '87.2 kbps' : '31.2 kbps'} />
              <ResultItem label="Payload Size" value={codec === 'g711' ? '160B' : '20B'} />
              <ResultItem label="Calls per 10Mbps" value={codec === 'g711' ? '114' : '320'} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bucket' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Token Bucket (Policing & Shaping)</div>
            <div className="result-grid" style={{marginBottom:20}}>
              <div className="field">
                <label className="label">CIR (Target Rate in kbps)</label>
                <input type="number" className="input" value={cir} onChange={e=>setCir(parseInt(e.target.value))} />
              </div>
              <div className="field">
                <label className="label">Bc (Burst Size in bits)</label>
                <input type="number" className="input" value={bc} onChange={e=>setBc(parseInt(e.target.value))} />
              </div>
            </div>
            <div className="result-grid">
              <ResultItem label="Tc (Time Interval)" value={`${(bc / cir).toFixed(2)} ms`} accent />
              <ResultItem label="Tokens per Tc" value={bc} />
              <ResultItem label="Impact" value={bc/cir < 10 ? 'High CPU' : 'Normal'} />
            </div>
            <div style={{marginTop:20, padding:15, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)', fontSize:12, lineHeight:1.6}}>
              <strong style={{color:'var(--cyan)'}}>Cisco/Standard Logic:</strong><br/>
              A policer refills the bucket every <strong style={{color:'var(--text)'}}>Tc</strong> interval. If a packet arrives and the bucket has enough tokens, it passes; otherwise, it is dropped or re-marked.
              <br/><br/>
              <code style={{color:'var(--dim)'}}>Tc = Bc / CIR</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: WiFi QR Code Generator ────────────────────────────
window.QoSDSCPTool = QoSDSCPTool;
