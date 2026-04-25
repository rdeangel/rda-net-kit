const { useState, useEffect, useCallback, useRef, useMemo } = React;

function GeoLookup() {
  const [ip, setIp] = useState('');
  const [provider, setProvider] = useState(GEO_PROVIDERS[0]?.id || 'ipapi');
  const [showProviders, setShowProviders] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const currentProvider = GEO_PROVIDERS.find(p => p.id === provider);

  const normalizeResult = (d, provId) => {
    if (provId === 'ipwhois') {
      if (!d.success && d.message) return { error: d.message };
      return {
        ip: d.ip, country_code: d.country_code, country: d.country,
        region: d.region, city: d.city, postal: d.postal,
        lat: d.latitude, lon: d.longitude, timezone: d.timezone,
        timezone_gmt: d.timezone_gmt, isp: d.isp, org: d.org, asn: d.asn,
        continent: d.continent, hostname: d.hostname,
        currency: d.currency ? `${d.currency} (${d.currency_code})` : '',
      };
    }
    if (provId === 'ipapi') {
      if (d.status === 'fail') return { error: d.message || 'Lookup failed' };
      return {
        ip: d.query, country_code: d.countryCode, country: d.country,
        region: d.regionName, city: d.city, postal: d.zip,
        lat: d.lat, lon: d.lon, timezone: d.timezone,
        isp: d.isp, org: d.org, asn: d.as,
        continent: d.continent, hostname: d.reverse,
        proxy: d.proxy, hosting: d.hosting, mobile: d.mobile,
      };
    }
    if (provId === 'ipinfo') {
      if (d.bogon) return { error: 'Bogon/private IP' };
      const [lat, lon] = (d.loc || '').split(',');
      return {
        ip: d.ip, country_code: d.country, country: d.country,
        region: d.region, city: d.city, postal: d.postal,
        lat: lat || '', lon: lon || '', timezone: d.timezone,
        org: d.org, asn: (d.org || '').split(' ')[0],
        hostname: d.hostname, anycast: d.anycast,
      };
    }
    return { error: 'Unknown provider' };
  };

  const buildFields = (r) => {
    const f = [['IP Address', r.ip]];
    if (r.country) f.push(['Country', r.country_code && r.country_code.length === 2 ? `${r.country} (${r.country_code})` : r.country]);
    if (r.region) f.push(['Region', r.region]);
    if (r.city) f.push(['City', r.city]);
    if (r.postal) f.push(['Postal Code', r.postal]);
    if (r.timezone) f.push(['Timezone', r.timezone_gmt ? `${r.timezone} (UTC${r.timezone_gmt})` : r.timezone]);
    if (r.lat) f.push(['Latitude', r.lat]);
    if (r.lon) f.push(['Longitude', r.lon]);
    if (r.continent) f.push(['Continent', r.continent]);
    if (r.isp) f.push(['ISP', r.isp]);
    if (r.org) f.push(['Organization', r.org]);
    if (r.asn) f.push(['ASN', r.asn]);
    if (r.hostname) f.push(['Hostname / Reverse', r.hostname]);
    if (r.currency) f.push(['Currency', r.currency]);
    if (r.proxy != null) f.push(['Proxy', r.proxy ? 'Yes' : 'No']);
    if (r.hosting != null) f.push(['Hosting', r.hosting ? 'Yes' : 'No']);
    if (r.mobile != null) f.push(['Mobile', r.mobile ? 'Yes' : 'No']);
    if (r.anycast != null) f.push(['Anycast', r.anycast ? 'Yes' : 'No']);
    return f;
  };

  const lookup = async (target) => {
    const val = (target || ip).trim();
    setErr(''); setResult(null); setLoading(true);
    try {
      const res = await fetch(currentProvider.url(val || ''));
      const d = await res.json();
      const normalized = normalizeResult(d, provider);
      if (normalized.error) { setErr(normalized.error); setLoading(false); return; }
      setResult(normalized);
    } catch { setErr('Request failed — check network connection'); }
    setLoading(false);
  };

  const fields = result ? buildFields(result) : [];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title" style={{display:'flex',alignItems:'center',gap:8}}>
          IP Geolocation
          <div style={{position:'relative',display:'inline-block'}}>
            <span className="badge badge-blue" style={{cursor:'pointer',fontSize:10}} onClick={() => setShowProviders(!showProviders)}>via {currentProvider.label} ▾</span>
            {showProviders && (
              <div style={{position:'absolute',top:'100%',left:0,marginTop:4,background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:4,zIndex:100,minWidth:160,boxShadow:'0 4px 12px rgba(0,0,0,.3)'}}>
                {GEO_PROVIDERS.map(p => (
                  <div key={p.id} onClick={() => { setProvider(p.id); setShowProviders(false); setResult(null); setErr(''); }}
                    style={{padding:'6px 10px',borderRadius:4,cursor:'pointer',fontSize:12,color:p.id===provider?'var(--cyan)':'var(--text)',background:p.id===provider?'rgba(0,212,200,.1)':'transparent'}}>
                    {p.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="field">
          <label className="label">IP Address (leave blank for your own IP)</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={ip} onChange={e => setIp(e.target.value)}
              onKeyDown={e => e.key==='Enter' && lookup()} placeholder="8.8.8.8 or blank for my IP" />
            <button className="btn btn-primary" onClick={() => lookup()} disabled={loading}>{loading?'...':'Lookup'}</button>
          </div>
          <Err msg={err} />
          <div className="hint">Only works for public IPs. Private ranges return limited data.</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['8.8.8.8','1.1.1.1','208.67.222.222','9.9.9.9'].map(p => (
            <button key={p} className="btn btn-ghost btn-sm" onClick={() => { setIp(p); lookup(p); }}>{p}</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => { setIp(''); lookup(''); }}>My IP</button>
        </div>
      </div>
      {result && (
        <div className="card fadein">
          <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:16,flexWrap:'wrap'}}>
            <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 20px',textAlign:'center',minWidth:120}}>
              <div style={{fontSize:32}}>{result.country_code && result.country_code.length === 2 ? String.fromCodePoint(...[...result.country_code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '🌐'}</div>
              <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--cyan)',marginTop:4}}>{result.ip}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>{result.city}{result.region ? `, ${result.region}` : ''}</div>
              <div style={{color:'var(--muted)',fontSize:13}}>{result.country}{result.timezone ? ` · ${result.timezone}` : ''}</div>
              {result.org && <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)',marginTop:4}}>{result.org}</div>}
            </div>
          </div>
          <div className="result-grid">
            {fields.filter(([,v]) => v != null && v !== '' && v !== false).map(([k,v]) => <ResultItem key={k} label={k} value={String(v)} />)}
          </div>
          {result.lat && result.lon && (
            <>
              <div style={{marginTop:20, borderRadius:8, overflow:'hidden', border:'1px solid var(--border)', height:300, background: 'var(--panel)'}}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${result.lat}%2C${result.lon}&bbox=${parseFloat(result.lon)-0.02}%2C${parseFloat(result.lat)-0.02}%2C${parseFloat(result.lon)+0.02}%2C${parseFloat(result.lat)+0.02}`}
                />
              </div>
              <div className="btn-row">
                <a className="btn btn-ghost btn-sm" href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}&zoom=12`} target="_blank" rel="noopener">Open in Full Map ↗</a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── OUI Database loaded from oui-db.js (39K+ IEEE entries) ───

// ─── Tool: MAC Address Tools ──────────────────────────────────
window.GeoLookup = GeoLookup;
