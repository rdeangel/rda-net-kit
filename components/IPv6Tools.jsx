const { useState, useEffect, useCallback, useRef, useMemo } = React;

function IPv6Tools() {
  const [input, setInput] = useState('2001:db8::1');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    const expanded = IPv6.expand(input.split('/')[0]);
    if (!expanded) { setErr('Invalid IPv6 address'); return; }
    const compressed = IPv6.compress(input.split('/')[0]);
    const info = IPv6.classify(input.split('/')[0]);
    setResult({ expanded, compressed, info });
  };

  useEffect(() => calc(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">IPv6 Address</div>
        <div className="field">
          <label className="label">IPv6 Address (any notation)</label>
          <div className="input-row">
            <input className={`input ${err ? 'error' : ''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calc()} placeholder="2001:db8::1" />
            <button className="btn btn-primary" onClick={calc}>Analyze</button>
          </div>
          <Err msg={err} />
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">Results</div>
          <div className="result-grid" style={{marginBottom:16}}>
            <ResultItem label="Expanded (Full)" value={result.expanded} />
            <ResultItem label="Compressed" value={result.compressed} accent />
            <ResultItem label="Type" value={result.info?.type || 'Unknown'} />
            <ResultItem label="Scope" value={result.info?.scope || '-'} />
            <ResultItem label="RFC" value={result.info?.rfc || '-'} />
          </div>
          <div className="card-title" style={{marginTop:8}}>Address Groups</div>
          <div style={{fontFamily:'var(--mono)',fontSize:15,letterSpacing:2,color:'var(--text)',background:'var(--panel)',padding:'12px 16px',borderRadius:'var(--radius)',border:'1px solid var(--border)',wordBreak:'break-all'}}>
            {result.expanded.split(':').map((g, i) => (
              <span key={i}>
                <span style={{color: g === '0000' ? 'var(--dim)' : 'var(--cyan)'}}>{g}</span>
                {i < 7 && <span style={{color:'var(--muted)'}}>:</span>}
              </span>
            ))}
          </div>
          <div className="hint" style={{marginTop:6}}>
            {result.expanded.split(':').map((g, i) => (
              <span key={i} style={{marginRight:8,fontSize:10,color:'var(--dim)'}}>[{i}]:{parseInt(g,16)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IP Classifier ─────────────────────────────────────
window.IPv6Tools = IPv6Tools;
