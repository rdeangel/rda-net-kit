const { useState, useEffect, useCallback, useRef, useMemo } = React;

function WiresharkTools() {
  const [activeTab, setActiveTab] = useState('display');
  const [tsharkSubTab, setTsharkSubTab] = useState('reference');
  const [copied, copy] = useCopy();

  // ── Display Filter Builder state ──────────────────────────────
  const [dfRows, setDfRows] = useState([
    { id: 1, field: 'ip.addr', op: '==', value: '', connector: 'and' }
  ]);
  const [dfMods, setDfMods] = useState({ synOnly: false, errorsOnly: false, noNoise: false, negate: false });
  const [dfProtoSub, setDfProtoSub] = useState({}); // { [rowId]: { method:'', status:'', uri:'', ... } }

  // ── Capture Filter (BPF) Builder state ───────────────────────
  const [bpfRows, setBpfRows] = useState([
    { id: 1, field: 'host', value: '', connector: 'and' }
  ]);
  const [bpfNegate, setBpfNegate] = useState(false);

  // ── TShark Builder state ──────────────────────────────────────
  const [ts, setTs] = useState({
    mode: 'live',          // 'live' | 'read'
    iface: 'eth0',
    readFile: '',
    writeFile: '',
    captureFilter: '',
    displayFilter: '',
    count: '',
    duration: '',
    outputFmt: 'default',  // 'default' | 'fields' | 'json' | 'pdml'
    fields: '',            // comma-separated list of -e fields
    stats: '',             // -z value e.g. 'io,phs'
  });

  const commonFilters = [
    { cat:'Security & Malware', filters:[
      { f:'http.request.method == "POST"', d:'Find data being exfiltrated via HTTP POST' },
      { f:'tcp.flags.syn == 1 && tcp.flags.ack == 0', d:'Detect SYN scan / Connection attempts' },
      { f:'dns.qry.name contains "malware"', d:'Search for suspicious DNS queries' },
      { f:'tls.handshake.extension.type == 0', d:'Identify Server Name Indication (SNI)' },
      { f:'frame contains "password"', d:'Search raw payload for sensitive strings' },
      { f:'http.request.method == "PUT"', d:'Detect file uploads via HTTP PUT' },
      { f:'dns.qry.name.len > 50', d:'Unusually long DNS queries (DNS tunneling indicator)' },
      { f:'tcp.flags.syn == 1 && tcp.flags.ack == 0 && tcp.flags.fin == 0', d:'SYN flood indicator (SYN without ACK/FIN)' },
      { f:'ip.ttl < 10', d:'Packets with very low TTL (potential TTL expiry attack or traceroute)' },
    ]},
    { cat:'TCP Performance', filters:[
      { f:'tcp.analysis.retransmission', d:'Retransmitted packets (Packet loss)' },
      { f:'tcp.analysis.duplicate_ack', d:'Duplicate ACKs (Congestion/Out of order)' },
      { f:'tcp.time_delta > 0.1', d:'Find slow responses (Latency > 100ms)' },
      { f:'tcp.window_size < 1000', d:'Small window size (Receiver throughput limit)' },
      { f:'tcp.flags.reset == 1', d:'Abrupt connection terminations (RST)' },
      { f:'tcp.analysis.zero_window', d:'Zero window — receiver buffer full (flow stalled)' },
      { f:'tcp.analysis.ack_rtt > 0.2', d:'High ACK round-trip time (> 200ms)' },
      { f:'tcp.analysis.out_of_order', d:'Out-of-order segments (reassembly needed)' },
      { f:'tcp.analysis.fast_retransmission', d:'Fast retransmit triggered by duplicate ACKs' },
    ]},
    { cat:'Application & Web', filters:[
      { f:'http.response.code >= 400', d:'HTTP Client/Server Errors' },
      { f:'dns.flags.rcode != 0', d:'DNS Error responses (NXDOMAIN, etc)' },
      { f:'http2.headers.method == "POST"', d:'Modern HTTP/2 POST requests' },
      { f:'grpc.status > 0', d:'Failed gRPC calls (Non-zero status)' },
      { f:'json.value.string == "error"', d:'Search for errors in JSON payloads' },
      { f:'http.request.uri contains "admin"', d:'Requests targeting admin panels' },
      { f:'http.response.code == 301 || http.response.code == 302', d:'HTTP redirects (potential phishing or misconfig)' },
      { f:'tls.record.content_type == 23 && tls.app_data', d:'Encrypted application data in TLS' },
      { f:'http.request.method in {"GET" "POST" "PUT" "DELETE"}', d:'All HTTP CRUD methods' },
    ]},
    { cat:'VoIP & Media', filters:[
      { f:'sip.Method == "INVITE"', d:'VoIP SIP Call Setup attempts' },
      { f:'rtp.ssrc', d:'Real-time media (RTP) stream identification' },
      { f:'rtp.p_type == 0', d:'G.711 PCMU Audio stream' },
      { f:'sip.Status-Code >= 400', d:'SIP Signaling errors' },
      { f:'sip.Method == "BYE"', d:'SIP call termination' },
      { f:'rtp.marker == 1', d:'RTP marker bit (talkspurt / frame boundary)' },
      { f:'rtcp.sr.ntp_timestamp', d:'RTCP Sender Reports (sync and stats)' },
    ]},
    { cat:'Network Troubleshooting', filters:[
      { f:'arp.opcode == 1', d:'ARP Requests (who has?)' },
      { f:'arp.duplicate-address-detected', d:'ARP conflict — duplicate IP on network' },
      { f:'icmp.type == 3', d:'ICMP Destination Unreachable' },
      { f:'icmp.type == 11', d:'ICMP Time Exceeded (TTL expired / traceroute)' },
      { f:'icmp.type == 5', d:'ICMP Redirect (misconfigured routing)' },
      { f:'dhcp.option.dhcp_message_type == 1', d:'DHCP Discover packets' },
      { f:'dhcp.option.dhcp_message_type == 5', d:'DHCP ACK — IP address assigned' },
      { f:'stp.type == 0', d:'STP Bridge Protocol Data Units (topology)' },
      { f:'vrrp.vrid || hsrp.state', d:'First Hop Redundancy (VRRP/HSRP)' },
    ]},
    { cat:'IPv6', filters:[
      { f:'ipv6', d:'All IPv6 traffic' },
      { f:'ipv6.hop_lim < 10', d:'IPv6 packets near TTL expiry' },
      { f:'icmpv6.type == 134', d:'IPv6 Router Advertisements' },
      { f:'icmpv6.type == 135', d:'IPv6 Neighbor Solicitation' },
      { f:'dhcpv6.msgtype == 1', d:'DHCPv6 Solicit' },
      { f:'ipv6.addr == fe80::/10', d:'Link-local IPv6 traffic' },
    ]},
    { cat:'Wireless / 802.11', filters:[
      { f:'wlan.fc.type == 0 && wlan.fc.subtype == 8', d:'802.11 Beacon frames' },
      { f:'wlan.fc.type == 0 && wlan.fc.subtype == 4', d:'802.11 Probe Requests' },
      { f:'wlan.fc.retry == 1', d:'Retransmitted WiFi frames' },
      { f:'radiotap.dbm_antsignal < -70', d:'Weak WiFi signal (< -70 dBm)' },
      { f:'wlan.fc.protected == 0', d:'Unencrypted WiFi data frames' },
    ]},
    { cat:'Industrial (SCADA)', filters:[
      { f:'mbtcp.prot_id == 0', d:'Modbus TCP traffic' },
      { f:'s7comm.data.func == 0x05', d:'Siemens S7 Write Variable' },
      { f:'enip.pccc.cmd == 0x0f', d:'EtherNet/IP PCCC Command' },
      { f:'bacapp.service.choice == 1', d:'BACnet ReadProperty request' },
      { f:'cotp.tpdu == 0xf0', d:'COTP (TPKT) — S7comm / IEC 104 transport' },
    ]}
  ];

  const tsharkCmds = [
    { cat:'Live Capture', cmds:[
      { c:'tshark -i eth0', d:'Start live capture on interface eth0' },
      { c:'tshark -i eth0 -f "port 53" -w dns.pcap', d:'Capture filter: only DNS, save to file' },
      { c:'tshark -i any -f "host 10.0.0.1 and port 443"', d:'Capture filter for specific host and port' },
      { c:'tshark -i eth0 -c 1000 -w capture.pcap', d:'Capture exactly 1000 packets then stop' },
      { c:'tshark -i eth0 -a duration:60 -w capture.pcap', d:'Capture for 60 seconds then stop' },
      { c:'tshark -i eth0 -a filesize:100000 -b files:5 -w ring.pcap', d:'Ring buffer: 5 files of 100KB each' },
    ]},
    { cat:'Packet Extraction', cmds:[
      { c:'tshark -i 1 -Y "http.request" -T fields -e http.host -e http.request.uri', d:'Extract HTTP hosts and URIs live' },
      { c:'tshark -r file.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name', d:'List all unique DNS queries in a file' },
      { c:'tshark -r file.pcap -T fields -e ip.src -e ip.dst -e tcp.port | sort | uniq -c | sort -rn | head -20', d:'Top 20 talkers (Source/Dest/Port)' },
      { c:'tshark -r file.pcap -T fields -e frame.time -e ip.src -e ip.dst -e http.user_agent', d:'Extract User-Agents with timestamps' },
      { c:'tshark -r file.pcap -Y "http" -T fields -e http.request.method -e http.host -e http.request.uri -e http.response.code', d:'Full HTTP transaction summary' },
      { c:'tshark -r file.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==1" -T fields -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport', d:'Extract all TCP handshake completions' },
      { c:'tshark -r file.pcap -Y "ip.src == 10.0.0.1" -T fields -e frame.time_relative -e tcp.seq -e tcp.len', d:'Time-sequence data plot for one host' },
    ]},
    { cat:'Statistics & Analysis', cmds:[
      { c:'tshark -r file.pcap -z io,phs', d:'Protocol Hierarchy Statistics (Overall view)' },
      { c:'tshark -r file.pcap -z expert', d:'Show "Expert Info" (Errors, Warnings, Notes)' },
      { c:'tshark -r file.pcap -z conv,tcp', d:'List all TCP conversations' },
      { c:'tshark -r file.pcap -z io,stat,1,"COUNT(tcp.flags.reset)tcp.flags.reset"', d:'Graph TCP resets per second' },
      { c:'tshark -r file.pcap -z conv,ip', d:'IP conversation statistics (bytes/packets)' },
      { c:'tshark -r file.pcap -z dns,tree', d:'DNS request/response pair statistics' },
      { c:'tshark -r file.pcap -z http,tree', d:'HTTP request distribution by method/code' },
    ]},
    { cat:'Security & Troubleshooting', cmds:[
      { c:'tshark -r file.pcap -Y "tcp.flags.syn==1 && tcp.flags.ack==0" -T fields -e ip.src | sort | uniq -c | sort -rn', d:'Find IPs performing SYN scans (ranked)' },
      { c:'tshark -r file.pcap -z follow,tcp,ascii,0', d:'Follow TCP Stream 0 (similar to GUI)' },
      { c:'tshark -r file.pcap -o "tls.keylog_file:ssl.keys" -Y "http"', d:'Decrypt TLS using a keylog file' },
      { c:'tshark -r file.pcap -Y "arp.duplicate-address-detected" -T fields -e arp.src.proto_ipv4 -e arp.src.hw_mac', d:'Find ARP conflicts with MAC addresses' },
      { c:'tshark -r file.pcap -Y "icmp.type == 3" -T fields -e ip.src -e icmp.dst_ip', d:'Destination Unreachable sources and targets' },
      { c:'tshark -r file.pcap -Y "dns.flags.rcode == 3" -T fields -e dns.qry.name | sort | uniq -c | sort -rn', d:'Most frequently failed DNS lookups (NXDOMAIN)' },
    ]},
    { cat:'VoIP / RTP', cmds:[
      { c:'tshark -r voip.pcap -z rtp,streams', d:'List all RTP media streams in file' },
      { c:'tshark -r voip.pcap -Y "sip.Method == \\"INVITE\\"" -T fields -e sip.from.user -e sip.to.user', d:'Extract caller and callee from SIP' },
      { c:'tshark -r voip.pcap -Y "rtp" -T fields -e ip.src -e ip.dst -e rtp.ssrc -e rtp.p_type | sort -u', d:'Unique RTP streams with codec type' },
      { c:'tshark -r voip.pcap -z voip,calls', d:'VoIP call summary with SIP call IDs' },
    ]}
  ];

  const dfFields = [
    { group:'IP', fields:[
      { value:'ip.src',    label:'IP Source',     type:'ip'   },
      { value:'ip.dst',    label:'IP Dest',        type:'ip'   },
      { value:'ip.addr',   label:'IP Any',         type:'ip'   },
      { value:'ipv6.src',  label:'IPv6 Source',    type:'ip'   },
      { value:'ipv6.dst',  label:'IPv6 Dest',      type:'ip'   },
      { value:'ipv6.addr', label:'IPv6 Any',       type:'ip'   },
    ]},
    { group:'Transport', fields:[
      { value:'tcp.port',     label:'TCP Port (any)',  type:'port' },
      { value:'tcp.srcport',  label:'TCP Src Port',    type:'port' },
      { value:'tcp.dstport',  label:'TCP Dst Port',    type:'port' },
      { value:'udp.port',     label:'UDP Port (any)',  type:'port' },
      { value:'udp.srcport',  label:'UDP Src Port',    type:'port' },
      { value:'udp.dstport',  label:'UDP Dst Port',    type:'port' },
    ]},
    { group:'Protocol', fields:[
      { value:'http',   label:'HTTP',       type:'proto', sub:'http' },
      { value:'tls',    label:'TLS/HTTPS',  type:'proto', sub:'tls'  },
      { value:'dns',    label:'DNS',        type:'proto', sub:'dns'  },
      { value:'tcp',    label:'TCP',        type:'proto' },
      { value:'udp',    label:'UDP',        type:'proto' },
      { value:'icmp',   label:'ICMP',       type:'proto' },
      { value:'icmpv6', label:'ICMPv6',     type:'proto' },
      { value:'arp',    label:'ARP',        type:'proto' },
      { value:'dhcp',   label:'DHCP',       type:'proto' },
      { value:'quic',   label:'QUIC',       type:'proto' },
      { value:'sip',    label:'SIP',        type:'proto', sub:'sip' },
      { value:'rtp',    label:'RTP',        type:'proto' },
      { value:'ssh',    label:'SSH',        type:'proto' },
      { value:'ftp',    label:'FTP',        type:'proto' },
      { value:'smtp',   label:'SMTP',       type:'proto' },
      { value:'mqtt',   label:'MQTT',       type:'proto' },
    ]},
    { group:'TCP Flags', fields:[
      { value:'tcp.flags.syn',   label:'TCP SYN',  type:'flag' },
      { value:'tcp.flags.ack',   label:'TCP ACK',  type:'flag' },
      { value:'tcp.flags.fin',   label:'TCP FIN',  type:'flag' },
      { value:'tcp.flags.reset', label:'TCP RST',  type:'flag' },
      { value:'tcp.flags.push',  label:'TCP PSH',  type:'flag' },
    ]},
    { group:'TCP Analysis', fields:[
      { value:'tcp.analysis.retransmission',     label:'Retransmission',  type:'bool' },
      { value:'tcp.analysis.duplicate_ack',      label:'Duplicate ACK',   type:'bool' },
      { value:'tcp.analysis.zero_window',        label:'Zero Window',     type:'bool' },
      { value:'tcp.analysis.out_of_order',       label:'Out of Order',    type:'bool' },
      { value:'tcp.analysis.fast_retransmission',label:'Fast Retransmit', type:'bool' },
      { value:'tcp.analysis.ack_rtt',            label:'ACK RTT',         type:'num'  },
    ]},
    { group:'Frame / IP', fields:[
      { value:'frame.len',           label:'Frame Length',    type:'num' },
      { value:'frame.time_relative', label:'Time (rel s)',    type:'num' },
      { value:'ip.ttl',              label:'IP TTL',          type:'num' },
      { value:'tcp.time_delta',      label:'TCP Time Delta',  type:'num' },
      { value:'tcp.stream',          label:'TCP Stream',      type:'num' },
      { value:'tcp.window_size',     label:'TCP Window Size', type:'num' },
      { value:'vlan.id',             label:'VLAN ID',         type:'num' },
    ]},
  ];

  const dfOps = { ip:['==','!='], port:['==','!=','>','<','>=','<='], proto:[], flag:['==','!='], bool:[], num:['==','!=','>','<','>=','<='], str:['==','!=','contains','matches'] };

  const protoSubDefs = {
    http:[
      { key:'method', label:'Method',        type:'select', opts:['','GET','POST','PUT','DELETE','PATCH','HEAD','OPTIONS'], fn:v=>`http.request.method == "${v}"` },
      { key:'status', label:'Status Code',   type:'text',   fn:v=>`http.response.code == ${v}` },
      { key:'uri',    label:'URI contains',  type:'text',   fn:v=>`http.request.uri contains "${v}"` },
      { key:'host',   label:'Host contains', type:'text',   fn:v=>`http.host contains "${v}"` },
    ],
    tls:[
      { key:'sni', label:'SNI contains', type:'text', fn:v=>`tls.handshake.extensions_server_name contains "${v}"` },
    ],
    dns:[
      { key:'qname', label:'Query name contains', type:'text', fn:v=>`dns.qry.name contains "${v}"` },
      { key:'qtype', label:'Record type', type:'select', opts:['','A','AAAA','MX','CNAME','NS','PTR','TXT','SOA'],
        fn:v=>{const m={A:'1',AAAA:'28',MX:'15',CNAME:'5',NS:'2',PTR:'12',TXT:'16',SOA:'6'};return `dns.qry.type == ${m[v]||v}`;} },
      { key:'rcode', label:'Response code', type:'select', opts:['','NOERROR','NXDOMAIN','SERVFAIL','REFUSED'],
        fn:v=>{const m={NOERROR:'0',NXDOMAIN:'3',SERVFAIL:'2',REFUSED:'5'};return `dns.flags.rcode == ${m[v]||v}`;} },
    ],
    sip:[
      { key:'method', label:'Method',      type:'select', opts:['','INVITE','BYE','REGISTER','OPTIONS','ACK','CANCEL','UPDATE'], fn:v=>`sip.Method == "${v}"` },
      { key:'status', label:'Status Code', type:'text',   fn:v=>`sip.Status-Code == ${v}` },
    ],
  };

  const bpfFields = [
    { group:'Host', fields:[
      { value:'host',      label:'Host (any)',    hasVal:true,  ex:'10.0.0.1' },
      { value:'src host',  label:'Source Host',   hasVal:true,  ex:'10.0.0.1' },
      { value:'dst host',  label:'Dest Host',     hasVal:true,  ex:'10.0.0.1' },
      { value:'net',       label:'Network (CIDR)',hasVal:true,  ex:'192.168.1.0/24' },
      { value:'src net',   label:'Src Network',   hasVal:true,  ex:'10.0.0.0/8' },
      { value:'dst net',   label:'Dst Network',   hasVal:true,  ex:'10.0.0.0/8' },
    ]},
    { group:'Port', fields:[
      { value:'port',      label:'Port (any)',    hasVal:true, ex:'443' },
      { value:'src port',  label:'Source Port',   hasVal:true, ex:'443' },
      { value:'dst port',  label:'Dest Port',     hasVal:true, ex:'443' },
      { value:'portrange', label:'Port Range',    hasVal:true, ex:'6000-6063' },
    ]},
    { group:'Protocol', fields:[
      { value:'tcp',   label:'TCP',    hasVal:false },
      { value:'udp',   label:'UDP',    hasVal:false },
      { value:'icmp',  label:'ICMP',   hasVal:false },
      { value:'icmp6', label:'ICMPv6', hasVal:false },
      { value:'arp',   label:'ARP',    hasVal:false },
      { value:'ip',    label:'IPv4',   hasVal:false },
      { value:'ip6',   label:'IPv6',   hasVal:false },
    ]},
    { group:'Size', fields:[
      { value:'less',    label:'Less than (bytes)',    hasVal:true, ex:'512'  },
      { value:'greater', label:'Greater than (bytes)', hasVal:true, ex:'1000' },
    ]},
  ];

  const dfNextId  = React.useRef(2);
  const bpfNextId = React.useRef(2);
  const addDfRow     = ()      => setDfRows(r=>[...r,{id:dfNextId.current++,field:'ip.addr',op:'==',value:'',connector:'and'}]);
  const removeDfRow  = id      => setDfRows(r=>r.filter(row=>row.id!==id));
  const updateDfRow  = (id,p)  => setDfRows(r=>r.map(row=>row.id===id?{...row,...p}:row));
  const addBpfRow    = ()      => setBpfRows(r=>[...r,{id:bpfNextId.current++,field:'host',value:'',connector:'and'}]);
  const removeBpfRow = id      => setBpfRows(r=>r.filter(row=>row.id!==id));
  const updateBpfRow = (id,p)  => setBpfRows(r=>r.map(row=>row.id===id?{...row,...p}:row));
  const getFieldDef  = f       => dfFields.flatMap(g=>g.fields).find(x=>x.value===f);
  const getBpfDef    = f       => bpfFields.flatMap(g=>g.fields).find(x=>x.value===f);
  const getOps       = f       => { const fd=getFieldDef(f); return fd?dfOps[fd.type]||[]:['==']; };

  const generateDisplayFilter = () => {
    const parts = [];
    dfRows.forEach((row, idx) => {
      const fd = getFieldDef(row.field);
      if (!fd) return;
      let clause = '';
      if (fd.type === 'proto' || fd.type === 'bool') {
        clause = row.field;
      } else if (fd.type === 'flag') {
        if (row.value !== '') clause = `${row.field} ${row.op} ${row.value}`;
      } else {
        if (row.value) {
          const q = row.op === 'contains' || row.op === 'matches';
          clause = q ? `${row.field} ${row.op} "${row.value}"` : `${row.field} ${row.op} ${row.value}`;
        }
      }
      const sub = dfProtoSub[row.id];
      if (sub && fd.sub && protoSubDefs[fd.sub]) {
        const subs = protoSubDefs[fd.sub].filter(sd=>sub[sd.key]).map(sd=>sd.fn(sub[sd.key]));
        if (subs.length) clause = clause ? `(${[clause,...subs].join(' && ')})` : subs.join(' && ');
      }
      if (!clause) return;
      if (parts.length > 0) parts.push(dfRows[idx-1]?.connector==='or' ? '||' : '&&');
      parts.push(clause);
    });
    if (dfMods.synOnly)    { if(parts.length) parts.push('&&'); parts.push('tcp.flags.syn == 1 && tcp.flags.ack == 0'); }
    if (dfMods.errorsOnly) { if(parts.length) parts.push('&&'); parts.push('(tcp.analysis.retransmission || tcp.analysis.duplicate_ack || tcp.flags.reset == 1)'); }
    if (dfMods.noNoise)    { if(parts.length) parts.push('&&'); parts.push('!(tcp.port == 22 || tcp.port == 3389 || tcp.port == 5900)'); }
    let f = parts.join(' ') || '...';
    if (dfMods.negate && f !== '...') f = `!(${f})`;
    return f;
  };

  const generateBpfFilter = () => {
    const parts = [];
    bpfRows.forEach((row, idx) => {
      const fd = getBpfDef(row.field);
      if (!fd) return;
      const clause = fd.hasVal ? (row.value ? `${row.field} ${row.value}` : '') : row.field;
      if (!clause) return;
      if (parts.length > 0) parts.push(bpfRows[idx-1]?.connector==='or' ? 'or' : 'and');
      parts.push(clause);
    });
    let f = parts.join(' ') || '...';
    if (bpfNegate && f !== '...') f = `not (${f})`;
    return f;
  };

  const displayFilterStr = generateDisplayFilter();
  const bpfFilterStr     = generateBpfFilter();

  return (
    <div className="fadein">
      <div style={{display:'flex', gap:8, marginBottom:20}}>
        {[
          { id:'display', label:'Display Filter' },
          { id:'capture', label:'Capture Filter (BPF)' },
          { id:'library', label:'Library' },
          { id:'tshark',  label:'TShark' },
        ].map(t => (
          <button key={t.id} className={`btn ${activeTab===t.id?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'display' && (
        <div className="card fadein">
          <div className="card-title">Display Filter Builder</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {dfRows.map((row,idx)=>{
              const fd=getFieldDef(row.field);
              const ops=getOps(row.field);
              const isLast=idx===dfRows.length-1;
              return (
                <div key={row.id}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <select className="select" style={{flex:'0 0 190px'}} value={row.field}
                      onChange={e=>{
                        const nf=e.target.value;
                        const nops=getOps(nf);
                        updateDfRow(row.id,{field:nf,op:nops[0]||'==',value:''});
                        setDfProtoSub(s=>{const n={...s};delete n[row.id];return n;});
                      }}>
                      {dfFields.map(g=>(
                        <optgroup key={g.group} label={g.group}>
                          {g.fields.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    {ops.length>0&&(
                      <select className="select" style={{flex:'0 0 110px'}} value={row.op}
                        onChange={e=>updateDfRow(row.id,{op:e.target.value})}>
                        {ops.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {fd&&fd.type!=='proto'&&fd.type!=='bool'?(
                      <input className="input" style={{flex:1}} placeholder="value" value={row.value}
                        onChange={e=>updateDfRow(row.id,{value:e.target.value})}/>
                    ):(
                      <span style={{flex:1,color:'var(--muted)',fontSize:12}}>presence — no value needed</span>
                    )}
                    {dfRows.length>1&&(
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--muted)'}} onClick={()=>removeDfRow(row.id)}>×</button>
                    )}
                  </div>
                  {fd?.sub&&protoSubDefs[fd.sub]&&(
                    <div style={{marginLeft:16,marginTop:6,padding:10,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:6}}>
                      <div style={{fontSize:11,color:'var(--muted)',marginBottom:6}}>{fd.label} sub-fields — optional, leave blank to ignore</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                        {protoSubDefs[fd.sub].map(sd=>{
                          const val=dfProtoSub[row.id]?.[sd.key]||'';
                          const setVal=v=>setDfProtoSub(s=>({...s,[row.id]:{...s[row.id],[sd.key]:v}}));
                          return (
                            <div key={sd.key} style={{display:'flex',flexDirection:'column',gap:4}}>
                              <label className="label" style={{fontSize:11}}>{sd.label}</label>
                              {sd.type==='select'?(
                                <select className="select" style={{minWidth:120}} value={val} onChange={e=>setVal(e.target.value)}>
                                  {sd.opts.map(o=><option key={o} value={o}>{o||'— any —'}</option>)}
                                </select>
                              ):(
                                <input className="input" style={{minWidth:130}} placeholder="optional" value={val} onChange={e=>setVal(e.target.value)}/>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!isLast&&(
                    <div style={{display:'flex',gap:6,marginTop:6,marginLeft:8}}>
                      {['and','or'].map(c=>(
                        <button key={c} onClick={()=>updateDfRow(row.id,{connector:c})}
                          className={`btn btn-sm ${row.connector===c?'btn-primary':'btn-ghost'}`}
                          style={{padding:'2px 14px',fontSize:11}}>{c.toUpperCase()}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button className="btn btn-ghost btn-sm" style={{marginTop:10}} onClick={addDfRow}>+ Add Condition</button>
          <div style={{marginTop:16}}>
            <div className="label" style={{marginBottom:8}}>Quick Modifiers</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:16}}>
              {[{k:'synOnly',l:'New Connections (SYN only)'},{k:'errorsOnly',l:'Only Errors (Retrans/Resets)'},{k:'noNoise',l:'Exclude Management (SSH/RDP)'},{k:'negate',l:'Negate entire filter'}].map(m=>(
                <label key={m.k} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
                  <input type="checkbox" checked={dfMods[m.k]} onChange={e=>setDfMods(d=>({...d,[m.k]:e.target.checked}))}/>
                  {m.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{marginTop:20,padding:16,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div className="label">Generated Display Filter</div>
              <button className={`btn btn-sm ${copied==='df'?'btn-primary':'btn-ghost'}`} onClick={()=>copy(displayFilterStr,'df')}>
                {copied==='df'?'✓ Copied!':'Copy String'}
              </button>
            </div>
            <div style={{fontFamily:'var(--mono)',color:'var(--cyan)',fontSize:14,wordBreak:'break-all',background:'var(--bg)',padding:12,borderRadius:6,border:'1px solid var(--border)'}}>
              {displayFilterStr}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'capture' && (
        <div className="card fadein">
          <div className="card-title">Capture Filter Builder (BPF)</div>
          <div style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>BPF capture filters run at capture time (-f in tshark). Different syntax from display filters — operates on raw packet headers only.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {bpfRows.map((row,idx)=>{
              const fd=getBpfDef(row.field);
              const isLast=idx===bpfRows.length-1;
              return (
                <div key={row.id}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <select className="select" style={{flex:'0 0 190px'}} value={row.field}
                      onChange={e=>updateBpfRow(row.id,{field:e.target.value,value:''})}>
                      {bpfFields.map(g=>(
                        <optgroup key={g.group} label={g.group}>
                          {g.fields.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                        </optgroup>
                      ))}
                    </select>
                    {fd?.hasVal?(
                      <input className="input" style={{flex:1}} placeholder={fd.ex||'value'} value={row.value}
                        onChange={e=>updateBpfRow(row.id,{value:e.target.value})}/>
                    ):(
                      <span style={{flex:1,color:'var(--muted)',fontSize:12}}>presence — no value needed</span>
                    )}
                    {bpfRows.length>1&&(
                      <button className="btn btn-ghost btn-sm" style={{color:'var(--muted)'}} onClick={()=>removeBpfRow(row.id)}>×</button>
                    )}
                  </div>
                  {!isLast&&(
                    <div style={{display:'flex',gap:6,marginTop:6,marginLeft:8}}>
                      {['and','or'].map(c=>(
                        <button key={c} onClick={()=>updateBpfRow(row.id,{connector:c})}
                          className={`btn btn-sm ${row.connector===c?'btn-primary':'btn-ghost'}`}
                          style={{padding:'2px 14px',fontSize:11}}>{c.toUpperCase()}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginTop:10}}>
            <button className="btn btn-ghost btn-sm" onClick={addBpfRow}>+ Add Condition</button>
            <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,cursor:'pointer'}}>
              <input type="checkbox" checked={bpfNegate} onChange={e=>setBpfNegate(e.target.checked)}/>
              Negate (not …)
            </label>
          </div>
          <div style={{marginTop:20,padding:16,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div className="label">Generated BPF Capture Filter</div>
              <button className={`btn btn-sm ${copied==='bpf'?'btn-primary':'btn-ghost'}`} onClick={()=>copy(bpfFilterStr,'bpf')}>
                {copied==='bpf'?'✓ Copied!':'Copy String'}
              </button>
            </div>
            <div style={{fontFamily:'var(--mono)',color:'var(--green)',fontSize:14,wordBreak:'break-all',background:'var(--bg)',padding:12,borderRadius:6,border:'1px solid var(--border)'}}>
              {bpfFilterStr}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="fadein">
          {commonFilters.map(g => (
            <div key={g.cat} className="card">
              <div className="card-title">{g.cat} Filters</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Filter Expression</th><th>Description</th><th style={{width:80}}>Action</th></tr></thead>
                  <tbody>
                    {g.filters.map(f => (
                      <tr key={f.f}>
                        <td style={{color:'var(--cyan)', fontFamily:'var(--mono)'}}>{f.f}</td>
                        <td style={{color:'var(--muted)'}}>{f.d}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={()=>copy(f.f, f.f)}>Copy</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tshark' && (
        <div className="fadein">
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            {[{id:'reference',label:'Reference'},{id:'builder',label:'Command Builder'}].map(t=>(
              <button key={t.id} className={`btn btn-sm ${tsharkSubTab===t.id?'btn-primary':'btn-ghost'}`} onClick={()=>setTsharkSubTab(t.id)}>{t.label}</button>
            ))}
          </div>

          {tsharkSubTab === 'reference' && (
            <div className="fadein">
              {tsharkCmds.map(g => (
                <div key={g.cat} className="card">
                  <div className="card-title">{g.cat}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {g.cmds.map(c => (
                      <div key={c.c} style={{background:'var(--panel)',padding:12,borderRadius:6,border:'1px solid var(--border)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                          <div style={{fontFamily:'var(--mono)',color:'var(--green)',fontSize:12,wordBreak:'break-all',flex:1}}>{c.c}</div>
                          <button className={`btn btn-ghost btn-sm ${copied===c.c?'btn-primary':''}`} onClick={()=>copy(c.c,c.c)} style={{flexShrink:0}}>{copied===c.c?'✓':'Copy'}</button>
                        </div>
                        <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{c.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tsharkSubTab === 'builder' && (
            <div className="card fadein">
              <div className="card-title">TShark Command Builder</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <div>
                  <div className="field">
                    <label className="label">Mode</label>
                    <select className="select" value={ts.mode} onChange={e=>setTs(s=>({...s,mode:e.target.value}))}>
                      <option value="live">Live Capture (-i)</option>
                      <option value="read">Read File (-r)</option>
                    </select>
                  </div>
                  {ts.mode==='live'?(
                    <div className="field">
                      <label className="label">Interface (-i)</label>
                      <input className="input" placeholder="e.g. eth0, any, en0" value={ts.iface} onChange={e=>setTs(s=>({...s,iface:e.target.value}))}/>
                    </div>
                  ):(
                    <div className="field">
                      <label className="label">Input File (-r)</label>
                      <input className="input" placeholder="e.g. capture.pcap" value={ts.readFile} onChange={e=>setTs(s=>({...s,readFile:e.target.value}))}/>
                    </div>
                  )}
                  {ts.mode==='live'&&(
                    <div className="field">
                      <label className="label">Write to File (-w, optional)</label>
                      <input className="input" placeholder="e.g. out.pcap" value={ts.writeFile} onChange={e=>setTs(s=>({...s,writeFile:e.target.value}))}/>
                    </div>
                  )}
                  <div className="field">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <label className="label">Capture Filter / BPF (-f)</label>
                      {bpfFilterStr!=='...'&&(
                        <button className="btn btn-ghost btn-sm" style={{fontSize:11,marginBottom:4}}
                          onClick={()=>setTs(s=>({...s,captureFilter:bpfFilterStr}))}>
                          ← Use built filter
                        </button>
                      )}
                    </div>
                    <input className="input" placeholder="e.g. port 443" value={ts.captureFilter} onChange={e=>setTs(s=>({...s,captureFilter:e.target.value}))}/>
                  </div>
                  <div className="field">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <label className="label">Display Filter (-Y)</label>
                      {displayFilterStr!=='...'&&(
                        <button className="btn btn-ghost btn-sm" style={{fontSize:11,marginBottom:4}}
                          onClick={()=>setTs(s=>({...s,displayFilter:displayFilterStr}))}>
                          ← Use built filter
                        </button>
                      )}
                    </div>
                    <input className="input" placeholder="e.g. http.response.code >= 400" value={ts.displayFilter} onChange={e=>setTs(s=>({...s,displayFilter:e.target.value}))}/>
                  </div>
                </div>
                <div>
                  <div className="field">
                    <label className="label">Stop: Packet Count (-c)</label>
                    <input className="input" placeholder="e.g. 1000" value={ts.count} onChange={e=>setTs(s=>({...s,count:e.target.value}))}/>
                  </div>
                  <div className="field">
                    <label className="label">Stop: Duration (-a duration:N seconds)</label>
                    <input className="input" placeholder="e.g. 60" value={ts.duration} onChange={e=>setTs(s=>({...s,duration:e.target.value}))}/>
                  </div>
                  <div className="field">
                    <label className="label">Output Format (-T)</label>
                    <select className="select" value={ts.outputFmt} onChange={e=>setTs(s=>({...s,outputFmt:e.target.value}))}>
                      <option value="default">Default (text)</option>
                      <option value="fields">Fields (-T fields)</option>
                      <option value="json">JSON (-T json)</option>
                      <option value="pdml">PDML/XML (-T pdml)</option>
                    </select>
                  </div>
                  {ts.outputFmt==='fields'&&(
                    <div className="field">
                      <label className="label">Output Fields (-e), comma-separated</label>
                      <input className="input" placeholder="e.g. ip.src,ip.dst,tcp.port" value={ts.fields} onChange={e=>setTs(s=>({...s,fields:e.target.value}))}/>
                    </div>
                  )}
                  <div className="field">
                    <label className="label">Statistics (-z, optional)</label>
                    <select className="select" value={ts.stats} onChange={e=>setTs(s=>({...s,stats:e.target.value}))}>
                      <option value="">None</option>
                      <option value="io,phs">Protocol Hierarchy (io,phs)</option>
                      <option value="expert">Expert Info (expert)</option>
                      <option value="conv,tcp">TCP Conversations (conv,tcp)</option>
                      <option value="conv,ip">IP Conversations (conv,ip)</option>
                      <option value="http,tree">HTTP Tree (http,tree)</option>
                      <option value="dns,tree">DNS Tree (dns,tree)</option>
                    </select>
                  </div>
                </div>
              </div>
              {(()=>{
                const parts=['tshark'];
                if(ts.mode==='live'){
                  parts.push(`-i ${ts.iface||'eth0'}`);
                  if(ts.captureFilter) parts.push(`-f "${ts.captureFilter}"`);
                  if(ts.writeFile)     parts.push(`-w ${ts.writeFile}`);
                  if(ts.count)         parts.push(`-c ${ts.count}`);
                  if(ts.duration)      parts.push(`-a duration:${ts.duration}`);
                } else {
                  parts.push(`-r ${ts.readFile||'capture.pcap'}`);
                }
                if(ts.displayFilter)         parts.push(`-Y "${ts.displayFilter}"`);
                if(ts.outputFmt!=='default') parts.push(`-T ${ts.outputFmt}`);
                if(ts.outputFmt==='fields'&&ts.fields) ts.fields.split(',').map(f=>f.trim()).filter(Boolean).forEach(f=>parts.push(`-e ${f}`));
                if(ts.stats) parts.push(`-z ${ts.stats}`);
                const cmd=parts.join(' ');
                return (
                  <div style={{marginTop:20,padding:16,background:'var(--panel)',border:'1px solid var(--border)',borderRadius:8}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                      <div className="label">Generated Command</div>
                      <button className={`btn btn-sm ${copied==='ts'?'btn-primary':'btn-ghost'}`} onClick={()=>copy(cmd,'ts')}>
                        {copied==='ts'?'✓ Copied!':'Copy'}
                      </button>
                    </div>
                    <div style={{fontFamily:'var(--mono)',color:'var(--green)',fontSize:13,wordBreak:'break-all',background:'var(--bg)',padding:12,borderRadius:6,border:'1px solid var(--border)'}}>
                      {cmd}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tool: IPFM / NBM / PTP ──────────────────────────────────
window.WiresharkTools = WiresharkTools;
