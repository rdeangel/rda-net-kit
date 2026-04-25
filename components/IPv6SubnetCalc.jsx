const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPv6SubnetCalc() {
  const [input, setInput] = useState('2001:db8::/32');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const bigIntToHex = (n, pad=32) => n.toString(16).padStart(pad,'0');
  const hexToGroups = h => h.match(/.{4}/g).join(':');

  const calc = () => {
    setErr(''); setResult(null);
    const parts = input.trim().split('/');
    if (parts.length !== 2) { setErr('Enter an IPv6 CIDR (e.g. 2001:db8::/32)'); return; }
    const expanded = IPv6.expand(parts[0]);
    const prefix = parseInt(parts[1]);
    if (!expanded) { setErr('Invalid IPv6 address'); return; }
    if (isNaN(prefix) || prefix < 0 || prefix > 128) { setErr('Prefix must be 0–128'); return; }
    // Convert to BigInt
    const addrHex = expanded.replace(/:/g,'');
    const addrInt = BigInt('0x' + addrHex);
    const maxInt = (BigInt(1) << BigInt(128)) - BigInt(1);
    const maskBits = prefix === 0 ? BigInt(0) : ((BigInt(1) << BigInt(128)) - BigInt(1)) - ((BigInt(1) << BigInt(128 - prefix)) - BigInt(1));
    const networkInt = addrInt & maskBits;
    const broadcastInt = networkInt | ((BigInt(1) << BigInt(128 - prefix)) - BigInt(1));
    const networkHex = bigIntToHex(networkInt);
    const broadcastHex = bigIntToHex(broadcastInt);
    const networkStr = IPv6.compress(hexToGroups(networkHex));
    const lastStr = IPv6.compress(hexToGroups(broadcastHex));
    const totalStr = prefix <= 64 ? `2^${128-prefix} (≈ ${prefix <= 64 ? '10^' + Math.floor((128-prefix)*Math.log10(2)) : ''})` : (BigInt(1) << BigInt(128-prefix)).toLocaleString();
    const hostsStr = prefix >= 127 ? (prefix===128?'1':'2') : prefix <= 64 ? `2^${128-prefix}` : ((BigInt(1) << BigInt(128-prefix)) - BigInt(2)).toLocaleString();
    const info = IPv6.classify(parts[0]);
    setResult({ networkStr, lastStr, totalStr, hostsStr, prefix, expanded, compressed: IPv6.compress(parts[0]), info });
  };

  useEffect(() => calc(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">IPv6 CIDR</div>
        <div className="field">
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && calc()} placeholder="2001:db8::/32" />
            <button className="btn btn-primary" onClick={calc}>Calculate</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['::1/128','::/0','fe80::/10','fc00::/7','2001:db8::/32','2001:db8:1::/48','2001:db8:1:1::/64'].map(p => (
            <button key={p} className="btn btn-ghost btn-sm" onClick={() => { setInput(p); setTimeout(calc,0); }}>{p}</button>
          ))}
        </div>
      </div>
      {result && (
        <div className="card fadein">
          <div className="card-title">Subnet Information — /{result.prefix}</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="Network Address" value={result.networkStr} accent />
            <ResultItem label="Last Address" value={result.lastStr} red />
            <ResultItem label="Total Addresses" value={result.totalStr} />
            <ResultItem label="Usable Hosts" value={result.hostsStr} green />
            <ResultItem label="Prefix Length" value={`/${result.prefix}`} />
            <ResultItem label="Address Type" value={result.info?.type || 'Unknown'} />
            <ResultItem label="Scope" value={result.info?.scope || '-'} />
            <ResultItem label="RFC" value={result.info?.rfc || '-'} />
          </div>
          <div className="card-title" style={{marginTop:16}}>Expanded / Compressed</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="Full Expanded" value={result.expanded + `/${result.prefix}`} />
            <ResultItem label="Compressed" value={result.compressed + `/${result.prefix}`} accent />
          </div>
          <div className="card-title" style={{marginTop:16}}>Common Sub-prefixes from /{result.prefix}</div>
          <div className="table-wrap hide-mobile">
            <table><thead><tr><th>Prefix</th><th>Subnets</th><th>Addresses each</th></tr></thead>
            <tbody>
              {[4,8,16].map(delta => {
                const np = result.prefix + delta;
                if (np > 128) return null;
                return <tr key={delta}><td style={{color:'var(--cyan)'}}>/{np}</td><td>{Math.pow(2,delta).toLocaleString()}</td><td>{np<=64?`2^${128-np}`:np<=126?(Math.pow(2,128-np)).toLocaleString():np===127?'2':'1'}</td></tr>;
              }).filter(Boolean)}
            </tbody></table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards">
            {[4,8,16].map(delta => {
              const np = result.prefix + delta;
              if (np > 128) return null;
              return (
                <div key={delta} className="mobile-card">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Prefix</span>
                    <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>/{np}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Count / Size</span>
                    <span className="mobile-card-value">{Math.pow(2,delta).toLocaleString()} / {np<=64?`2^${128-np}`:np<=126?(Math.pow(2,128-np)).toLocaleString():np===127?'2':'1'}</span>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: Subnet Overlap Detector ───────────────────────────
window.IPv6SubnetCalc = IPv6SubnetCalc;
