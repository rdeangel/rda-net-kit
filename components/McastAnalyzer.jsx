const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastAnalyzer() {
  const [input, setInput] = useState('239.1.2.3');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    const trimmed = input.trim();

    // Try IPv4
    const ip4 = IPv4.parse(trimmed);
    if (ip4 !== null) {
      const a = (ip4 >>> 24) & 0xFF;
      if (a < 224 || a > 239) { setErr('Not a multicast address. IPv4 multicast range: 224.0.0.0 – 239.255.255.255'); return; }
      const cls = Multicast.classifyIPv4(ip4);
      const mac = Multicast.ipv4ToMac(ip4);
      setResult({ version: 4, ip: IPv4.str(ip4), mac, ...cls });
      return;
    }

    // Try IPv6
    const expanded = IPv6.expand(trimmed);
    if (expanded && expanded.startsWith('ff')) {
      const mac = Multicast.ipv6ToMac(expanded);
      const cls = Multicast.classifyIPv6(expanded);
      setResult({ version: 6, expanded, compressed: IPv6.compress(trimmed), mac, ...cls });
      return;
    }

    setErr('Enter a valid IPv4 multicast (224.x–239.x) or IPv6 multicast (ff00::/8) address');
  };

  useEffect(() => calc(), []);
  useEffect(() => { const t = setTimeout(calc, 300); return () => clearTimeout(t); }, [input]);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Multicast Address</div>
        <div className="field">
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && calc()} placeholder="224.0.0.1 or ff02::1" />
            <button className="btn btn-primary" onClick={calc}>Analyze</button>
          </div>
          <Err msg={err} />
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['224.0.0.1','224.0.0.5','232.1.2.3','233.1.2.0','239.255.255.250','ff02::1','ff02::fb','ff05::1:3','ff0e::1'].map(p => (
            <button key={p} className="btn btn-ghost btn-sm" onClick={() => { setInput(p); }}>{p}</button>
          ))}
        </div>
      </div>

      {result && result.version === 4 && (
        <div className="card fadein">
          <div className="card-title">IPv4 Multicast Analysis</div>
          <div className="result-grid">
            <ResultItem label="Address" value={result.ip} accent />
            <ResultItem label="Ethernet MAC" value={result.mac} green />
            <ResultItem label="Scope" value={result.scope} />
            <ResultItem label="Block" value={result.block} />
            <ResultItem label="Description" value={result.description} />
            <ResultItem label="RFC" value={result.rfc} />
            <ResultItem label="SSM Eligible" value={result.isSSM ? 'Yes' : 'No'} green={result.isSSM} />
            {result.ttlThreshold > 0 && <ResultItem label="TTL Threshold" value={`≥ ${result.ttlThreshold}`} />}
            {result.asNumber !== null && <ResultItem label="GLOP AS Number" value={`AS ${result.asNumber}`} yellow />}
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px',marginTop:12}}>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>Scope</strong> — How far the packet can travel. <span style={{color:'var(--cyan)'}}>Link-Local</span> (224.0.0.x) never leaves the subnet. <span style={{color:'var(--yellow)'}}>Admin-Scoped</span> (239.x) is constrained by network policy. <span style={{color:'var(--green)'}}>Global</span> can cross the internet.</div>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>Block</strong> — Which IANA allocation this address belongs to. Each block serves a different purpose (control traffic, SSM, GLOP, etc.).</div>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>SSM Eligible</strong> — Whether the address is in the Source-Specific Multicast range (232.0.0.0/8). SSM lets receivers subscribe to a specific source, avoiding the need for an RP (Rendezvous Point).</div>
              {result.ttlThreshold > 0 && <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>TTL Threshold</strong> — The minimum TTL a packet needs to be forwarded beyond this scope boundary. Routers enforce TTL thresholds at each scope border.</div>}
              {result.asNumber !== null && <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>GLOP AS Number</strong> — This address is in the GLOP block (<RFCLink rfc="RFC 3180" />). The 2nd and 3rd octets encode the 16-bit AS number: <code style={{color:'var(--cyan)'}}>233.{Math.floor(result.asNumber/256)}.{result.asNumber%256}.x</code>. Each AS gets a /24 of multicast space.</div>}
              <div><strong style={{color:'var(--text)'}}>Ethernet MAC</strong> — The Layer-2 address derived from the IP. Only 23 of 28 bits map (prefix <code style={{color:'var(--cyan)'}}>01:00:5E</code>), so 32 different IPs share this MAC.</div>
            </div>
          </div>
        </div>
      )}

      {result && result.version === 6 && (
        <div className="card fadein">
          <div className="card-title">IPv6 Multicast Analysis</div>
          <div className="result-grid">
            <ResultItem label="Address" value={result.compressed} accent />
            <ResultItem label="Expanded" value={result.expanded} />
            <ResultItem label="Ethernet MAC" value={result.mac} green />
            <ResultItem label="Scope" value={result.scopeName} />
            <ResultItem label="Scope Value" value={`0x${result.scope.toString(16).padStart(2,'0')} (${result.scope})`} />
            <ResultItem label="Description" value={result.description} />
            <ResultItem label="RFC" value={result.rfc} />
            <ResultItem label="T Flag (Temporary)" value={result.flagT ? 'Yes' : 'No (Permanent)'} />
            <ResultItem label="P Flag (Unicast-Prefix)" value={result.flagP ? 'Yes' : 'No'} />
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px',marginTop:12}}>
            <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:1,lineHeight:2,marginBottom:8}}>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:50}}>Format</span>
                <span style={{color:'var(--dim)'}}>ff</span>
                <span style={{padding:'2px 4px',background:'rgba(167,139,250,0.15)',borderRadius:3,color:'var(--purple)'}}>{(result.scope >> 4).toString(16).padStart(1,'0')}</span>
                <span style={{padding:'2px 4px',background:'rgba(0,212,200,0.15)',borderRadius:3,color:'var(--cyan)'}}>{(result.scope & 0xf).toString(16)}</span>
                <span style={{color:'var(--dim)'}}>:{result.expanded.split(':').slice(1).join(':')}</span>
              </div>
              <div>
                <span style={{color:'var(--muted)',display:'inline-block',width:50}}> </span>
                <span style={{color:'var(--dim)'}}>^^</span>
                <span style={{color:'var(--purple)',marginLeft:4}}>flags</span>
                <span style={{color:'var(--cyan)',marginLeft:2}}>scope</span>
              </div>
            </div>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>Scope</strong> — Encoded in the 2nd nibble of <code style={{color:'var(--cyan)'}}>ffXX</code>. Controls how far the packet travels. Common values: <span style={{color:'var(--cyan)'}}>1</span>=Interface, <span style={{color:'var(--cyan)'}}>2</span>=Link, <span style={{color:'var(--cyan)'}}>5</span>=Site, <span style={{color:'var(--cyan)'}}>8</span>=Organization, <span style={{color:'var(--cyan)'}}>E</span>=Global.</div>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>T Flag</strong> — If set, this is a <em>temporary</em> (dynamically assigned) multicast address. If clear, it's a <em>permanent</em> (well-known) IANA-assigned address.</div>
              <div style={{marginBottom:4}}><strong style={{color:'var(--text)'}}>P Flag</strong> — If set, the address is <em>unicast-prefix-based</em> (<RFCLink rfc="RFC 3306" />), meaning it embeds the network prefix. Used to avoid collisions when multiple sites use the same group ID.</div>
              <div><strong style={{color:'var(--text)'}}>Ethernet MAC</strong> — IPv6 uses prefix <code style={{color:'var(--cyan)'}}>33:33</code> followed by the low 32 bits. Unlike IPv4, this is a many-to-one mapping (2^88:1 overlap).</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: GLOP Calculator ───────────────────────────────────
window.McastAnalyzer = McastAnalyzer;
