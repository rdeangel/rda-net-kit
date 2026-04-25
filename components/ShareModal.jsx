const { useState, useEffect, useCallback, useRef, useMemo } = React;

function ShareModal({ data, onClose }) {
  const url = `${location.origin}${location.pathname}#${encodeURIComponent(JSON.stringify(data))}`;
  const [copied, copy] = useCopy();
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={onClose}>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,padding:24,width:480,maxWidth:'90vw'}} onClick={e => e.stopPropagation()}>
        <div style={{fontWeight:600,marginBottom:12}}>Share this calculation</div>
        <div style={{fontFamily:'var(--mono)',fontSize:12,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 12px',wordBreak:'break-all',color:'var(--cyan)',marginBottom:12}}>{url}</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-primary" onClick={() => copy(url,'share')}>
            {copied === 'share' ? '✓ Copied!' : 'Copy URL'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Global Search logic ──────────────────────────────────────
const getSearchResults = (q) => {
  if (!q || q.length < 2) return [];
  const query = q.toLowerCase();
  const tokens = query.split(/\s+/).filter(t => t.length > 0);
  const res = [];

  // Helper for multi-token matching
  const matches = (str, tags = []) => {
    if (!str) return false;
    const s = str.toLowerCase();
    return tokens.every(t => s.includes(t) || tags.some(tag => tag.toLowerCase().includes(t)));
  };

  // 1. Smart Input Detection
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const cidrRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$|^[0-9A-Fa-f]{12}$/;

  if (ipv4Regex.test(query)) {
    res.push({ type:'Action', title: `Analyze IPv4: ${query}`, desc: 'Open Subnet Calculator & Classifier', id: 'subnet' });
    res.push({ type:'Action', title: `Geo/ASN Lookup: ${query}`, desc: 'Lookup location and owner info', id: 'geo' });
  } else if (cidrRegex.test(query)) {
    res.push({ type:'Action', title: `Calculate Subnet: ${query}`, desc: 'Break down CIDR block details', id: 'subnet' });
  } else if (ipv6Regex.test(query)) {
    res.push({ type:'Action', title: `Analyze IPv6: ${query}`, desc: 'Open IPv6 tools & classifier', id: 'ipv6subnet' });
  } else if (macRegex.test(query)) {
    res.push({ type:'Action', title: `MAC Lookup: ${query}`, desc: 'Check manufacturer and OUI details', id: 'mac' });
  } else if (query.toLowerCase().includes('config') || query.toLowerCase().includes('template') || query.toLowerCase().includes('bulk') || query.toLowerCase().includes('interface')) {
    res.push({ type:'Action', title: `Interface Config Gen: ${query}`, desc: 'Bulk provision interfaces from template', id: 'config-gen' });
  }

  // 2. Tokenized Content Search
  const isOnlineQuery = /^onl?i/i.test(q.trim());
  TOOLS.forEach(t => {
    const kwStr = t.keywords || '';
    if (isOnlineQuery ? t.online : (matches(t.label) || matches(t.group) || matches(kwStr))) {
      res.push({ type:'Tool', title: t.label, desc: isOnlineQuery ? 'Requires internet connection' : `Group: ${t.group}`, id: t.id });
    }
  });

  KNOWLEDGE_BASE.forEach(k => {
    if (matches(k.title, k.tags)) {
      res.push({ type:'Topic', title: k.title, desc: `Reference: ${TOOLS.find(t=>t.id===k.id)?.label || k.id}`, id: k.id });
    }
  });

  AD_DATA.forEach(a => {
    if (matches(a.name) || matches(String(a.ad)) || matches(a.desc)) {
      res.push({ type:'Protocol', title: `${a.name} (AD ${a.ad})`, desc: a.desc, id: 'proto-ref' });
    }
  });

  if (typeof PORT_DATA !== 'undefined') {
    PORT_DATA.forEach(p => {
      if (matches(String(p.port)) || matches(p.service) || matches(p.desc) || matches(p.proto)) {
        res.push({ type:'Port', title: `${p.port}/${p.proto}`, desc: `${p.service}: ${p.desc}`, id: 'ports' });
      }
    });
  }

  PRIVATE_RANGES.forEach(r => {
    if (matches(r.range) || matches(r.rfc) || matches(r.use)) {
      res.push({ type:'Reference', title: r.range, desc: `${r.rfc}: ${r.use}`, id: 'cheatsheet' });
    }
  });

  SPECIAL_RANGES.forEach(r => {
    if (matches(r.range) || matches(r.rfc) || matches(r.use)) {
      res.push({ type:'Reference', title: r.range, desc: `${r.rfc}: ${r.use}`, id: 'cheatsheet' });
    }
  });

  IPV6_SPECIAL.forEach(r => {
    if (matches(r.addr) || matches(r.type) || matches(r.rfc) || matches(r.use)) {
      res.push({ type:'Reference', title: r.addr, desc: `${r.rfc}: ${r.type}`, id: 'cheatsheet' });
    }
  });

  // Deduplicate and limit
  const seen = new Set();
  return res.filter(r => {
    const key = `${r.type}:${r.title}:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
};

window.ShareModal = ShareModal;
