const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastBuilder() {
  const [scope, setScope] = useState(2);
  const [flagT, setFlagT] = useState(false);
  const [flagP, setFlagP] = useState(false);
  const [flagR, setFlagR] = useState(false);
  const [groupId, setGroupId] = useState('1');
  const [result, setResult] = useState(null);

  const calc = () => {
    let flags = 0;
    if (flagT) flags |= 0x1;
    if (flagP) flags |= 0x2;
    if (flagR) flags |= 0x4;

    const firstWord = `ff${flags.toString(16)}${scope.toString(16)}`;
    let g = groupId.trim().replace(/^0x/, '');
    if (!/^[0-9a-fA-F]+$/.test(g)) g = '1';

    // Construct full address
    const full = `${firstWord}::${g}`;
    const expanded = IPv6.expand(full);
    if (!expanded) return;

    const compressed = IPv6.compress(expanded);
    const mac = Multicast.ipv6ToMac(expanded);
    const cls = Multicast.classifyIPv6(expanded);

    setResult({
      address: compressed,
      expanded,
      mac,
      scopeName: cls ? cls.scopeName : 'Unknown',
      isPermanent: !flagT,
      isPrefixBased: flagP,
      hasEmbeddedRP: flagR
    });
  };

  useEffect(() => calc(), [scope, flagT, flagP, flagR, groupId]);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">IPv6 Multicast Parameters</div>
        <div className="field">
          <label className="label">Scope</label>
          <select className="select" value={scope} onChange={e => setScope(parseInt(e.target.value))}>
            {Multicast.IPv6_SCOPES.map(s => (
              <option key={s.value} value={s.value}>{s.value.toString(16).toUpperCase()} — {s.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Flags (0RPT)</label>
          <div style={{display:'flex',gap:16,marginTop:8}}>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
              <input type="checkbox" checked={flagT} onChange={e => setFlagT(e.target.checked)} />
              T Flag (Transient)
            </label>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
              <input type="checkbox" checked={flagP} onChange={e => setFlagP(e.target.checked)} />
              P Flag (Prefix-based)
            </label>
            <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}}>
              <input type="checkbox" checked={flagR} onChange={e => setFlagR(e.target.checked)} />
              R Flag (RP Embedded)
            </label>
          </div>
        </div>

        <div className="field">
          <label className="label">Group ID (Hex)</label>
          <input className="input" value={groupId} onChange={e => setGroupId(e.target.value)} placeholder="e.g. 1, fb, or dead:beef" />
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">Constructed Address</div>
          <div className="result-grid">
            <ResultItem label="IPv6 Multicast" value={result.address} accent />
            <ResultItem label="Ethernet MAC" value={result.mac} green />
            <ResultItem label="Scope" value={result.scopeName} />
          </div>

          <div style={{marginTop:16}}>
            <div className="card-title" style={{fontSize:13}}>Properties</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              <span className={`badge ${result.isPermanent ? 'badge-blue' : 'badge-yellow'}`}>{result.isPermanent ? 'Permanent (IANA)' : 'Transient (Dynamic)'}</span>
              {result.isPrefixBased && <span className="badge badge-green">Unicast-Prefix-Based</span>}
              {result.hasEmbeddedRP && <span className="badge badge-cyan">Embedded RP</span>}
            </div>
          </div>

          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',marginTop:14}}>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
              <strong style={{color:'var(--text)'}}>Structure:</strong> IPv6 multicast addresses start with <code style={{color:'var(--cyan)'}}>ff</code>. The next 4 bits are <strong style={{color:'var(--text)'}}>flags</strong> (0RPT), and the following 4 bits are the <strong style={{color:'var(--text)'}}>scope</strong>.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Flags:</strong> <code style={{color:'var(--text)'}}>T=0</code> means a well-known address assigned by IANA. <code style={{color:'var(--text)'}}>T=1</code> means it's dynamically assigned. <code style={{color:'var(--text)'}}>P=1</code> (<RFCLink rfc="RFC 3306" />) allows for multicast addresses to be derived from a unicast prefix to avoid global collisions.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Common Patterns:</strong>
              <ul style={{marginTop:6,paddingLeft:20}}>
                <li><code style={{color:'var(--cyan)'}}>ff02::1</code> — All Nodes (Link-Local)</li>
                <li><code style={{color:'var(--cyan)'}}>ff02::fb</code> — mDNS (Link-Local)</li>
                <li><code style={{color:'var(--cyan)'}}>ff0e::/16</code> — Global Scope well-known</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: OSI & TCP/IP Model ───────────────────────────────
window.McastBuilder = McastBuilder;
