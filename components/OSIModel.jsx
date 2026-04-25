const { useState, useEffect, useCallback, useRef, useMemo } = React;

function OSIModel() {
  const data = [
    { osi: 7, name: 'Application', pdu: 'Data', tcp: 'Application', examples: 'HTTP, DNS, FTP, SMTP, SSH', span: 3 },
    { osi: 6, name: 'Presentation', pdu: 'Data', tcp: null, examples: 'SSL/TLS, JPEG, GIF, ASCII' },
    { osi: 5, name: 'Session', pdu: 'Data', tcp: null, examples: 'RPC, NetBIOS, Sockets' },
    { osi: 4, name: 'Transport', pdu: 'Segments', tcp: 'Transport', examples: 'TCP, UDP, SCTP', span: 1 },
    { osi: 3, name: 'Network', pdu: 'Packets', tcp: 'Internet', examples: 'IP, ICMP, IPsec, IGMP', span: 1 },
    { osi: 2, name: 'Data Link', pdu: 'Frames', tcp: 'Network Access', examples: 'Ethernet, Wi-Fi, ARP, L2TP', span: 2 },
    { osi: 1, name: 'Physical', pdu: 'Bits', tcp: null, examples: 'Cables, Hubs, Fiber, Bits' },
  ];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Layer Comparison Matrix</div>
        <div className="table-wrap">
          <table className="osi-table">
            <thead>
              <tr>
                <th style={{width:100}}>OSI Layer</th>
                <th style={{width:130}}>Layer Name</th>
                <th style={{width:110}}>PDU (Data Unit)</th>
                <th style={{width:140}}>TCP/IP Layer</th>
                <th>Examples / Protocols</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l, i) => {
                const tcpColor = l.tcp === 'Application' ? 'var(--layer-7)' : l.tcp === 'Transport' ? 'var(--layer-4)' : l.tcp === 'Internet' ? 'var(--layer-3)' : 'var(--layer-2)';
                return (
                  <tr key={l.osi} style={{borderLeft:`4px solid var(--layer-${l.osi})`}}>
                    <td style={{fontWeight:700,color:`var(--layer-${l.osi})`}}>Layer {l.osi}</td>
                    <td style={{fontWeight:600}}>{l.name}</td>
                    <td style={{color:'var(--muted)',fontSize:12}}>{l.pdu}</td>
                    {l.tcp !== null ? (
                      <td rowSpan={l.span} style={{
                        verticalAlign:'middle',
                        textAlign:'center',
                        background: tcpColor,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '0 12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)',
                        border: 'none'
                      }}>
                        {l.tcp}
                      </td>
                    ) : null}
                    <td style={{fontSize:12,color:'var(--dim)'}}>{l.examples}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Encapsulation Flow</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[7,4,3,2].map(l => {
              const item = data.find(d => d.osi === l);
              return (
                <div key={l} style={{
                  background:'var(--panel)', border:`1px solid var(--layer-${l})`, borderRadius:6, padding:'8px 12px',
                  display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                  <div style={{fontSize:11,fontWeight:600}}>{item.name}</div>
                  <div style={{fontSize:10,color:'var(--dim)',fontFamily:'var(--mono)'}}>{item.pdu}</div>
                </div>
              );
            })}
            <div style={{textAlign:'center',color:'var(--muted)',fontSize:18}}>↓</div>
            <div style={{background:'var(--cyan)', color:'#000', borderRadius:6, padding:8, textAlign:'center', fontWeight:700, fontSize:12}}>PHYSICAL WIRE / BITS</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Key Concepts</div>
          <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.6}}>
            <strong style={{color:'var(--text)'}}>OSI Model:</strong> A conceptual 7-layer model defined by ISO. It is primarily used for education and troubleshooting.
            <br/><br/>
            <strong style={{color:'var(--text)'}}>TCP/IP Model:</strong> The actual 4-layer stack used by the Internet (Application, Transport, Internet, Network Access).
            <br/><br/>
            <strong style={{color:'var(--text)'}}>Encapsulation:</strong> As data moves down the stack, each layer adds its own header (and sometimes a trailer) to the PDU from the layer above.
            <br/><br/>
            <strong style={{color:'var(--text)'}}>De-encapsulation:</strong> The reverse process as data moves up the stack on the receiving end.
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --layer-7: #ef4444; --layer-6: #f97316; --layer-5: #f59e0b;
          --layer-4: #22c55e; --layer-3: #06b6d4; --layer-2: #3b82f6; --layer-1: #8b5cf6;
        }
        .osi-table { border-collapse: collapse; width: 100%; border: 1px solid var(--border); }
        .osi-table td { padding: 12px 8px; border: 1px solid var(--border); }
        .osi-table th { background: var(--panel); padding: 10px 8px; border: 1px solid var(--border); text-align: left; font-size: 11px; color: var(--muted); }
      `}</style>
    </div>
  );
}

// ─── Tool: Packet Header Map ────────────────────────────────
window.OSIModel = OSIModel;
