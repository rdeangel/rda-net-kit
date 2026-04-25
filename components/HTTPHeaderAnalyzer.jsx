const { useState, useEffect, useCallback, useRef, useMemo } = React;

function HTTPHeaderAnalyzer() {
  const [url, setUrl] = useState('');
  const [proxy, setProxy] = useState('http://localhost:8080/proxy/fetch?url=');
  const [showProxy, setShowProxy] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('security');
  const [copied, copy] = useCopy();

  const hasProxy = proxy.trim().length > 0;
  const proxyUrl = target => `${proxy.trim()}${encodeURIComponent(target)}`;

  const curlCmd = () => {
    const target = url.trim();
    if (!target) return 'curl -sI https://example.com';
    return `curl -sI "${target.startsWith('http') ? target : 'https://' + target}"`;
  };

  const parseRaw = text => {
    const lines = text.trim().split(/\r?\n/);
    const headers = {};
    let statusLine = '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (/^HTTP\//i.test(t)) { statusLine = t; continue; }
      const colon = t.indexOf(':');
      if (colon > 0) {
        headers[t.slice(0, colon).trim().toLowerCase()] = t.slice(colon + 1).trim();
      }
    }
    const statusMatch = statusLine.match(/\s(\d{3})\s/);
    return { statusLine, statusCode: statusMatch ? statusMatch[1] : '?', headers };
  };

  const analyzePasted = () => {
    if (!rawInput.trim()) return;
    setResult(parseRaw(rawInput));
    setTab('security');
  };

  const analyzeLive = async () => {
    let target = url.trim();
    if (!target) { setErr('Enter a URL'); return; }
    if (!target.startsWith('http')) target = 'https://' + target;
    setErr(''); setResult(null); setLoading(true);
    try {
      const res = await fetch(proxyUrl(target));
      if (!res.ok && res.status !== 403) throw new Error(`HTTP ${res.status}`);
      const headers = {};
      res.headers.forEach((v, k) => { headers[k] = v; });
      const statusLine = `HTTP/${res.ok ? '1.1' : '?'} ${res.status} ${res.statusText || ''}`;
      setResult({ statusLine, statusCode: String(res.status), headers });
      setTab('security');
    } catch (e) {
      setErr(e.message || 'Fetch failed — check the proxy URL and target.');
    }
    setLoading(false);
  };

  const analyze = hasProxy ? analyzeLive : analyzePasted;

  const checks = result ? HTTP_SECURITY_CHECKS.map(c => ({
    ...c, value: result.headers[c.key] || null, pass: !!(result.headers[c.key])
  })) : [];

  const scored = checks.filter(c => c.impact !== 'legacy');
  const score = scored.filter(c => c.pass).length;
  const grade = score >= 7 ? 'A+' : score >= 6 ? 'A' : score >= 5 ? 'B' : score >= 4 ? 'C' : score >= 2 ? 'D' : 'F';
  const gradeColor = g => g.startsWith('A') ? 'var(--green)' : g === 'B' ? '#8bc34a' : g === 'C' ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title" style={{display:'flex',alignItems:'center',gap:8}}>
          HTTP Header Analyzer
          {hasProxy && <span className="badge badge-green" style={{fontSize:10}}>Live Fetch</span>}
        </div>

        <div className="field">
          <label className="label">{hasProxy ? 'Target URL' : 'URL (generates curl command)'}</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && analyze()}
              placeholder="https://example.com" />
            {hasProxy && <button className="btn btn-primary" onClick={analyzeLive} disabled={loading}>{loading ? '…' : 'Fetch'}</button>}
          </div>
        </div>

        {!hasProxy && (
          <>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px',display:'flex',gap:10,alignItems:'center',marginBottom:16}}>
              <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',flex:1,wordBreak:'break-all'}}>{curlCmd()}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => copy(curlCmd(), 'curl')}>{copied==='curl'?'✓ Copied':'Copy'}</button>
            </div>
            <div className="field">
              <label className="label">Paste the curl output below</label>
              <textarea className="input" style={{minHeight:130,fontFamily:'var(--mono)',fontSize:11,resize:'vertical',lineHeight:1.6}}
                value={rawInput} onChange={e => setRawInput(e.target.value)}
                placeholder={'HTTP/2 200\ncontent-type: text/html\nstrict-transport-security: max-age=31536000\nx-frame-options: DENY\nx-content-type-options: nosniff\n...'} />
            </div>
            <button className="btn btn-primary" onClick={analyzePasted} disabled={!rawInput.trim()}>Analyze Headers</button>
          </>
        )}

        <Err msg={err} />

        <div style={{display:'flex',gap:6,alignItems:'center',marginTop:10}}>
          <div className="hint" style={{margin:0}}>{hasProxy ? 'Fetching via CORS proxy. Clear proxy to switch to paste mode.' : 'Works offline and for internal servers. Set a proxy below for live fetch.'}</div>
          <span style={{fontSize:10,color:'var(--cyan)',cursor:'pointer',whiteSpace:'nowrap'}} onClick={() => setShowProxy(!showProxy)}>Proxy ▾</span>
        </div>
        {showProxy && (
          <div className="field" style={{marginTop:8}}>
            <label className="label">CORS Proxy URL (prefix — target URL is appended encoded)</label>
            <input className="input" value={proxy} onChange={e => setProxy(e.target.value)}
              placeholder="https://api.allorigins.win/raw?url=" style={{fontFamily:'var(--mono)',fontSize:11}} />
            <div className="hint">Example: https://api.allorigins.win/raw?url= or https://corsproxy.io/?</div>
          </div>
        )}
      </div>

      {result && (
        <div className="card fadein">
          <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
            <div style={{fontSize:48,fontWeight:800,fontFamily:'var(--mono)',color:gradeColor(grade),lineHeight:1}}>{grade}</div>
            <div>
              <div style={{fontWeight:600,fontSize:13,fontFamily:'var(--mono)'}}>{result.statusLine || `HTTP ${result.statusCode}`}</div>
              <div style={{color:'var(--muted)',fontSize:12,marginTop:2}}>{score}/{scored.length} security headers present · {Object.keys(result.headers).length} total headers</div>
            </div>
          </div>

          <div style={{display:'flex',gap:4,alignItems:'center',borderBottom:'1px solid var(--border)',marginBottom:16}}>
            <div style={{display:'flex',gap:4,flex:1}}>
              {[['security','Security Analysis'],['headers','All Headers']].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{padding:'6px 14px',fontSize:12,fontWeight:600,border:'none',background:'none',cursor:'pointer',
                    color:tab===id?'var(--cyan)':'var(--muted)',
                    borderBottom:tab===id?'2px solid var(--cyan)':'2px solid transparent',marginBottom:-1}}>
                  {label}
                </button>
              ))}
            </div>
            {tab === 'security' && (
              <button className="btn btn-ghost btn-sm" style={{marginBottom:4}} onClick={() => {
                const lines = [
                  `URL: ${url.trim() || '(pasted)'}`,
                  `Grade: ${grade}`,
                  `${result.statusLine || `HTTP ${result.statusCode}`}`,
                  `${score}/${scored.length} security headers present · ${Object.keys(result.headers).length} total headers`,
                  '',
                  ...checks.map(c => [
                    `${c.pass ? '✓' : '✗'} ${c.label} [${c.impact}]`,
                    `  ${c.desc}`,
                    c.value ? `  Value: ${c.value}` : `  Recommended: ${c.rec}`,
                  ].join('\n')),
                ];
                copy(lines.join('\n'), 'copyall');
              }}>{copied==='copyall' ? '✓ Copied' : 'Copy All'}</button>
            )}
            {tab === 'headers' && (
              <button className="btn btn-ghost btn-sm" style={{marginBottom:4}} onClick={() => {
                const headerLines = Object.entries(result.headers).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}: ${v}`).join('\n');
                copy(`URL: ${url.trim() || '(pasted)'}\n\n${headerLines}`, 'copyall');
              }}>{copied==='copyall' ? '✓ Copied' : 'Copy All'}</button>
            )}
          </div>

          {tab === 'security' && (
            <div>
              {checks.map(c => (
                <div key={c.key} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:16,minWidth:20,marginTop:1}}>{c.pass ? '✅' : '❌'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:3}}>
                      <span style={{fontWeight:600,fontSize:13,fontFamily:'var(--mono)',color:c.pass?'var(--text)':'var(--muted)'}}>{c.label}</span>
                      <span style={{fontSize:10,color:IMPACT_COLOR[c.impact],fontWeight:600,textTransform:'uppercase'}}>{c.impact}</span>
                    </div>
                    <div style={{fontSize:11,color:'var(--dim)',marginBottom:c.value?4:0}}>{c.desc}</div>
                    {c.value
                      ? <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--cyan)',background:'var(--panel)',padding:'4px 8px',borderRadius:4,wordBreak:'break-all'}}>{c.value}</div>
                      : <div style={{fontSize:11,color:'var(--dim)'}}>Recommended: <span style={{fontFamily:'var(--mono)',color:'var(--muted)'}}>{c.rec}</span></div>
                    }
                  </div>
                  {c.value && <CopyBtn text={c.value} />}
                </div>
              ))}
            </div>
          )}

          {tab === 'headers' && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Header</th><th>Value</th><th></th></tr></thead>
                <tbody>
                  {Object.entries(result.headers).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => {
                    const isSec = HTTP_SECURITY_CHECKS.some(c => c.key === k);
                    return (
                      <tr key={k}>
                        <td style={{fontFamily:'var(--mono)',fontSize:11,color:isSec?'var(--cyan)':'var(--muted)',whiteSpace:'nowrap'}}>{k}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:11,wordBreak:'break-all'}}>{v}</td>
                        <td><CopyBtn text={v} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: Self-Signed Certificate Generator ──────────────────
window.HTTPHeaderAnalyzer = HTTPHeaderAnalyzer;
