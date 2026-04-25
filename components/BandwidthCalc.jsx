const { useState, useEffect, useCallback, useRef, useMemo } = React;

function BandwidthCalc() {
  const [activeTab, setActiveTab] = useState('convert');
  const [bwValue, setBwValue]     = useState('100');
  const [bwUnit, setBwUnit]       = useState('Mbps');
  const [fileSize, setFileSize]   = useState('1');
  const [fileSizeUnit, setFileSizeUnit] = useState('GB');
  const [linkSpeed, setLinkSpeed] = useState('1000');
  const [linkUnit, setLinkUnit]   = useState('Mbps');
  const [pktSize, setPktSize]     = useState('1500');
  const [serialSpeed, setSerialSpeed] = useState('1000');
  const [serialUnit, setSerialUnit]   = useState('Mbps');
  const [pps, setPps]             = useState('1000');
  const [avgPktSize, setAvgPktSize]   = useState('512');
  const [ifaceSpeed, setIfaceSpeed]   = useState('1000');
  const [ifaceUnit, setIfaceUnit]     = useState('Mbps');

  const toBps = (v, unit) => {
    const n = parseFloat(v) || 0;
    return unit==='bps'?n:unit==='Kbps'?n*1e3:unit==='Mbps'?n*1e6:unit==='Gbps'?n*1e9:unit==='Tbps'?n*1e12:
           unit==='B/s'?n*8:unit==='KB/s'?n*8e3:unit==='MB/s'?n*8e6:unit==='GB/s'?n*8e9:unit==='TB/s'?n*8e12:n;
  };
  const toBytes = (v, unit) => {
    const n = parseFloat(v) || 0;
    return unit==='KB'?n*1e3:unit==='MB'?n*1e6:unit==='GB'?n*1e9:unit==='TB'?n*1e12:
           unit==='KiB'?n*1024:unit==='MiB'?n*1048576:unit==='GiB'?n*1073741824:n;
  };
  const fmtTime = s => {
    if(s<0.001) return `${(s*1e6).toFixed(2)} μs`;
    if(s<1)     return `${(s*1000).toFixed(2)} ms`;
    if(s<60)    return `${s.toFixed(2)} s`;
    if(s<3600)  return `${Math.floor(s/60)}m ${Math.round(s%60)}s`;
    return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  };
  const fmtBps = bps => {
    if(bps>=1e12) return `${(bps/1e12).toFixed(4)} Tbps`;
    if(bps>=1e9)  return `${(bps/1e9).toFixed(4)} Gbps`;
    if(bps>=1e6)  return `${(bps/1e6).toFixed(4)} Mbps`;
    if(bps>=1e3)  return `${(bps/1e3).toFixed(4)} Kbps`;
    return `${bps.toFixed(4)} bps`;
  };

  const convBps       = toBps(bwValue, bwUnit);
  const transferBytes = toBytes(fileSize, fileSizeUnit);
  const transferBps   = toBps(linkSpeed, linkUnit);
  const transferSec   = transferBps > 0 ? (transferBytes*8)/transferBps : 0;
  const serialBps     = toBps(serialSpeed, serialUnit);
  const serialDelaySec= serialBps > 0 ? ((parseInt(pktSize)||0)*8)/serialBps : 0;
  const utilBps       = (parseInt(pps)||0)*(parseInt(avgPktSize)||0)*8;
  const ifaceBps      = toBps(ifaceSpeed, ifaceUnit);
  const utilPct       = ifaceBps > 0 ? Math.min(100,(utilBps/ifaceBps)*100) : 0;
  const utilColor     = utilPct<60?'var(--green)':utilPct<80?'var(--yellow)':'var(--red)';
  const units         = ['bps','Kbps','Mbps','Gbps','Tbps'];
  const sizeUnits     = ['KB','MB','GB','TB','KiB','MiB','GiB'];

  const [obsRate, setObsRate]   = useState('');
  const [obsUnit, setObsUnit]   = useState('MB/s');

  const tabs = [
    {id:'convert',   l:'Unit Converter'},
    {id:'transfer',  l:'Transfer Time'},
    {id:'linkrate',  l:'Link Speed ↔ Rate'},
    {id:'serial',    l:'Serialization Delay'},
    {id:'util',      l:'Link Utilization'},
  ];

  return (
    <div className="fadein">
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {tabs.map(t=>(
          <button key={t.id} className={`btn btn-sm ${activeTab===t.id?'btn-primary':'btn-ghost'}`}
            onClick={()=>setActiveTab(t.id)} style={{flex:1,minWidth:120}}>{t.l}</button>
        ))}
      </div>

      {activeTab==='convert' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Bandwidth Unit Converter</div>
            <div className="field">
              <label className="label">Value</label>
              <div className="input-row">
                <input className="input" value={bwValue} onChange={e=>setBwValue(e.target.value)} placeholder="100"/>
                <select className="input" style={{width:110}} value={bwUnit} onChange={e=>setBwUnit(e.target.value)}>
                  <optgroup label="Bits / sec (network)">
                    {units.map(u=><option key={u}>{u}</option>)}
                  </optgroup>
                  <optgroup label="Bytes / sec (storage)">
                    {['B/s','KB/s','MB/s','GB/s','TB/s'].map(u=><option key={u}>{u}</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="hint">Network speeds use bits (Mbps). Storage/OS speeds use bytes (MB/s). 1 byte = 8 bits.</div>
            </div>
          </div>
          <div className="card fadein">
            <div className="card-title">Equivalents</div>
            <div style={{marginBottom:8,fontSize:11,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Bits per second (network)</div>
            <div className="result-grid grid-mobile-1"
 style={{marginBottom:16}}>
              {units.map(u=>{
                const v=u==='bps'?convBps:u==='Kbps'?convBps/1e3:u==='Mbps'?convBps/1e6:u==='Gbps'?convBps/1e9:convBps/1e12;
                return <ResultItem key={u} label={u} value={v.toLocaleString(undefined,{maximumFractionDigits:6})} accent={u===bwUnit}/>;
              })}
            </div>
            <div style={{marginBottom:8,fontSize:11,color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>Bytes per second (storage / OS)</div>
            <div className="result-grid grid-mobile-1"
>
              <ResultItem label="B/s"   value={(convBps/8).toLocaleString(undefined,{maximumFractionDigits:2})}        accent={bwUnit==='B/s'}/>
              <ResultItem label="KB/s"  value={(convBps/8/1e3).toLocaleString(undefined,{maximumFractionDigits:4})}   accent={bwUnit==='KB/s'}/>
              <ResultItem label="MB/s"  value={(convBps/8/1e6).toLocaleString(undefined,{maximumFractionDigits:4})}   accent={bwUnit==='MB/s'}  green/>
              <ResultItem label="GB/s"  value={(convBps/8/1e9).toLocaleString(undefined,{maximumFractionDigits:6})}   accent={bwUnit==='GB/s'}/>
              <ResultItem label="KiB/s" value={(convBps/8/1024).toLocaleString(undefined,{maximumFractionDigits:4})}/>
              <ResultItem label="MiB/s" value={(convBps/8/1048576).toLocaleString(undefined,{maximumFractionDigits:4})} yellow/>
              <ResultItem label="GiB/s" value={(convBps/8/1073741824).toLocaleString(undefined,{maximumFractionDigits:6})}/>
            </div>
            <div style={{marginTop:12,padding:'8px 12px',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontSize:12,color:'var(--muted)'}}>
              <strong style={{color:'var(--text)'}}>MB/s vs MiB/s:</strong> MB/s (green) uses 1,000,000 bytes — what storage vendors advertise. MiB/s (yellow) uses 1,048,576 bytes — what Windows, Linux, and macOS actually display during file copies. On a 1 Gbps link: 125 MB/s = 119.2 MiB/s.
            </div>
          </div>
          <div className="card">
            <div className="card-title">Common Link Speeds</div>
            <div className="table-wrap hide-mobile"><table>
              <thead><tr><th>Interface</th><th>Speed</th><th>Mbps</th><th>MB/s</th><th>MiB/s</th></tr></thead>
              <tbody>
                {[['Fast Ethernet',100],['Gigabit Ethernet',1000],['10G Ethernet',10000],
                  ['25G Ethernet',25000],['100G Ethernet',100000],['400G Ethernet',400000],
                  ['T1 / DS1',1.544],['T3 / DS3',44.736],['OC-3',155.52],['OC-48',2488.32],
                ].map(([name,mbps])=>(
                  <tr key={name}>
                    <td style={{fontFamily:'var(--mono)',fontSize:12}}>{name}</td>
                    <td><span className="badge badge-cyan">{mbps>=1000?mbps/1000+'G':mbps+'M'}</span></td>
                    <td style={{fontFamily:'var(--mono)'}}>{mbps.toLocaleString()}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{(mbps/8).toFixed(2)}</td>
                    <td style={{fontFamily:'var(--mono)'}}>{(mbps*1e6/8/1048576).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {/* Mobile View */}
            <div className="show-mobile mobile-cards">
              {[['Fast Ethernet',100],['Gigabit Ethernet',1000],['10G Ethernet',10000],['T1',1.544],['OC-3',155.52]].map(([name,mbps])=>(
                <div key={name} className="mobile-card">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{name}</span>
                    <span className="mobile-card-value" style={{color:'var(--cyan)',fontWeight:600}}>{mbps>=1000?mbps/1000+'G':mbps+'M'}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">MB/s | MiB/s</span>
                    <span className="mobile-card-value">{(mbps/8).toFixed(1)} | {(mbps*1e6/8/1048576).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab==='transfer' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">File Transfer Time</div>
            <div className="two-col grid-mobile-1" style={{gap:20}}>
              <div className="field">
                <label className="label">File / Data Size</label>
                <div className="input-row">
                  <input className="input" value={fileSize} onChange={e=>setFileSize(e.target.value)} placeholder="1"/>
                  <select className="input" style={{width:90}} value={fileSizeUnit} onChange={e=>setFileSizeUnit(e.target.value)}>
                    {sizeUnits.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Link / Transfer Speed</label>
                <div className="input-row">
                  <input className="input" value={linkSpeed} onChange={e=>setLinkSpeed(e.target.value)} placeholder="1000"/>
                  <select className="input" style={{width:100}} value={linkUnit} onChange={e=>setLinkUnit(e.target.value)}>
                    <optgroup label="Bits/sec (network)">
                      {units.map(u=><option key={u}>{u}</option>)}
                    </optgroup>
                    <optgroup label="Bytes/sec (browser / OS)">
                      {['B/s','KB/s','MB/s','GB/s'].map(u=><option key={u}>{u}</option>)}
                    </optgroup>
                  </select>
                </div>
                <div className="hint">Use MB/s if you're reading speed from a browser download or OS file copy.</div>
              </div>
            </div>
          </div>
          <div className="card fadein">
            <div className="card-title">Results</div>
            <div className="result-grid grid-mobile-1"
>
              <ResultItem label="Data (bits)"    value={(transferBytes*8).toLocaleString()}/>
              <ResultItem label="Speed"          value={fmtBps(transferBps)}/>
              <ResultItem label="Transfer Time"  value={fmtTime(transferSec)} accent/>
            </div>
            <div style={{marginTop:16}}>
              <div className="label" style={{marginBottom:8}}>At different link speeds</div>
              <div className="table-wrap hide-mobile"><table>
                <thead><tr><th>Link</th><th>100% eff.</th><th>95% eff.</th><th>70% eff.</th></tr></thead>
                <tbody>
                  {[['T1',1.544e6],['Fast-E',100e6],['GigE',1e9],['10G',10e9],['100G',100e9],['200G',200e9],['400G',400e9],['800G',800e9]].map(([l,b])=>(
                    <tr key={l}>
                      <td>{l}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{fmtTime(transferBytes*8/b)}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{fmtTime(transferBytes*8/(b*0.95))}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{fmtTime(transferBytes*8/(b*0.70))}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards">
                {[['T1',1.544e6],['Fast-E',100e6],['GigE',1e9],['10G',10e9]].map(([l,b])=>(
                  <div key={l} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{l}</span>
                      <span className="mobile-card-value" style={{color:'var(--cyan)',fontWeight:600}}>{fmtTime(transferBytes*8/b)}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">95% | 70%</span>
                      <span className="mobile-card-value">{fmtTime(transferBytes*8/(b*0.95))} | {fmtTime(transferBytes*8/(b*0.70))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab==='linkrate' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Link Speed → Transfer Rate</div>
            <div className="hint" style={{marginBottom:12}}>Enter your link speed to see the expected transfer rate in MB/s — what you'd see in a browser download or OS file copy.</div>
            <div className="field">
              <label className="label">Link Speed</label>
              <div className="input-row">
                <input className="input" value={linkSpeed} onChange={e=>setLinkSpeed(e.target.value)} placeholder="1000"/>
                <select className="input" style={{width:90}} value={linkUnit} onChange={e=>setLinkUnit(e.target.value)}>
                  {units.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          {transferBps>0&&(
            <div className="card fadein">
              <div className="card-title">Expected Transfer Rate</div>
              <div className="result-grid grid-mobile-1"
>
                <ResultItem label="Theoretical Max (MB/s)"  value={(transferBps/8/1e6).toFixed(3)}   accent green/>
                <ResultItem label="Theoretical Max (MiB/s)" value={(transferBps/8/1048576).toFixed(3)} yellow/>
                <ResultItem label="At 95% efficiency (MB/s)" value={(transferBps*0.95/8/1e6).toFixed(3)}/>
                <ResultItem label="At 70% efficiency (MB/s)" value={(transferBps*0.70/8/1e6).toFixed(3)}/>
              </div>
              <div style={{marginTop:12,padding:'8px 12px',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontSize:12,color:'var(--muted)'}}>
                <strong style={{color:'var(--text)'}}>MB/s vs MiB/s:</strong> Browsers and download managers show MB/s (1 MB = 1,000,000 bytes). Windows Explorer shows MiB/s (1 MiB = 1,048,576 bytes). On a 1 Gbps link: 125 MB/s = 119.2 MiB/s.
              </div>
              <div style={{marginTop:16}}>
                <div className="label" style={{marginBottom:8}}>Common link speeds reference</div>
                <div className="table-wrap hide-mobile"><table>
                  <thead><tr><th>Link</th><th>Mbps</th><th>Max MB/s</th><th>Max MiB/s</th><th>Typical MB/s (~70%)</th></tr></thead>
                  <tbody>
                    {[['Fast Ethernet',100],['Gigabit Ethernet',1000],['2.5G Ethernet',2500],['10G Ethernet',10000],['25G Ethernet',25000],['100G Ethernet',100000]].map(([name,mbps])=>{
                      const bps=mbps*1e6;
                      return (
                        <tr key={name} style={Math.abs(transferBps-bps)<1?{background:'rgba(0,212,200,.07)'}:{}}>
                          <td style={{fontSize:12}}>{name}</td>
                          <td style={{fontFamily:'var(--mono)'}}>{mbps.toLocaleString()}</td>
                          <td style={{fontFamily:'var(--mono)',color:'var(--green)'}}>{(bps/8/1e6).toFixed(1)}</td>
                          <td style={{fontFamily:'var(--mono)',color:'var(--yellow)'}}>{(bps/8/1048576).toFixed(1)}</td>
                          <td style={{fontFamily:'var(--mono)'}}>{(bps*0.7/8/1e6).toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
                {/* Mobile View */}
                <div className="show-mobile mobile-cards">
                  {[['Fast-E',100],['GigE',1000],['2.5G',2500],['10G',10000]].map(([name,mbps])=>(
                    <div key={name} className="mobile-card">
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">{name}</span>
                        <span className="mobile-card-value" style={{color:'var(--green)',fontWeight:600}}>{(mbps*1e6/8/1e6).toFixed(1)} MB/s</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Typical (70%)</span>
                        <span className="mobile-card-value">{(mbps*1e6*0.7/8/1e6).toFixed(1)} MB/s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-title">Observed Rate → Link Speed</div>
            <div className="hint" style={{marginBottom:12}}>Enter the transfer rate you're observing (e.g. from browser) to see what link speed it implies.</div>
            <div className="field">
              <label className="label">Observed Transfer Rate</label>
              <div className="input-row">
                <input className="input" value={obsRate} onChange={e=>setObsRate(e.target.value)} placeholder="e.g. 11.2"/>
                <select className="input" style={{width:100}} value={obsUnit} onChange={e=>setObsUnit(e.target.value)}>
                  {['B/s','KB/s','MB/s','GB/s','MiB/s','GiB/s'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {obsRate&&parseFloat(obsRate)>0&&(()=>{
              const n=parseFloat(obsRate)||0;
              const bps=obsUnit==='B/s'?n*8:obsUnit==='KB/s'?n*8e3:obsUnit==='MB/s'?n*8e6:obsUnit==='GB/s'?n*8e9:obsUnit==='MiB/s'?n*8*1048576:obsUnit==='GiB/s'?n*8*1073741824:n*8e6;
              return (
                <div className="result-grid grid-mobile-1"
 style={{marginTop:12}}>
                  <ResultItem label="Implied link (100% eff.)" value={fmtBps(bps)}/>
                  <ResultItem label="Implied link (95% eff.)"  value={fmtBps(bps/0.95)}/>
                  <ResultItem label="Implied link (70% eff.)"  value={fmtBps(bps/0.70)} accent/>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab==='serial' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Serialization Delay</div>
            <div className="hint" style={{marginBottom:12}}>Time to put all bits of a packet on the wire — critical for QoS and latency budgets.</div>
            <div className="two-col grid-mobile-1" style={{gap:20}}>
              <div className="field">
                <label className="label">Packet Size (bytes)</label>
                <div className="input-row">
                  <input className="input" value={pktSize} onChange={e=>setPktSize(e.target.value)} placeholder="1500"/>
                  <select className="input" style={{width:130}} value={pktSize} onChange={e=>setPktSize(e.target.value)}>
                    {[['64 B (min Eth)','64'],['128 B','128'],['256 B','256'],['512 B','512'],['1500 B (MTU)','1500'],['9000 B (Jumbo)','9000']].map(([l,v])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Link Speed</label>
                <div className="input-row">
                  <input className="input" value={serialSpeed} onChange={e=>setSerialSpeed(e.target.value)} placeholder="1000"/>
                  <select className="input" style={{width:90}} value={serialUnit} onChange={e=>setSerialUnit(e.target.value)}>
                    {units.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {serialBps>0 && (
            <div className="card fadein">
              <div className="card-title">Results</div>
              <div className="result-grid grid-mobile-1"
>
                <ResultItem label="Packet Size"  value={`${parseInt(pktSize)||0} bytes`}/>
                <ResultItem label="Bits on Wire" value={`${(parseInt(pktSize)||0)*8} bits`}/>
                <ResultItem label="Delay"        value={fmtTime(serialDelaySec)} accent/>
                <ResultItem label="Delay (μs)"   value={`${(serialDelaySec*1e6).toFixed(4)} μs`}/>
              </div>
              <div style={{marginTop:16}}>
                <div className="label" style={{marginBottom:8}}>Across packet sizes</div>
                <div className="table-wrap hide-mobile"><table>
                  <thead><tr><th>Size</th><th>Delay</th><th>Max pps @ 100%</th></tr></thead>
                  <tbody>
                    {[64,128,256,512,1024,1500,9000].map(sz=>{
                      const d=serialBps>0?(sz*8)/serialBps:0;
                      const mx=serialBps>0?serialBps/(sz*8):0;
                      return (
                        <tr key={sz} style={sz===parseInt(pktSize)?{background:'rgba(0,212,200,.07)'}:{}}>
                          <td style={{fontFamily:'var(--mono)'}}>{sz} B</td>
                          <td style={{fontFamily:'var(--mono)'}}>{fmtTime(d)}</td>
                          <td style={{fontFamily:'var(--mono)'}}>{mx.toLocaleString(undefined,{maximumFractionDigits:0})} pps</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
                {/* Mobile View */}
                <div className="show-mobile mobile-cards">
                  {[64,512,1500,9000].map(sz=>{
                    const d=serialBps>0?(sz*8)/serialBps:0;
                    const mx=serialBps>0?serialBps/(sz*8):0;
                    return (
                      <div key={sz} className="mobile-card" style={sz===parseInt(pktSize)?{borderColor:'var(--cyan)'}:{}}>
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">{sz} Bytes</span>
                          <span className="mobile-card-value" style={{color:'var(--cyan)',fontWeight:600}}>{fmtTime(d)}</span>
                        </div>
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">Max Rate</span>
                          <span className="mobile-card-value">{mx.toLocaleString(undefined,{maximumFractionDigits:0})} pps</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==='util' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Link Utilization Calculator</div>
            <div className="hint" style={{marginBottom:12}}>Calculate bandwidth consumed by a traffic rate in packets per second.</div>
            <div className="two-col grid-mobile-1" style={{gap:20}}>
              <div className="field">
                <label className="label">Packet Rate (pps)</label>
                <input className="input" value={pps} onChange={e=>setPps(e.target.value)} placeholder="1000"/>
              </div>
              <div className="field">
                <label className="label">Avg Packet Size (bytes)</label>
                <div className="input-row">
                  <input className="input" value={avgPktSize} onChange={e=>setAvgPktSize(e.target.value)} placeholder="512"/>
                  <select className="input" style={{width:140}}
                    value={['64','512','1500'].includes(avgPktSize) ? avgPktSize : 'custom'}
                    onChange={e=>{ if(e.target.value!=='custom') setAvgPktSize(e.target.value); }}>
                    {!['64','512','1500'].includes(avgPktSize) && (
                      <option value="custom">Custom ({avgPktSize||'?'}B)</option>
                    )}
                    <option value="64">64 B (min Eth)</option>
                    <option value="512">512 B (avg mix)</option>
                    <option value="1500">1500 B (MTU)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="field" style={{marginTop:12}}>
              <label className="label">Interface Speed</label>
              <div className="input-row">
                <input className="input" value={ifaceSpeed} onChange={e=>setIfaceSpeed(e.target.value)} placeholder="1000"/>
                <select className="input" style={{width:90}} value={ifaceUnit} onChange={e=>setIfaceUnit(e.target.value)}>
                  {units.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="card fadein">
            <div className="card-title">Results</div>
            <div className="result-grid grid-mobile-1"
>
              <ResultItem label="Traffic Rate"   value={fmtBps(utilBps)} accent/>
              <ResultItem label="Link Capacity"  value={fmtBps(ifaceBps)}/>
              <ResultItem label="Utilization"    value={`${utilPct.toFixed(2)}%`} green={utilPct<60} yellow={utilPct>=60&&utilPct<80} red={utilPct>=80}/>
              <ResultItem label="Headroom"       value={fmtBps(Math.max(0,ifaceBps-utilBps))}/>
              <ResultItem label="Max pps @ 64B"  value={(ifaceBps/(64*8)).toLocaleString(undefined,{maximumFractionDigits:0})}/>
              <ResultItem label="Max pps @ 1500B" value={(ifaceBps/(1500*8)).toLocaleString(undefined,{maximumFractionDigits:0})}/>
            </div>
            <div style={{marginTop:16,padding:'12px 16px',background:'var(--bg)',borderRadius:'var(--radius)',border:`1px solid ${utilColor}`}}>
              <div style={{fontSize:11,color:'var(--muted)',marginBottom:6}}>UTILIZATION GAUGE</div>
              <div style={{height:10,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,utilPct)}%`,background:utilColor,borderRadius:4,transition:'width .3s'}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:4,fontSize:11,color:'var(--muted)'}}>
                <span>0%</span>
                <span style={{color:utilPct>=60?'var(--yellow)':'var(--muted)'}}>60% warning</span>
                <span style={{color:utilPct>=80?'var(--red)':'var(--muted)'}}>80% critical</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: MTU & Encapsulation Calculator ─────────────────────
window.BandwidthCalc = BandwidthCalc;
