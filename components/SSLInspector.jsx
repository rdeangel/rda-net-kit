const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SSLInspector() {
  const [domain, setDomain] = useState('');
  const [proxy, setProxy] = useState(SSL_DEFAULT_PROXY);
  const [showProxy, setShowProxy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const cleanDomain = s => s.replace(/^https?:\/\//, '').split('/')[0].split('?')[0].trim();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sslProxy = url => proxy.trim() ? `${proxy.trim()}${encodeURIComponent(url)}` : url;

  const runScan = async () => {
    const host = cleanDomain(domain);
    if (!host) { setErr('Enter a domain name'); return; }
    setErr(''); setResult(null); setLoading(true); setProgress(0);
    setScanStatus('Initiating scan…');
    try {
      // Kick off the scan (ignore response — may error if cached scan exists)
      try { await fetch(sslProxy(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&startNew=on&all=done`)); } catch(_){}
      let data, attempts = 0;
      do {
        const allDone = data?.endpoints?.length > 0 && data.endpoints.every(ep => ep.progress === 100);
        await sleep(allDone ? 3000 : 10000); // poll fast once endpoints finish
        setScanStatus(s => s === 'Initiating scan…' ? 'Waiting for scan to start…' : s);
        const r = await fetch(sslProxy(`https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(host)}&all=done`));
        if (r.status === 429) { await sleep(15000); continue; } // back off on rate limit
        if (!r.ok) throw new Error(`Proxy returned HTTP ${r.status}`);
        data = await r.json();
        attempts++;
        const eps = data.endpoints || [];
        const allEndpointsDone = eps.length > 0 && eps.every(e => e.progress === 100);
        const avgProgress = eps.length ? Math.round(eps.reduce((s, e) => s + (e.progress || 0), 0) / eps.length) : 0;
        const doneCount = eps.filter(e => e.progress === 100).length;
        setProgress(avgProgress);
        const status = data.status || '';
        if (status === 'DNS') setScanStatus('Resolving DNS…');
        else if (allEndpointsDone && status !== 'READY') setScanStatus('Finalizing…');
        else if (eps.length > 1) setScanStatus(`Scanning ${doneCount}/${eps.length} endpoints…`);
        else if (eps[0]?.statusMessage) setScanStatus(eps[0].statusMessage);
        else setScanStatus('Scanning…');
      } while (data?.status !== 'READY' && data?.status !== 'ERROR' && attempts < 36);
      if (data?.status === 'ERROR') throw new Error(data.statusMessage || 'SSL Labs scan error');
      if (data?.status !== 'READY') throw new Error('Scan timed out after 6 minutes. Try again — results may be cached.');
      setResult(data);
    } catch (e) {
      setErr(e.message || 'Scan failed — check network or try a different CORS proxy.');
    }
    setLoading(false);
  };

  const gradeColor = g => !g ? 'var(--muted)' : g.startsWith('A') ? 'var(--green)' : g === 'B' ? '#8bc34a' : g === 'C' ? 'var(--yellow)' : 'var(--red)';

  const formatExpiry = ts => {
    if (!ts) return 'N/A';
    const d = new Date(ts), now = new Date();
    const days = Math.ceil((d - now) / 86400000);
    return `${d.toISOString().split('T')[0]} (${days > 0 ? `${days}d remaining` : `EXPIRED ${Math.abs(days)}d ago`})`;
  };

  const revMap = { 0:'Not checked', 1:'Revoked', 2:'Good', 3:'No status', 4:'Unknown', 5:'Not revoked' };

  const getWarnings = (ep, protos, details) => {
    const w = [];
    if (details?.hstsPolicy?.status !== 'present') w.push('No HSTS policy');
    if (!protos.some(p => p.id === 772))            w.push('TLS 1.3 not supported');
    if (details?.forwardSecrecy === 1)              w.push('Forward secrecy with some browsers only');
    if (details?.protocolIntolerance > 0)           w.push('Protocol intolerance detected');
    if (details?.heartbleed)                        w.push('Heartbleed vulnerable');
    if (details?.poodle)                            w.push('POODLE (SSLv3) vulnerable');
    if (details?.poodleTls === 2)                   w.push('POODLE (TLS) vulnerable');
    if (details?.freak)                             w.push('FREAK vulnerable');
    if (details?.logjam)                            w.push('Logjam vulnerable');
    if (details?.bleichenbacher > 1)                w.push('ROBOT / Bleichenbacher vulnerable');
    if (details?.openSslCcs === 3)                  w.push('OpenSSL CCS injection vulnerable');
    return w;
  };

  const chainIssueStr = n => {
    if (!n) return 'None';
    const f = [];
    if (n & 1) f.push('Incomplete');
    if (n & 2) f.push('Extra certs');
    if (n & 4) f.push('Cross-cert');
    if (n & 16) f.push('Unvalidatable');
    if (n & 32) f.push('No chain sent');
    return f.join(', ') || 'Issues present';
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">SSL / TLS Certificate Inspector <span className="badge badge-blue" style={{marginLeft:8,fontSize:10}}>via SSL Labs API</span></div>
        <div className="field">
          <label className="label">Domain Name</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && runScan()}
              placeholder="example.com" />
            <button className="btn btn-primary" onClick={runScan} disabled={loading}>{loading ? '…' : 'Inspect'}</button>
          </div>
          <Err msg={err} />
          <div style={{display:'flex',gap:6,alignItems:'center',marginTop:6}}>
            <div className="hint" style={{margin:0}}>Full TLS scan via Qualys SSL Labs — first-time scans take 60–90 seconds.</div>
            <span style={{fontSize:10,color:'var(--cyan)',cursor:'pointer',whiteSpace:'nowrap'}} onClick={() => setShowProxy(!showProxy)}>Proxy ▾</span>
            {domain.trim() && <a href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(cleanDomain(domain))}`} target="_blank" rel="noopener" style={{fontSize:10,color:'var(--muted)',whiteSpace:'nowrap',marginLeft:4}}>Open in SSL Labs ↗</a>}
          </div>
          {showProxy && (
            <div className="field" style={{marginTop:8}}>
              <label className="label">CORS Proxy URL (prefix — target URL is appended encoded)</label>
              <input className="input" value={proxy} onChange={e => setProxy(e.target.value)}
                placeholder="https://api.allorigins.win/raw?url=" style={{fontFamily:'var(--mono)',fontSize:11}} />
              <div className="hint">Leave as default for hosted use. Clear it if running on a server with direct SSL Labs access.</div>
            </div>
          )}
        </div>
        {loading && (
          <div style={{marginTop:12}}>
            <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:6}}>
              <span style={{color:'var(--muted)',fontSize:12}}>{scanStatus}</span>
              {progress > 0 && <span style={{color:'var(--cyan)',fontSize:12,fontFamily:'var(--mono)'}}>{progress}%</span>}
            </div>
            <div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.max(5,progress)}%`,background:'var(--cyan)',borderRadius:2,transition:'width .5s ease'}} />
            </div>
          </div>
        )}
      </div>

      {result && result.endpoints?.map((ep, ei) => {
        const leafId = ep.details?.certChains?.[0]?.certIds?.[0];
        const cert = result.certs?.find(c => c.id === leafId);
        const chainIssues = ep.details?.certChains?.[0]?.issues;
        const protos = ep.details?.protocols || [];
        const expired = cert?.notAfter && new Date(cert.notAfter) < new Date();
        const warnings = ep.hasWarnings ? getWarnings(ep, protos, ep.details) : [];
        return (
          <div key={ei} className="card fadein">
            <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:warnings.length ? 12 : 20,flexWrap:'wrap'}}>
              <div style={{fontSize:56,fontWeight:800,fontFamily:'var(--mono)',color:gradeColor(ep.grade),lineHeight:1,minWidth:60}}>{ep.grade || '?'}</div>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>{result.host}</div>
                <div style={{color:'var(--muted)',fontSize:12,fontFamily:'var(--mono)'}}>{ep.ipAddress}</div>
                <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                  {ep.hasWarnings && <span className="badge badge-yellow">Warnings</span>}
                  {ep.gradeTrustIgnored && ep.gradeTrustIgnored !== ep.grade && (
                    <span className="badge" style={{color:'var(--muted)'}}>Trust-ignored: {ep.gradeTrustIgnored}</span>
                  )}
                  {expired && <span className="badge badge-red">EXPIRED</span>}
                </div>
              </div>
            </div>
            {warnings.length > 0 && (
              <div style={{marginBottom:20,padding:'10px 12px',background:'rgba(255,193,7,.07)',border:'1px solid rgba(255,193,7,.2)',borderRadius:6}}>
                {warnings.map((w, i) => (
                  <div key={i} style={{fontSize:12,color:'var(--yellow)',display:'flex',alignItems:'center',gap:6,marginTop:i?4:0}}>
                    <span>⚠</span><span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {cert && (<>
              <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',fontWeight:700,letterSpacing:1,marginBottom:10}}>Certificate</div>
              <div className="result-grid">
                <ResultItem label="Common Name" value={(cert.commonNames||[]).join(', ') || 'N/A'} />
                <ResultItem label="SANs" value={cert.altNames?.length ? `${cert.altNames.slice(0,6).join(', ')}${cert.altNames.length>6?` +${cert.altNames.length-6} more`:''}` : 'None'} />
                <ResultItem label="Issuer" value={cert.issuerSubject || 'N/A'} />
                <ResultItem label="Valid From" value={cert.notBefore ? new Date(cert.notBefore).toISOString().split('T')[0] : 'N/A'} />
                <ResultItem label="Expires" value={formatExpiry(cert.notAfter)} red={expired} green={!expired} />
                <ResultItem label="Key" value={`${cert.keyAlg||'?'} ${cert.keyStrength||'?'}-bit`} />
                <ResultItem label="Signature" value={cert.sigAlg || 'N/A'} />
                <ResultItem label="Revocation" value={revMap[cert.revocationStatus] || 'Unknown'} green={cert.revocationStatus===2} red={cert.revocationStatus===1} />
                {chainIssues != null && <ResultItem label="Chain Issues" value={chainIssueStr(chainIssues)} green={!chainIssues} red={!!chainIssues} />}
              </div>
            </>)}

            {protos.length > 0 && (<>
              <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',fontWeight:700,letterSpacing:1,margin:'18px 0 10px'}}>Protocol Support</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[{id:769,label:'TLS 1.0',bad:true},{id:770,label:'TLS 1.1',bad:true},{id:771,label:'TLS 1.2',bad:false},{id:772,label:'TLS 1.3',bad:false}].map(({id,label,bad}) => {
                  const on = protos.some(p => p.id === id);
                  return (
                    <span key={id} className={`badge ${on ? (bad ? 'badge-red' : 'badge-green') : ''}`} style={{opacity:on?1:0.35}}>
                      {on ? '✓' : '✗'} {label}
                    </span>
                  );
                })}
              </div>
            </>)}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tool: HTTP Header Analyzer ───────────────────────────────
const HTTP_SECURITY_CHECKS = [
  { key:'strict-transport-security',   label:'HSTS',                  impact:'critical', rec:'max-age=31536000; includeSubDomains', desc:'Enforces HTTPS. Protects against SSL stripping attacks.' },
  { key:'content-security-policy',     label:'Content-Security-Policy',impact:'critical', rec:"default-src 'self'",                  desc:'Prevents XSS and injection. Controls allowed resource origins.' },
  { key:'x-frame-options',             label:'X-Frame-Options',        impact:'high',     rec:'DENY or SAMEORIGIN',                  desc:'Prevents clickjacking by blocking iframe embedding.' },
  { key:'x-content-type-options',      label:'X-Content-Type-Options', impact:'medium',   rec:'nosniff',                             desc:'Prevents MIME-type sniffing attacks.' },
  { key:'referrer-policy',             label:'Referrer-Policy',        impact:'medium',   rec:'strict-origin-when-cross-origin',     desc:'Controls referrer info sent with requests.' },
  { key:'permissions-policy',          label:'Permissions-Policy',     impact:'medium',   rec:'camera=(), microphone=()',            desc:'Restricts browser API access (camera, mic, geolocation, etc.).' },
  { key:'cross-origin-opener-policy',  label:'COOP',                   impact:'low',      rec:'same-origin',                         desc:'Isolates browsing context from cross-origin threats.' },
  { key:'cross-origin-embedder-policy',label:'COEP',                   impact:'low',      rec:'require-corp',                        desc:'Requires explicit permission for cross-origin resources.' },
  { key:'x-xss-protection',            label:'X-XSS-Protection',       impact:'legacy',   rec:'1; mode=block',                       desc:'Legacy XSS filter. Deprecated — CSP is the modern replacement.' },
];

const IMPACT_COLOR = { critical:'var(--red)', high:'var(--yellow)', medium:'var(--cyan)', low:'var(--muted)', legacy:'var(--dim)' };

window.SSLInspector = SSLInspector;
