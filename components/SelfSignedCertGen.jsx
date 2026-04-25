const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SelfSignedCertGen() {
  const [form, setForm] = useState({ cn:'', org:'', country:'', days:'365', keyBits:'2048', sans:'' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [forgeReady, setForgeReady] = useState(!!window.forge);

  useEffect(() => {
    if (window.forge) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/node-forge@1.3.1/dist/forge.min.js';
    s.onload = () => setForgeReady(true);
    s.onerror = () => setErr('Failed to load cryptography library from CDN');
    document.head.appendChild(s);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generate = () => {
    if (!form.cn.trim()) { setErr('Common Name is required'); return; }
    setErr(''); setResult(null); setLoading(true);

    // Defer to let React render the loading state before blocking computation
    setTimeout(() => {
      try {
        const forge = window.forge;
        const bits = parseInt(form.keyBits);

        forge.pki.rsa.generateKeyPair({ bits, workers: -1 }, (genErr, keyPair) => {
          if (genErr) { setErr('Key generation failed: ' + genErr.message); setLoading(false); return; }
          try {
            const cert = forge.pki.createCertificate();
            cert.publicKey = keyPair.publicKey;
            cert.serialNumber = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');

            const now = new Date();
            const exp = new Date(now.getTime() + parseInt(form.days) * 86400000);
            cert.validity.notBefore = now;
            cert.validity.notAfter = exp;

            const attrs = [{ name:'commonName', value: form.cn.trim() }];
            if (form.org.trim()) attrs.push({ name:'organizationName', value: form.org.trim() });
            if (form.country.trim()) attrs.push({ name:'countryName', value: form.country.trim().toUpperCase().slice(0, 2) });
            cert.setSubject(attrs);
            cert.setIssuer(attrs);

            const extensions = [
              { name:'basicConstraints', cA: true, critical: true },
              { name:'keyUsage', keyCertSign: true, digitalSignature: true, keyEncipherment: true, critical: true },
              { name:'extKeyUsage', serverAuth: true, clientAuth: true },
              { name:'subjectKeyIdentifier' },
            ];

            const sanList = form.sans.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
            const cnLooksDomain = /[a-z].*\./i.test(form.cn.trim());
            const allSans = cnLooksDomain && !sanList.includes(form.cn.trim()) ? [form.cn.trim(), ...sanList] : sanList;
            if (allSans.length) {
              extensions.push({ name:'subjectAltName', altNames: allSans.map(s =>
                /^\d{1,3}(\.\d{1,3}){3}$/.test(s) ? { type:7, ip:s } : { type:2, value:s }
              )});
            }
            cert.setExtensions(extensions);
            cert.sign(keyPair.privateKey, forge.md.sha256.create());

            const certPem = forge.pki.certificateToPem(cert);
            const keyPem  = forge.pki.privateKeyToPem(keyPair.privateKey);

            const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
            const md = forge.md.sha256.create();
            md.update(derBytes);
            const fp = md.digest().toHex().toUpperCase().match(/../g).join(':');

            setResult({ certPem, keyPem, fingerprint: fp, notAfter: exp.toISOString().split('T')[0], cn: form.cn.trim(), bits });
          } catch (e2) {
            setErr('Certificate build failed: ' + (e2.message || e2));
          }
          setLoading(false);
        });
      } catch (e) {
        setErr('Generation failed: ' + (e.message || e));
        setLoading(false);
      }
    }, 50);
  };

  const downloadPem = (content, filename) => {
    const blob = new Blob([content], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">
          Self-Signed Certificate Generator
          {!forgeReady && <span className="badge badge-yellow" style={{marginLeft:8,fontSize:10}}>Loading crypto lib…</span>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          <div className="field" style={{gridColumn:'1/-1'}}>
            <label className="label">Common Name (CN) *</label>
            <input className={`input ${err&&!form.cn?'error':''}`} value={form.cn}
              onChange={e => set('cn', e.target.value)} placeholder="example.com or My Root CA" />
          </div>
          <div className="field">
            <label className="label">Organization (O)</label>
            <input className="input" value={form.org} onChange={e => set('org', e.target.value)} placeholder="My Company" />
          </div>
          <div className="field">
            <label className="label">Country (C)</label>
            <input className="input" value={form.country} onChange={e => set('country', e.target.value)} placeholder="US" maxLength={2} style={{textTransform:'uppercase'}} />
          </div>
          <div className="field">
            <label className="label">Validity Period</label>
            <select className="select" value={form.days} onChange={e => set('days', e.target.value)}>
              {[['30','30 days'],['90','90 days'],['365','1 year'],['730','2 years'],['3650','10 years']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Key Size</label>
            <select className="select" value={form.keyBits} onChange={e => set('keyBits', e.target.value)}>
              <option value="2048">RSA 2048-bit</option>
              <option value="4096">RSA 4096-bit (slower)</option>
            </select>
          </div>
          <div className="field" style={{gridColumn:'1/-1'}}>
            <label className="label">Subject Alternative Names (SANs)</label>
            <input className="input" value={form.sans} onChange={e => set('sans', e.target.value)} placeholder="www.example.com, api.example.com, 192.168.1.1" />
            <div className="hint">Comma-separated. Domains and IPs supported. CN is auto-added if it looks like a domain.</div>
          </div>
        </div>
        <Err msg={err} />
        <button className="btn btn-primary" onClick={generate} disabled={loading || !forgeReady} style={{marginTop:14}}>
          {loading ? 'Generating… (may take a few seconds)' : 'Generate Certificate & Key'}
        </button>
        <div className="hint" style={{marginTop:8}}>All generation happens locally in your browser — no data is sent to any server.</div>
      </div>

      {result && (
        <div className="card fadein">
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
            <span className="badge badge-green">Generated</span>
            <span style={{color:'var(--text)',fontSize:13,fontFamily:'var(--mono)'}}>{result.cn}</span>
            <span style={{color:'var(--muted)',fontSize:12}}>RSA {result.bits}-bit · Expires {result.notAfter}</span>
          </div>
          <div style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>SHA-256 Fingerprint</div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--cyan)',marginBottom:18,wordBreak:'break-all'}}>{result.fingerprint}</div>

          {[{label:'Certificate (PEM)', content:result.certPem, file:'certificate.pem'}, {label:'Private Key (PEM)', content:result.keyPem, file:'private-key.pem'}].map(({label,content,file}) => (
            <div key={file} style={{marginBottom:18}}>
              <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                <span style={{fontSize:13,fontWeight:600}}>{label}</span>
                <CopyBtn text={content} />
                <button className="btn btn-ghost btn-sm" onClick={() => downloadPem(content, file)}>↓ Download</button>
              </div>
              <div style={{background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'10px 14px',fontFamily:'var(--mono)',fontSize:11,color:'var(--dim)',maxHeight:150,overflowY:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all',userSelect:'all'}}>
                {content}
              </div>
            </div>
          ))}
          <div className="hint">⚠ Keep private-key.pem secure. Browsers will show a warning for self-signed certs unless you install the cert as a trusted CA on your OS/browser.</div>
        </div>
      )}
    </div>
  );
}

// ─── Reference Data ──────────────────────────────────────────
const PRIVATE_RANGES = [
  { range:'10.0.0.0/8', start:'10.0.0.0', end:'10.255.255.255', hosts:'16,777,214', rfc:'RFC1918', use:'Large private networks' },
  { range:'172.16.0.0/12', start:'172.16.0.0', end:'172.31.255.255', hosts:'1,048,574', rfc:'RFC1918', use:'Medium private networks' },
  { range:'192.168.0.0/16', start:'192.168.0.0', end:'192.168.255.255', hosts:'65,534', rfc:'RFC1918', use:'Home/small office' },
  { range:'100.64.0.0/10', start:'100.64.0.0', end:'100.127.255.255', hosts:'4,194,302', rfc:'RFC6598', use:'Carrier-grade NAT' },
  { range:'169.254.0.0/16', start:'169.254.0.0', end:'169.254.255.255', hosts:'65,024', rfc:'RFC3927', use:'APIPA / Link-local' },
  { range:'127.0.0.0/8', start:'127.0.0.0', end:'127.255.255.255', hosts:'16,777,214', rfc:'RFC1122', use:'Loopback' },
];

const SPECIAL_RANGES = [
  { range:'0.0.0.0/8', rfc:'RFC1122', use:'This network (source only)' },
  { range:'192.0.0.0/24', rfc:'RFC6890', use:'IETF Protocol Assignments' },
  { range:'192.0.2.0/24', rfc:'RFC5737', use:'TEST-NET-1 (Documentation)' },
  { range:'192.88.99.0/24', rfc:'RFC7526', use:'6to4 Relay Anycast (deprecated)' },
  { range:'198.18.0.0/15', rfc:'RFC2544', use:'Benchmarking' },
  { range:'198.51.100.0/24', rfc:'RFC5737', use:'TEST-NET-2 (Documentation)' },
  { range:'203.0.113.0/24', rfc:'RFC5737', use:'TEST-NET-3 (Documentation)' },
  { range:'224.0.0.0/4', rfc:'RFC3171', use:'Multicast' },
  { range:'240.0.0.0/4', rfc:'RFC1112', use:'Reserved (Class E)' },
  { range:'255.255.255.255/32', rfc:'RFC919', use:'Limited Broadcast' },
];

const IPV6_SPECIAL = [
  { addr:'::1/128', type:'Loopback', rfc:'RFC4291', use:'Self-loopback' },
  { addr:'::/128', type:'Unspecified', rfc:'RFC4291', use:'Unknown address' },
  { addr:'fe80::/10', type:'Link-Local Unicast', rfc:'RFC4291', use:'Single link only' },
  { addr:'fc00::/7', type:'Unique Local (ULA)', rfc:'RFC4193', use:'Private/Site-local' },
  { addr:'ff00::/8', type:'Multicast', rfc:'RFC4291', use:'One-to-many' },
  { addr:'2000::/3', type:'Global Unicast', rfc:'RFC4291', use:'Public Internet' },
  { addr:'2001:db8::/32', type:'Documentation', rfc:'RFC3849', use:'Examples/Manuals' },
  { addr:'2001::/32', type:'Teredo', rfc:'RFC4380', use:'IPv6-over-IPv4 tunneling' },
  { addr:'2002::/16', type:'6to4', rfc:'RFC3056', use:'Transition mechanism' },
  { addr:'::ffff:0:0/96', type:'IPv4-Mapped', rfc:'RFC4291', use:'IPv4 embedded in IPv6' },
  { addr:'64:ff9b::/96', type:'NAT64 Prefix', rfc:'RFC6052', use:'NAT64 well-known prefix' },
  { addr:'ff02::1:ff00:0/104', type:'Solicited-node', rfc:'RFC4291', use:'Neighbor Discovery' },
];

const IPV6_SCOPES = [
  { scope:'ff01::', name:'Interface-local', use:'Loopback' },
  { scope:'ff02::', name:'Link-local', use:'Single link / subnet' },
  { scope:'ff04::', name:'Admin-local', use:'Administrative domain' },
  { scope:'ff05::', name:'Site-local', use:'Whole site / enterprise' },
  { scope:'ff08::', name:'Organization-local', use:'Multiple sites' },
  { scope:'ff0e::', name:'Global', use:'Public Internet' },
];

const CLASS_TABLE = [
  { cls:'A', range:'1–126', mask:'/8',  networks:'126', hostsPerNet:'16,777,214', use:'Large organizations' },
  { cls:'B', range:'128–191', mask:'/16', networks:'16,384', hostsPerNet:'65,534', use:'Medium organizations' },
  { cls:'C', range:'192–223', mask:'/24', networks:'2,097,152', hostsPerNet:'254', use:'Small networks' },
  { cls:'D', range:'224–239', mask:'N/A', networks:'N/A', hostsPerNet:'N/A', use:'Multicast' },
  { cls:'E', range:'240–255', mask:'N/A', networks:'N/A', hostsPerNet:'N/A', use:'Reserved' },
];

const KNOWLEDGE_BASE = [
  { id: 'switching-ref', title: 'vPC (Virtual Port-Channel)', tags: ['vpc', 'nexus', 'peer-link', 'peer-keepalive', 'nexus', 'switching', 'mclag', 'mlag', 'orphan port', 'consistency check'] },
  { id: 'switching-ref', title: 'STP (Spanning Tree Protocol)', tags: ['stp', '802.1d', '802.1w', '802.1s', 'rstp', 'mst', 'root bridge', 'bpdu', 'spanning tree', 'portfast', 'bpduguard'] },
  { id: 'switching-ref', title: 'LACP / EtherChannel', tags: ['lacp', 'pagp', 'etherchannel', 'port-channel', '802.3ad', 'bundling', 'load-balance', 'hashing'] },
  { id: 'vxlan-ref', title: 'VXLAN (Virtual Extensible LAN)', tags: ['vxlan', 'overlay', 'vtep', 'vni', 'encapsulation', 'nve', 'evpn', 'rfc7348'] },
  { id: 'ipfm-ref', title: 'IPFM, NBM & PTP', tags: ['ipfm', 'ptp', 'nbm', 'broadcast', '2110', 'smpte', 'boundary clock', 'grandmaster', '2059', 'aes67', 'non-blocking multicast'] },
  { id: 'switching-ref', title: 'FHRP (HSRP, VRRP, GLBP)', tags: ['hsrp', 'vrrp', 'glbp', 'fhrp', 'redundancy', 'virtual gateway', 'active', 'standby', 'priority'] },
  { id: 'proto-ref', title: 'OSPF (Open Shortest Path First)', tags: ['ospf', 'lsa', 'abr', 'asbr', 'shortest path', 'igp', 'link-state', 'area 0', 'backbone', 'hello', 'dead interval', 'lsa type 1', 'lsa type 2', 'lsa type 3', 'lsa type 5'] },
  { id: 'proto-ref', title: 'BGP (Border Gateway Protocol)', tags: ['bgp', 'ebgp', 'ibgp', 'as-path', 'autonomous system', 'med', 'local preference', 'path vector', 'weight', 'neighbor states', 'established'] },
  { id: 'proto-ref', title: 'EIGRP', tags: ['eigrp', 'successor', 'feasible successor', 'k-values', 'dual', 'cisco proprietary', 'hello', 'update', 'query', 'reply', 'ack'] },
  { id: 'proto-ref', title: 'IS-IS', tags: ['is-is', 'clns', 'nsap', 'level 1', 'level 2', 'intermediate system', 'pdu', 'lsp', 'csnp', 'psnp'] },
  { id: 'proto-ref', title: 'MPLS & Label Switching', tags: ['mpls', 'ldp', 'rsvp', 'rsvp-te', 'label', 'fec', 'lib', 'lfib', 'lsr', 'ler', 'php', 'penultimate hop popping'] },
  { id: 'proto-ref', title: 'Administrative Distance (AD)', tags: ['ad', 'admin distance', 'trustworthiness', 'route preference', '0', '1', '20', '90', '110', '115', '120', '170', '200'] },
  { id: 'osi-model', title: 'OSI Model Layers', tags: ['osi', 'layer 1', 'layer 2', 'layer 3', 'layer 4', 'layer 5', 'layer 6', 'layer 7', 'tcp/ip', 'encapsulation', 'data', 'segments', 'packets', 'frames', 'bits'] },
  { id: 'ports', title: 'Common TCP/UDP Ports', tags: ['port', 'service', 'protocol', 'iana', 'well-known', 'dhcp', 'dns', 'http', 'https', 'ssh', 'telnet', 'ftp', 'smtp', 'snmp', 'bgp', 'rip'] },
  { id: 'cheatsheet', title: 'RFC1918 Private Ranges', tags: ['rfc1918', 'private ip', '10.0.0.0', '172.16.0.0', '192.168.0.0', 'nat', 'carrier-grade nat'] },
  { id: 'cheatsheet', title: 'Special IPv4/IPv6 Ranges', tags: ['multicast', 'loopback', 'apipa', 'link-local', 'rfc6890', 'rfc4291', 'anycast', 'broadcast', 'test-net'] },
  { id: 'packet-headers', title: 'Packet Header Layouts', tags: ['header', 'ipv4 header', 'tcp header', 'udp header', 'ethernet header', 'mtu', 'ttl', 'checksum', 'flags', 'offset', 'window size'] },
  { id: 'wireshark', title: 'Wireshark & TShark Toolkit', tags: ['wireshark', 'tshark', 'pcap', 'packet capture', 'display filter', 'capture filter', 'tcpdump', 'trace', 'analysis'] },
  { id: 'cypher', title: 'Cypher Deck', tags: ['encode', 'decode', 'base64', 'hex', 'binary', 'hash', 'sha', 'md5', 'jwt', 'xor', 'cipher', 'crypto', 'rot13', 'brute force', 'hmac'] },
  { id: 'diag', title: 'Remote Ping & MTR', tags: ['ping', 'traceroute', 'mtr', 'latency', 'reachability', 'diagnostics', 'icmp', 'packet loss'] },
  { id: 'mcast-ref', title: 'Multicast Address Reference', tags: ['multicast', 'igmp', 'mld', 'pim', '224.0.0.0', 'ff00::', 'dense mode', 'sparse mode', 'ssm'] },
];

const AD_DATA = [
  { name: 'Connected', ad: 0, type: 'Direct', desc: 'Interfaces physically connected.' },
  { name: 'Static', ad: 1, type: 'Manual', desc: 'User-defined routes.' },
  { name: 'EIGRP (Summary)', ad: 5, type: 'IGP', desc: 'EIGRP summary routes.' },
  { name: 'eBGP', ad: 20, type: 'EGP', desc: 'External BGP (between different AS).' },
  { name: 'EIGRP (Internal)', ad: 90, type: 'IGP', desc: 'Fast convergence, Cisco prop.' },
  { name: 'IGRP', ad: 100, type: 'IGP', desc: 'Legacy Cisco distance vector.' },
  { name: 'OSPF', ad: 110, type: 'IGP', desc: 'Link-state (Shortest Path First).' },
  { name: 'IS-IS', ad: 115, type: 'IGP', desc: 'Link-state, used in service providers.' },
  { name: 'RIP', ad: 120, type: 'IGP', desc: 'Distance vector, max 15 hops.' },
  { name: 'EIGRP (External)', ad: 170, type: 'IGP', desc: 'Redistributed from other protocols.' },
  { name: 'iBGP', ad: 200, type: 'EGP', desc: 'Internal BGP (within same AS).' },
  { name: 'Unreachable', ad: 255, type: '—', desc: 'Unknown/Untrusted route.' },
];

// ─── Tool: Cheat Sheet ────────────────────────────────────────
window.SelfSignedCertGen = SelfSignedCertGen;
