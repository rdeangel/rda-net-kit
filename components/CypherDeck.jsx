const { useState, useEffect, useCallback, useRef, useMemo } = React;

function CypherDeck() {
  const [activeTab, setActiveTab] = useState('encode');
  const [copied, copy] = useCopy();

  // ── Encode/Decode state ──────────────────────────────
  const [encInput, setEncInput] = useState('');
  const [encFormat, setEncFormat] = useState('text'); // which format the user is typing in

  // ── Hash state ───────────────────────────────────────
  const [hashInput, setHashInput] = useState('');
  const [hashMode, setHashMode] = useState('text'); // 'text' | 'hex'
  const [hmacKey, setHmacKey] = useState('');
  const [showHmac, setShowHmac] = useState(false);
  const [hashResults, setHashResults] = useState(null);

  // ── JWT state ────────────────────────────────────────
  const [jwtInput, setJwtInput] = useState('');
  const [jwtParsed, setJwtParsed] = useState(null);
  const [jwtError, setJwtError] = useState('');

  // ── XOR state ────────────────────────────────────────
  const [xorInput, setXorInput] = useState('');
  const [xorKey, setXorKey] = useState('');
  const [xorInputFmt, setXorInputFmt] = useState('text'); // 'text' | 'hex'
  const [xorKeyFmt, setXorKeyFmt] = useState('text');
  const [xorOp, setXorOp] = useState('xor'); // 'xor' | 'and' | 'or' | 'not'
  const [xorRepeat, setXorRepeat] = useState(true);
  const [showBrute, setShowBrute] = useState(false);

  // ── Encode/Decode logic ──────────────────────────────
  const getEncodings = useMemo(() => {
    if (!encInput) return null;
    let text = '';
    try {
      if (encFormat === 'text') text = encInput;
      else if (encFormat === 'base64') text = atob(encInput);
      else if (encFormat === 'hex') {
        const clean = encInput.replace(/[^0-9a-fA-F]/g, '');
        if (clean.length % 2) return null;
        text = clean.match(/.{2}/g).map(b => String.fromCharCode(parseInt(b, 16))).join('');
      } else if (encFormat === 'binary') {
        const bits = encInput.replace(/[^01]/g, '');
        if (bits.length % 8) return null;
        text = bits.match(/.{8}/g).map(b => String.fromCharCode(parseInt(b, 2))).join('');
      } else if (encFormat === 'url') {
        text = decodeURIComponent(encInput);
      } else if (encFormat === 'rot13') {
        text = encInput.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c.charCodeAt(0) & 223) ? c.charCodeAt(0) - 13 : c.charCodeAt(0) + 13));
      } else if (encFormat === 'ascii') {
        const codes = encInput.split(/[\s,]+/).filter(Boolean).map(Number);
        if (codes.some(isNaN)) return null;
        text = String.fromCharCode(...codes);
      }
    } catch { return null; }

    try {
      return {
        text,
        base64: btoa(unescape(encodeURIComponent(text))),
        hex: Array.from(new TextEncoder().encode(text)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        binary: Array.from(new TextEncoder().encode(text)).map(b => b.toString(2).padStart(8, '0')).join(' '),
        url: encodeURIComponent(text),
        rot13: text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c.charCodeAt(0) & 223) ? c.charCodeAt(0) - 13 : c.charCodeAt(0) + 13)),
        ascii: Array.from(new TextEncoder().encode(text)).join(' '),
        charCount: [...new Intl.Segmenter().segment(text)].length,
        byteCount: new TextEncoder().encode(text).length,
      };
    } catch { return null; }
  }, [encInput, encFormat]);

  // ── Hash logic ───────────────────────────────────────
  useEffect(() => {
    if (!hashInput) { setHashResults(null); return; }
    const input = hashMode === 'hex'
      ? hashInput.replace(/[^0-9a-fA-F]/g, '').match(/.{2}/g)?.map(b => String.fromCharCode(parseInt(b, 16))).join('') || ''
      : hashInput;
    const text = showHmac && hmacKey ? hmacKey + input : input;
    (async () => {
      const [md5h, sha1, sha256, sha512] = await Promise.all([
        md5(text),
        shaHash('SHA-1', text),
        shaHash('SHA-256', text),
        shaHash('SHA-512', text),
      ]);
      setHashResults({ md5: md5h, sha1, sha256, sha512 });
    })();
  }, [hashInput, hashMode, hmacKey, showHmac]);

  // ── JWT logic ────────────────────────────────────────
  useEffect(() => {
    if (!jwtInput.trim()) { setJwtParsed(null); setJwtError(''); return; }
    const parts = jwtInput.trim().split('.');
    if (parts.length !== 3) { setJwtError('Invalid JWT — expected 3 dot-separated segments'); setJwtParsed(null); return; }
    try {
      const b64url = s => s.replace(/-/g, '+').replace(/_/g, '/');
      const pad = s => s + '='.repeat((4 - s.length % 4) % 4);
      const header = JSON.parse(atob(pad(b64url(parts[0]))));
      const payload = JSON.parse(atob(pad(b64url(parts[1]))));
      setJwtParsed({ header, payload, signature: parts[2], raw: parts });
      setJwtError('');
    } catch (e) { setJwtError('Decode error: ' + e.message); setJwtParsed(null); }
  }, [jwtInput]);

  // ── XOR logic ────────────────────────────────────────
  const xorResult = useMemo(() => {
    let msgBytes, keyBytes;
    try {
      if (xorInputFmt === 'hex') {
        const clean = xorInput.replace(/[^0-9a-fA-F]/g, '');
        msgBytes = clean.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
      } else {
        msgBytes = Array.from(new TextEncoder().encode(xorInput));
      }
      if (xorKeyFmt === 'hex') {
        const clean = xorKey.replace(/[^0-9a-fA-F]/g, '');
        keyBytes = clean.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
      } else {
        keyBytes = Array.from(new TextEncoder().encode(xorKey));
      }
    } catch { return null; }

    if (!msgBytes.length || !keyBytes.length) return null;
    const result = msgBytes.map((b, i) => {
      const k = xorRepeat ? keyBytes[i % keyBytes.length] : (i < keyBytes.length ? keyBytes[i] : 0);
      if (xorOp === 'xor') return b ^ k;
      if (xorOp === 'and') return b & k;
      if (xorOp === 'or')  return b | k;
      if (xorOp === 'not') return (~b) & 0xFF;
      return b ^ k;
    });
    return {
      hex: result.map(b => b.toString(16).padStart(2, '0')).join(' '),
      binary: result.map(b => b.toString(2).padStart(8, '0')).join(' '),
      ascii: result.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join(''),
      printable: result.filter(b => b >= 32 && b <= 126).length,
      total: result.length,
    };
  }, [xorInput, xorKey, xorInputFmt, xorKeyFmt, xorOp, xorRepeat]);

  const bruteResults = useMemo(() => {
    if (!xorInput) return [];
    let msgBytes;
    try {
      if (xorInputFmt === 'hex') {
        const clean = xorInput.replace(/[^0-9a-fA-F]/g, '');
        msgBytes = clean.match(/.{2}/g)?.map(b => parseInt(b, 16)) || [];
      } else {
        msgBytes = Array.from(new TextEncoder().encode(xorInput));
      }
    } catch { return []; }
    if (!msgBytes.length) return [];
    const results = [];
    for (let key = 0; key < 256; key++) {
      const decoded = msgBytes.map(b => b ^ key);
      const printable = decoded.filter(b => b >= 32 && b <= 126).length;
      if (printable > decoded.length * 0.7) {
        results.push({
          key: key,
          keyHex: key.toString(16).padStart(2, '0'),
          text: decoded.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join(''),
          score: (printable / decoded.length * 100).toFixed(0),
        });
      }
    }
    return results.slice(0, 32);
  }, [xorInput, xorInputFmt]);

  // ── Helpers ──────────────────────────────────────────
  const copyVal = (val, key) => { navigator.clipboard.writeText(val).catch(()=>{}); copy(val, key); };

  const JwtTimeClaim = ({ label, value }) => {
    if (value === undefined || value === null) return null;
    const ts = Number(value);
    if (isNaN(ts)) return <span style={{color:'var(--muted)'}}>{label}: {String(value)}</span>;
    const date = new Date(ts < 1e12 ? ts * 1000 : ts);
    const now = Date.now();
    const diff = date.getTime() - now;
    const isPast = diff < 0;
    const absDiff = Math.abs(diff);
    const relStr = absDiff < 60000 ? `${Math.floor(absDiff/1000)}s`
      : absDiff < 3600000 ? `${Math.floor(absDiff/60000)}m`
      : absDiff < 86400000 ? `${Math.floor(absDiff/3600000)}h`
      : `${Math.floor(absDiff/86400000)}d`;
    return (
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
        <span style={{color:'var(--cyan)',fontFamily:'var(--mono)',fontSize:12}}>{label}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:12}}>{date.toISOString()}</span>
        <span style={{fontSize:11,color:isPast?'var(--red)':'var(--green)',fontWeight:600}}>
          {isPast ? `${relStr} ago` : `in ${relStr}`}
        </span>
      </div>
    );
  };

  const tabs = [
    { id:'encode', label:'Encode / Decode', icon:'⟐' },
    { id:'hash',   label:'Hash Generator', icon:'⊞' },
    { id:'jwt',    label:'JWT Decoder',    icon:'⑂' },
    { id:'xor',    label:'XOR Cipher',     icon:'⊕' },
  ];

  return (
    <div className="fadein">
      <div style={{display:'flex', gap:8, marginBottom:20}}>
        {tabs.map(t => (
          <button key={t.id} className={`btn ${activeTab===t.id?'btn-primary':'btn-ghost'}`}
            onClick={() => setActiveTab(t.id)} style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontFamily:'var(--mono)',fontSize:14}}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Encode / Decode ═══ */}
      {activeTab === 'encode' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Multi Encoder / Decoder</div>
            <div style={{marginBottom:12}}>
              <div className="label">Input</div>
              <div style={{display:'flex',gap:8}}>
                <textarea className="input" rows={3} value={encInput}
                  onChange={e => setEncInput(e.target.value)} placeholder="Paste text, Base64, hex, binary, URL-encoded, ROT13, or ASCII codes…"
                  style={{flex:1,resize:'vertical',fontFamily:'var(--mono)',fontSize:13}} />
              </div>
              <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                {['text','base64','hex','binary','url','rot13','ascii'].map(f => (
                  <button key={f} className={`btn ${encFormat===f?'btn-primary':'btn-ghost'} btn-sm`}
                    onClick={() => setEncFormat(f)} style={{textTransform:'capitalize'}}>{f}</button>
                ))}
              </div>
            </div>
            {getEncodings && (
              <>
                <div style={{display:'flex',gap:12,marginBottom:12,fontSize:12,color:'var(--muted)'}}>
                  <span>{getEncodings.charCount} chars</span>
                  <span>{getEncodings.byteCount} bytes</span>
                </div>
                {[
                  ['Text', getEncodings.text],
                  ['Base64', getEncodings.base64],
                  ['Hex', getEncodings.hex],
                  ['Binary', getEncodings.binary],
                  ['URL Encoded', getEncodings.url],
                  ['ROT13', getEncodings.rot13],
                  ['ASCII Decimal', getEncodings.ascii],
                ].map(([label, val], i) => val ? (
                  <div key={label} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                      <span style={{fontSize:11,fontWeight:600,color:'var(--cyan)',textTransform:'uppercase',letterSpacing:0.8}}>{label}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => copyVal(val, `enc-${i}`)}>
                        {copied===`enc-${i}`?'Copied!':'Copy'}
                      </button>
                    </div>
                    <div style={{
                      background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                      padding:'8px 12px',fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',
                      wordBreak:'break-all',maxHeight:100,overflowY:'auto',whiteSpace:'pre-wrap'
                    }}>{val}</div>
                  </div>
                ) : null)}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ Hash Generator ═══ */}
      {activeTab === 'hash' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">Hash Generator</div>
            <div style={{marginBottom:12}}>
              <div className="label">Input</div>
              <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <textarea className="input" rows={3} value={hashInput}
                  onChange={e => setHashInput(e.target.value)} placeholder="Enter text to hash…"
                  style={{flex:1,resize:'vertical',fontFamily:'var(--mono)',fontSize:13}} />
              </div>
              <div style={{display:'flex',gap:6,marginTop:8,alignItems:'center'}}>
                <button className={`btn ${hashMode==='text'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setHashMode('text')}>Text</button>
                <button className={`btn ${hashMode==='hex'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setHashMode('hex')}>Hex</button>
                <span style={{flex:1}} />
                <button className={`btn ${showHmac?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setShowHmac(!showHmac)}>
                  HMAC
                </button>
              </div>
              {showHmac && (
                <div style={{marginTop:8}}>
                  <div className="label">HMAC Key</div>
                  <input className="input" value={hmacKey} onChange={e => setHmacKey(e.target.value)}
                    placeholder="Secret key…" style={{fontFamily:'var(--mono)'}} />
                </div>
              )}
            </div>
            {hashResults && [
              ['MD5', hashResults.md5, 32, 'var(--red)'],
              ['SHA-1', hashResults.sha1, 40, 'var(--yellow)'],
              ['SHA-256', hashResults.sha256, 64, 'var(--cyan)'],
              ['SHA-512', hashResults.sha512, 128, 'var(--green)'],
            ].map(([algo, hash, len, color], i) => (
              <div key={algo} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:700,color,fontFamily:'var(--mono)',letterSpacing:0.5}}>{algo}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => copyVal(hash, `hash-${i}`)}>
                    {copied===`hash-${i}`?'Copied!':'Copy'}
                  </button>
                </div>
                <div style={{
                  background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                  padding:'8px 12px',fontFamily:'var(--mono)',fontSize:12,color,
                  wordBreak:'break-all'
                }}>{hash}</div>
              </div>
            ))}
            {!hashInput && (
              <div style={{textAlign:'center',padding:24,color:'var(--dim)',fontSize:13}}>
                Enter text above to generate hashes
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ JWT Decoder ═══ */}
      {activeTab === 'jwt' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">JWT Decoder</div>
            <div style={{marginBottom:14}}>
              <div className="label">JSON Web Token</div>
              <textarea className="input" rows={4} value={jwtInput}
                onChange={e => setJwtInput(e.target.value)} placeholder="Paste your JWT token here (eyJhbGci…)"
                style={{width:'100%',resize:'vertical',fontFamily:'var(--mono)',fontSize:12}} />
            </div>
            {jwtError && <div style={{color:'var(--red)',fontSize:12,marginBottom:12}}>{jwtError}</div>}
            {jwtParsed && (
              <>
                {/* Header */}
                <div style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--purple)',textTransform:'uppercase',letterSpacing:1}}>Header</span>
                    <span style={{fontSize:10,color:'var(--dim)'}}>{jwtParsed.raw[0].length} chars</span>
                  </div>
                  <pre style={{
                    background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                    padding:12,fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',overflow:'auto',margin:0
                  }}>{JSON.stringify(jwtParsed.header, null, 2)}</pre>
                </div>
                {/* Payload */}
                <div style={{marginBottom:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:'var(--cyan)',textTransform:'uppercase',letterSpacing:1}}>Payload</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => copyVal(JSON.stringify(jwtParsed.payload), 'jwt-payload')}>
                      {copied==='jwt-payload'?'Copied!':'Copy JSON'}
                    </button>
                  </div>
                  {/* Time claims */}
                  {['iat','exp','nbf','auth_time'].map(claim =>
                    jwtParsed.payload[claim] !== undefined ? (
                      <JwtTimeClaim key={claim} label={claim} value={jwtParsed.payload[claim]} />
                    ) : null
                  )}
                  {jwtParsed.payload.exp && jwtParsed.payload.exp * 1000 < Date.now() && (
                    <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius)',
                      padding:'8px 12px',marginBottom:8,fontSize:12,color:'var(--red)',fontWeight:600}}>
                      ⚠ TOKEN EXPIRED
                    </div>
                  )}
                  <pre style={{
                    background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                    padding:12,fontFamily:'var(--mono)',fontSize:12,color:'var(--text)',overflow:'auto',margin:0
                  }}>{JSON.stringify(jwtParsed.payload, null, 2)}</pre>
                </div>
                {/* Signature */}
                <div>
                  <span style={{fontSize:11,fontWeight:700,color:'var(--yellow)',textTransform:'uppercase',letterSpacing:1}}>Signature</span>
                  <div style={{
                    background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                    padding:'8px 12px',fontFamily:'var(--mono)',fontSize:11,color:'var(--muted)',wordBreak:'break-all',marginTop:4
                  }}>{jwtParsed.signature}</div>
                  <div style={{fontSize:10,color:'var(--dim)',marginTop:4}}>
                    Algorithm: <span style={{color:'var(--text)'}}>{jwtParsed.header.alg || 'none'}</span>
                    {jwtParsed.header.typ && <> · Type: <span style={{color:'var(--text)'}}>{jwtParsed.header.typ}</span></>}
                  </div>
                </div>
              </>
            )}
            {!jwtInput.trim() && !jwtError && (
              <div style={{textAlign:'center',padding:24,color:'var(--dim)',fontSize:13}}>
                Paste a JWT token above to decode it
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ XOR Cipher ═══ */}
      {activeTab === 'xor' && (
        <div className="fadein">
          <div className="card">
            <div className="card-title">XOR / Bitwise Cipher</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
              <div>
                <div className="label">Message</div>
                <textarea className="input" rows={3} value={xorInput}
                  onChange={e => setXorInput(e.target.value)} placeholder="Enter message…"
                  style={{width:'100%',resize:'vertical',fontFamily:'var(--mono)',fontSize:13}} />
                <div style={{display:'flex',gap:4,marginTop:4}}>
                  <button className={`btn ${xorInputFmt==='text'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setXorInputFmt('text')}>Text</button>
                  <button className={`btn ${xorInputFmt==='hex'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setXorInputFmt('hex')}>Hex</button>
                </div>
              </div>
              <div>
                <div className="label">Key</div>
                <textarea className="input" rows={3} value={xorKey}
                  onChange={e => setXorKey(e.target.value)} placeholder="Enter key…"
                  style={{width:'100%',resize:'vertical',fontFamily:'var(--mono)',fontSize:13}} />
                <div style={{display:'flex',gap:4,marginTop:4}}>
                  <button className={`btn ${xorKeyFmt==='text'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setXorKeyFmt('text')}>Text</button>
                  <button className={`btn ${xorKeyFmt==='hex'?'btn-primary':'btn-ghost'} btn-sm`} onClick={() => setXorKeyFmt('hex')}>Hex</button>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              {['xor','and','or','not'].map(op => (
                <button key={op} className={`btn ${xorOp===op?'btn-primary':'btn-ghost'} btn-sm`}
                  onClick={() => setXorOp(op)} style={{textTransform:'uppercase',fontWeight:700}}>{op}</button>
              ))}
              <span style={{flex:1}} />
              <label style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--muted)',cursor:'pointer'}}>
                <input type="checkbox" checked={xorRepeat} onChange={e => setXorRepeat(e.target.checked)} /> Repeat key
              </label>
              <button className={`btn ${showBrute?'btn-primary':'btn-ghost'} btn-sm`}
                onClick={() => setShowBrute(!showBrute)}>Brute Force</button>
            </div>
            {xorResult && (
              <>
                {[
                  ['Hex', xorResult.hex, 'var(--cyan)'],
                  ['Binary', xorResult.binary, 'var(--green)'],
                  ['ASCII', xorResult.ascii, 'var(--text)'],
                ].map(([label, val, color], i) => (
                  <div key={label} style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                      <span style={{fontSize:11,fontWeight:600,color,textTransform:'uppercase',letterSpacing:0.8}}>{label}</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => copyVal(val, `xor-${i}`)}>
                        {copied===`xor-${i}`?'Copied!':'Copy'}
                      </button>
                    </div>
                    <div style={{
                      background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',
                      padding:'8px 12px',fontFamily:'var(--mono)',fontSize:12,color,
                      wordBreak:'break-all',maxHeight:100,overflowY:'auto',whiteSpace:'pre-wrap'
                    }}>{val}</div>
                  </div>
                ))}
                <div style={{fontSize:11,color:'var(--muted)'}}>
                  Printable: {xorResult.printable}/{xorResult.total} bytes ({(xorResult.printable/xorResult.total*100).toFixed(0)}%)
                </div>
              </>
            )}
            {!xorResult && xorInput && xorKey && (
              <div style={{color:'var(--red)',fontSize:12}}>Invalid input — check hex formatting</div>
            )}
          </div>
          {/* Brute Force Panel */}
          {showBrute && (
            <div className="card" style={{marginTop:16}}>
              <div className="card-title">Single-Byte XOR Brute Force</div>
              <div className="hint" style={{marginBottom:12}}>
                Tries all 256 possible single-byte XOR keys. Shows results with &gt;70% printable ASCII.
              </div>
              {bruteResults.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {bruteResults.map(r => (
                    <div key={r.key} style={{
                      display:'flex',alignItems:'center',gap:10,padding:'6px 10px',
                      background:'var(--bg)',borderRadius:'var(--radius)',border:'1px solid var(--border)'
                    }}>
                      <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--cyan)',minWidth:36}}>
                        0x{r.keyHex}
                      </span>
                      <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {r.text}
                      </span>
                      <span style={{fontSize:10,color:r.score>=90?'var(--green)':'var(--yellow)',fontWeight:600,minWidth:32,textAlign:'right'}}>
                        {r.score}%
                      </span>
                      <button className="btn btn-ghost btn-sm" style={{fontSize:10}} onClick={() => copyVal(r.text, `brute-${r.key}`)}>
                        {copied===`brute-${r.key}`?'✓':'Copy'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : xorInput ? (
                <div style={{color:'var(--muted)',fontSize:12}}>No readable results found with any single-byte key.</div>
              ) : (
                <div style={{color:'var(--dim)',fontSize:12,textAlign:'center',padding:12}}>Enter a message above first.</div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
window.CypherDeck = CypherDeck;
