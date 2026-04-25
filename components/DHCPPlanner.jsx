const { useState, useEffect, useCallback, useRef, useMemo } = React;

function DHCPPlanner() {
  const [cidr, setCidr]               = useState('192.168.1.0/24');
  const [excludeStart, setExcludeStart] = useState('10');
  const [excludeEnd, setExcludeEnd]   = useState('5');
  const [leaseDays, setLeaseDays]     = useState('1');
  const [leaseHours, setLeaseHours]   = useState('0');
  const [dnsServer, setDnsServer]     = useState('8.8.8.8');
  const [dnsServer2, setDnsServer2]   = useState('8.8.4.4');
  const [domainName, setDomainName]   = useState('corp.local');
  const [poolName, setPoolName]       = useState('LAN_POOL');
  const [result, setResult]           = useState(null);
  const [err, setErr]                 = useState('');

  const calculate = () => {
    setErr(''); setResult(null);
    const parsed = IPv4.parseCIDR(cidr.trim());
    if (!parsed) { setErr('Invalid CIDR notation (e.g. 192.168.1.0/24)'); return; }
    if (parsed.prefix < 8 || parsed.prefix > 30) { setErr('Prefix must be between /8 and /30'); return; }
    const info       = IPv4.subnet(parsed.ip, parsed.prefix);
    const totalHosts = info.hostCount;
    const excS       = Math.max(0, parseInt(excludeStart)||0);
    const excE       = Math.max(0, parseInt(excludeEnd)||0);
    if (excS + excE >= totalHosts) { setErr('Excluded IPs exceed available host count'); return; }
    const firstNum   = IPv4.parse(info.firstHostStr);
    const lastNum    = IPv4.parse(info.lastHostStr);
    const scopeStartNum = firstNum + excS;
    const scopeEndNum   = lastNum  - excE;
    setResult({
      network:    info.networkStr,
      broadcast:  info.broadcastStr,
      subnetMask: info.maskStr,
      firstUsable:info.firstHostStr,
      lastUsable: info.lastHostStr,
      totalHosts, excS, excE,
      poolSize:   Math.max(0, totalHosts - excS - excE),
      scopeStart: IPv4.str(scopeStartNum),
      scopeEnd:   IPv4.str(scopeEndNum),
      defaultGw:  info.firstHostStr,
      prefix:     parsed.prefix,
    });
  };

  useEffect(()=>{ calculate(); }, []);

  const genIOS = () => {
    if (!result) return '';
    const excSNum = IPv4.parse(result.firstUsable);
    const excENum = IPv4.parse(result.lastUsable);
    const lines = ['! Cisco IOS DHCP Configuration'];
    if (result.excS > 0) lines.push(`ip dhcp excluded-address ${result.firstUsable} ${IPv4.str(excSNum + result.excS - 1)}`);
    if (result.excE > 0) lines.push(`ip dhcp excluded-address ${IPv4.str(excENum - result.excE + 1)} ${result.lastUsable}`);
    lines.push('!');
    lines.push(`ip dhcp pool ${poolName}`);
    lines.push(` network ${result.network} ${result.subnetMask}`);
    lines.push(` default-router ${result.defaultGw}`);
    lines.push(` dns-server ${dnsServer}${dnsServer2?' '+dnsServer2:''}`);
    if (domainName) lines.push(` domain-name ${domainName}`);
    lines.push(` lease ${parseInt(leaseDays)||0}${parseInt(leaseHours)>0?' '+leaseHours:''}`);
    return lines.join('\n');
  };

  const genNXOS = () => {
    if (!result) return '';
    const excSNum = IPv4.parse(result.firstUsable);
    const excENum = IPv4.parse(result.lastUsable);
    const lines = ['! Cisco NX-OS DHCP Configuration (feature dhcp required)'];
    lines.push('feature dhcp');
    lines.push('ip dhcp relay information option');
    if (result.excS > 0) lines.push(`ip dhcp excluded-address ${result.firstUsable} ${IPv4.str(excSNum + result.excS - 1)}`);
    if (result.excE > 0) lines.push(`ip dhcp excluded-address ${IPv4.str(excENum - result.excE + 1)} ${result.lastUsable}`);
    lines.push('!');
    lines.push(`ip dhcp pool ${poolName}`);
    lines.push(`  network ${result.network}/${result.prefix}`);
    lines.push(`  default-router ${result.defaultGw}`);
    lines.push(`  dns-server ${dnsServer}${dnsServer2?' '+dnsServer2:''}`);
    if (domainName) lines.push(`  domain-name ${domainName}`);
    lines.push(`  lease ${parseInt(leaseDays)||0} ${parseInt(leaseHours)||0} 0`);
    return lines.join('\n');
  };

  const [cfgTab, setCfgTab] = useState('ios');

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Subnet & Pool</div>
        <div className="two-col grid-mobile-1"
 style={{gap:20}}>
          <div className="field">
            <label className="label">Network (CIDR)</label>
            <div className="input-row">
              <input className={`input ${err?'error':''}`} value={cidr} onChange={e=>setCidr(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&calculate()} placeholder="192.168.1.0/24"/>
              <button className="btn btn-primary" onClick={calculate}>Plan</button>
            </div>
            <Err msg={err}/>
          </div>
          <div className="field">
            <label className="label">Pool Name</label>
            <input className="input" value={poolName} onChange={e=>setPoolName(e.target.value)} placeholder="LAN_POOL"/>
          </div>
        </div>
        <div className="two-col grid-mobile-1"
 style={{gap:20,marginTop:12}}>
          <div className="field">
            <label className="label">Exclude from START of range</label>
            <input className="input" type="number" min="0" value={excludeStart} onChange={e=>setExcludeStart(e.target.value)} placeholder="10"/>
            <div className="hint">IPs reserved for routers, servers, printers at the low end</div>
          </div>
          <div className="field">
            <label className="label">Exclude from END of range</label>
            <input className="input" type="number" min="0" value={excludeEnd} onChange={e=>setExcludeEnd(e.target.value)} placeholder="5"/>
            <div className="hint">IPs reserved at the high end for static devices</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">DHCP Options</div>
        <div className="two-col grid-mobile-1"
 style={{gap:20}}>
          <div className="field">
            <label className="label">Primary DNS</label>
            <input className="input" value={dnsServer} onChange={e=>setDnsServer(e.target.value)} placeholder="8.8.8.8"/>
          </div>
          <div className="field">
            <label className="label">Secondary DNS</label>
            <input className="input" value={dnsServer2} onChange={e=>setDnsServer2(e.target.value)} placeholder="8.8.4.4"/>
          </div>
          <div className="field">
            <label className="label">Domain Name</label>
            <input className="input" value={domainName} onChange={e=>setDomainName(e.target.value)} placeholder="corp.local"/>
          </div>
          <div className="field">
            <label className="label">Lease Duration</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input className="input" type="number" min="0" value={leaseDays} onChange={e=>setLeaseDays(e.target.value)} style={{width:70}}/>
              <span style={{color:'var(--muted)',whiteSpace:'nowrap',fontSize:13}}>days</span>
              <input className="input" type="number" min="0" max="23" value={leaseHours} onChange={e=>setLeaseHours(e.target.value)} style={{width:70}}/>
              <span style={{color:'var(--muted)',whiteSpace:'nowrap',fontSize:13}}>hours</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Scope Summary</div>
            <div className="result-grid grid-mobile-1">
              <ResultItem label="Network"          value={`${result.network}/${result.prefix}`}/>
              <ResultItem label="Subnet Mask"      value={result.subnetMask}/>
              <ResultItem label="Default Gateway"  value={result.defaultGw} accent/>
              <ResultItem label="Total Usable"     value={result.totalHosts.toLocaleString()}/>
              <ResultItem label="Excluded (start)" value={result.excS} red={result.excS>0}/>
              <ResultItem label="Excluded (end)"   value={result.excE} red={result.excE>0}/>
              <ResultItem label="DHCP Pool Size"   value={result.poolSize.toLocaleString()} green/>
              <ResultItem label="Scope Start"      value={result.scopeStart} accent/>
              <ResultItem label="Scope End"        value={result.scopeEnd} accent/>
              <ResultItem label="Lease"            value={`${leaseDays}d ${leaseHours}h`}/>
            </div>
            {result.poolSize < 10 && (
              <div style={{marginTop:12,padding:'8px 12px',background:'rgba(239,68,68,.1)',border:'1px solid var(--red)',borderRadius:'var(--radius)',color:'var(--red)',fontSize:12}}>
                ⚠ Pool has only {result.poolSize} addresses. Consider a larger subnet or fewer exclusions.
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Lease Duration Guide</div>
            <div className="table-wrap hide-mobile"><table>
              <thead><tr><th>Environment</th><th>Recommended Lease</th><th>Rationale</th></tr></thead>
              <tbody>
                {[
                  ['Corporate LAN (stable)', '8h – 3d',   'Few devices, predictable, reduces DHCP chatter'],
                  ['Wireless / Guest',       '1h – 8h',   'High device churn, limited pool reuse needed'],
                  ['Data Centre servers',    'Infinite',   'Servers should be static or use DHCP reservations'],
                  ['VoIP phones',            '1h – 4h',   'Phones restart for firmware; short lease avoids stale entries'],
                  ['IoT devices',            '24h',        'Low mobility, moderate pool, stable enough'],
                  ['High-density events',    '30m – 2h',  'Maximum pool reuse; short lease reclaims fast'],
                  ['Branch WAN / dial-up',   '2d – 7d',   'Minimise DHCP renewal traffic over expensive WAN'],
                ].map(([env,rec,rat])=>(
                  <tr key={env}>
                    <td style={{fontWeight:600}}>{env}</td>
                    <td style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontSize:12}}>{rec}</td>
                    <td style={{fontSize:12,color:'var(--muted)'}}>{rat}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {/* Mobile View */}
            <div className="show-mobile mobile-cards">
              {[
                ['Corporate LAN', '8h – 3d', 'Stable device count'],
                ['Wireless / Guest', '1h – 8h', 'High churn, pool reuse'],
                ['Data Centre', 'Infinite', 'Reservations preferred'],
                ['VoIP phones', '1h – 4h', 'Firmware updates'],
                ['IoT devices', '24h', 'Low mobility'],
                ['High-density', '30m – 2h', 'Max pool reuse'],
                ['Branch WAN', '2d – 7d', 'Save renewal traffic'],
              ].map(([env, rec, rat]) => (
                <div key={env} className="mobile-card">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{env}</span>
                    <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{rec}</span>
                  </div>
                  <div className="mobile-card-row" style={{borderBottom:'none'}}>
                    <span className="mobile-card-value" style={{textAlign:'left', paddingLeft:0, color:'var(--muted)', fontSize:11}}>{rat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Generated Configuration</div>
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              {[{id:'ios',l:'Cisco IOS'},{id:'nxos',l:'Cisco NX-OS'}].map(p=>(
                <button key={p.id} className={`btn btn-sm ${cfgTab===p.id?'btn-primary':'btn-ghost'}`}
                  onClick={()=>setCfgTab(p.id)}>{p.l}</button>
              ))}
              <div style={{marginLeft:'auto'}}>
                <CopyBtn text={cfgTab==='ios'?genIOS():genNXOS()}/>
              </div>
            </div>
            <pre style={{margin:0,padding:'12px 16px',background:'var(--bg)',borderRadius:'var(--radius)',
              fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',whiteSpace:'pre-wrap',lineHeight:1.7}}>
              {cfgTab==='ios'?genIOS():genNXOS()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: Network CLI Quick Reference ────────────────────────
window.DHCPPlanner = DHCPPlanner;
