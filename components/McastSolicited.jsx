const { useState, useEffect, useCallback, useRef, useMemo } = React;

function McastSolicited() {
  const [input, setInput] = useState('2001:db8::1234:5678');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr('');
    const expanded = IPv6.expand(input.trim());
    if (!expanded) { setErr('Invalid IPv6 address'); return; }
    const res = Multicast.solicitedNode(expanded);
    setResult({
      original: IPv6.compress(expanded),
      originalExpanded: expanded,
      ...res
    });
  };

  useEffect(() => calc(), []);
  useEffect(() => { const t = setTimeout(calc, 300); return () => clearTimeout(t); }, [input]);

  const presets = ['fe80::1', '2001:db8::1', '2001:db8:acad::cafe:babe', '::1'];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">IPv6 Unicast Address</div>
        <div className="field">
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={input} onChange={e => setInput(e.target.value)}
              placeholder="e.g. 2001:db8::1" onKeyDown={e => e.key==='Enter' && calc()} />
            <button className="btn btn-primary" onClick={calc}>Compute</button>
          </div>
          {err && <div className="err-msg">{err}</div>}
        </div>
        <div className="presets">
          {presets.map(p => (
            <span key={p} className="preset-tag" onClick={() => setInput(p)}>{p}</span>
          ))}
        </div>
      </div>

      {result && (
        <div className="card fadein">
          <div className="card-title">Solicited-Node Multicast Result</div>
          <div className="result-grid">
            <ResultItem label="Unicast Address" value={result.original} accent />
            <ResultItem label="Solicited-Node IP" value={result.solicited} green />
            <ResultItem label="Ethernet MAC" value={result.mac} yellow />
          </div>
          <div style={{marginTop:16}}>
            <div className="card-title" style={{fontSize:13}}>Expanded Forms</div>
            <div className="result-grid">
              <ResultItem label="IP Expanded" value={result.solicitedExpanded} />
              <ResultItem label="MAC Prefix" value="33:33:ff" />
            </div>
          </div>
          <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'12px 14px',marginTop:14}}>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.7}}>
              <strong style={{color:'var(--text)'}}>How it works:</strong> IPv6 uses Solicited-Node Multicast for Neighbor Discovery (ND), replacing IPv4 ARP broadcast. This address is formed by taking the <strong style={{color:'var(--text)'}}>lower 24 bits</strong> of the unicast address and appending them to the prefix <code style={{color:'var(--cyan)'}}>ff02::1:ff00:0/104</code>.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Efficiency:</strong> By using multicast instead of broadcast, only nodes that share the same last 24 bits will receive the ND packets. This reduces the "broadcast storm" effect on large L2 segments, as the probability of two nodes having the same last 24 bits is extremely low (1 in 16.7 million).
              <br/><br/>
              <strong style={{color:'var(--text)'}}>MAC Mapping:</strong> Maps to the Ethernet multicast MAC <code style={{color:'var(--cyan)'}}>33:33:ff:xx:xx:xx</code> (low 24 bits).
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Neighbor Discovery Role:</strong> When a host needs to resolve an IPv6 address to a MAC, it sends a <strong style={{color:'var(--text)'}}>Neighbor Solicitation (NS)</strong> to this multicast address. The target node, listening for its specific solicited-node address, responds with a unicast <strong style={{color:'var(--text)'}}>Neighbor Advertisement (NA)</strong>.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Duplicate Address Detection (DAD):</strong> This address is critical for "MAC/IP Collision Checking." Before a node can use a new IPv6 address, it performs DAD by sending an NS to its own solicited-node address. If it receives a response, it knows another device is already using that address (or a colliding 24-bit suffix), preventing address conflicts before they happen.
              <br/><br/>
              <strong style={{color:'var(--text)'}}>Verification:</strong> You can see which multicast groups your interface has joined using:
              <ul style={{margin:'8px 0 0 18px', padding:0}}>
                <li>Linux: <code style={{color:'var(--cyan)'}}>ip -6 maddr show</code></li>
                <li>Windows: <code style={{color:'var(--cyan)'}}>netsh interface ipv6 show joins</code></li>
                <li>macOS: <code style={{color:'var(--cyan)'}}>ndp -an</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: MAC Collision Check ──────────────────────────────
window.McastSolicited = McastSolicited;
