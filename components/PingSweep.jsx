const { useState, useEffect, useCallback, useRef, useMemo } = React;

function PingSweep() {
  const [cidr, setCidr] = useState('192.168.1.0/24');
  const [filter, setFilter] = useState('');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const generate = () => {
    setErr(''); setResult(null); setPage(0);
    const c = IPv4.parseCIDR(cidr);
    if (!c) { setErr('Invalid CIDR'); return; }
    const sn = IPv4.subnet(c.ip, c.prefix);
    if (sn.totalHosts > 65536) { setErr('Network too large (max /16). Use a smaller subnet.'); return; }
    const ips = [];
    for (let i = sn.network; i <= sn.broadcast; i = (i+1)>>>0) {
      ips.push(IPv4.str(i));
    }
    setResult({ ips, sn });
  };

  useEffect(() => generate(), []);

  const filtered = result ? result.ips.filter(ip => !filter || ip.includes(filter)) : [];
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE);

  const copyAll = () => navigator.clipboard.writeText(filtered.join('\n'));
  const nmap = result ? `nmap -sn ${result.sn.cidr}` : '';
  const fping = result ? `fping -ag ${result.sn.networkStr}/${result.sn.prefix} 2>/dev/null` : '';

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Ping Sweep Planner</div>
        <div className="field">
          <label className="label">Network CIDR (max /16)</label>
          <div className="input-row">
            <input className={`input ${err?'error':''}`} value={cidr} onChange={e => setCidr(e.target.value)}
              onKeyDown={e => e.key==='Enter' && generate()} placeholder="192.168.1.0/24" />
            <button className="btn btn-primary" onClick={generate}>Generate</button>
          </div>
          <Err msg={err} />
        </div>
      </div>

      {result && (
        <>
          <div className="card fadein">
            <div className="card-title">CLI Commands</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[['nmap',nmap],['fping',fping],['ping (bash)',`for ip in $(seq ${result.sn.firstHostStr.split('.')[3]} ${result.sn.lastHostStr.split('.')[3]}); do ping -c 1 -W 1 ${result.sn.firstHostStr.split('.').slice(0,3).join('.')}.$ip &>/dev/null && echo "${result.sn.firstHostStr.split('.').slice(0,3).join('.')}.$ip is UP"; done`]].map(([tool, cmd]) => (
                <div key={tool} style={{display:'flex',alignItems:'flex-start',gap:8,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                  <span style={{fontSize:11,color:'var(--dim)',width:40,flexShrink:0,marginTop:1}}>{tool}</span>
                  <code style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)',flex:1,wordBreak:'break-all'}}>{cmd}</code>
                  <CopyBtn text={cmd} />
                </div>
              ))}
            </div>
          </div>

          <div className="card fadein">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,gap:8,flexWrap:'wrap'}}>
              <div className="card-title" style={{marginBottom:0}}>IP List — {result.ips.length} addresses</div>
              <div style={{display:'flex',gap:8}}>
                <input className="input" style={{width:160}} value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} placeholder="Filter IPs..." />
                <button className="btn btn-ghost btn-sm" onClick={copyAll}>Copy All</button>
                <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered.map(ip=>({ip})),'ips.csv')}>CSV</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:4,marginBottom:12}}>
              {visible.map((ip, i) => {
                const last = parseInt(ip.split('.').pop());
                const isNetwork = ip === result.sn.networkStr;
                const isBcast = ip === result.sn.broadcastStr;
                return (
                  <div key={ip} style={{
                    fontFamily:'var(--mono)',fontSize:11,padding:'5px 8px',borderRadius:4,
                    background: isNetwork||isBcast ? 'rgba(239,68,68,.1)' : 'var(--panel)',
                    border: `1px solid ${isNetwork||isBcast?'rgba(239,68,68,.25)':'var(--border)'}`,
                    color: isNetwork||isBcast ? 'var(--red)' : 'var(--text)',
                    display:'flex',justifyContent:'space-between',alignItems:'center',gap:4,
                    cursor:'default',
                  }}>
                    <span>{ip}</span>
                    <CopyBtn text={ip} />
                  </div>
                );
              })}
            </div>
            {pageCount > 1 && (
              <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'center'}}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}>← Prev</button>
                <span style={{fontSize:12,color:'var(--muted)'}}>Page {page+1} of {pageCount} · {filtered.length} IPs</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(pageCount-1,p+1))} disabled={page===pageCount-1}>Next →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tool: Multicast IP-MAC Map ──────────────────────────────
window.PingSweep = PingSweep;
