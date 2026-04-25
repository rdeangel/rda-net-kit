const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SubnetCalc({ onShare }) {
  const [input, setInput] = useState('192.168.1.0/24');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    const cidr = IPv4.parseCIDR(input);
    if (!cidr) { setErr('Invalid CIDR notation (e.g. 192.168.1.0/24)'); setResult(null); return; }
    setErr('');
    const sn = IPv4.subnet(cidr.ip, cidr.prefix);
    const cls = IPv4.classify(cidr.ip);
    setResult({ sn, cls, inputIP: IPv4.str(cidr.ip) });
  };

  useEffect(() => { calc(); }, []);

  const rows = result ? [
    { Field:'Network Address', Value: result.sn.networkStr },
    { Field:'Subnet Mask', Value: result.sn.maskStr },
    { Field:'Wildcard Mask', Value: result.sn.wildcardStr },
    { Field:'Broadcast Address', Value: result.sn.broadcastStr },
    { Field:'First Usable Host', Value: result.sn.firstHostStr },
    { Field:'Last Usable Host', Value: result.sn.lastHostStr },
    { Field:'Total Addresses', Value: result.sn.totalCount },
    { Field:'Usable Hosts', Value: result.sn.hostCount },
    { Field:'CIDR', Value: result.sn.cidr },
    { Field:'IP Class', Value: result.cls.ipClass },
    { Field:'Type', Value: result.cls.type },
    { Field:'Scope', Value: result.cls.scope },
    { Field:'RFC', Value: result.cls.rfc },
  ] : [];

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Input</div>
        <div className="field">
          <label className="label">IP / CIDR Notation</label>
          <div className="input-row">
            <input className={`input ${err ? 'error' : ''}`} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calc()} placeholder="192.168.1.0/24" />
            <button className="btn btn-primary" onClick={calc}>Calculate</button>
          </div>
          <Err msg={err} />
          <div className="hint">Accepts host address (192.168.1.55/24) or network address</div>
        </div>
      </div>

      {result && (
        <>
          <div className="card fadein">
            <div className="card-title">Results — {result.sn.cidr}</div>
            <div className="result-grid grid-mobile-1">
              <ResultItem label="Network Address" value={result.sn.networkStr} accent />
              <ResultItem label="Broadcast Address" value={result.sn.broadcastStr} red />
              <ResultItem label="Subnet Mask" value={result.sn.maskStr} />
              <ResultItem label="Wildcard Mask" value={result.sn.wildcardStr} yellow />
              <ResultItem label="First Usable Host" value={result.sn.firstHostStr} green />
              <ResultItem label="Last Usable Host" value={result.sn.lastHostStr} green />
              <ResultItem label="Total Addresses" value={result.sn.totalCount} />
              <ResultItem label="Usable Hosts" value={result.sn.hostCount} green />
              <ResultItem label="IP Class" value={result.cls.ipClass} />
              <ResultItem label="Type" value={result.cls.type} />
              <ResultItem label="RFC" value={result.cls.rfc} />
              <ResultItem label="Scope" value={result.cls.scope} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">IP Representations — {result.inputIP}</div>
            <div className="result-grid grid-mobile-1">
              <ResultItem label="Dotted Decimal" value={result.inputIP} />
              <ResultItem label="Binary" value={IPv4.toBinary(IPv4.parseCIDR(input)?.ip || 0)} />
              <ResultItem label="Hexadecimal" value={IPv4.toHex(IPv4.parseCIDR(input)?.ip || 0)} />
              <ResultItem label="Integer" value={(IPv4.parseCIDR(input)?.ip || 0).toString()} />
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-ghost" onClick={() => exportJSON(rows, 'subnet.json')}>Export JSON</button>
            <button className="btn btn-ghost" onClick={() => exportCSV(rows, 'subnet.csv')}>Export CSV</button>
            <button className="btn btn-ghost" onClick={() => onShare({ tool:'subnet', input })}>Share URL</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tool: IP Range ↔ CIDR ───────────────────────────────────
window.SubnetCalc = SubnetCalc;
