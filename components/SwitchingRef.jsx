const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SwitchingRef() {
  const [tab, setTab]           = useState('stp');
  const [stpTab, setStpTab]     = useState('variants');
  const [hello, setHello]       = useState('2');
  const [fwdDelay, setFwdDelay] = useState('15');
  const [maxAge, setMaxAge]     = useState('20');
  const [priority, setPriority] = useState('32768');
  const [macAddr, setMacAddr]   = useState('00:1A:2B:3C:4D:5E');

  const helloSec    = parseInt(hello)||2;
  const fwdDelaySec = parseInt(fwdDelay)||15;
  const maxAgeSec   = parseInt(maxAge)||20;
  const conv8021d   = maxAgeSec + 2*fwdDelaySec;
  const convRSTP    = 3*helloSec;
  const bridgePri   = parseInt(priority)||32768;
  const macClean    = macAddr.replace(/[^0-9a-fA-F]/g,'').toUpperCase().padEnd(12,'0').slice(0,12);
  const bridgeId    = `${(bridgePri+1).toString(16).toUpperCase().padStart(4,'0')}:${macClean.match(/.{2}/g).join(':')}`;

  const topTabs = [
    {id:'stp',      l:'STP / Spanning Tree'},
    {id:'ether',    l:'EtherChannel'},
    {id:'vpc',      l:'vPC (Nexus)'},
  ];
  const stpTabs = [
    {id:'variants', l:'Variants'},
    {id:'states',   l:'Port States & Roles'},
    {id:'timers',   l:'Timer Calculator'},
    {id:'bridge',   l:'Bridge Priority'},
    {id:'configs',  l:'Port Configs'},
  ];

  return (
    <div className="fadein">
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {topTabs.map(t=>(
          <button key={t.id} className={`btn btn-sm ${tab===t.id?'btn-primary':'btn-ghost'}`}
            onClick={()=>setTab(t.id)} style={{flex:1,minWidth:130}}>{t.l}</button>
        ))}
      </div>

      {/* ── STP TAB ── */}
      {tab==='stp' && (
        <div className="fadein">
          <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
            {stpTabs.map(t=>(
              <button key={t.id} className={`btn btn-sm ${stpTab===t.id?'btn-primary':'btn-ghost'}`}
                onClick={()=>setStpTab(t.id)} style={{flex:1,minWidth:100}}>{t.l}</button>
            ))}
          </div>

          {stpTab==='variants' && (
            <div className="fadein">
              <div className="card">
                <div className="card-title">STP Variant Comparison</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Standard</th><th>Name</th><th>Instances</th><th>Convergence</th><th>BPDU</th><th>Note</th></tr></thead>
                  <tbody>
                    {[
                      ['IEEE 802.1D','STP (Classic)','1 (CST)','30–50 s','v0 Config','Original standard — one tree for all VLANs'],
                      ['Cisco','PVST+','1 per VLAN','30–50 s','v0 Config','Per-VLAN instances, Cisco proprietary'],
                      ['IEEE 802.1w','RSTP','1 (CST)','< 1–5 s','v2 RST BPDU','Rapid convergence via Proposal/Agreement'],
                      ['Cisco','Rapid-PVST+','1 per VLAN','< 1–5 s','v2 RST BPDU','RSTP per VLAN — Cisco default on Cat switches'],
                      ['IEEE 802.1s','MST','Up to 16','< 1–5 s','v3 MST BPDU','Maps VLANs to instances — scales well'],
                      ['Cisco','MST (Cisco impl)','1–16','< 1–5 s','v3 MST BPDU','Interoperates with Rapid-PVST+ at boundary'],
                    ].map(([std,name,inst,conv,bpdu,note])=>(
                      <tr key={name}>
                        <td><span className="badge badge-blue">{std}</span></td>
                        <td style={{fontWeight:600}}>{name}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{inst}</td>
                        <td style={{color:conv.includes('<')?'var(--green)':'var(--yellow)',fontWeight:600}}>{conv}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:11}}>{bpdu}</td>
                        <td style={{fontSize:12,color:'var(--muted)'}}>{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="card">
                <div className="card-title">STP Path Cost Reference (IEEE 802.1D-2004 long mode)</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Link Speed</th><th>Cost (1998 short)</th><th>Cost (2004 long)</th></tr></thead>
                  <tbody>
                    {[['10 Mbps','100','2,000,000'],['100 Mbps','19','200,000'],['1 Gbps','4','20,000'],
                      ['2 Gbps','3','10,000'],['10 Gbps','2','2,000'],['100 Gbps','—','200'],['1 Tbps','—','20']].map(([sp,c98,c04])=>(
                      <tr key={sp}>
                        <td>{sp}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{c98}</td>
                        <td style={{fontFamily:'var(--mono)',color:'var(--cyan)'}}>{c04}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="card">
                <div className="card-title">BPDU Key Fields (802.1D / 802.1w)</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Field</th><th>Size</th><th>Notes</th></tr></thead>
                  <tbody>
                    {[
                      ['Protocol ID','2 B','0x0000 (IEEE STP)'],
                      ['Version','1 B','0=STP, 2=RSTP, 3=MSTP'],
                      ['BPDU Type','1 B','0x00 Config, 0x80 TCN, 0x02 RST/MST'],
                      ['Flags','1 B','TC, Proposal, Port Role[2], Learning, Forwarding, Agreement, TCA'],
                      ['Root Bridge ID','8 B','Priority(2) + Root MAC(6)'],
                      ['Root Path Cost','4 B','Cumulative cost to root'],
                      ['Bridge ID','8 B','Priority(2) + Sender MAC(6)'],
                      ['Port ID','2 B','Priority(4 bits) + Port Num(12 bits)'],
                      ['Message Age','2 B','Hops from root ×256 = seconds'],
                      ['Max Age','2 B','Default 20 s ×256'],
                      ['Hello Time','2 B','Default 2 s ×256'],
                      ['Forward Delay','2 B','Default 15 s ×256'],
                    ].map(([f,sz,n])=>(
                      <tr key={f}>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{f}</td>
                        <td><span className="badge badge-cyan">{sz}</span></td>
                        <td style={{fontSize:12,color:'var(--muted)'}}>{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {stpTab==='states' && (
            <div className="fadein">
              <div className="card">
                <div className="card-title">Port States</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>802.1D State</th><th>RSTP State</th><th>BPDUs</th><th>Learns MACs</th><th>Forwards Data</th><th>Duration</th></tr></thead>
                  <tbody>
                    {[
                      ['Blocking','Discarding','Listens','No','No','maxAge (20s)','var(--red)'],
                      ['Listening','—','Yes','No','No','fwdDelay (15s)','var(--yellow)'],
                      ['Learning','Learning','Yes','Yes','No','fwdDelay (15s)','var(--yellow)'],
                      ['Forwarding','Forwarding','Yes','Yes','Yes','Stable','var(--green)'],
                      ['Disabled','Discarding','No','No','No','—','var(--muted)'],
                    ].map(([s1,s2,bpdu,mac,fwd,dur,col])=>(
                      <tr key={s1}>
                        <td style={{fontWeight:600,color:col}}>{s1}</td>
                        <td style={{color:'var(--muted)'}}>{s2}</td>
                        <td>{bpdu==='Yes'?<span className="badge badge-green">Yes</span>:<span className="badge badge-red">{bpdu}</span>}</td>
                        <td>{mac==='Yes'?<span className="badge badge-green">Yes</span>:<span className="badge badge-red">No</span>}</td>
                        <td>{fwd==='Yes'?<span className="badge badge-green">Yes</span>:<span className="badge badge-red">No</span>}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{dur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
              <div className="card">
                <div className="card-title">Port Roles</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                  {[
                    {role:'Root Port (RP)',col:'var(--cyan)',desc:'Best path toward the Root Bridge. One per non-root switch. In RSTP enters Forwarding immediately after Proposal/Agreement.'},
                    {role:'Designated Port (DP)',col:'var(--green)',desc:'Best port on each LAN segment toward the root. The only port that forwards BPDUs onto that segment.'},
                    {role:'Alternate Port (AP)',col:'var(--yellow)',desc:'RSTP only. Receives a superior BPDU from another bridge. Transitions instantly to Root Port on upstream failure — no timer wait.'},
                    {role:'Backup Port (BP)',col:'var(--purple)',desc:'RSTP only. Receives a superior BPDU from its own bridge on the same segment (hub/loop). Rare in modern networks.'},
                    {role:'Non-Designated (Blocked)',col:'var(--red)',desc:'STP (802.1D) only. Receives BPDUs but does not forward data. Transitions through Listening→Learning on topology change.'},
                    {role:'Edge Port / PortFast',col:'var(--blue)',desc:'Goes directly to Forwarding on link-up (skips Listening/Learning). Sends a TCN if it ever receives a BPDU. End-devices only.'},
                  ].map(({role,col,desc})=>(
                    <div key={role} style={{padding:'12px 14px',border:'1px solid var(--border)',borderLeft:`3px solid ${col}`,borderRadius:'var(--radius)',background:'var(--card)'}}>
                      <div style={{fontWeight:600,color:col,marginBottom:6}}>{role}</div>
                      <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stpTab==='timers' && (
            <div className="fadein">
              <div className="card">
                <div className="card-title">STP Timer Configuration</div>
                <div className="hint" style={{marginBottom:12}}>Set timers only on the Root Bridge. Cisco formula: Fwd Delay ≥ (diameter+2)/2; Max Age ≥ 2×(Fwd Delay−1).</div>
                <div className="two-col" style={{gap:20}}>
                  <div className="field">
                    <label className="label">Hello Time (s) — default 2</label>
                    <input className="input" value={hello} onChange={e=>setHello(e.target.value)} placeholder="2"/>
                    <div className="hint">Range 1–10 s. Frequency of BPDU origination from root.</div>
                  </div>
                  <div className="field">
                    <label className="label">Forward Delay (s) — default 15</label>
                    <input className="input" value={fwdDelay} onChange={e=>setFwdDelay(e.target.value)} placeholder="15"/>
                    <div className="hint">Range 4–30 s. Duration of Listening + Learning states (802.1D).</div>
                  </div>
                </div>
                <div className="field" style={{marginTop:12}}>
                  <label className="label">Max Age (s) — default 20</label>
                  <input className="input" value={maxAge} onChange={e=>setMaxAge(e.target.value)} placeholder="20" style={{maxWidth:200}}/>
                  <div className="hint">Range 6–40 s. How long a BPDU is considered valid before aging out.</div>
                </div>
              </div>
              <div className="card fadein">
                <div className="card-title">Convergence Analysis</div>
                <div className="result-grid">
                  <ResultItem label="802.1D Max Convergence" value={`${conv8021d} s`}
                    red={conv8021d>50} yellow={conv8021d>30&&conv8021d<=50} green={conv8021d<=30}/>
                  <ResultItem label="RSTP Worst-Case (3×Hello)" value={`${convRSTP} s`} green/>
                  <ResultItem label="Listening→Forwarding (802.1D)" value={`${2*fwdDelaySec} s`}/>
                  <ResultItem label="BPDU Aging (Max Age)" value={`${maxAgeSec} s`}/>
                </div>
                <div style={{marginTop:16}}>
                  <div className="label" style={{marginBottom:8}}>Diameter-Based Recommended Timers</div>
                  <div className="table-wrap"><table>
                    <thead><tr><th>Diameter</th><th>Hello</th><th>Fwd Delay</th><th>Max Age</th><th>Max Convergence</th></tr></thead>
                    <tbody>
                      {[2,3,4,5,6,7].map(d=>{
                        const fd=Math.min(30,Math.ceil((d+2)/2+10)), ma=Math.min(40,Math.ceil(fd*2-2));
                        return (
                          <tr key={d}>
                            <td>{d}{d===2?' (min)':d===7?' (Cisco max)':''}</td>
                            <td style={{fontFamily:'var(--mono)'}}>2 s</td>
                            <td style={{fontFamily:'var(--mono)'}}>{fd} s</td>
                            <td style={{fontFamily:'var(--mono)'}}>{ma} s</td>
                            <td style={{fontFamily:'var(--mono)',color:'var(--cyan)'}}>{ma+2*fd} s</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                </div>
                <div style={{marginTop:12,padding:'10px 14px',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontFamily:'var(--mono)',fontSize:12}}>
                  <div style={{color:'var(--muted)',marginBottom:4}}># Cisco IOS — configure on Root Bridge only</div>
                  <div style={{color:'var(--cyan)'}}>spanning-tree vlan 1 hello-time {helloSec}</div>
                  <div style={{color:'var(--cyan)'}}>spanning-tree vlan 1 forward-time {fwdDelaySec}</div>
                  <div style={{color:'var(--cyan)'}}>spanning-tree vlan 1 max-age {maxAgeSec}</div>
                </div>
              </div>
            </div>
          )}

          {stpTab==='bridge' && (
            <div className="fadein">
              <div className="card">
                <div className="card-title">Bridge ID Builder</div>
                <div className="hint" style={{marginBottom:12}}>Bridge ID = Priority (4 bits) + System ID Ext / VLAN (12 bits) + MAC (6 bytes). Total 8 bytes. Lower Bridge ID wins root election.</div>
                <div className="two-col" style={{gap:20}}>
                  <div className="field">
                    <label className="label">Bridge Priority (multiple of 4096)</label>
                    <select className="input" value={priority} onChange={e=>setPriority(e.target.value)}>
                      {[0,4096,8192,12288,16384,20480,24576,28672,32768,36864,40960,45056,49152,53248,57344,61440].map(p=>(
                        <option key={p} value={p}>{p}{p===0?' — highest (primary root)':p===32768?' — default':p===61440?' — lowest priority':''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Switch Base MAC Address</label>
                    <input className="input" value={macAddr} onChange={e=>setMacAddr(e.target.value)} placeholder="00:1A:2B:3C:4D:5E"/>
                  </div>
                </div>
              </div>
              <div className="card fadein">
                <div className="card-title">Bridge ID for VLAN 1</div>
                <div className="result-grid">
                  <ResultItem label="Priority Configured" value={bridgePri}/>
                  <ResultItem label="System ID Ext (VLAN)" value="1"/>
                  <ResultItem label="Effective Priority Field" value={bridgePri+1} accent/>
                  <ResultItem label="Bridge ID (hex)" value={bridgeId}/>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Priority Planning Reference</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Role</th><th>Priority</th><th>IOS Command</th></tr></thead>
                  <tbody>
                    {[
                      ['Primary Root Bridge','0','spanning-tree vlan X priority 0'],
                      ['Secondary Root Bridge','4096','spanning-tree vlan X priority 4096'],
                      ['Distribution Layer','16384','spanning-tree vlan X priority 16384'],
                      ['Access Layer (default)','32768','(no command — this is default)'],
                      ['Ensure Never Root','61440','spanning-tree vlan X priority 61440'],
                      ['Auto Primary Root','macro','spanning-tree vlan X root primary'],
                      ['Auto Secondary Root','macro','spanning-tree vlan X root secondary'],
                    ].map(([r,p,c])=>(
                      <tr key={r}>
                        <td>{r}</td>
                        <td style={{fontFamily:'var(--mono)'}}>{p}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--cyan)'}}>{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {stpTab==='configs' && (
            <div className="fadein">
              <div className="card">
                <div className="card-title">Typical Cisco Port Configurations</div>
                <div className="two-col" style={{gap:20}}>
                  <div>
                    <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Access Port (Host)</strong>
                    <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                      interface Gi1/0/1<br/>
                      &nbsp;switchport mode access<br/>
                      &nbsp;switchport access vlan 10<br/>
                      &nbsp;<span style={{color:'var(--cyan)'}}>spanning-tree portfast</span><br/>
                      &nbsp;<span style={{color:'var(--yellow)'}}>spanning-tree bpduguard enable</span>
                    </div>
                  </div>
                  <div>
                    <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Trunk Port (Uplink)</strong>
                    <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                      interface Gi1/0/48<br/>
                      &nbsp;switchport trunk encapsulation dot1q<br/>
                      &nbsp;switchport mode trunk<br/>
                      &nbsp;switchport trunk allowed vlan 10,20<br/>
                      &nbsp;switchport trunk native vlan 99
                    </div>
                  </div>
                </div>
                <div className="hint" style={{marginTop:12}}>
                  <strong style={{color:'var(--text)'}}>Security Note:</strong> Always enable <strong style={{color:'var(--yellow)'}}>BPDU Guard</strong> on access ports to prevent unauthorized switches from joining the topology.
                </div>
              </div>
              <div className="card">
                <div className="card-title">Root Bridge Configuration</div>
                <div className="two-col" style={{gap:20}}>
                  <div>
                    <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Manual Priority</strong>
                    <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                      <span style={{color:'var(--muted)'}}>! Primary root — VLAN 10</span><br/>
                      spanning-tree vlan 10 priority 0<br/><br/>
                      <span style={{color:'var(--muted)'}}>! Secondary root — VLAN 10</span><br/>
                      spanning-tree vlan 10 priority 4096
                    </div>
                  </div>
                  <div>
                    <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Macro Command</strong>
                    <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                      <span style={{color:'var(--muted)'}}>! Auto-sets priority to beat current root</span><br/>
                      spanning-tree vlan 10 root primary<br/><br/>
                      <span style={{color:'var(--muted)'}}>! Sets priority to 28672 or lower</span><br/>
                      spanning-tree vlan 10 root secondary
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Key Verification Commands</div>
                <div className="table-wrap"><table>
                  <thead><tr><th>Command</th><th>Purpose</th></tr></thead>
                  <tbody>
                    {[
                      ['show spanning-tree','STP state for all VLANs'],
                      ['show spanning-tree vlan X detail','Timers, topology changes, port roles'],
                      ['show spanning-tree summary','STP mode and root port counts'],
                      ['show spanning-tree inconsistentports','Ports in BPDU Guard / Root Guard error state'],
                      ['debug spanning-tree events','Real-time topology change events'],
                    ].map(([cmd,desc])=>(
                      <tr key={cmd}>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)'}}>{cmd}</td>
                        <td style={{fontSize:12,color:'var(--muted)'}}>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ETHERCHANNEL TAB ── */}
      {tab==='ether' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">LACP vs PAgP vs Static</div>
            <div className="table-wrap"><table>
              <thead><tr><th>Feature</th><th>LACP (802.3ad)</th><th>PAgP (Cisco)</th><th>Static (On)</th></tr></thead>
              <tbody>
                {[
                  ['Standard','IEEE Open Standard','Cisco Proprietary','Manual / None'],
                  ['Active Mode','Active','Desirable','On'],
                  ['Passive Mode','Passive','Auto','—'],
                  ['Max Active Ports','8 active + 8 standby','8','8'],
                  ['Negotiation','Yes — PDUs exchanged','Yes — PDUs exchanged','None'],
                  ['Interoperability','Any IEEE 802.3ad device','Cisco only','Cisco only'],
                  ['Hot-Standby','Yes (standby links)','No','No'],
                ].map(([f,l,p,s])=>(
                  <tr key={f}>
                    <td style={{fontWeight:600}}>{f}</td>
                    <td style={{color:f==='Active Mode'?'var(--green)':f==='Standard'?'var(--cyan)':'inherit'}}>{l}</td>
                    <td style={{color:f==='Active Mode'?'var(--green)':'inherit'}}>{p}</td>
                    <td style={{color:f==='Active Mode'?'var(--cyan)':'inherit'}}>{s}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
          <div className="card">
            <div className="card-title">Mode Compatibility Matrix</div>
            <div className="table-wrap"><table>
              <thead><tr><th>Side A \ Side B</th><th>Active</th><th>Passive</th><th>On</th></tr></thead>
              <tbody>
                {[
                  ['Active','✓ Forms','✓ Forms','✗ No'],
                  ['Passive','✓ Forms','✗ No','✗ No'],
                  ['On','✗ No','✗ No','✓ Forms'],
                ].map(([mode,...cells])=>(
                  <tr key={mode}>
                    <td style={{fontWeight:600}}>{mode}</td>
                    {cells.map((c,i)=>(
                      <td key={i} style={{color:c.startsWith('✓')?'var(--green)':'var(--red)',fontWeight:600}}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="hint" style={{marginTop:10}}>Two passive sides never form — at least one must be Active. Static "On" only pairs with another "On".</div>
          </div>
          <div className="card">
            <div className="card-title">Load Balancing Methods</div>
            <div className="table-wrap"><table>
              <thead><tr><th>Method</th><th>Command</th><th>Best For</th></tr></thead>
              <tbody>
                {[
                  ['Source MAC','src-mac','L2-only networks, unknown traffic'],
                  ['Dst MAC','dst-mac','Servers behind a single gateway MAC'],
                  ['Src+Dst MAC','src-dst-mac','Mixed L2 environments'],
                  ['Source IP','src-ip','Multiple clients to one server'],
                  ['Dst IP','dst-ip','One client to many servers'],
                  ['Src+Dst IP','src-dst-ip','Most routed environments (default)'],
                  ['Src+Dst IP+Port','src-dst-mixed-ip-port','Best distribution for L4-aware flows'],
                ].map(([m,cmd,use])=>(
                  <tr key={m}>
                    <td style={{fontWeight:600}}>{m}</td>
                    <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)'}}>{cmd}</td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{use}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div style={{marginTop:12,padding:'10px 14px',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontFamily:'var(--mono)',fontSize:12}}>
              <div style={{color:'var(--muted)',marginBottom:4}}># Cisco IOS</div>
              <div style={{color:'var(--cyan)'}}>port-channel load-balance src-dst-ip</div>
              <div style={{color:'var(--muted)',marginTop:8,marginBottom:4}}># Verify hash result for a flow</div>
              <div style={{color:'var(--cyan)'}}>test etherchannel load-balance interface Po1 ip 10.1.1.1 10.2.2.2</div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">EtherChannel Configuration (Cisco IOS)</div>
            <div className="two-col" style={{gap:20}}>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>LACP Active</strong>
                <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                  interface range Gi1/0/1-2<br/>
                  &nbsp;channel-group 1 mode active<br/>
                  &nbsp;channel-protocol lacp<br/><br/>
                  interface Port-channel1<br/>
                  &nbsp;switchport mode trunk<br/>
                  &nbsp;switchport trunk allowed vlan 10,20
                </div>
              </div>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Verification</strong>
                <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                  show etherchannel summary<br/>
                  show etherchannel 1 detail<br/>
                  show lacp neighbor<br/>
                  show interfaces Po1 trunk
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── vPC TAB ── */}
      {tab==='vpc' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title" style={{color:'var(--cyan)'}}>Cisco vPC (Virtual Port-Channel) — Nexus</div>
            <div className="two-col" style={{gap:20}}>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Core Components</strong>
                <ul style={{fontSize:12,color:'var(--muted)',lineHeight:1.7,paddingLeft:16}}>
                  <li><strong style={{color:'var(--cyan)'}}>vPC Peer-Link:</strong> L2 10G+ link for control plane sync and data path (Type 1 consistency).</li>
                  <li><strong style={{color:'var(--cyan)'}}>vPC Peer-Keepalive:</strong> L3 link (MGMT) to detect split-brain scenarios. No data traffic.</li>
                  <li><strong style={{color:'var(--cyan)'}}>vPC Domain:</strong> Logical grouping of two peer switches.</li>
                  <li><strong style={{color:'var(--cyan)'}}>vPC Member Port:</strong> Individual link to the downstream device.</li>
                </ul>
              </div>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Consistency Checks</strong>
                <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.6}}>
                  <div style={{marginBottom:8,padding:8,background:'rgba(239,68,68,0.1)',borderRadius:6,border:'1px solid rgba(239,68,68,0.2)'}}>
                    <strong style={{color:'var(--red)'}}>Type 1 (Critical):</strong> Must match exactly or vPC suspends — MTU, STP Mode, Speed/Duplex, VLAN allowed list.
                  </div>
                  <div style={{padding:8,background:'rgba(245,158,11,0.1)',borderRadius:6,border:'1px solid rgba(245,158,11,0.2)'}}>
                    <strong style={{color:'var(--yellow)'}}>Type 2 (Warning):</strong> Should match. vPC stays UP but specific features may fail — Logging, SNMP, IGMP Snooping.
                  </div>
                </div>
              </div>
            </div>
            <div style={{marginTop:16,background:'var(--panel)',padding:12,borderRadius:8,border:'1px solid var(--border)'}}>
              <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:6}}>Key Features</strong>
              <div className="result-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))'}}>
                <ResultItem label="Peer-Gateway" value="Allows L3 forwarding on local MAC"/>
                <ResultItem label="Peer-Switch" value="Both peers act as STP Root"/>
                <ResultItem label="Auto-Recovery" value="Brings up vPC if peer never boots"/>
                <ResultItem label="Delay Restore" value="Prevents blackholing during boot"/>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="two-col" style={{gap:20}}>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>vPC Data Plane Rule</strong>
                <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7,padding:10,background:'rgba(6,182,212,0.05)',borderRadius:6,border:'1px solid var(--border)'}}>
                  <strong style={{color:'var(--cyan)'}}>The Rule:</strong> A frame received on a <strong style={{color:'var(--text)'}}>vPC Peer-Link</strong> cannot be sent out of a <strong style={{color:'var(--text)'}}>vPC Member Port</strong> (unless the peer link is the only path left).<br/><br/>
                  <strong style={{color:'var(--text)'}}>Why?</strong> Prevents L2 loops without STP blocking. Ensures traffic is forwarded locally by the peer that receives it.
                </div>
              </div>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Orphan Ports</strong>
                <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7,padding:10,background:'rgba(245,158,11,0.05)',borderRadius:6,border:'1px solid var(--border)'}}>
                  An <strong style={{color:'var(--yellow)'}}>Orphan Port</strong> connects to only one vPC peer.<br/><br/>
                  <strong style={{color:'var(--text)'}}>Risk:</strong> If Peer-Link fails, secondary shuts vPC ports. Orphan port on secondary becomes <strong style={{color:'var(--red)'}}>isolated</strong>.<br/><br/>
                  <strong style={{color:'var(--text)'}}>Fix:</strong> Dual-home critical devices or use non-vPC trunks.
                </div>
              </div>
            </div>
            <div style={{marginTop:16}}>
              <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Active-Active HSRP with Peer-Gateway</strong>
              <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
                Normally only the HSRP <strong style={{color:'var(--green)'}}>Active</strong> router forwards traffic. With <code style={{color:'var(--cyan)'}}>peer-gateway</code>, the <strong style={{color:'var(--yellow)'}}>Standby</strong> router can forward L3 traffic received on a local vPC member port, avoiding an unnecessary hop across the Peer-Link.
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">vPC Configuration Skeleton (NX-OS)</div>
            <div className="two-col" style={{gap:20}}>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Domain & Keepalive</strong>
                <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                  <span style={{color:'var(--muted)'}}>! On both peers</span><br/>
                  feature vpc<br/>
                  feature lacp<br/><br/>
                  vpc domain 10<br/>
                  &nbsp;peer-keepalive destination 192.168.1.2<br/>
                  &nbsp;&nbsp;source 192.168.1.1 vrf management<br/>
                  &nbsp;peer-gateway<br/>
                  &nbsp;auto-recovery
                </div>
              </div>
              <div>
                <strong style={{color:'var(--text)',fontSize:13,display:'block',marginBottom:8}}>Peer-Link & Member Port</strong>
                <div style={{background:'var(--mono-bg)',padding:10,borderRadius:6,fontFamily:'var(--mono)',fontSize:11,color:'var(--green)',border:'1px solid var(--border)'}}>
                  <span style={{color:'var(--muted)'}}>! Peer-Link</span><br/>
                  interface port-channel1<br/>
                  &nbsp;vpc peer-link<br/><br/>
                  <span style={{color:'var(--muted)'}}>! vPC member port</span><br/>
                  interface port-channel10<br/>
                  &nbsp;vpc 10
                </div>
              </div>
            </div>
            <div style={{marginTop:12,padding:'10px 14px',background:'var(--card)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontFamily:'var(--mono)',fontSize:12}}>
              <div style={{color:'var(--muted)',marginBottom:4}}># Key verification</div>
              {['show vpc','show vpc consistency-parameters','show vpc peer-keepalive','show vpc role'].map(c=>(
                <div key={c} style={{color:'var(--cyan)'}}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Arcade Hub ───────────────────────────────────────────────
window.SwitchingRef = SwitchingRef;
