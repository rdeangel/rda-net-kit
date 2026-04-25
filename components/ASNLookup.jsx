const { useState, useEffect, useCallback, useRef, useMemo } = React;

function CopyAllBtn({ getText }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button className="btn btn-ghost btn-sm" onClick={copy} style={{marginLeft:'auto'}}>
      {copied ? '✓ Copied' : 'Copy All'}
    </button>
  );
}

function ASNLookup() {
  const [queries, setQueries] = useState({ ip: '', asn: '' });
  const [mode, setMode] = useState('ip');
  const query = queries[mode];
  const setQuery = (v) => setQueries(q => ({ ...q, [mode]: v }));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const lookup = async (overrideQuery, overrideMode) => {
    const m = overrideMode ?? mode;
    const q = (overrideQuery ?? query).trim();
    if (!q && m === 'asn') { setErr('Enter an AS number'); return; }
    setErr(''); setResult(null); setLoading(true);
    try {
      if (m === 'ip') {
        const ip = q ? encodeURIComponent(q) : '';
        const target = `https://ipwhois.app/json/${ip}`;
        const base = window.LOCAL_PROXY
          ? `${window.LOCAL_PROXY}${encodeURIComponent(target)}`
          : target;
        const res = await fetch(base, {signal: AbortSignal.timeout(8000)});
        const d = await res.json();
        if (!d.success && d.message) { setErr(d.message); setLoading(false); return; }
        setResult({ mode: m, data: {
          ip: d.ip || q || '—',
          asn: d.asn || '—',
          org: d.org || '—',
          isp: d.isp || '—',
          country: d.country || '—',
          country_code: d.country_code || '',
          region: d.region || '—',
          city: d.city || '—',
          postal: d.postal || '—',
          lat: d.latitude,
          lon: d.longitude,
          timezone: d.timezone || '—',
          timezone_gmt: d.timezone_gmt || '',
          continent: d.continent || '—',
          type: d.type || '—',
          hostname: d.hostname || '',
          currency: d.currency ? `${d.currency} (${d.currency_code})` : '',
          country_flag: d.country_flag || '',
        }});
      } else {
        // RIPE Stat ASN lookup
        const res = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${q.replace(/^as/i,'')}`, {signal: AbortSignal.timeout(8000)});
        const d = await res.json();
        if (d.status === 'ok' && d.data) {
          // Fetch prefixes in parallel
          const asnNum = d.data.resource;
          const [v4Res, v6Res] = await Promise.all([
            fetch(`https://stat.ripe.net/data/ris-prefixes/data.json?resource=AS${asnNum}&list_prefixes=true`, {signal: AbortSignal.timeout(8000)}).then(r=>r.json()).catch(()=>null),
            null // v6 included in same response
          ]);
          const v4Prefixes = v4Res?.data?.prefixes?.v4?.originating || [];
          const v6Prefixes = v4Res?.data?.prefixes?.v6?.originating || [];
          setResult({ mode, data: {
            asn: asnNum,
            name: d.data.holder,
            description_short: d.data.block?.desc || '',
            country_code: '',
            announced: d.data.announced,
            block: d.data.block,
            prefixes_v4: v4Prefixes.slice(0, 500).map(p => ({ prefix: p })),
            prefixes_v6: v6Prefixes.slice(0, 500).map(p => ({ prefix: p })),
            rir_allocation: { rir_name: d.data.block?.name || '' },
            website: '',
          }});
        } else setErr('No ASN data found');
      }
    } catch (e) { setErr(`Request failed: ${e.message || e}`); }
    setLoading(false);
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">BGP / ASN Lookup <span className="badge badge-blue" style={{marginLeft:8,fontSize:10}}>via RIPE Stat</span></div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          {[['ip','IP Address'],['asn','AS Number']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => {
              if (v === 'asn' && result?.mode === 'ip' && result?.data?.asn) {
                setQueries(q => ({ ...q, asn: result.data.asn.replace(/^AS/i, '') }));
              }
              setMode(v); setResult(null); setErr('');
            }}>{l}</button>
          ))}
        </div>
        {mode === 'ip' && !window.LOCAL_PROXY && (
          <div className="alert alert-warn" style={{marginBottom:12}}>
            IP lookups require the Docker proxy. Look up directly at{' '}
            <a href="https://ipwhois.app" target="_blank" rel="noopener noreferrer">ipwhois.app</a>.
          </div>
        )}
        <div className="field">
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key==='Enter' && lookup()} placeholder={mode==='ip'?'My IP (leave blank) or enter an IP':'AS15169 or 15169'} />
            <button className="btn btn-primary" onClick={() => lookup()} disabled={loading}>{loading?'...':'Lookup'}</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {mode === 'ip'
            ? <>
                {['8.8.8.8','1.1.1.1','208.67.222.222','9.9.9.9'].map(p => <button key={p} className="btn btn-ghost btn-sm" onClick={() => { setQuery(p); lookup(p, 'ip'); }}>{p}</button>)}
                <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); lookup('', 'ip'); }}>My IP</button>
              </>
            : ['15169','13335','3356','7922','20940'].map(a => <button key={a} className="btn btn-ghost btn-sm" onClick={() => { setQuery(a); lookup(a, 'asn'); }}>AS{a}</button>)
          }
        </div>
      </div>

      {result && result.mode === 'ip' && result.data && (
        <div className="card fadein">
          <div className="card-title" style={{display:'flex',alignItems:'center'}}>
            IP Information <span className="badge badge-blue" style={{marginLeft:8,fontSize:10}}>via ipwhois</span>
            <CopyAllBtn getText={() => {
              const d = result.data;
              const lines = [
                `IP: ${d.ip}`, `Type: ${d.type}`, `ASN: ${d.asn}`, `ISP: ${d.isp}`,
                `Organization: ${d.org}`,
                ...(d.hostname ? [`Hostname: ${d.hostname}`] : []),
                `Country: ${d.country_code ? `${d.country} (${d.country_code})` : d.country}`,
                `Region: ${d.region}`, `City: ${d.city}`, `Postal: ${d.postal}`,
                ...(d.lat != null ? [`Coordinates: ${d.lat}, ${d.lon}`] : []),
                `Timezone: ${d.timezone} (UTC${d.timezone_gmt})`,
                `Continent: ${d.continent}`,
                ...(d.currency ? [`Currency: ${d.currency}`] : []),
              ];
              return lines.join('\n');
            }} />
          </div>
          <div className="result-grid grid-mobile-1" style={{marginBottom:12}}>
            <ResultItem label="IP" value={result.data.ip} accent />
            <ResultItem label="Type" value={result.data.type} />
            <ResultItem label="ASN" value={result.data.asn} />
            <ResultItem label="ISP" value={result.data.isp} />
            <ResultItem label="Organization" value={result.data.org} />
            {result.data.hostname && <ResultItem label="Hostname" value={result.data.hostname} />}
          </div>
          <div className="card-title" style={{marginTop:4}}>Geolocation</div>
          <div className="result-grid grid-mobile-1" style={{marginBottom:12}}>
            <ResultItem label="Country" value={result.data.country_code ? `${result.data.country} (${result.data.country_code})` : result.data.country} />
            <ResultItem label="Region" value={result.data.region} />
            <ResultItem label="City" value={result.data.city} />
            <ResultItem label="Postal" value={result.data.postal} />
            {result.data.lat != null && <ResultItem label="Coordinates" value={`${result.data.lat}, ${result.data.lon}`} />}
            <ResultItem label="Timezone" value={`${result.data.timezone} (UTC${result.data.timezone_gmt})`} />
            <ResultItem label="Continent" value={result.data.continent} />
            {result.data.currency && <ResultItem label="Currency" value={result.data.currency} />}
          </div>
        </div>
      )}

      {result && result.mode === 'asn' && (
        <div className="card fadein">
          <div className="card-title" style={{display:'flex',alignItems:'center'}}>
            AS{result.data.asn} — {result.data.name}
            <CopyAllBtn getText={() => {
              const d = result.data;
              const lines = [
                `ASN: AS${d.asn}`, `Name: ${d.name}`,
                `Description: ${d.description_short || d.description_full?.[0] || '-'}`,
                `Country: ${d.country_code || '-'}`, `Website: ${d.website || '-'}`,
                `RIR: ${d.rir_allocation?.rir_name || '-'}`,
                ...(d.prefixes_v4?.length ? [`\nIPv4 Prefixes:`, ...d.prefixes_v4.map(p => p.prefix)] : []),
                ...(d.prefixes_v6?.length ? [`\nIPv6 Prefixes:`, ...d.prefixes_v6.map(p => p.prefix)] : []),
              ];
              return lines.join('\n');
            }} />
          </div>
          <div className="result-grid grid-mobile-1" style={{marginBottom:16}}>
            <ResultItem label="ASN" value={`AS${result.data.asn}`} accent />
            <ResultItem label="Name" value={result.data.name} />
            <ResultItem label="Description" value={result.data.description_short || result.data.description_full?.[0] || '-'} />
            <ResultItem label="Country" value={result.data.country_code || '-'} />
            <ResultItem label="Website" value={result.data.website || '-'} />
            <ResultItem label="RIR" value={result.data.rir_allocation?.rir_name || '-'} />
          </div>
          {result.data.prefixes_v4?.length > 0 && (
            <>
              <div className="card-title">IPv4 Prefixes ({result.data.prefixes_v4.length})</div>
              <div className="table-wrap hide-mobile" style={{maxHeight:200,overflowY:'auto'}}>
                <table><thead><tr><th>Prefix</th></tr></thead>
                <tbody>{result.data.prefixes_v4.slice(0,50).map((p,i) => (
                  <tr key={i}><td style={{color:'var(--cyan)'}}>{p.prefix}</td></tr>
                ))}</tbody></table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards" style={{maxHeight:200, overflowY:'auto'}}>
                {result.data.prefixes_v4.slice(0,50).map((p,i) => (
                  <div key={i} className="mobile-card" style={{padding:'6px 12px'}}>
                    <span style={{color:'var(--cyan)', fontFamily:'var(--mono)', fontSize:12}}>{p.prefix}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {result.data.prefixes_v6?.length > 0 && (
            <>
              <div className="card-title" style={{marginTop:12}}>IPv6 Prefixes ({result.data.prefixes_v6.length})</div>
              <div className="table-wrap hide-mobile" style={{maxHeight:200,overflowY:'auto'}}>
                <table><thead><tr><th>Prefix</th></tr></thead>
                <tbody>{result.data.prefixes_v6.slice(0,50).map((p,i) => (
                  <tr key={i}><td style={{color:'var(--purple)'}}>{p.prefix}</td></tr>
                ))}</tbody></table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards" style={{maxHeight:200, overflowY:'auto'}}>
                {result.data.prefixes_v6.slice(0,50).map((p,i) => (
                  <div key={i} className="mobile-card" style={{padding:'6px 12px'}}>
                    <span style={{color:'var(--purple)', fontFamily:'var(--mono)', fontSize:12}}>{p.prefix}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: Ping Sweep Planner ─────────────────────────────────
window.ASNLookup = ASNLookup;
