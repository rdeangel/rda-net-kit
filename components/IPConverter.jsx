const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPConverter() {
  const [mode, setMode] = useState('decimal');
  const [val, setVal] = useState('192.168.1.100');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    let ip = null;
    if (mode === 'decimal') ip = IPv4.parse(val);
    else if (mode === 'binary') ip = IPv4.fromBinary(val);
    else if (mode === 'hex') ip = IPv4.fromHex(val);
    else if (mode === 'integer') { const n = parseInt(val.trim()); ip = (!isNaN(n) && n >= 0 && n <= 0xffffffff) ? n >>> 0 : null; }
    if (ip === null) { setErr('Invalid input for selected format'); return; }
    setResult({
      decimal: IPv4.str(ip),
      binary: IPv4.toBinary(ip),
      hex: IPv4.toHex(ip),
      integer: ip.toString(),
      octets: [24,16,8,0].map(s => (ip >>> s) & 0xff),
    });
  };

  useEffect(() => calc(), []);

  const placeholder = { decimal:'192.168.1.100', binary:'11000000.10101000.00000001.01100100', hex:'0xC0A80164', integer:'3232235876' };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Input Format</div>
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          {[['decimal','Dotted Decimal'],['binary','Binary'],['hex','Hexadecimal'],['integer','Integer']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => { setMode(v); setResult(null); setErr(''); }}>{l}</button>
          ))}
        </div>
        <div className="field">
          <label className="label">Value</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calc()} placeholder={placeholder[mode]} />
            <button className="btn btn-primary" onClick={calc}>Convert</button>
          </div>
          <Err msg={err} />
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">All Representations</div>
          <div className="result-grid">
            <ResultItem label="Dotted Decimal" value={result.decimal} accent />
            <ResultItem label="Hexadecimal" value={result.hex} />
            <ResultItem label="32-bit Integer" value={result.integer} />
          </div>
          <div className="card-title" style={{marginTop:16}}>Binary</div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px'}}>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:10}}>
              {result.octets.map((o, i) => (
                <div key={i} style={{textAlign:'center'}}>
                  <div className="bit-grid" style={{gridTemplateColumns:'repeat(8,1fr)',gap:3}}>
                    {o.toString(2).padStart(8,'0').split('').map((b, bi) => (
                      <div key={bi} className={`bit-cell ${b==='1'?'one':'zero'}`}>{b}</div>
                    ))}
                  </div>
                  <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)',textAlign:'center',marginTop:4}}>{o}</div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:'var(--mono)',fontSize:12,letterSpacing:1,color:'var(--text)',wordBreak:'break-all'}}>
              {result.binary.split('.').map((oct, oi) => (
                <span key={oi}>
                  {oct.split('').map((b,bi) => (
                    <span key={bi} style={{color: b==='1'?'var(--cyan)':'var(--dim)'}}>{b}</span>
                  ))}
                  {oi < 3 && <span style={{color:'var(--border)'}}>.</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="card-title" style={{marginTop:16}}>Octet Breakdown</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {result.octets.map((o, i) => (
              <div key={i} style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:11,color:'var(--dim)',marginBottom:4}}>Octet {i+1}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:600,color:'var(--cyan)'}}>{o}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>0x{o.toString(16).toUpperCase().padStart(2,'0')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: Subnet Visual Map ──────────────────────────────────
window.IPConverter = IPConverter;
