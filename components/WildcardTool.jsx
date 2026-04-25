const { useState, useEffect, useCallback, useRef, useMemo } = React;

function WildcardTool() {
  const [input, setInput] = useState('255.255.255.0');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    const trimmed = input.trim();
    // Could be a mask, CIDR prefix, or IP/CIDR
    let mask = null, prefix = null;
    if (/^\d+$/.test(trimmed)) {
      prefix = parseInt(trimmed);
      if (prefix < 0 || prefix > 32) { setErr('Prefix must be 0–32'); return; }
      mask = IPv4.mask(prefix);
    } else if (trimmed.startsWith('/')) {
      prefix = parseInt(trimmed.slice(1));
      if (isNaN(prefix) || prefix < 0 || prefix > 32) { setErr('Invalid prefix'); return; }
      mask = IPv4.mask(prefix);
    } else {
      mask = IPv4.parse(trimmed);
      if (mask === null) { setErr('Invalid subnet mask or prefix'); return; }
      // Determine prefix from mask
      let m = mask, p = 0;
      while (p < 32 && (m & 0x80000000) !== 0) { m = (m << 1) >>> 0; p++; }
      prefix = p;
    }
    const wildcard = (~mask) >>> 0;
    setResult({
      mask: IPv4.str(mask), wildcard: IPv4.str(wildcard),
      maskHex: IPv4.toHex(mask), wildcardHex: IPv4.toHex(wildcard),
      maskBinary: IPv4.toBinary(mask), wildcardBinary: IPv4.toBinary(wildcard),
      prefix,
    });
  };

  useEffect(() => calc(), []);

  const prefixes = Array.from({ length: 33 }, (_, i) => i);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Input</div>
        <div className="field">
          <label className="label">Subnet Mask, CIDR Prefix (/24), or just 24</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calc()} placeholder="255.255.255.0 or /24 or 24" />
            <button className="btn btn-primary" onClick={calc}>Calculate</button>
          </div>
          <Err msg={err} />
        </div>
        <div className="card-title" style={{marginTop:8}}>Quick Select</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
          {[8,16,24,25,26,27,28,29,30,32].map(p => (
            <button key={p} className={`btn btn-ghost btn-sm ${result?.prefix===p?'btn-primary':''}`} onClick={() => { setInput(String(p)); setTimeout(calc,0); }}>/{p}</button>
          ))}
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">Results — /{result.prefix}</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="Subnet Mask" value={result.mask} accent />
            <ResultItem label="Wildcard Mask" value={result.wildcard} yellow />
            <ResultItem label="Prefix Length" value={`/${result.prefix}`} />
            <ResultItem label="Mask (Hex)" value={result.maskHex} />
            <ResultItem label="Wildcard (Hex)" value={result.wildcardHex} />
            <ResultItem label="Host Bits" value={32 - result.prefix} />
          </div>
          <div className="card-title" style={{marginTop:16}}>Binary Representation</div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 16px'}}>
            <div className="label" style={{marginBottom:6}}>Subnet Mask</div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',letterSpacing:1}}>
              {result.maskBinary.split('.').map((oct, oi) => (
                <span key={oi}>
                  {oct.split('').map((b,bi) => (
                    <span key={bi} style={{color: b==='1'?'var(--cyan)':'var(--dim)'}}>{b}</span>
                  ))}
                  {oi < 3 && <span style={{color:'var(--border)'}}>.</span>}
                </span>
              ))}
            </div>
            <div className="label" style={{marginBottom:6,marginTop:10}}>Wildcard Mask</div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',letterSpacing:1}}>
              {result.wildcardBinary.split('.').map((oct, oi) => (
                <span key={oi}>
                  {oct.split('').map((b,bi) => (
                    <span key={bi} style={{color: b==='1'?'var(--yellow)':'var(--dim)'}}>{b}</span>
                  ))}
                  {oi < 3 && <span style={{color:'var(--border)'}}>.</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="card-title" style={{marginTop:16}}>All Prefix Reference</div>
          <div className="table-wrap hide-mobile" style={{maxHeight:240,overflowY:'auto'}}>
            <table>
              <thead><tr><th>Prefix</th><th>Subnet Mask</th><th>Wildcard</th><th>Hosts</th></tr></thead>
              <tbody>
                {prefixes.map(p => {
                  const m = IPv4.mask(p);
                  const w = (~m)>>>0;
                  const hosts = p <= 30 ? Math.pow(2,32-p)-2 : p===31 ? 2 : 1;
                  return (
                    <tr key={p} style={result.prefix===p?{background:'rgba(0,212,200,.07)'}:{}}>
                      <td style={{color: result.prefix===p?'var(--cyan)':'inherit'}}>/{p}</td>
                      <td>{IPv4.str(m)}</td>
                      <td style={{color:'var(--yellow)'}}>{IPv4.str(w)}</td>
                      <td style={{color:'var(--green)'}}>{hosts.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile View */}
          <div className="show-mobile mobile-cards" style={{maxHeight:300, overflowY:'auto'}}>
            {prefixes.map(p => {
              const m = IPv4.mask(p);
              const w = (~m)>>>0;
              const hosts = p <= 30 ? Math.pow(2,32-p)-2 : p===31 ? 2 : 1;
              return (
                <div key={p} className="mobile-card" style={result.prefix===p?{borderColor:'var(--cyan)', background:'rgba(0,212,200,.05)'}:{}}>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Prefix</span>
                    <span className="mobile-card-value" style={{color: result.prefix===p?'var(--cyan)':'inherit', fontWeight:600}}>/{p}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Mask / Wildcard</span>
                    <span className="mobile-card-value">{IPv4.str(m)} / <span style={{color:'var(--yellow)'}}>{IPv4.str(w)}</span></span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Usable Hosts</span>
                    <span className="mobile-card-value" style={{color:'var(--green)'}}>{hosts.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IP Converter ──────────────────────────────────────
window.WildcardTool = WildcardTool;
