const { useState, useEffect, useCallback, useRef, useMemo } = React;

function PacketHeaders() {
  const [activeHeader, setActiveHeader] = useState('ipv4');
  const [selectedField, setSelectedField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});

  const headers = {
    ipv4: {
      title: <span>IPv4 Header (<RFCLink rfc="RFC 791" />)</span>,
      rows: [
        [
          { id: 'v4_ver', name: 'Version', bits: 4, default: 4, color: 'var(--layer-3)', desc: '4 for IPv4, 6 for IPv6.' },
          { id: 'v4_ihl', name: 'IHL', bits: 4, default: 5, color: 'var(--layer-3)', desc: 'Internet Header Length in 32-bit words. Min is 5 (20 bytes).' },
          { id: 'v4_dscp', name: 'DSCP', bits: 6, default: 0, color: 'var(--layer-3)', desc: 'Differentiated Services Code Point for QoS.' },
          { id: 'v4_ecn', name: 'ECN', bits: 2, default: 0, color: 'var(--layer-3)', desc: 'Explicit Congestion Notification.' },
          { id: 'v4_len', name: 'Total Length', bits: 16, default: 60, color: 'var(--layer-3)', desc: 'Entire packet size including header and data (max 65,535).' }
        ],
        [
          { id: 'v4_id', name: 'Identification', bits: 16, default: 0x4d2, color: 'var(--dim)', desc: 'Used for uniquely identifying fragments of an IP datagram.' },
          { id: 'v4_flags', name: 'Flags', bits: 3, default: 2, color: 'var(--dim)', desc: 'Control or identify fragments (Reserved, DF, MF).', isFlags: true, flags: ['Res', 'DF', 'MF'] },
          { id: 'v4_off', name: 'Fragment Offset', bits: 13, default: 0, color: 'var(--dim)', desc: 'Offset of a particular fragment relative to the beginning of the original datagram.' }
        ],
        [
          { id: 'v4_ttl', name: 'TTL', bits: 8, default: 64, color: 'var(--yellow)', desc: 'Time To Live. Prevents packets from circulating indefinitely.' },
          { id: 'v4_proto', name: 'Protocol', bits: 8, default: 6, color: 'var(--green)', desc: 'Next level protocol (6=TCP, 17=UDP, 1=ICMP).' },
          { id: 'v4_chk', name: 'Header Checksum', bits: 16, default: 0x0, color: 'var(--dim)', desc: 'Error-checking of the header.' }
        ],
        [ { id: 'v4_src', name: 'Source IP Address', bits: 32, default: 0xc0a8010a, color: 'var(--cyan)', isIP: true, desc: 'The sender\'s IP address.' } ],
        [ { id: 'v4_dst', name: 'Destination IP Address', bits: 32, default: 0x08080808, color: 'var(--cyan)', isIP: true, desc: 'The receiver\'s IP address.' } ]
      ]
    },
    ipv6: {
      title: <span>IPv6 Header (<RFCLink rfc="RFC 8200" />)</span>,
      rows: [
        [
          { id: 'v6_ver', name: 'Version', bits: 4, default: 6, color: 'var(--layer-3)', desc: 'Must be 6.' },
          { id: 'v6_tc', name: 'Traffic Class', bits: 8, default: 0, color: 'var(--layer-3)', desc: 'QoS management (DSCP/ECN).' },
          { id: 'v6_fl', name: 'Flow Label', bits: 20, default: 0, color: 'var(--layer-3)', desc: 'Label for packets belonging to a specific flow.' }
        ],
        [
          { id: 'v6_len', name: 'Payload Length', bits: 16, default: 20, color: 'var(--layer-3)', desc: 'Size of payload in octets. Excludes fixed header.' },
          { id: 'v6_next', name: 'Next Header', bits: 8, default: 6, color: 'var(--green)', desc: 'Type of header immediately following (TCP=6, UDP=17).' },
          { id: 'v6_hop', name: 'Hop Limit', bits: 8, default: 64, color: 'var(--yellow)', desc: 'Decremented at each node. Packet discarded at 0.' }
        ],
        [ { id: 'v6_src', name: 'Source Address', bits: 32, default: 0x20010db8, color: 'var(--cyan)', desc: 'Source address (showing first 32 bits).' } ],
        [ { id: 'v6_src_2', name: 'Source (cont)', bits: 32, default: 0x0, color: 'var(--cyan)', desc: 'Bits 32-63.' } ],
        [ { id: 'v6_src_3', name: 'Source (cont)', bits: 32, default: 0x0, color: 'var(--cyan)', desc: 'Bits 64-95.' } ],
        [ { id: 'v6_src_4', name: 'Source (cont)', bits: 32, default: 0x1, color: 'var(--cyan)', desc: 'Bits 96-127.' } ],
        [ { id: 'v6_dst', name: 'Destination Address', bits: 32, default: 0x20014860, color: 'var(--cyan)', desc: 'Destination address (showing first 32 bits).' } ],
        [ { id: 'v6_dst_2', name: 'Destination (cont)', bits: 32, default: 0x4860, color: 'var(--cyan)', desc: 'Bits 32-63.' } ],
        [ { id: 'v6_dst_3', name: 'Destination (cont)', bits: 32, default: 0x0, color: 'var(--cyan)', desc: 'Bits 64-95.' } ],
        [ { id: 'v6_dst_4', name: 'Destination (cont)', bits: 32, default: 0x8888, color: 'var(--cyan)', desc: 'Bits 96-127.' } ]
      ]
    },
    tcp: {
      title: <span>TCP Header (<RFCLink rfc="RFC 9293" />)</span>,
      rows: [
        [
          { id: 'tcp_src', name: 'Source Port', bits: 16, default: 443, color: 'var(--layer-4)', desc: 'The port number at the sender side.' },
          { id: 'tcp_dst', name: 'Destination Port', bits: 16, default: 51234, color: 'var(--layer-4)', desc: 'The port number at the receiver side.' }
        ],
        [ { id: 'tcp_seq', name: 'Sequence Number', bits: 32, default: 0x12345678, color: 'var(--layer-4)', desc: 'Ensures data is reassembled in order.' } ],
        [ { id: 'tcp_ack', name: 'Acknowledgment Number', bits: 32, default: 0, color: 'var(--layer-4)', desc: 'Next expected byte sequence number.' } ],
        [
          { id: 'tcp_off', name: 'Data Offset', bits: 4, default: 5, color: 'var(--layer-4)', desc: 'Size of TCP header in 32-bit words.' },
          { id: 'tcp_res', name: 'Reserved', bits: 3, default: 0, color: 'var(--dim)', desc: 'Must be zero.' },
          { id: 'tcp_flags', name: 'Flags', bits: 9, default: 0x02, color: 'var(--red)', isFlags: true, flags: ['NS','CWR','ECE','URG','ACK','PSH','RST','SYN','FIN'], desc: 'Control bits (SYN, ACK, FIN, etc.).' },
          { id: 'tcp_win', name: 'Window Size', bits: 16, default: 64240, color: 'var(--yellow)', desc: 'Number of bytes sender is willing to receive.' }
        ],
        [
          { id: 'tcp_chk', name: 'Checksum', bits: 16, default: 0x0, color: 'var(--dim)', desc: 'Error-checking for header and data.' },
          { id: 'tcp_urg', name: 'Urgent Pointer', bits: 16, default: 0, color: 'var(--dim)', desc: 'Offset from seq number to urgent data.' }
        ]
      ]
    },
    udp: {
      title: <span>UDP Header (<RFCLink rfc="RFC 768" />)</span>,
      rows: [
        [
          { id: 'udp_src', name: 'Source Port', bits: 16, default: 53, color: 'var(--layer-4)', desc: 'Source port.' },
          { id: 'udp_dst', name: 'Destination Port', bits: 16, default: 53, color: 'var(--layer-4)', desc: 'Destination port.' }
        ],
        [
          { id: 'udp_len', name: 'Length', bits: 16, default: 8, color: 'var(--layer-4)', desc: 'Length of header plus data.' },
          { id: 'udp_chk', name: 'Checksum', bits: 16, default: 0x0, color: 'var(--dim)', desc: 'Optional error-checking.' }
        ]
      ]
    }
  };

  // Initialize values
  useEffect(() => {
    const vals = {};
    Object.values(headers).forEach(h => {
      h.rows.forEach(row => {
        row.forEach(f => { vals[f.id] = f.default; });
      });
    });
    setFieldValues(vals);
  }, []);

  const current = headers[activeHeader];
  const updateVal = (id, val) => setFieldValues(prev => ({ ...prev, [id]: val }));

  // Compute hex/binary strings
  const getWireFormat = () => {
    let bits = '';
    current.rows.forEach(row => {
      row.forEach(f => {
        let v = fieldValues[f.id] || 0;
        bits += (v >>> 0).toString(2).padStart(f.bits, '0').slice(-f.bits);
      });
    });
    const hex = bits.match(/.{4}/g)?.map(b => parseInt(b,2).toString(16)).join('') || '';
    return {
      hex: hex.toUpperCase().match(/.{2}/g)?.join(' ') || '',
      bin: bits.match(/.{8}/g)?.join(' ') || bits
    };
  };

  const wire = getWireFormat();

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Packet Header Builder & Simulator</div>
        <div className="tab-row">
          {Object.keys(headers).map(h => (
            <button key={h} className={`tab-btn ${activeHeader === h ? 'active' : ''}`}
              onClick={() => { setActiveHeader(h); setSelectedField(null); }}>
              {h.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col" style={{alignItems:'stretch'}}>
        <div className="card fadein" style={{flex:2}}>
          <div className="card-title">{current.title} <span style={{fontSize:11,color:'var(--dim)',marginLeft:8}}>(Click fields to edit)</span></div>
          <div style={{display:'flex',flexDirection:'column',gap:1,border:'1px solid var(--border)',borderRadius:8,overflow:'hidden',background:'var(--border)'}}>
            <div style={{display:'flex',background:'var(--card)',fontSize:9,color:'var(--dim)',padding:'2px 4px',borderBottom:'1px solid var(--border)'}}>
              {Array.from({length:32}).map((_,i) => (
                <div key={i} style={{flex:1,textAlign:'center'}}>{i}</div>
              ))}
            </div>
            {current.rows.map((row, ri) => (
              <div key={ri} style={{display:'flex',height:48}}>
                {row.map((field, fi) => {
                  const val = fieldValues[field.id] || 0;
                  const displayVal = field.isIP ? IPv4.str(val) :
                                    field.isFlags ? `0x${val.toString(16).toUpperCase()}` :
                                    val.toString();
                  const isSelected = selectedField?.id === field.id;

                  return (
                    <div key={fi} style={{
                      flex: field.bits,
                      background: isSelected ? `${field.color}33` : 'var(--card)',
                      borderRight: fi===row.length-1?'none':'1px solid var(--border)',
                      display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',
                      padding:4,overflow:'hidden',transition:'all .15s',cursor:'pointer',
                      boxShadow: isSelected ? `inset 0 0 0 2px ${field.color}` : 'none',
                      zIndex: isSelected ? 1 : 0
                    }} onClick={() => setSelectedField(field)}>
                      <div style={{fontSize:9,fontWeight:700,color:field.color,textTransform:'uppercase',whiteSpace:'nowrap'}}>{field.name}</div>
                      <div style={{fontSize:10,color:'var(--text)',fontWeight:600,whiteSpace:'nowrap',marginTop:2}}>{displayVal}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{marginTop:16}}>
            <div className="card-title" style={{fontSize:13}}>Wire Format (Raw Data)</div>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:12,fontFamily:'var(--mono)',fontSize:12}}>
              <div style={{marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <span style={{color:'var(--dim)',display:'inline-block',width:40}}>HEX</span>
                  <span style={{color:'var(--cyan)',wordBreak:'break-all'}}>{wire.hex}</span>
                </div>
                <button className="btn btn-ghost btn-sm" style={{padding:'2px 8px', fontSize:10}} onClick={() => navigator.clipboard.writeText(wire.hex.replace(/\s/g,''))}>Copy Hex</button>
              </div>
              <div>
                <span style={{color:'var(--dim)',display:'inline-block',width:40}}>BIN</span>
                <span style={{color:'var(--muted)',fontSize:10,wordBreak:'break-all'}}>{wire.bin}</span>
              </div>
            </div>
          </div>

          <div style={{marginTop:16}}>
            <div className="card-title" style={{fontSize:13, display:'flex', justifyContent:'space-between'}}>
              Scapy Snippet (Python)
              <button className="btn btn-ghost btn-sm" style={{padding:'2px 8px', fontSize:10}} onClick={() => {
                const scapy = activeHeader === 'ipv4' ? `IP(bytes.fromhex("${wire.hex.replace(/\s/g,'')}"))` :
                             activeHeader === 'ipv6' ? `IPv6(bytes.fromhex("${wire.hex.replace(/\s/g,'')}"))` :
                             activeHeader === 'tcp' ? `TCP(bytes.fromhex("${wire.hex.replace(/\s/g,'')}"))` :
                             `UDP(bytes.fromhex("${wire.hex.replace(/\s/g,'')}"))`;
                navigator.clipboard.writeText(scapy);
              }}>Copy Snippet</button>
            </div>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontFamily:'var(--mono)',fontSize:11,color:'var(--green)'}}>
              <span style={{color:'var(--muted)'}}># Import and send the custom header</span><br/>
              <span style={{color:'var(--purple)'}}>from</span> scapy.all <span style={{color:'var(--purple)'}}>import</span> *<br/>
              pkt = {activeHeader === 'ipv4' ? 'IP' : activeHeader === 'ipv6' ? 'IPv6' : activeHeader === 'tcp' ? 'TCP' : 'UDP'}(bytes.fromhex(<span style={{color:'var(--yellow)'}}>{`"${wire.hex.replace(/\s/g,'')}"`}</span>))<br/>
              send(pkt)
            </div>
          </div>
        </div>

        <div className="card fadein" style={{flex:1,minWidth:280}}>
          <div className="card-title">Field Details</div>
          {selectedField ? (
            <div className="fadein">
              <div style={{fontSize:16,fontWeight:700,color:selectedField.color,marginBottom:4}}>{selectedField.name}</div>
              <div style={{fontSize:11,color:'var(--dim)',marginBottom:12}}>Size: {selectedField.bits} bits • Range: 0–{Math.pow(2, selectedField.bits)-1}</div>

              <div style={{fontSize:13,color:'var(--text)',lineHeight:1.5,marginBottom:16}}>{selectedField.desc}</div>

              <div className="field">
                <label className="label">Value</label>
                {selectedField.isFlags ? (
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {selectedField.flags.map((fname, idx) => {
                      const bitIdx = selectedField.bits - 1 - idx;
                      const isSet = (fieldValues[selectedField.id] & (1 << bitIdx)) !== 0;
                      return (
                        <label key={fname} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,cursor:'pointer',padding:'4px 8px',background:'var(--panel)',borderRadius:4}}>
                          <input type="checkbox" checked={isSet} onChange={e => {
                            const cur = fieldValues[selectedField.id];
                            updateVal(selectedField.id, e.target.checked ? (cur | (1 << bitIdx)) : (cur & ~(1 << bitIdx)));
                          }} />
                          <span style={{fontFamily:'var(--mono)',color:'var(--cyan)',width:30}}>{fname}</span>
                          <span style={{color:'var(--dim)'}}>Bit {bitIdx}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : selectedField.isIP ? (
                  <input className="input" value={IPv4.str(fieldValues[selectedField.id])}
                    onChange={e => {
                      const p = IPv4.parse(e.target.value);
                      if (p !== null) updateVal(selectedField.id, p);
                    }} />
                ) : (
                  <div className="field">
                    <div className="input-row">
                      <input className="input" type="number"
                        min="0" max={Math.pow(2, selectedField.bits)-1}
                        value={fieldValues[selectedField.id] || 0}
                        onChange={e => updateVal(selectedField.id, parseInt(e.target.value) || 0)} />
                    </div>
                    {selectedField.name.toLowerCase().includes('port') && (
                      <div className="btn-row" style={{marginTop:8}}>
                        {[80, 443, 53, 22, 21, 23, 25, 110, 143, 3306, 3389, 5060].map(p => (
                          <button key={p} className="btn btn-ghost btn-sm" onClick={() => updateVal(selectedField.id, p)}>{p}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--dim)',fontSize:13,textAlign:'center'}}>
              Click a header field to<br/>view details and edit values
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tab-row { display: flex; gap: 8px; margin-top: 12px; }
        .tab-btn {
          padding: 8px 16px; border: 1px solid var(--border); background: var(--panel);
          color: var(--muted); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;
          transition: all 0.2s;
        }
        .tab-btn:hover { background: var(--card); color: var(--text); }
        .tab-btn.active { background: var(--cyan); color: var(--btn-text); border-color: var(--cyan); }
      `}</style>
    </div>
  );
}

// ─── Tool: IP Proto Reference ──────────────────────
window.PacketHeaders = PacketHeaders;
