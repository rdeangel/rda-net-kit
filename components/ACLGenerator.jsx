const { useState, useEffect, useCallback, useRef, useMemo } = React;

function ACLGenerator() {
  const [cidr, setCidr] = useState('192.168.1.0/24');
  const [action, setAction] = useState('permit');
  const [proto, setProto] = useState('ip');
  const [port, setPort] = useState('');
  const [platform, setPlatform] = useState('cisco-ios');
  const [ruleType, setRuleType] = useState('filter');
  const [natTarget, setNatTarget] = useState('');
  const [natPort, setNatPort] = useState('');
  const [iface, setIface] = useState('eth0');
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const getExplanation = () => {
    if (platform === 'iptables') {
      if (ruleType === 'filter') return "iptables uses the 'filter' table by default. 'INPUT' handles packets destined for the local system, while 'FORWARD' handles traffic passing through (routing). Stateful rules (using conntrack) are recommended for security.";
      if (ruleType === 'masquerade') return "Masquerading is a form of Dynamic SNAT. It replaces the source IP with the IP of the outgoing interface (" + iface + "). It's used to give a private LAN access to the internet via a dynamic public IP.";
      if (ruleType === 'snat') return "Static SNAT (Source NAT) replaces the source IP with a fixed address (" + (natTarget || '1.2.3.4') + "). Used when the gateway has multiple static IPs.";
      if (ruleType === 'dnat') return "DNAT (Destination NAT) or Port Forwarding modifies the destination IP/port of incoming packets. This allows external users to access a server inside your private network.";
    }
    if (platform === 'nftables') {
      return "nftables is the modern replacement for iptables. It uses a single 'nft' tool and supports 'inet' tables that handle both IPv4 and IPv6. NAT rules are added as hooks to the 'nat' table, usually with priority -100 for prerouting and 100 for postrouting.";
    }
    return "This configuration generates the necessary syntax for the selected platform. Most firewall policies follow a top-down execution order.";
  };

  const generate = () => {
    setErr('');
    const c = IPv4.parseCIDR(cidr);
    if (!c) { setErr('Invalid CIDR'); return; }
    const sn = IPv4.subnet(c.ip, c.prefix);
    const portStr = port.trim();
    const dstPortSuffix = portStr ? ` eq ${portStr}` : '';
    let out = '';

    const formatPort = (p, plat) => {
      if (!p) return '';
      if (plat === 'iptables') return p.replace('-', ':');
      if (plat === 'nftables') return p.replace(':', '-');
      return p;
    };

    if (platform === 'cisco-ios') {
      const wc = sn.wildcardStr;
      const net = sn.networkStr;
      if (ruleType === 'filter') {
        if (proto === 'ip') {
          out = `access-list 100 ${action} ip ${net} ${wc} any`;
        } else {
          out = `access-list 100 ${action} ${proto} ${net} ${wc} any any${dstPortSuffix}`;
        }
        out += `\n! Named ACL equivalent:\nip access-list extended NET_ACL\n ${action} ${proto} ${net} ${wc} any${dstPortSuffix}`;
      } else if (ruleType === 'masquerade') {
        out = `! Cisco IOS NAT (PAT / Overload)\naccess-list 1 permit ${net} ${wc}\nip nat inside source list 1 interface ${iface} overload\n\n! Apply to interfaces:\ninterface ${iface}\n ip nat outside\ninterface GigabitEthernet2\n ip nat inside`;
      } else if (ruleType === 'dnat') {
        out = `! Cisco IOS Static NAT (Port Forward)\nip nat inside source static ${proto} ${natTarget || '192.168.1.10'} ${natPort || portStr || '80'} interface ${iface} ${portStr || '80'}`;
      }
    } else if (platform === 'iptables') {
      const act = action === 'permit' ? 'ACCEPT' : 'DROP';
      if (ruleType === 'filter') {
        out = `# Standard Stateful Boilerplate\niptables -P INPUT DROP\niptables -P FORWARD DROP\niptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT\niptables -A INPUT -i lo -j ACCEPT\n\n`;
        out += `# iptables rule for ${cidr}\niptables -A INPUT -s ${sn.cidr} -p ${proto === 'ip' ? 'all' : proto}${portStr ? ` --dport ${formatPort(portStr, 'iptables')}` : ''} -j ${act}\niptables -A FORWARD -s ${sn.cidr} -p ${proto === 'ip' ? 'all' : proto}${portStr ? ` --dport ${formatPort(portStr, 'iptables')}` : ''} -j ${act}`;
      } else if (ruleType === 'masquerade') {
        out = `# iptables NAT: Masquerade (Dynamic SNAT)\niptables -t nat -A POSTROUTING -s ${sn.cidr} -o ${iface} -j MASQUERADE\n\n# Ensure IP forwarding is enabled:\nsysctl -w net.ipv4.ip_forward=1`;
      } else if (ruleType === 'snat') {
        out = `# iptables NAT: Static SNAT\niptables -t nat -A POSTROUTING -s ${sn.cidr} -o ${iface} -j SNAT --to-source ${natTarget || '1.2.3.4'}`;
      } else if (ruleType === 'dnat') {
        out = `# iptables NAT: DNAT (Port Forward)\niptables -t nat -A PREROUTING -i ${iface} -p ${proto} --dport ${portStr || '80'} -j DNAT --to-destination ${natTarget || '192.168.1.10'}${natPort ? `:${natPort}` : ''}`;
      }
    } else if (platform === 'pfsense') {
      out = `# pfSense / OPNsense rule (Firewall > Rules)\nAction: ${action === 'permit' ? 'Pass' : 'Block'}\nProtocol: ${proto.toUpperCase()}\nSource: ${sn.cidr}\nDestination: any${portStr ? `\nDestination Port: ${portStr}` : ''}`;
    } else if (platform === 'nftables') {
      const act = action === 'permit' ? 'accept' : 'drop';
      if (ruleType === 'filter') {
        out = `table inet filter {\n  chain input {\n    type filter hook input priority 0; policy drop;\n    ct state established,related accept\n    iifname "lo" accept\n    ip saddr ${sn.cidr} ${proto === 'ip' ? '' : `${proto} dport ${formatPort(portStr || 'any', 'nftables')} `}${act}\n  }\n}`;
      } else if (ruleType === 'masquerade' || ruleType === 'snat') {
        const natAct = ruleType === 'masquerade' ? 'masquerade' : `snat to ${natTarget || '1.2.3.4'}`;
        out = `table ip nat {\n  chain postrouting {\n    type nat hook postrouting priority 100;\n    ip saddr ${sn.cidr} oifname "${iface}" ${natAct}\n  }\n}`;
      } else if (ruleType === 'dnat') {
        out = `table ip nat {\n  chain prerouting {\n    type nat hook prerouting priority -100;\n    iifname "${iface}" ${proto} dport ${portStr || '80'} dnat to ${natTarget || '192.168.1.10'}${natPort ? `:${natPort}` : ''}\n  }\n}`;
      }
    } else if (platform === 'aws-sg') {
      const dir = action === 'permit' ? 'Inbound' : 'Outbound (deny not supported; use NACL)';
      out = `# AWS Security Group Rule\nDirection: ${dir}\nType: Custom ${proto.toUpperCase()}\nProtocol: ${proto === 'ip' ? 'All' : proto.toUpperCase()}\nPort Range: ${portStr || 'All'}\nSource/Destination: ${sn.cidr}\n\n# AWS NACL (supports deny):\nRule #: 100\nType: Custom ${proto.toUpperCase()}\nProtocol: ${proto === 'ip' ? 'All' : proto}\nPort Range: ${portStr || 'All'}\nSource: ${sn.cidr}\nAction: ${action === 'permit' ? 'ALLOW' : 'DENY'}`;
    } else if (platform === 'windows') {
      const dir = action === 'permit' ? 'allow' : 'block';
      out = `# Windows Firewall (netsh advfirewall)\nnetsh advfirewall firewall add rule name="NET_RULE" dir=in action=${dir} protocol=${proto === 'ip' ? 'any' : proto} remoteip=${sn.cidr}${portStr ? ` localport=${portStr}` : ''} enable=yes`;
    } else if (platform === 'junos') {
      out = `# Junos firewall filter\nfirewall {\n  family inet {\n    filter FILTER_NAME {\n      term TERM1 {\n        from {\n          source-address ${sn.cidr};\n          ${proto !== 'ip' ? `protocol ${proto};` : ''}\n          ${portStr ? `destination-port ${portStr};` : ''}\n        }\n        then {\n          ${action === 'permit' ? 'accept' : 'discard'};\n        }\n      }\n      term DEFAULT {\n        then accept;\n      }\n    }\n  }\n}`;
    } else if (platform === 'cisco-asa') {
      const act = action === 'permit' ? 'permit' : 'deny';
      out = `! Cisco ASA ACL\naccess-list OUTSIDE_IN extended ${act} ${proto === 'ip' ? 'ip' : proto} ${sn.networkStr} ${sn.wildcardStr} any${portStr ? ` eq ${portStr}` : ''}\n\n! Apply to interface:\naccess-group OUTSIDE_IN in interface outside\n\n! Object-group approach:\nobject network OBJ_${sn.networkStr.replace(/\./g,'_')}\n subnet ${sn.networkStr} ${sn.maskStr}\naccess-list OUTSIDE_IN extended ${act} ${proto === 'ip' ? 'ip' : proto} object OBJ_${sn.networkStr.replace(/\./g,'_')} any${portStr ? ` eq ${portStr}` : ''}`;
    } else if (platform === 'palo-alto') {
      const act = action === 'permit' ? 'allow' : 'deny';
      out = `# Palo Alto Networks (PAN-OS) Security Policy\n# Panorama / Device > Policy > Security\n\nset rulebase security rules RULE_NAME from trust\nset rulebase security rules RULE_NAME to untrust\nset rulebase security rules RULE_NAME source ${sn.cidr}\nset rulebase security rules RULE_NAME destination any\nset rulebase security rules RULE_NAME application ${proto === 'ip' ? 'any' : proto}\nset rulebase security rules RULE_NAME service ${portStr ? `application-default` : 'any'}\nset rulebase security rules RULE_NAME action ${act}\nset rulebase security rules RULE_NAME log-start yes\nset rulebase security rules RULE_NAME log-end yes\n\n# Address Object:\nset address ADDR_${sn.networkStr.replace(/\./g,'_')} ip-netmask ${sn.cidr}`;
    } else if (platform === 'fortigate') {
      const act = action === 'permit' ? 'accept' : 'deny';
      out = `# FortiGate / FortiOS Firewall Policy\nconfig firewall address\n  edit "ADDR_${sn.networkStr}"\n    set type iprange\n    set subnet ${sn.networkStr} ${sn.maskStr}\n  next\nend\n\nconfig firewall policy\n  edit 0\n    set name "POLICY_${sn.networkStr}"\n    set srcintf "wan1"\n    set dstintf "internal"\n    set srcaddr "ADDR_${sn.networkStr}"\n    set dstaddr "all"\n    set action ${act}\n    set schedule "always"\n    set service ${portStr ? `"TCP_${portStr}"` : '"ALL"'}\n    set logtraffic all\n  next\nend`;
    } else if (platform === 'openbsd-pf') {
      const act = action === 'permit' ? 'pass' : 'block';
      out = `# OpenBSD pf rules (pf.conf)\n${act} in quick on egress proto ${proto === 'ip' ? 'all' : proto} \\n  from ${sn.cidr} to any${portStr ? ` port ${portStr}` : ''}\n\n# With state tracking:\n${act} in quick on egress proto ${proto === 'ip' ? 'tcp' : proto} \\n  from ${sn.cidr} to any${portStr ? ` port ${portStr}` : ''} flags S/SA keep state\n\n# Table approach (for many IPs):\ntable <blocked_nets> { ${sn.cidr} }\n${act} in quick on egress from <blocked_nets> to any`;
    } else if (platform === 'ufw') {
      const act = action === 'permit' ? 'allow' : 'deny';
      out = `# UFW (Uncomplicated Firewall)\n# Basic rule:\nufw ${act} from ${sn.cidr}${portStr ? ` to any port ${portStr}` : ''}\n\n# With protocol:\nufw ${act} proto ${proto === 'ip' ? 'tcp' : proto} from ${sn.cidr}${portStr ? ` to any port ${portStr}` : ''}\n\n# Check status:\nufw status numbered\n\n# To insert at position 1:\nufw insert 1 ${act} from ${sn.cidr}${portStr ? ` to any port ${portStr}` : ''}`;
    } else if (platform === 'azure-nsg') {
      const act = action === 'permit' ? 'Allow' : 'Deny';
      out = `# Azure Network Security Group Rule\n# Portal: NSG > Inbound/Outbound security rules > Add\n\nName: RULE_${sn.networkStr.replace(/\./g,'-')}\nPriority: 100\nSource: IP Addresses\nSource IP ranges: ${sn.cidr}\nSource port ranges: *\nDestination: Any\nDestination port ranges: ${portStr || '*'}\nProtocol: ${proto === 'ip' ? 'Any' : proto.toUpperCase()}\nAction: ${act}\n\n# Azure CLI:\naz network nsg rule create \\\n  --resource-group MyRG \\\n  --nsg-name MyNSG \\\n  --name RULE_${sn.networkStr.replace(/\./g,'-')} \\\n  --priority 100 \\\n  --source-address-prefixes ${sn.cidr} \\\n  --destination-port-ranges ${portStr || '*'} \\\n  --protocol ${proto === 'ip' ? '*' : proto.toUpperCase()} \\\n  --access ${act}`;
    } else if (platform === 'gcp') {
      const act = action === 'permit' ? 'ALLOW' : 'DENY';
      out = `# GCP VPC Firewall Rule\n# Console: VPC Network > Firewall > Create Firewall Rule\n\nName: rule-${sn.networkStr.replace(/\./g,'-')}\nNetwork: default\nDirection: INGRESS\nAction on match: ${act}\nTargets: All instances in network\nSource filter: IPv4 ranges\nSource IPv4 ranges: ${sn.cidr}\nProtocols and ports: ${proto === 'ip' ? 'Allow all' : `${proto}${portStr?':'+portStr:''}`}\n\n# gcloud CLI:\ngcloud compute firewall-rules create rule-${sn.networkStr.replace(/\./g,'-')} \\\n  --network default \\\n  --action ${act} \\\n  --direction INGRESS \\\n  --source-ranges ${sn.cidr} \\\n  --rules ${proto === 'ip' ? 'all' : `${proto}${portStr?':'+portStr:''}`}`;
    } else if (platform === 'mikrotik') {
      const act = action === 'permit' ? 'accept' : 'drop';
      out = `# MikroTik RouterOS (CLI)\n/ip firewall filter\nadd chain=forward action=${act} src-address=${sn.cidr}${proto !== 'ip' ? ` protocol=${proto}` : ''}${portStr ? ` dst-port=${portStr}` : ''} comment="RULE_${sn.networkStr}"\n\n# Address list approach:\n/ip firewall address-list\nadd list=blocked_nets address=${sn.cidr}\n\n/ip firewall filter\nadd chain=forward action=${act} src-address-list=blocked_nets${proto !== 'ip' ? ` protocol=${proto}` : ''}${portStr ? ` dst-port=${portStr}` : ''}`;
    } else if (platform === 'vyos') {
      const act = action === 'permit' ? 'accept' : 'drop';
      out = `# VyOS / Vyatta Firewall Rules\nset firewall name RULE_SET default-action drop\nset firewall name RULE_SET rule 10 action ${act}\nset firewall name RULE_SET rule 10 source address ${sn.cidr}\n${proto !== 'ip' ? `set firewall name RULE_SET rule 10 protocol ${proto}` : ''}\n${portStr ? `set firewall name RULE_SET rule 10 destination port ${portStr}` : ''}\nset firewall name RULE_SET rule 10 state new enable\n\n# Apply to interface:\nset interfaces ethernet eth0 firewall in name RULE_SET`;
    }
    setResult(out);
  };

  useEffect(() => generate(), []);

  return (
    <div className="fadein">
      <div className="card">
        <div className="card-title">Configuration</div>
        <div className="result-grid">
          <div className="field"><label className="label">Network CIDR</label>
            <input className={`input ${err?'error':''}`} value={cidr} onChange={e => setCidr(e.target.value)} placeholder="192.168.1.0/24" /></div>
          <div className="field"><label className="label">Platform</label>
            <select className="select" value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="cisco-ios">Cisco IOS / IOS-XE</option>
              <option value="junos">Juniper JunOS</option>
              <option value="iptables">iptables (Linux)</option>
              <option value="nftables">nftables (Linux)</option>
              <option value="pfsense">pfSense / OPNsense</option>
              <option value="aws-sg">AWS Security Group / NACL</option>
              <option value="windows">Windows Firewall</option>
              <option value="cisco-asa">Cisco ASA</option>
              <option value="palo-alto">Palo Alto (PAN-OS)</option>
              <option value="fortigate">Fortinet FortiGate</option>
              <option value="openbsd-pf">OpenBSD pf</option>
              <option value="ufw">UFW (Ubuntu)</option>
              <option value="azure-nsg">Azure NSG</option>
              <option value="gcp">GCP Firewall Rules</option>
              <option value="mikrotik">MikroTik RouterOS</option>
              <option value="vyos">VyOS / Vyatta</option>
            </select></div>
        </div>
        <div className="two-col">
          <div className="field"><label className="label">Rule Category</label>
            <select className="select" value={ruleType} onChange={e => setRuleType(e.target.value)}>
              <option value="filter">Firewall (Filter)</option>
              <option value="masquerade">NAT: Masquerade (Dynamic SNAT)</option>
              <option value="snat">NAT: Static SNAT (Source NAT)</option>
              <option value="dnat">NAT: DNAT (Port Forwarding)</option>
            </select>
          </div>
          <div className="field"><label className="label">Interface (WAN / Out)</label>
            <input className="input" value={iface} onChange={e => setIface(e.target.value)} placeholder="eth0" />
          </div>
        </div>
        <div className="two-col">
          <div className="field"><label className="label">Action (Filter Only)</label>
            <div style={{display:'flex',gap:8}}>
              {[['permit','Permit'],['deny','Deny']].map(([v,l]) => (
                <button key={v} disabled={ruleType!=='filter'} className={`btn ${action===v?'btn-primary':'btn-ghost'}`} onClick={() => setAction(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="field"><label className="label">Protocol</label>
            <select className="select" value={proto} onChange={e => setProto(e.target.value)}>
              {['ip','tcp','udp','icmp','esp','ah','gre'].map(p => <option key={p}>{p}</option>)}
            </select></div>
        </div>
        {ruleType !== 'filter' && (
          <div className="two-col">
            <div className="field"><label className="label">NAT Target IP</label>
              <input className="input" value={natTarget} onChange={e => setNatTarget(e.target.value)} placeholder="e.g. 1.2.3.4 or 192.168.1.50" />
            </div>
            <div className="field"><label className="label">NAT Target Port (optional)</label>
              <input className="input" value={natPort} onChange={e => setNatPort(e.target.value)} placeholder="e.g. 8080" />
            </div>
          </div>
        )}
        <div className="field" style={{maxWidth:200}}>
          <label className="label">Match Port (optional)</label>
          <input className="input" value={port} onChange={e => setPort(e.target.value)} placeholder="e.g. 443" />
        </div>
        <Err msg={err} />
        <button className="btn btn-primary" onClick={generate}>Generate Rules</button>
      </div>
      {result && (
        <div className="card fadein">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div className="card-title" style={{marginBottom:0}}>Generated Rules</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),1500); }}>
              {copied ? '✓ Copied' : 'Copy All'}
            </button>
          </div>
          <pre style={{fontFamily:'var(--mono)',fontSize:11,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'14px 16px',overflowX:'auto',color:'var(--text)',lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{result}</pre>

          <div style={{marginTop:20, padding:15, background:'var(--panel)', borderLeft:'4px solid var(--cyan)', borderRadius:4}}>
            <div style={{fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:6}}>Mechanics & Logic Explanation</div>
            <div style={{fontSize:11, color:'var(--muted)', lineHeight:1.5}}>{getExplanation()}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool: IP Geolocation ─────────────────────────────────────
// ipwhois.app doesn't send CORS headers for real HTTP origins — only works from
// file:// (where no Origin header is sent). ip-api.com and ipinfo.io support CORS.
const GEO_PROVIDERS = [
  ...(window.location.protocol === 'file:' ? [
    { id:'ipwhois', label:'ipwhois.app', url: ip => `https://ipwhois.app/json/${encodeURIComponent(ip)}` },
  ] : []),
  { id:'ipapi',   label:'ip-api.com',  url: ip => `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query,continent,continentCode,currency` },
  { id:'ipinfo',  label:'ipinfo.io',   url: ip => `https://ipinfo.io/${encodeURIComponent(ip)}/json` },
];

window.ACLGenerator = ACLGenerator;
