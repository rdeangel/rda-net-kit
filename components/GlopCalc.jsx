const { useState, useEffect, useCallback, useRef, useMemo } = React;

function GlopCalc() {
  const [mode, setMode] = useState('as-to-glop');
  const [asInput, setAsInput] = useState('64512');
  const [glopInput, setGlopInput] = useState('233.251.0.1');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    if (mode === 'as-to-glop') {
      const asNum = parseInt(asInput.trim());
      if (isNaN(asNum) || asNum < 0 || asNum > 65535) { setErr('AS number must be 0–65535 (16-bit)'); return; }
      const g = Multicast.asToGlop(asNum);
      const block = IPv4.subnet(IPv4.parse(`233.${g.x}.${g.y}.0`), 24);
      setResult({ asNum, x: g.x, y: g.y, block: g.block, start: block.networkStr, end: block.broadcastStr, total: 256, mac: Multicast.ipv4ToMac(IPv4.parse(`233.${g.x}.${g.y}.0`)) });
    } else {
      const ip = IPv4.parse(glopInput);
      if (ip === null) { setErr('Invalid IPv4 address'); return; }
      const a = (ip >>> 24) & 0xFF;
      if (a !== 233) { setErr('GLOP addresses must start with 233.x.x.x'); return; }
      const b = (ip >>> 16) & 0xFF;
      const c = (ip >>> 8) & 0xFF;
      const asNum = Multicast.glopToAs(b, c);
      const g = Multicast.asToGlop(asNum);
      const block = IPv4.subnet(IPv4.parse(`233.${b}.${c}.0`), 24);
      setResult({ asNum, x: b, y: c, block: g.block, start: block.networkStr, end: block.broadcastStr, total: 256, mac: Multicast.ipv4ToMac(IPv4.parse(`233.${b}.${c}.0`)) });
    }
  };

  useEffect(() => calc(), []);
  useEffect(() => { const t = setTimeout(calc, 300); return () => clearTimeout(t); }, [asInput, glopInput, mode]);

  const switchMode = (m) => { setMode(m); setResult(null); setErr(''); };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Mode</div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[['as-to-glop','AS → GLOP Block'],['glop-to-as','GLOP → AS Number']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => switchMode(v)}>{l}</button>
          ))}
        </div>
        {mode === 'as-to-glop' ? (
          <div className="field">
            <label className="label">AS Number (0–65535)</label>
            <div className="input-row">
              <input className={`input ${err?'error':''}`} type="number" value={asInput} onChange={e => setAsInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && calc()} placeholder="64512" min="0" max="65535" />
              <button className="btn btn-primary" onClick={calc}>Calculate</button>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
              {[['64512','Private'],['15169','Google'],['13335','Cloudflare'],['14618','Amazon'],['0','AS 0']].map(([v,l]) => (
                <button key={v} className="btn btn-ghost btn-sm" onClick={() => setAsInput(v)}>{l}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="field">
            <label className="label">GLOP Multicast Address (233.x.y.z)</label>
            <div className="input-row">
              <input className={`input ${err?'error':''}`} value={glopInput} onChange={e => setGlopInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && calc()} placeholder="233.1.2.0" />
              <button className="btn btn-primary" onClick={calc}>Extract AS</button>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:8}}>
              {[['233.252.0.1','AS 64512'],['233.59.41.1','AS 15169'],['233.52.71.1','AS 13335'],['233.57.26.1','AS 14618']].map(([v,l]) => (
                <button key={v} className="btn btn-ghost btn-sm" onClick={() => setGlopInput(v)}>{l}</button>
              ))}
            </div>
          </div>
        )}
        <Err msg={err} />
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">GLOP Result</div>
          <div className="result-grid">
            <ResultItem label="AS Number" value={`AS ${result.asNum}`} accent />
            <ResultItem label="GLOP Block" value={result.block} green />
            <ResultItem label="Block Start" value={result.start} />
            <ResultItem label="Block End" value={result.end} />
            <ResultItem label="Total Addresses" value={result.total.toString()} />
            <ResultItem label="Base MAC" value={result.mac} />
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',marginTop:12}}>
            <div className="hint" style={{marginBottom:8,fontWeight:600}}>Encoding Breakdown</div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:1,lineHeight:2}}>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>AS </span>
                <span style={{color:'var(--dim)'}}>{result.asNum.toString(2).padStart(16,'0').slice(0,8)}</span>
                <span style={{color:'var(--border)'}}>.</span>
                <span style={{color:'var(--dim)'}}>{result.asNum.toString(2).padStart(16,'0').slice(8)}</span>
                <span style={{color:'var(--muted)',marginLeft:8}}>= {result.asNum}</span>
              </div>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}>IP </span>
                <span style={{color:'var(--cyan)'}}>233</span>
                <span style={{color:'var(--border)'}}>.</span>
                <span style={{padding:'2px 3px',background:'rgba(245,158,11,0.15)',borderRadius:3,color:'var(--yellow)'}}>{result.x}</span>
                <span style={{color:'var(--border)'}}>.</span>
                <span style={{padding:'2px 3px',background:'rgba(0,212,200,0.15)',borderRadius:3,color:'var(--cyan)'}}>{result.y}</span>
                <span style={{color:'var(--border)'}}>.</span>
                <span style={{color:'var(--dim)'}}>0</span>
              </div>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:36}}> </span>
                <span style={{color:'var(--dim)'}}>fixed</span>
                <span style={{marginLeft:3,color:'var(--yellow)'}}>{'\u2191'} X=AS/256</span>
                <span style={{marginLeft:6,color:'var(--cyan)'}}>{'\u2191'} Y=AS%256</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card fadein" style={{marginTop: result ? 0 : undefined}}>
        <div className="card-title">How GLOP Works</div>
        <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
          <strong style={{color:'var(--text)'}}>GLOP</strong> (<RFCLink rfc="RFC 3180" />) is a method to allocate multicast address space based on your <strong style={{color:'var(--text)'}}>Autonomous System (AS) number</strong>. Every 16-bit AS number gets a dedicated /24 block in the 233.0.0.0/8 range — no registration required.
          <br/><br/>
          <strong style={{color:'var(--text)'}}>Formula:</strong> Your block is <code style={{color:'var(--cyan)'}}>233.<span style={{color:'var(--yellow)'}}>X</span>.<span style={{color:'var(--green)'}}>Y</span>.0/24</code> where <code style={{color:'var(--yellow)'}}>X = AS / 256</code> (high byte) and <code style={{color:'var(--green)'}}>Y = AS % 256</code> (low byte). This gives each AS 256 multicast addresses.
          <br/><br/>
          <strong style={{color:'var(--text)'}}>Use case:</strong> ISPs and content providers use their GLOP block to assign unique multicast groups to different streams or services. Since the mapping is deterministic, any network operator can compute which AS a 233.x.y.z address belongs to — useful for troubleshooting multicast source identification.
          <br/><br/>
          <strong style={{color:'var(--text)'}}>Limitation:</strong> Only supports 16-bit AS numbers (0–65535). For 32-bit AS numbers, see <RFCLink rfc="RFC 5771" /> which reserves 234.0.0.0/7 for extended GLOP.
        </div>
      </div>
    </div>
  );
}

// ─── Tool: Multicast Reference ───────────────────────────────
window.GlopCalc = GlopCalc;
