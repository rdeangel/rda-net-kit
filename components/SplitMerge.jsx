const { useState, useEffect, useCallback, useRef, useMemo } = React;

function SplitMerge() {
  const [mode, setMode] = useState('split');
  const [cidr, setCidr] = useState('192.168.0.0/22');
  const [splitCount, setSplitCount] = useState(4);
  const [mergeLines, setMergeLines] = useState('192.168.0.0/24\n192.168.1.0/24\n192.168.2.0/24\n192.168.3.0/24');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const calc = () => {
    setErr(''); setResult(null);
    if (mode === 'split') {
      const c = IPv4.parseCIDR(cidr);
      if (!c) { setErr('Invalid CIDR'); return; }
      const bits = Math.ceil(Math.log2(splitCount));
      const newPrefix = c.prefix + bits;
      if (newPrefix > 32) { setErr('Too many splits for this prefix'); return; }
      const count = Math.pow(2, bits);
      const parent = IPv4.subnet(c.ip, c.prefix);
      const subnets = Array.from({length: count}, (_, i) => {
        const net = (parent.network + i * Math.pow(2, 32 - newPrefix)) >>> 0;
        return IPv4.subnet(net, newPrefix);
      });
      setResult({ mode:'split', subnets, newPrefix, parent });
    } else {
      const entries = mergeLines.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (entries.length < 2) { setErr('Enter at least 2 networks'); return; }
      const parsed = entries.map(e => { const c = IPv4.parseCIDR(e); return c ? IPv4.subnet(c.ip, c.prefix) : null; });
      if (parsed.some(p => !p)) { setErr('Invalid CIDR in list'); return; }
      const allIPs = parsed.flatMap(n => [n.network, n.broadcast]);
      const sup = IPv4.supernet(allIPs);
      setResult({ mode:'merge', subnets: parsed, supernet: sup });
    }
  };

  useEffect(() => calc(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[['split','Split Subnet'],['merge','Merge / Summarize']].map(([v,l]) => (
            <button key={v} className={`btn ${mode===v?'btn-primary':'btn-ghost'}`} onClick={() => { setMode(v); setResult(null); setErr(''); }}>{l}</button>
          ))}
        </div>
        {mode === 'split' ? (
          <div className="two-col grid-mobile-1">
            <div className="field"><label className="label">Parent Network</label>
              <input className="input" value={cidr} onChange={e => setCidr(e.target.value)} placeholder="192.168.0.0/22" /></div>
            <div className="field"><label className="label">Number of Subnets</label>
              <select className="select" value={splitCount} onChange={e => setSplitCount(parseInt(e.target.value))}>
                {[2,4,8,16,32,64,128,256].map(n => <option key={n} value={n}>{n} equal subnets</option>)}
              </select></div>
          </div>
        ) : (
          <div className="field"><label className="label">Networks to Merge (one CIDR per line)</label>
            <textarea className="input" rows={5} value={mergeLines} onChange={e => setMergeLines(e.target.value)} style={{resize:'vertical'}} /></div>
        )}
        <Err msg={err} />
        <button className="btn btn-primary" onClick={calc}>{mode==='split'?'Split':'Merge & Summarize'}</button>
      </div>

      {result && (
        <div className="card fadein">
          {result.mode === 'split' ? (
            <>
              <div className="card-title">{result.subnets.length} subnets of /{result.newPrefix} from {result.parent.cidr}</div>
              <div className="table-wrap hide-mobile">
                <table><thead><tr><th>#</th><th>Network</th><th>CIDR</th><th>First Host</th><th>Last Host</th><th>Broadcast</th></tr></thead>
                <tbody>{result.subnets.map((sn,i) => (
                  <tr key={i}><td style={{color:'var(--dim)'}}>{i+1}</td><td style={{color:'var(--cyan)'}}>{sn.networkStr}</td><td>{sn.cidr}</td><td>{sn.firstHostStr}</td><td>{sn.lastHostStr}</td><td style={{color:'var(--red)'}}>{sn.broadcastStr}</td></tr>
                ))}</tbody></table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards">
                {result.subnets.map((sn,i) => (
                  <div key={i} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Subnet {i+1}</span>
                      <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{sn.cidr}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Range</span>
                      <span className="mobile-card-value" style={{fontSize:11}}>{sn.firstHostStr} - {sn.lastHostStr}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="btn-row">
                <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(result.subnets.map((s,i)=>({index:i+1,cidr:s.cidr,network:s.networkStr,first:s.firstHostStr,last:s.lastHostStr,broadcast:s.broadcastStr})),'split.csv')}>Export CSV</button>
              </div>
            </>
          ) : (
            <>
              <div className="card-title">Summary Route</div>
              <div className="result-grid grid-mobile-1" style={{marginBottom:16}}>
                <ResultItem label="Supernet CIDR" value={result.supernet.cidr} accent />
                <ResultItem label="Network" value={result.supernet.networkStr} />
                <ResultItem label="Broadcast" value={result.supernet.broadcastStr} />
                <ResultItem label="Mask" value={result.supernet.maskStr} />
                <ResultItem label="Total Addresses" value={result.supernet.totalCount} />
              </div>
              <div className="card-title">Input Networks</div>
              <div className="table-wrap hide-mobile">
                <table><thead><tr><th>CIDR</th><th>Network</th><th>Broadcast</th><th>Hosts</th></tr></thead>
                <tbody>{result.subnets.map((n,i) => <tr key={i}><td style={{color:'var(--cyan)'}}>{n.cidr}</td><td>{n.networkStr}</td><td>{n.broadcastStr}</td><td style={{color:'var(--green)'}}>{n.hostCount}</td></tr>)}</tbody>
                </table>
              </div>
              {/* Mobile View */}
              <div className="show-mobile mobile-cards">
                {result.subnets.map((n,i) => (
                  <div key={i} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">CIDR</span>
                      <span className="mobile-card-value" style={{color:'var(--cyan)', fontWeight:600}}>{n.cidr}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Hosts</span>
                      <span className="mobile-card-value" style={{color:'var(--green)'}}>{n.hostCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: Port Reference ─────────────────────────────────────
const PORT_DATA = [
  {port:20,proto:'TCP',service:'FTP Data',desc:'File Transfer Protocol (data)'},
  {port:21,proto:'TCP',service:'FTP Control',desc:'File Transfer Protocol (control)'},
  {port:22,proto:'TCP',service:'SSH',desc:'Secure Shell'},
  {port:23,proto:'TCP',service:'Telnet',desc:'Telnet (unencrypted)'},
  {port:25,proto:'TCP',service:'SMTP',desc:'Simple Mail Transfer Protocol'},
  {port:53,proto:'TCP/UDP',service:'DNS',desc:'Domain Name System'},
  {port:67,proto:'UDP',service:'DHCP Server',desc:'DHCP — server to client'},
  {port:68,proto:'UDP',service:'DHCP Client',desc:'DHCP — client to server'},
  {port:69,proto:'UDP',service:'TFTP',desc:'Trivial File Transfer Protocol'},
  {port:80,proto:'TCP',service:'HTTP',desc:'HyperText Transfer Protocol'},
  {port:88,proto:'TCP/UDP',service:'Kerberos',desc:'Kerberos authentication'},
  {port:110,proto:'TCP',service:'POP3',desc:'Post Office Protocol v3'},
  {port:111,proto:'TCP/UDP',service:'RPC',desc:'Remote Procedure Call'},
  {port:119,proto:'TCP',service:'NNTP',desc:'Network News Transfer Protocol'},
  {port:123,proto:'UDP',service:'NTP',desc:'Network Time Protocol'},
  {port:135,proto:'TCP/UDP',service:'RPC/EPMAP',desc:'Microsoft RPC / End Point Mapper'},
  {port:137,proto:'UDP',service:'NetBIOS-NS',desc:'NetBIOS Name Service'},
  {port:138,proto:'UDP',service:'NetBIOS-DGM',desc:'NetBIOS Datagram Service'},
  {port:139,proto:'TCP',service:'NetBIOS-SSN',desc:'NetBIOS Session Service'},
  {port:143,proto:'TCP',service:'IMAP',desc:'Internet Message Access Protocol'},
  {port:161,proto:'UDP',service:'SNMP',desc:'Simple Network Management Protocol'},
  {port:162,proto:'UDP',service:'SNMP Trap',desc:'SNMP Trap messages'},
  {port:179,proto:'TCP',service:'BGP',desc:'Border Gateway Protocol'},
  {port:194,proto:'TCP',service:'IRC',desc:'Internet Relay Chat'},
  {port:389,proto:'TCP/UDP',service:'LDAP',desc:'Lightweight Directory Access Protocol'},
  {port:443,proto:'TCP',service:'HTTPS',desc:'HTTP over TLS/SSL'},
  {port:445,proto:'TCP',service:'SMB',desc:'Server Message Block (Windows file sharing)'},
  {port:465,proto:'TCP',service:'SMTPS',desc:'SMTP over SSL'},
  {port:500,proto:'UDP',service:'IKE',desc:'IPsec Internet Key Exchange'},
  {port:514,proto:'UDP',service:'Syslog',desc:'Syslog messages'},
  {port:515,proto:'TCP',service:'LPD',desc:'Line Printer Daemon'},
  {port:520,proto:'UDP',service:'RIP',desc:'Routing Information Protocol'},
  {port:546,proto:'UDP',service:'DHCPv6 Client',desc:'DHCPv6 client'},
  {port:547,proto:'UDP',service:'DHCPv6 Server',desc:'DHCPv6 server'},
  {port:587,proto:'TCP',service:'SMTP (Submit)',desc:'Mail submission (STARTTLS)'},
  {port:636,proto:'TCP',service:'LDAPS',desc:'LDAP over SSL'},
  {port:646,proto:'TCP/UDP',service:'LDP',desc:'MPLS Label Distribution Protocol'},
  {port:853,proto:'TCP',service:'DNS-over-TLS',desc:'DoT — encrypted DNS'},
  {port:989,proto:'TCP',service:'FTPS Data',desc:'FTP over SSL (data)'},
  {port:990,proto:'TCP',service:'FTPS Control',desc:'FTP over SSL (control)'},
  {port:993,proto:'TCP',service:'IMAPS',desc:'IMAP over SSL'},
  {port:995,proto:'TCP',service:'POP3S',desc:'POP3 over SSL'},
  {port:1080,proto:'TCP',service:'SOCKS',desc:'SOCKS proxy'},
  {port:1194,proto:'UDP',service:'OpenVPN',desc:'OpenVPN default port'},
  {port:1433,proto:'TCP',service:'MSSQL',desc:'Microsoft SQL Server'},
  {port:1434,proto:'UDP',service:'MSSQL Browser',desc:'SQL Server Browser Service'},
  {port:1521,proto:'TCP',service:'Oracle DB',desc:'Oracle Database listener'},
  {port:1701,proto:'UDP',service:'L2TP',desc:'Layer 2 Tunneling Protocol'},
  {port:1723,proto:'TCP',service:'PPTP',desc:'Point-to-Point Tunneling Protocol'},
  {port:1812,proto:'UDP',service:'RADIUS Auth',desc:'RADIUS authentication'},
  {port:1813,proto:'UDP',service:'RADIUS Acct',desc:'RADIUS accounting'},
  {port:2049,proto:'TCP/UDP',service:'NFS',desc:'Network File System'},
  {port:2181,proto:'TCP',service:'ZooKeeper',desc:'Apache ZooKeeper'},
  {port:2375,proto:'TCP',service:'Docker',desc:'Docker daemon (unencrypted)'},
  {port:2376,proto:'TCP',service:'Docker TLS',desc:'Docker daemon (TLS)'},
  {port:3306,proto:'TCP',service:'MySQL',desc:'MySQL / MariaDB'},
  {port:3389,proto:'TCP',service:'RDP',desc:'Remote Desktop Protocol'},
  {port:4500,proto:'UDP',service:'IPsec NAT-T',desc:'IPsec NAT Traversal'},
  {port:4789,proto:'UDP',service:'VXLAN',desc:'Virtual Extensible LAN'},
  {port:5000,proto:'TCP',service:'Docker Registry',desc:'Docker Registry (default)'},
  {port:5060,proto:'TCP/UDP',service:'SIP',desc:'Session Initiation Protocol'},
  {port:5061,proto:'TCP',service:'SIP TLS',desc:'SIP over TLS'},
  {port:5355,proto:'UDP',service:'LLMNR',desc:'Link-Local Multicast Name Resolution'},
  {port:5432,proto:'TCP',service:'PostgreSQL',desc:'PostgreSQL database'},
  {port:5900,proto:'TCP',service:'VNC',desc:'Virtual Network Computing'},
  {port:6379,proto:'TCP',service:'Redis',desc:'Redis key-value store'},
  {port:6443,proto:'TCP',service:'Kubernetes API',desc:'Kubernetes API server'},
  {port:6514,proto:'TCP',service:'Syslog TLS',desc:'Syslog over TLS'},
  {port:8080,proto:'TCP',service:'HTTP Alt',desc:'Alternative HTTP / web proxies'},
  {port:8443,proto:'TCP',service:'HTTPS Alt',desc:'Alternative HTTPS'},
  {port:8883,proto:'TCP',service:'MQTT TLS',desc:'MQTT over TLS'},
  {port:9092,proto:'TCP',service:'Kafka',desc:'Apache Kafka'},
  {port:9200,proto:'TCP',service:'Elasticsearch',desc:'Elasticsearch REST API'},
  {port:9300,proto:'TCP',service:'Elasticsearch',desc:'Elasticsearch inter-node'},
  {port:10250,proto:'TCP',service:'Kubelet',desc:'Kubernetes Kubelet API'},
  {port:27017,proto:'TCP',service:'MongoDB',desc:'MongoDB database'},
  {port:5004,proto:'UDP',service:'RTP',desc:'Real-time Transport Protocol'},
  {port:5005,proto:'UDP',service:'RTCP',desc:'RTP Control Protocol'},
  {port:554,proto:'TCP/UDP',service:'RTSP',desc:'Real Time Streaming Protocol'},
  {port:111,proto:'TCP/UDP',service:'SUNRPC',desc:'ONC RPC / portmapper'},
  {port:2049,proto:'TCP/UDP',service:'NFS',desc:'Network File System'},
  {port:5900,proto:'TCP',service:'VNC',desc:'Virtual Network Computing'},
  {port:6000,proto:'TCP',service:'X11',desc:'X Window System'},
  {port:1723,proto:'TCP',service:'PPTP',desc:'Point-to-Point Tunneling Protocol'},
  {port:1701,proto:'UDP',service:'L2TP',desc:'Layer 2 Tunneling Protocol'},
  {port:1194,proto:'UDP',service:'OpenVPN',desc:'OpenVPN default'},
  {port:500,proto:'UDP',service:'ISAKMP',desc:'Internet Security Association and Key Management Protocol'},
  {port:4500,proto:'UDP',service:'IPsec NAT-T',desc:'IPsec NAT Traversal'},
  {port:5060,proto:'TCP/UDP',service:'SIP',desc:'Session Initiation Protocol'},
  {port:5061,proto:'TCP/UDP',service:'SIPS',desc:'SIP over TLS'},
  {port:1812,proto:'UDP',service:'RADIUS Auth',desc:'RADIUS authentication'},
  {port:1813,proto:'UDP',service:'RADIUS Acct',desc:'RADIUS accounting'},
  {port:37,proto:'TCP/UDP',service:'Time',desc:'Time Protocol'},
  {port:43,proto:'TCP',service:'Whois',desc:'Whois protocol'},
  {port:70,proto:'TCP',service:'Gopher',desc:'Gopher protocol'},
  {port:79,proto:'TCP',service:'Finger',desc:'Finger protocol'},
  {port:514,proto:'UDP',service:'Syslog',desc:'Syslog messages'},
  {port:515,proto:'TCP',service:'LPD',desc:'Line Printer Daemon'},
  {port:520,proto:'UDP',service:'RIP',desc:'Routing Information Protocol'},
  {port:521,proto:'UDP',service:'RIPng',desc:'RIP for IPv6'},
  {port:631,proto:'TCP/UDP',service:'IPP',desc:'Internet Printing Protocol'},
  {port:873,proto:'TCP',service:'Rsync',desc:'Rsync file synchronization'},
  {port:1433,proto:'TCP',service:'MSSQL',desc:'Microsoft SQL Server'},
  {port:3306,proto:'TCP',service:'MySQL',desc:'MySQL / MariaDB'},
  {port:5432,proto:'TCP',service:'PostgreSQL',desc:'PostgreSQL database'},
  {port:6379,proto:'TCP',service:'Redis',desc:'Redis key-value store'},
  {port:27017,proto:'TCP',service:'MongoDB',desc:'MongoDB default'},
  {port:8080,proto:'TCP',service:'HTTP Alt',desc:'Common alternative for web servers'},
  {port:8443,proto:'TCP',service:'HTTPS Alt',desc:'Common alternative for HTTPS'},
  {port:9092,proto:'TCP',service:'Kafka',desc:'Apache Kafka broker'},
  {port:10000,proto:'TCP',service:'Webmin',desc:'Web-based system administration'},
];

const PROTOCOL_DATA = [
  {num:1,name:'ICMP',desc:'Internet Control Message Protocol (v4)',rfc:'RFC 792'},
  {num:2,name:'IGMP',desc:'Internet Group Management Protocol',rfc:'RFC 1112'},
  {num:4,name:'IP-in-IP',desc:'IP in IP (encapsulation)',rfc:'RFC 2003'},
  {num:6,name:'TCP',desc:'Transmission Control Protocol',rfc:'RFC 793'},
  {num:8,name:'EGP',desc:'Exterior Gateway Protocol',rfc:'RFC 827'},
  {num:9,name:'IGP',desc:'Interior Gateway Protocol',rfc:'any private IGP'},
  {num:17,name:'UDP',desc:'User Datagram Protocol',rfc:'RFC 768'},
  {num:27,name:'RDP',desc:'Reliable Data Protocol',rfc:'RFC 908'},
  {num:41,name:'IPv6-in-IPv4',desc:'IPv6 encapsulation',rfc:'RFC 2473'},
  {num:46,name:'RSVP',desc:'Resource Reservation Protocol',rfc:'RFC 2205'},
  {num:47,name:'GRE',desc:'Generic Routing Encapsulation',rfc:'RFC 2784'},
  {num:50,name:'ESP',desc:'Encapsulating Security Payload (IPsec)',rfc:'RFC 4303'},
  {num:51,name:'AH',desc:'Authentication Header (IPsec)',rfc:'RFC 4302'},
  {num:58,name:'IPv6-ICMP',desc:'ICMP for IPv6',rfc:'RFC 4443'},
  {num:88,name:'EIGRP',desc:'Enhanced Interior Gateway Routing Protocol',rfc:'Cisco'},
  {num:89,name:'OSPF',desc:'Open Shortest Path First',rfc:'RFC 2328'},
  {num:103,name:'PIM',desc:'Protocol Independent Multicast',rfc:'RFC 4601'},
  {num:112,name:'VRRP',desc:'Virtual Router Redundancy Protocol',rfc:'RFC 5798'},
  {num:115,name:'L2TP',desc:'Layer Two Tunneling Protocol',rfc:'RFC 2661'},
  {num:132,name:'SCTP',desc:'Stream Control Transmission Protocol',rfc:'RFC 4960'},
];

const ROUTING_DATA = [
  {name:'Connected', ad:0, type:'Direct', algo:'—', metric:'Direct', desc:'Interfaces directly connected to the router.'},
  {name:'Static', ad:1, type:'Manual', algo:'—', metric:'Manual', desc:'Manually configured routes.'},
  {name:'EIGRP (Summary)', ad:5, type:'IGP', algo:'DUAL', metric:'Bandwidth/Delay', desc:'EIGRP summary routes.'},
  {name:'eBGP', ad:20, type:'EGP', algo:'Path Vector', metric:'AS Path', desc:'External BGP (routes between different AS).'},
  {name:'EIGRP (Internal)', ad:90, type:'IGP', algo:'DUAL', metric:'Composite', desc:'Cisco proprietary (mostly). Fast convergence.'},
  {name:'IGRP', ad:100, type:'IGP', algo:'Dist. Vector', metric:'Composite', desc:'Legacy Cisco protocol (replaced by EIGRP).'},
  {name:'OSPF', ad:110, type:'IGP', algo:'Link State', metric:'Cost', desc:'Shortest Path First. Uses Areas and LSAs.'},
  {name:'IS-IS', ad:115, type:'IGP', algo:'Link State', metric:'Cost', desc:'Intermediate System to Intermediate System.'},
  {name:'RIP', ad:120, type:'IGP', algo:'Dist. Vector', metric:'Hop Count', desc:'Simple, max 15 hops. Legacy networks.'},
  {name:'EIGRP (External)', ad:170, type:'IGP', algo:'DUAL', metric:'Composite', desc:'EIGRP routes redistributed from other protocols.'},
  {name:'iBGP', ad:200, type:'EGP', algo:'Path Vector', metric:'AS Path', desc:'Internal BGP (routes within the same AS).'},
  {name:'Unreachable', ad:255, type:'—', algo:'—', metric:'—', desc:'Unknown/Untrusted route (will not be installed).'},
];

window.SplitMerge = SplitMerge;
