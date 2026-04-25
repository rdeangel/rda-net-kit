const { useState, useEffect, useCallback, useRef, useMemo } = React;

function MACTools() {
  const [mac, setMac] = useState('00:1A:2B:3C:4D:5E');
  const [result, setResult] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [err, setErr] = useState('');

  const parseMac = (s) => {
    const clean = s.replace(/[:\-\.]/g, '').toUpperCase();
    if (!/^[0-9A-F]{12}$/.test(clean)) return null;
    return clean;
  };

  const calc = async () => {
    setErr(''); setResult(null); setVendor(null);
    const clean = parseMac(mac);
    if (!clean) { setErr('Invalid MAC address (expected XX:XX:XX:XX:XX:XX)'); return; }
    const bytes = clean.match(/.{2}/g);
    // EUI-64: insert FF:FE in middle and flip bit 7 of first byte
    const b0 = parseInt(bytes[0], 16) ^ 0x02;
    const eui64 = `${b0.toString(16).padStart(2,'0')}${bytes[1]}:${bytes[2]}ff:fe${bytes[3]}:${bytes[4]}${bytes[5]}`;
    const linkLocal = `fe80::${eui64.match(/.{4}/g).join(':')}`;
    const compressed = IPv6.compress(linkLocal.replace('fe80::','fe80:0000:0000:0000:').replace(/(.{4})(.{4}):(.{4})(.{4})/,'$1:$2:$3:$4'));
    setResult({
      clean,
      formatted: bytes.join(':'),
      cisco: bytes.join('.').replace(/(..)(..)\.(..)(..)\.(..)(..)/, '$1$2.$3$4.$5$6').toLowerCase(),
      oui: bytes.slice(0,3).join(':'),
      nic: bytes.slice(3).join(':'),
      binary: bytes.map(b => parseInt(b,16).toString(2).padStart(8,'0')).join(':'),
      eui64: eui64,
      linkLocal: `fe80::${eui64}`,
      isMulticast: (parseInt(bytes[0],16) & 0x01) === 1,
      isLocallyAdministered: (parseInt(bytes[0],16) & 0x02) === 2,
    });
    setVendorLoading(true);
    const ouiKey = bytes.slice(0,3).join('').toUpperCase();
    const db = (typeof OUI_DB !== 'undefined') ? OUI_DB : (typeof window !== 'undefined' && window.OUI_DB) ? window.OUI_DB : {};
    setVendor(db[ouiKey] || 'Unknown vendor');
    setVendorLoading(false);
  };

  useEffect(() => { calc(); }, []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">MAC Address</div>
        <div className="field">
          <label className="label">MAC Address (any separator)</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={mac} onChange={e => setMac(e.target.value)}
              onKeyDown={e => e.key==='Enter' && calc()} placeholder="00:1A:2B:3C:4D:5E" />
            <button className="btn btn-primary" onClick={calc}>Analyze</button>
          </div>
          <Err msg={err} />
          <div className="hint">Accepts colons, dashes, dots, or no separator</div>
        </div>
      </div>
      {result && (
        <div className="card fadein">
          <div className="result-grid grid-mobile-1">
            <ResultItem label="Canonical (IEEE)" value={result.formatted} accent />
            <ResultItem label="Cisco Format" value={result.cisco} />
            <ResultItem label="OUI (Vendor Prefix)" value={result.oui} />
            <ResultItem label="NIC Specific" value={result.nic} />
            <ResultItem label="Vendor" value={vendorLoading ? 'Looking up...' : (vendor || '—')} green />
            <ResultItem label="Multicast" value={result.isMulticast ? 'Yes' : 'No'} red={result.isMulticast} />
            <ResultItem label="Locally Administered" value={result.isLocallyAdministered ? 'Yes (LAA)' : 'No (UAA)'} yellow={result.isLocallyAdministered} />
          </div>
          <div className="card-title" style={{marginTop:16}}>IPv6 Link-Local (EUI-64)</div>
          <div className="result-grid grid-mobile-1">
            <ResultItem label="EUI-64 Interface ID" value={result.eui64} />
            <ResultItem label="Link-Local Address" value={result.linkLocal} accent />
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px',marginTop:12}}>
            <div className="hint" style={{marginBottom:8}}>EUI-64 construction: Insert FF:FE after OUI, flip Universal/Local bit (bit 7 of first octet)</div>
            <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text)',letterSpacing:1, display:'flex', flexWrap:'wrap', gap:'4px 0', wordBreak:'break-all'}}>
              {result.binary.split(':').map((oct, i) => (
                <span key={i} style={{display:'inline-block'}}>
                  {i === 0 ? oct.split('').map((b,bi) => <span key={bi} style={{color: bi===6?'var(--yellow)':b==='1'?'var(--cyan)':'var(--dim)'}}>{b}</span>) :
                    oct.split('').map((b,bi) => <span key={bi} style={{color:b==='1'?'var(--cyan)':'var(--dim)'}}>{b}</span>)}
                  {i < 5 && <span style={{color:'var(--border)', margin:'0 2px'}}>:</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IPv6 Subnet Calculator ────────────────────────────
window.MACTools = MACTools;
