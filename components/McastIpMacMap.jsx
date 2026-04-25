const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastIpMacMap() {
  const MODE_DEFAULTS = {
    'ip4-to-mac': '239.1.2.3',
    'mac-to-ip4': '01:00:5E:01:02:03',
    'ip6-to-mac': 'ff02::1',
    'range-map': '239.1.0.0/24',
  };
  const MODE_PRESETS = {
    'ip4-to-mac': [['224.0.0.1','All Hosts'],['224.0.0.5','OSPF'],['224.0.0.251','mDNS'],['232.1.2.3','SSM'],['239.255.255.250','SSDP']],
    'mac-to-ip4': [['01:00:5E:00:00:01','All Hosts'],['01:00:5E:00:00:05','OSPF'],['01:00:5E:00:00:FC','SSDP'],['01:00:5E:7F:FF:FA','239.255.255.250']],
    'ip6-to-mac': [['ff02::1','All Nodes'],['ff02::2','All Routers'],['ff02::fb','mDNS'],['ff05::1:3','DHCP']],
    'range-map': [['239.1.0.0/24','/24 block'],['232.0.0.0/16','SSM /16'],['239.255.255.0/28','/28 block']],
  };

  const [mode, setMode] = useState('ip4-to-mac');
  const [input, setInput] = useState('239.1.2.3');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const parseMac = (s) => {
    const clean = s.replace(/[:\-\.]/g, '').toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(clean)) return null;
    return clean;
  };

  const switchMode = (m) => {
    setMode(m);
    setInput(MODE_DEFAULTS[m]);
    setResult(null);
    setErr('');
  };

  const calc = () => {
    setErr(''); setResult(null);
    if (mode === 'ip4-to-mac') {
      const ip = IPv4.parse(input);
      if (ip === null) { setErr('Invalid IPv4 address'); return; }
      const a = (ip >>> 24) & 0xFF;
      const isMcast = a >= 224 && a <= 239;
      const mac = Multicast.ipv4ToMac(ip);
      const low23 = ip & 0x007FFFFF;
      const cls = Multicast.classifyIPv4(ip);
      setResult({ version: 4, ip: IPv4.str(ip), mac, isMcast, low23, low23Bin: low23.toString(2).padStart(23,'0'), scope: cls ? cls.scope : '-', block: cls ? cls.block : '-', rfc: cls ? cls.rfc : '-', description: cls ? cls.description : '-' });
    } else if (mode === 'mac-to-ip4') {
      const clean = parseMac(input);
      if (!clean) { setErr('Invalid MAC address (expected format: 01:00:5E:XX:XX:XX)'); return; }
      const ips = Multicast.macToIpv4Set(input);
      if (!ips) { setErr('MAC must start with 01:00:5E'); return; }
      setResult({ version: 'mac', mac: clean.match(/.{2}/g).join(':'), ips });
    } else if (mode === 'range-map') {
      const c = IPv4.parseCIDR(input);
      if (!c) { setErr('Invalid CIDR (e.g. 239.1.0.0/24)'); return; }
      const a = (c.ip >>> 24) & 0xFF;
      if (a < 224 || a > 239) { setErr('CIDR must be within multicast range 224.0.0.0/4'); return; }
      const sn = IPv4.subnet(c.ip, c.prefix);
      const totalHosts = sn.totalHosts;
      const maxShow = 256;
      const showAll = totalHosts <= maxShow;
      const macFirst = Multicast.ipv4ToMac(sn.network);
      const macLast = Multicast.ipv4ToMac(sn.broadcast);
      const entries = [];
      const limit = showAll ? totalHosts : Math.min(totalHosts, 20);
      for (let i = 0; i < limit; i++) {
        const addr = (sn.network + i) >>> 0;
        entries.push({ ip: IPv4.str(addr), mac: Multicast.ipv4ToMac(addr) });
      }
      setResult({ version: 'range', cidr: sn.cidr, totalHosts, showAll, macFirst, macLast, entries });
    } else {
      const expanded = IPv6.expand(input);
      if (!expanded) { setErr('Invalid IPv6 address'); return; }
      if (!expanded.startsWith('ff')) { setErr('Not an IPv6 multicast address (must start with ff)'); return; }
      const mac = Multicast.ipv6ToMac(expanded);
      const groups = expanded.split(':').map(g => parseInt(g, 16));
      const last32 = ((groups[6] << 16) | groups[7]) >>> 0;
      const cls = Multicast.classifyIPv6(expanded);
      setResult({ version: 6, expanded, compressed: IPv6.compress(input), mac, last32Hex: last32.toString(16).padStart(8,'0'), scopeName: cls ? cls.scopeName : '-', flagT: cls ? cls.flagT : false, flagP: cls ? cls.flagP : false });
    }
  };

  useEffect(() => calc(), []);

  const labelFor = (m) => m === 'ip4-to-mac' ? 'IPv4 Multicast Address' : m === 'mac-to-ip4' ? 'Multicast MAC Address' : m === 'range-map' ? 'Multicast CIDR Range' : 'IPv6 Multicast Address';

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Mode</div>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {[['ip4-to-mac','IPv4 → MAC'],['mac-to-ip4','MAC → IPv4'],['ip6-to-mac','IPv6 → MAC'],['range-map','Range Map']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => switchMode(v)}>{l}</button>
          ))}
        </div>
        <div className="field">
          <label className="label">{labelFor(mode)}</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && calc()} placeholder={MODE_DEFAULTS[mode]} />
            <button className="btn btn-primary" onClick={calc}>Map</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {(MODE_PRESETS[mode] || []).map(([val, lbl]) => (
            <button key={val} className="btn btn-ghost btn-sm" onClick={() => { setInput(val); setTimeout(calc,0); }}>{lbl}</button>
          ))}
        </div>
      </div>

      {result && result.version === 4 && (
        <div className="card fadein">
          <div className="card-title">Mapping Result</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="IPv4 Address" value={result.ip} accent />
            <ResultItem label="Ethernet MAC" value={result.mac} green />
            <ResultItem label="Is Multicast" value={result.isMcast ? 'Yes (Class D)' : 'No'} red={!result.isMcast} />
            <ResultItem label="Scope" value={result.scope} />
            <ResultItem label="Block" value={result.block} />
            <ResultItem label="RFC" value={result.rfc} />
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',marginTop:12}}>
            <div className="hint" style={{marginBottom:8,fontWeight:600}}>Bit-level Mapping (23-bit overlap)</div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:1,lineHeight:2}}>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>IP </span>
                {(() => {
                  const bin = IPv4.toBinary(IPv4.parse(result.ip));
                  return bin.split('').map((ch, i) => {
                    const isDot = ch === '.';
                    const pos = isDot ? -1 : (() => { let p = 0; for (let j = 0; j < i; j++) if (bin[j] !== '.') p++; return p; })();
                    const isLow = pos >= 9;
                    return <span key={i} style={{color: isDot ? 'var(--border)' : isLow ? 'var(--cyan)' : 'var(--dim)'}}>{ch}</span>;
                  });
                })()}
              </div>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>MAC</span>
                {(() => {
                  const macBytes = result.mac.split(':');
                  return macBytes.map((b, bi) => {
                    const bits = parseInt(b, 16).toString(2).padStart(8, '0');
                    const isPrefix = bi < 3;
                    return <span key={bi}>{bits.split('').map((bit, j) => (
                      <span key={j} style={{color: isPrefix ? 'var(--dim)' : 'var(--cyan)'}}>{bit}</span>
                    ))}{bi < 5 && <span style={{color:'var(--border)'}}>:</span>}</span>;
                  });
                })()}
              </div>
            </div>
            <div className="hint" style={{marginTop:8}}>MAC prefix <span style={{color:'var(--cyan)'}}>01:00:5E:0x</span> is fixed by IANA. Only lower 23 bits of the 28-bit Class D address fit, so 5 bits are lost — creating a 32:1 overlap (32 different IPs share one MAC).</div>
          </div>
        </div>
      )}

      {result && result.version === 'mac' && (
        <div className="card fadein">
          <div className="card-title">Reverse Lookup — 32 Overlapping IPs</div>
          <div className="hint" style={{marginBottom:8}}>Only 23 of 28 Class D bits are carried in the MAC. The 5 lost bits (4 low bits of first octet + high bit of second octet) create 2⁵ = 32 possible IPs per MAC.</div>
          <div className="table-wrap hide-mobile">
            <table><thead><tr><th>#</th><th>IP Address</th><th>Scope</th><th></th></tr></thead>
            <tbody>
              {result.ips.map((ip, i) => {
                const cls = Multicast.classifyIPv4(IPv4.parse(ip));
                return (
                  <tr key={i}>
                    <td style={{color:'var(--dim)'}}>{i+1}</td>
                    <td style={{color:'var(--cyan)',fontFamily:'var(--mono)'}}>{ip}</td>
                    <td style={{fontSize:12}}><span className={`badge ${cls && cls.isSSM ? 'badge-green' : cls && cls.scope === 'Link-Local' ? 'badge-yellow' : 'badge-blue'}`}>{cls ? cls.scope : '-'}</span></td>
                    <td><CopyBtn text={ip} /></td>
                  </tr>
                );
              })}
            </tbody></table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {result.ips.map((ip, i) => {
              const cls = Multicast.classifyIPv4(IPv4.parse(ip));
              return (
                <div key={i} className="mobile-card">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">IP #{i+1}</span>
                    <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{ip}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Scope</span>
                    <span className="mobile-card-value">{cls ? cls.scope : '-'}</span>
                  </div>
                  <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                    <CopyBtn text={ip} label="Copy IP" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(result.ips.join('\n'))}>Copy All IPs</button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(result.ips.map((ip,i) => { const c = Multicast.classifyIPv4(IPv4.parse(ip)); return {index:i+1,ip,scope:c?c.scope:'-',block:c?c.block:'-'}; }),'mcast-mac-ips.csv')}>Export CSV</button>
          </div>
        </div>
      )}

      {result && result.version === 6 && (
        <div className="card fadein">
          <div className="card-title">Mapping Result</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="IPv6 Address" value={result.compressed} accent />
            <ResultItem label="Expanded" value={result.expanded} />
            <ResultItem label="Ethernet MAC" value={result.mac} green />
            <ResultItem label="Scope" value={result.scopeName} />
            <ResultItem label="T Flag (Temporary)" value={result.flagT ? 'Yes' : 'No (Permanent)'} />
            <ResultItem label="P Flag (Unicast-Prefix)" value={result.flagP ? 'Yes' : 'No'} />
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',marginTop:12}}>
            <div className="hint" style={{marginBottom:8,fontWeight:600}}>Bit-level Mapping (32-bit suffix)</div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:1,lineHeight:2}}>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>v6 </span>
                {(() => {
                  const hex = result.expanded.replace(/:/g, '');
                  return <span>{hex.slice(0,24).split('').map((c,i) => <span key={i} style={{color:'var(--dim)'}}>{c}</span>)}<span style={{color:'var(--border)'}}>|</span>{hex.slice(24).split('').map((c,i) => <span key={i+100} style={{color:'var(--cyan)'}}>{c}</span>)}</span>;
                })()}
              </div>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>MAC</span>
                <span style={{color:'var(--dim)'}}>33:33:</span><span style={{color:'var(--cyan)'}}>{result.last32Hex.slice(0,2)}:{result.last32Hex.slice(2,4)}:{result.last32Hex.slice(4,6)}:{result.last32Hex.slice(6,8)}</span>
              </div>
            </div>
            <div className="hint" style={{marginTop:8}}>IPv6 multicast uses prefix <span style={{color:'var(--cyan)'}}>33:33</span> followed by the low 32 bits of the address. Unlike IPv4 (23-bit), all 32 bits map — no ambiguity. The MAC prefix 33:33 is defined in <RFCLink rfc="RFC 2464" />.</div>
          </div>
        </div>
      )}

      {result && result.version === 'range' && (
        <div className="card fadein">
          <div className="card-title">Range Map — {result.cidr}</div>
          <div className="result-grid grid-mobile-1" style={{marginBottom:12}}>
            <ResultItem label="CIDR" value={result.cidr} accent />
            <ResultItem label="Total Addresses" value={result.totalHosts.toLocaleString()} />
            <ResultItem label="First MAC" value={result.macFirst} green />
            <ResultItem label="Last MAC" value={result.macLast} green />
            {result.macFirst === result.macLast
              ? <ResultItem label="Overlap" value="All addresses share the same MAC (32:1)" red />
              : <ResultItem label="Unique MACs" value={(result.totalHosts > 32 ? result.totalHosts : 'Up to ' + result.totalHosts).toString()} />
            }
          </div>
          {!result.showAll && <div className="hint" style={{marginBottom:8}}>Showing first 20 of {result.totalHosts.toLocaleString()} addresses (max {256} for display). Export CSV for full list.</div>}
          <div className="table-wrap hide-mobile">
            <table><thead><tr><th>#</th><th>IP Address</th><th>Ethernet MAC</th><th></th></tr></thead>
            <tbody>
              {result.entries.map((e, i) => (
                <tr key={i}>
                  <td style={{color:'var(--dim)'}}>{i+1}</td>
                  <td style={{color:'var(--cyan)',fontFamily:'var(--mono)'}}>{e.ip}</td>
                  <td style={{color:'var(--green)',fontFamily:'var(--mono)'}}>{e.mac}</td>
                  <td><CopyBtn text={e.mac} /></td>
                </tr>
              ))}
            </tbody></table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {result.entries.map((e, i) => (
              <div key={i} className="mobile-card">
                <div className="mobile-card-row">
                  <span className="mobile-card-label">IP: {e.ip}</span>
                  <span className="mobile-card-value" style={{color:'var(--green)', fontWeight:600}}>{e.mac}</span>
                </div>
                <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                  <CopyBtn text={e.mac} label="Copy MAC" />
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const rows = [];
              for (let i = 0; i < result.totalHosts && i < 65536; i++) {
                const addr = (IPv4.parse(result.cidr.split('/')[0]) + i) >>> 0;
                rows.push({ip:IPv4.str(addr),mac:Multicast.ipv4ToMac(addr)});
              }
              exportCSV(rows,'mcast-range-map.csv');
            }}>Export CSV{result.totalHosts > 65536 ? ' (first 65K)' : ''}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(result.entries.map(e => e.ip + '\t' + e.mac).join('\n'))}>Copy Table</button>
          </div>
        </div>
      )}

      <div className="card fadein" style={{marginTop: result ? 0 : undefined}}>
        <div className="card-title">How Multicast MAC Mapping Works</div>
        <div className="table-wrap hide-mobile" style={{marginBottom:12}}>
          <table>
            <thead><tr><th>Protocol</th><th>MAC Prefix</th><th>IP Bits Used</th><th>Ambiguity</th><th>RFC</th></tr></thead>
            <tbody>
              <tr>
                <td style={{fontWeight:500}}>IPv4 Multicast</td>
                <td style={{color:'var(--cyan)',fontFamily:'var(--mono)'}}>01:00:5E:0x:xx:xx</td>
                <td>Lower 23 of 28 Class D bits</td>
                <td style={{color:'var(--yellow)'}}>32 IPs per MAC</td>
                <td style={{color:'var(--dim)'}}><RFCLink rfc="RFC 1112" /></td>
              </tr>
              <tr>
                <td style={{fontWeight:500}}>IPv6 Multicast</td>
                <td style={{color:'var(--cyan)',fontFamily:'var(--mono)'}}>33:33:xx:xx:xx:xx</td>
                <td>Lower 32 bits of address</td>
                <td style={{color:'var(--yellow)'}}>2^88 : 1 Overlap</td>
                <td style={{color:'var(--dim)'}}><RFCLink rfc="RFC 2464" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Mobile View */}
        <div className="show-mobile mobile-cards" style={{marginBottom:12}}>
          {[
            {p:'IPv4 Multicast', pre:'01:00:5E', a:'32:1', rfc:'RFC 1112'},
            {p:'IPv6 Multicast', pre:'33:33', a:'2^88:1', rfc:'RFC 2464'}
          ].map(m => (
            <div key={m.p} className="mobile-card">
              <div className="mobile-card-row">
                <span className="mobile-card-label">{m.p}</span>
                <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{m.pre}</span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-label">Ambiguity / RFC</span>
                <span className="mobile-card-value" style={{color:'var(--yellow)'}}>{m.a} ({m.rfc})</span>
              </div>
            </div>
          ))}
        </div>
              <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px'}}>
              <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.6}}>
              <strong style={{color:'var(--text)'}}>IPv4 (32:1):</strong> Class D addresses (224.0.0.0–239.255.255.255) have 28 significant bits, but Ethernet MACs only carry 23 bits after the IANA prefix <code style={{color:'var(--cyan)'}}>01:00:5E</code>. This leaves 5 bits of ambiguity (2^5 = 32), meaning 32 different multicast IPs map to the same MAC.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>IPv6 (2^88:1):</strong> Maps the low 32 bits of the address after the <code style={{color:'var(--cyan)'}}>33:33</code> prefix. Since an IPv6 multicast address has 128 bits (minus the 8-bit 'ff' prefix), there are 88 bits of address space that are "discarded" for the MAC mapping. This results in a staggering <strong style={{color:'var(--text)'}}>2^88 potential IP addresses</strong> mapping to a single MAC (though practically rare in most subnets).
              </div>
              </div>
      </div>
    </div>
  );
}

// ─── Tool: Multicast Analyzer ────────────────────────────────
window.McastIpMacMap = McastIpMacMap;
