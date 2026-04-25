const { useState, useEffect, useCallback, useRef, useMemo } = React;

function CLIReference() {
  const [platform, setPlatform] = useState('ios');
  const [category, setCategory] = useState('interfaces');
  const [search, setSearch]     = useState('');
  const [copied, copy]          = useCopy();

  const CLI = {
    ios: {
      interfaces: [
        {cmd:'show interfaces',                                         desc:'All interface counters, errors, and line/protocol state'},
        {cmd:'show interfaces GigabitEthernet0/1',                      desc:'Detailed stats for a specific interface'},
        {cmd:'show interfaces status',                                  desc:'Port status table — speed, duplex, VLAN (Cat switches)'},
        {cmd:'show interfaces trunk',                                   desc:'Trunk interfaces and allowed/active VLANs'},
        {cmd:'show interfaces counters errors',                         desc:'Per-interface error counters (runts, giants, CRC)'},
        {cmd:'show ip interface brief',                                 desc:'Quick view: IP, line protocol, and admin state'},
        {cmd:'show ip interface GigabitEthernet0/1',                    desc:'IP config detail: helper-address, ACLs, proxy-ARP'},
        {cmd:'show controllers GigabitEthernet0/1',                     desc:'PHY-level hardware stats and transceiver info'},
        {cmd:'clear counters GigabitEthernet0/1',                       desc:'Reset interface counters (non-destructive)'},
        {cmd:'show interfaces GigabitEthernet0/1 | inc rate',           desc:'Current input/output rate in bps and pps'},
      ],
      routing: [
        {cmd:'show ip route',                                           desc:'Full IPv4 RIB'},
        {cmd:'show ip route summary',                                   desc:'Route count broken down by protocol'},
        {cmd:'show ip route 10.0.0.0 255.255.255.0 longer-prefixes',    desc:'All routes within a given prefix'},
        {cmd:'show ip route 192.168.1.1',                               desc:'Best route for a specific host'},
        {cmd:'show ip protocols',                                       desc:'Active routing protocols, timers, redistributions'},
        {cmd:'show ip ospf neighbor',                                   desc:'OSPF adjacencies and state'},
        {cmd:'show ip ospf database',                                   desc:'OSPF LSDB summary (LSA counts per type)'},
        {cmd:'show ip ospf interface brief',                            desc:'OSPF cost, state, and DR/BDR per interface'},
        {cmd:'show ip eigrp neighbors',                                 desc:'EIGRP neighbors, hold timer, uptime'},
        {cmd:'show ip eigrp topology',                                  desc:'EIGRP topology table — FD, RD, successors'},
        {cmd:'show ip eigrp topology all-links',                        desc:'Full topology including feasible successors'},
        {cmd:'show ip bgp summary',                                     desc:'BGP peer state, uptime, and prefix counts'},
        {cmd:'show ip bgp neighbors 10.0.0.1',                          desc:'Detailed BGP neighbor: timers, capabilities, errors'},
        {cmd:'show ip bgp 0.0.0.0/0 longer-prefixes',                   desc:'BGP routes within a prefix range'},
        {cmd:'show ip cef 10.0.0.0/24',                                 desc:'CEF FIB entry for prefix'},
        {cmd:'show ip cef exact-route 10.1.1.1 10.2.2.2',              desc:'CEF forwarding path for a source→destination pair'},
      ],
      switching: [
        {cmd:'show spanning-tree',                                      desc:'STP state for all VLANs'},
        {cmd:'show spanning-tree vlan 10',                              desc:'STP topology for VLAN 10'},
        {cmd:'show spanning-tree vlan 10 detail',                       desc:'Timers, topology changes, port roles for VLAN 10'},
        {cmd:'show spanning-tree summary',                              desc:'STP mode (PVST/RSTP/MST) and root port counts'},
        {cmd:'show vlan brief',                                         desc:'VLAN table with member ports'},
        {cmd:'show mac address-table',                                  desc:'Full MAC address table'},
        {cmd:'show mac address-table address aabb.ccdd.eeff',           desc:'Find where a specific MAC is learned'},
        {cmd:'show mac address-table vlan 10',                          desc:'MACs learned on VLAN 10'},
        {cmd:'clear mac address-table dynamic',                         desc:'Flush entire dynamic MAC table'},
        {cmd:'show etherchannel summary',                               desc:'Port-channel groups, member ports, and LACP state'},
        {cmd:'show cdp neighbors detail',                               desc:'CDP neighbor info: IP, platform, IOS version'},
        {cmd:'show lldp neighbors detail',                              desc:'LLDP neighbor detail'},
      ],
      acl_nat: [
        {cmd:'show ip access-lists',                                    desc:'All ACLs with per-entry match counts'},
        {cmd:'show ip access-lists ACL_NAME',                           desc:'Specific ACL with hit counts'},
        {cmd:'show ip nat translations',                                desc:'Active NAT/PAT translation table'},
        {cmd:'show ip nat translations verbose',                        desc:'NAT table with protocol, ports, flags'},
        {cmd:'show ip nat statistics',                                  desc:'NAT hits, misses, translation peak counts'},
        {cmd:'debug ip nat',                                            desc:'Real-time NAT translation events (use briefly)'},
        {cmd:'clear ip nat translation *',                              desc:'Clear all dynamic NAT translations'},
        {cmd:'show policy-map interface GigabitEthernet0/1',            desc:'QoS policy class statistics and drops'},
      ],
      troubleshoot: [
        {cmd:'ping 8.8.8.8 repeat 100 size 1500 df-bit',               desc:'Extended ping — MTU path test with DF-bit set'},
        {cmd:'traceroute 8.8.8.8 probe 3 ttl 1 30',                    desc:'Traceroute with 3 probes and TTL range 1–30'},
        {cmd:'show processes cpu sorted',                               desc:'CPU usage by process — find top consumers'},
        {cmd:'show processes cpu history',                              desc:'CPU utilization graph over last 60s/60m/72h'},
        {cmd:'show memory statistics',                                  desc:'Memory pool free/used breakdown'},
        {cmd:'show log',                                                desc:'Syslog buffer (most recent messages)'},
        {cmd:'show log | include %OSPF|%BGP|%LINK',                    desc:'Filter log for specific process messages'},
        {cmd:'show ntp status',                                         desc:'NTP sync state, stratum, and reference clock'},
        {cmd:'show ntp associations',                                   desc:'NTP peers and their stratum/offset'},
        {cmd:'show version',                                            desc:'IOS version, uptime, config register, memory'},
        {cmd:'show inventory',                                          desc:'Hardware PIDs and serial numbers (chassis, cards)'},
        {cmd:'show environment all',                                    desc:'Temperature, fan, and power supply status'},
        {cmd:'show ip traffic',                                         desc:'IP protocol counters (packets in/out, errors, fragments)'},
        {cmd:'show tech-support',                                       desc:'Full diagnostic snapshot for TAC cases'},
      ],
    },
    nxos: {
      interfaces: [
        {cmd:'show interface',                                          desc:'All interfaces: counters, errors, line/protocol'},
        {cmd:'show interface Ethernet1/1',                              desc:'Detail for a specific interface'},
        {cmd:'show interface status',                                   desc:'Port status table (speed, duplex, VLAN, type)'},
        {cmd:'show interface brief',                                    desc:'One-line per interface with IP and state'},
        {cmd:'show interface counters errors',                          desc:'Error counters — runts, giants, CRC, input errors'},
        {cmd:'show ip interface brief',                                 desc:'IP and line-protocol status for all interfaces'},
        {cmd:'show interface trunk',                                    desc:'Trunk port allowed and active VLANs'},
        {cmd:'clear counters interface Ethernet1/1',                    desc:'Reset interface counters'},
        {cmd:'show interface Ethernet1/1 | inc rate',                   desc:'Current input/output rate in bps'},
        {cmd:'show hardware internal forwarding detail',                desc:'ASIC forwarding counters (platform-specific)'},
      ],
      routing: [
        {cmd:'show ip route',                                           desc:'IPv4 RIB'},
        {cmd:'show ip route summary',                                   desc:'Route count by protocol'},
        {cmd:'show ip ospf neighbor',                                   desc:'OSPF adjacency table'},
        {cmd:'show ip ospf database',                                   desc:'OSPF LSDB summary'},
        {cmd:'show ip ospf interface brief',                            desc:'OSPF per-interface state and cost'},
        {cmd:'show bgp sessions',                                       desc:'BGP session state (all VRFs and address families)'},
        {cmd:'show bgp ipv4 unicast summary',                           desc:'BGP peer table: state, uptime, prefixes'},
        {cmd:'show bgp ipv4 unicast 10.0.0.0/24',                       desc:'BGP RIB entry for a prefix'},
        {cmd:'show bgp ipv4 unicast neighbors 10.0.0.1 advertised-routes', desc:'Prefixes being advertised to a BGP peer'},
        {cmd:'show bgp ipv4 unicast neighbors 10.0.0.1 received-routes',   desc:'Prefixes received from a BGP peer (pre-policy)'},
        {cmd:'show forwarding ipv4 route 10.0.0.0/24',                 desc:'Hardware FIB lookup for a prefix'},
        {cmd:'show route-map',                                          desc:'Route maps with match/set clauses'},
        {cmd:'show ip prefix-list',                                     desc:'Prefix-list entries with match counters'},
      ],
      switching: [
        {cmd:'show spanning-tree',                                      desc:'STP state all VLANs'},
        {cmd:'show spanning-tree vlan 10',                              desc:'STP for VLAN 10'},
        {cmd:'show spanning-tree summary',                              desc:'STP mode and root counts'},
        {cmd:'show vlan',                                               desc:'VLAN database'},
        {cmd:'show vlan brief',                                         desc:'VLAN list with member ports'},
        {cmd:'show mac address-table',                                  desc:'MAC address table'},
        {cmd:'show mac address-table dynamic',                          desc:'Dynamic MAC entries only'},
        {cmd:'show vpc',                                                desc:'vPC domain status and peer link state'},
        {cmd:'show vpc consistency-parameters',                         desc:'vPC config consistency check between peers'},
        {cmd:'show vpc peer-keepalive',                                 desc:'vPC keepalive link status and last message'},
        {cmd:'show port-channel summary',                               desc:'Port-channel groups and member state'},
        {cmd:'show feature',                                            desc:'Enabled NX-OS feature licenses'},
        {cmd:'show cdp neighbors detail',                               desc:'CDP neighbor IP, platform, NX-OS version'},
      ],
      acl_nat: [
        {cmd:'show ip access-lists',                                    desc:'All ACLs with match counts'},
        {cmd:'show access-list statistics',                             desc:'Hardware ACL TCAM hit counters'},
        {cmd:'show ip nat translations',                                desc:'Active NAT translations (if configured)'},
        {cmd:'show ip nat statistics',                                  desc:'NAT statistics'},
        {cmd:'show policy-map interface Ethernet1/1',                   desc:'QoS policy class stats and drops on interface'},
        {cmd:'show queuing interface Ethernet1/1',                      desc:'Queueing stats per class'},
      ],
      troubleshoot: [
        {cmd:'show processes cpu',                                      desc:'CPU usage by process'},
        {cmd:'show processes cpu history',                              desc:'CPU utilization history graph'},
        {cmd:'show system resources',                                   desc:'CPU, memory, and file-system usage'},
        {cmd:'show logging',                                            desc:'Syslog buffer'},
        {cmd:'show logging last 50',                                    desc:'Last 50 syslog entries'},
        {cmd:'ping 8.8.8.8 count 100 packet-size 1500 df-bit',         desc:'MTU path test with DF-bit'},
        {cmd:'traceroute 8.8.8.8',                                      desc:'Traceroute'},
        {cmd:'show ntp peer-status',                                    desc:'NTP peers and stratum'},
        {cmd:'show version',                                            desc:'NX-OS version, hardware, uptime'},
        {cmd:'show environment',                                        desc:'Temperature, fans, power supplies'},
        {cmd:'show hardware internal errors',                           desc:'Hardware ASIC error counters'},
        {cmd:'ethanalyzer local interface inband display-filter "icmp"',desc:'Packet capture on mgmt plane (control-plane traffic)'},
        {cmd:'show tech-support',                                       desc:'Full diagnostic output for TAC'},
      ],
    },
    junos: {
      interfaces: [
        {cmd:'show interfaces terse',                                   desc:'Quick all-interface status (up/down, IP)'},
        {cmd:'show interfaces ge-0/0/0 detail',                         desc:'Detailed stats: errors, drops, PHY info'},
        {cmd:'show interfaces descriptions',                            desc:'Interface description list'},
        {cmd:'show interfaces statistics',                              desc:'Traffic stats for all interfaces'},
        {cmd:'show interfaces ge-0/0/0 extensive',                      desc:'Full hardware and error counter detail'},
        {cmd:'clear interfaces statistics ge-0/0/0',                    desc:'Reset interface counters'},
        {cmd:'show interfaces ge-0/0/0 | match "Physical|input rate"',  desc:'Filter for PHY state and current rates'},
      ],
      routing: [
        {cmd:'show route',                                              desc:'Full routing table (all protocols)'},
        {cmd:'show route 10.0.0.0/24 exact',                            desc:'Exact prefix match in RIB'},
        {cmd:'show route protocol ospf',                                desc:'OSPF routes only'},
        {cmd:'show route protocol bgp',                                 desc:'BGP routes only'},
        {cmd:'show ospf neighbor',                                      desc:'OSPF neighbor adjacencies'},
        {cmd:'show ospf database',                                      desc:'OSPF LSDB summary'},
        {cmd:'show ospf interface',                                     desc:'OSPF interface state, cost, DR/BDR'},
        {cmd:'show bgp summary',                                        desc:'BGP peer state and prefix counts'},
        {cmd:'show bgp neighbor 10.0.0.1',                              desc:'Detailed BGP neighbor info'},
        {cmd:'show route advertising-protocol bgp 10.0.0.1',           desc:'Prefixes being advertised to a BGP peer'},
        {cmd:'show route receive-protocol bgp 10.0.0.1',               desc:'Prefixes received from a BGP peer'},
        {cmd:'show policy-options',                                     desc:'Routing policies and prefix-lists'},
        {cmd:'show route forwarding-table',                             desc:'Kernel forwarding table (FIB)'},
      ],
      switching: [
        {cmd:'show spanning-tree interface',                            desc:'STP interface state and port role'},
        {cmd:'show spanning-tree bridge',                               desc:'Bridge STP state and root info'},
        {cmd:'show ethernet-switching table',                           desc:'MAC address table (EX/QFX series)'},
        {cmd:'show vlans',                                              desc:'VLAN database with member interfaces'},
        {cmd:'show lacp interfaces',                                    desc:'LACP member interface state'},
        {cmd:'show lacp statistics interfaces ae0',                     desc:'LACP PDU counters for a bundle'},
        {cmd:'show lldp neighbors',                                     desc:'LLDP neighbor table'},
        {cmd:'show lldp neighbors detail',                              desc:'LLDP neighbor detail: platform, capabilities'},
      ],
      acl_nat: [
        {cmd:'show firewall filter',                                    desc:'Stateless firewall filter counter summary'},
        {cmd:'show firewall filter FILTER_NAME',                        desc:'Per-term counter detail for a specific filter'},
        {cmd:'show nat source summary',                                 desc:'Source NAT pool and rule summary'},
        {cmd:'show nat source translations',                            desc:'Active NAT translation entries'},
        {cmd:'show nat source statistics',                              desc:'NAT hit/miss statistics per rule'},
        {cmd:'show security flow session',                              desc:'Active stateful sessions (SRX)'},
      ],
      troubleshoot: [
        {cmd:'ping 8.8.8.8 count 100 size 1500 do-not-fragment',       desc:'MTU path test with DF-bit'},
        {cmd:'traceroute 8.8.8.8',                                      desc:'Traceroute'},
        {cmd:'show system processes extensive',                         desc:'CPU-intensive processes and memory'},
        {cmd:'show chassis routing-engine',                             desc:'RE CPU, memory, temp, uptime'},
        {cmd:'show chassis environment',                                desc:'Temperature, fans, power supply status'},
        {cmd:'show log messages',                                       desc:'System log messages'},
        {cmd:'show log messages | match "error|Error|RPD_OSPF"',       desc:'Filter logs by pattern'},
        {cmd:'show ntp associations',                                   desc:'NTP peer stratum and offset'},
        {cmd:'show version',                                            desc:'Junos version, hardware model'},
        {cmd:'request support information | save /var/tmp/rsi.txt',    desc:'Full diagnostic dump (equiv. show tech-support)'},
        {cmd:'monitor traffic interface ge-0/0/0 detail',              desc:'Live packet capture on interface'},
        {cmd:'show pfe statistics traffic',                             desc:'Packet Forwarding Engine traffic stats'},
      ],
    },
  };

  const cats = [
    {id:'interfaces',  l:'Interfaces'},
    {id:'routing',     l:'Routing'},
    {id:'switching',   l:'Switching'},
    {id:'acl_nat',     l:'ACL & NAT'},
    {id:'troubleshoot',l:'Troubleshoot'},
  ];
  const platforms = [
    {id:'ios',   l:'Cisco IOS / IOS-XE'},
    {id:'nxos',  l:'Cisco NX-OS'},
    {id:'junos', l:'Juniper JunOS'},
  ];

  const allCmds = Object.values(CLI[platform]||{}).flat();
  const searchedCmds = search.trim()
    ? allCmds.filter(c=>c.cmd.toLowerCase().includes(search.toLowerCase())||c.desc.toLowerCase().includes(search.toLowerCase()))
    : (CLI[platform]?.[category]||[]);

  return (
    <div className="fadein">
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
        {platforms.map(p=>(
          <button key={p.id} className={`btn btn-sm ${platform===p.id?'btn-primary':'btn-ghost'}`}
            onClick={()=>{setPlatform(p.id);setSearch('');}} style={{flex:1,minWidth:140}}>{p.l}</button>
        ))}
      </div>
      <div className="field" style={{marginBottom:12}}>
        <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={`Search ${platforms.find(p=>p.id===platform)?.l} commands…`}/>
      </div>
      {!search.trim() && (
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {cats.map(c=>(
            <button key={c.id} className={`btn btn-sm ${category===c.id?'btn-primary':'btn-ghost'}`}
              onClick={()=>setCategory(c.id)} style={{flex:1,minWidth:100}}>{c.l}</button>
          ))}
        </div>
      )}
      <div className="card">
        <div className="card-title">
          {search.trim()
            ? `Search results — ${searchedCmds.length} command${searchedCmds.length!==1?'s':''}`
            : `${platforms.find(p=>p.id===platform)?.l} · ${cats.find(c=>c.id===category)?.l}`}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {searchedCmds.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 12px',
              background:'var(--bg)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:'var(--mono)',fontSize:13,color:'var(--cyan)',marginBottom:3,wordBreak:'break-all'}}>{c.cmd}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{c.desc}</div>
              </div>
              <button className="btn btn-ghost btn-sm" style={{flexShrink:0,fontSize:11,whiteSpace:'nowrap'}}
                onClick={()=>copy(c.cmd,`cli-${i}`)}>
                {copied===`cli-${i}`?'Copied!':'Copy'}
              </button>
            </div>
          ))}
          {searchedCmds.length===0 && (
            <div style={{padding:24,textAlign:'center',color:'var(--muted)'}}>No commands match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tool: Cypher Deck ──────────────────────────────────────
function md5(str) {
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586); c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426); c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417); c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101); c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632); c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083); c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690); c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784); c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463); c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353); c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222); c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835); c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415); c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606); c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744); c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379); c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
  function md51(s) {
    var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= s.length; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
    s = s.substring(i - 64);
    var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s) { var md5blks = [], i; for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24); return md5blks; }
  var hex_chr = '0123456789abcdef'.split('');
  function rhex(n) { var s = '', j = 0; for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]; return s; }
  function hex(x) { for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
  function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
  return hex(md51(str));
}

async function shaHash(algo, text) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(algo, enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}


// ─── Tool: SysTool CLI Builder ───────────────────────────────
window.CLIReference = CLIReference;
