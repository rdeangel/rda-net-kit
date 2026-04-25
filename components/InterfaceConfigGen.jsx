const { useState, useEffect, useCallback, useRef, useMemo } = React;

function InterfaceConfigGen() {
  const ip2int = ip => ip.split('.').reduce((a,b) => (a*256)+parseInt(b,10), 0) >>> 0;
  const int2ip = n  => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
  const mkMask = p  => p===0 ? 0 : ((0xffffffff << (32-p)) >>> 0);

  const [prefix, setPrefix] = useState("GigabitEthernet1/0/");
  const [start, setStart] = useState("1");
  const [end, setEnd] = useState("4");
  const [baseIP, setBaseIP] = useState("10.10.10.0");
  const [subnetCIDR, setSubnetCIDR] = useState("30");
  const [vlanStart, setVlanStart] = useState("");
  const [template, setTemplate] = useState(
    `interface {{int}}
  description Peering-Link-{{i}}
  no switchport
  ip address {{ip}} {{mask}}
  no shutdown`
  );
  const [copied, copy] = useCopy();

  const generateOutput = () => {
    let out = [];
    let currentIPNum = 0;

    // Parse the base IP to get its numeric value if provided
    if (baseIP) {
      const parsed = IPv4.parseCIDR(baseIP + "/" + (subnetCIDR || "32"));
      if (parsed) {
        currentIPNum = parsed.ip;
      }
    }

    let cidr = parseInt(subnetCIDR, 10);
    if (isNaN(cidr) || cidr < 0 || cidr > 32) cidr = 32;

    const numIPsPerSubnet = Math.pow(2, 32 - cidr);
    const mask = int2ip(mkMask(cidr));

    const s = parseInt(start, 10) || 1;
    const e = parseInt(end, 10) || 4;
    const vStart = parseInt(vlanStart, 10);

    for (let i = s; i <= e; i++) {
      let blockStr = template;

      blockStr = blockStr.replace(/\{\{int\}\}/g, prefix + i);
      blockStr = blockStr.replace(/\{\{i\}\}/g, i);

      if (!isNaN(vStart)) {
        blockStr = blockStr.replace(/\{\{vlan\}\}/g, vStart + (i - s));
      } else {
        blockStr = blockStr.replace(/\{\{vlan\}\}/g, "");
      }

      if (baseIP) {
        const netInt = currentIPNum;
        const netStr = int2ip(netInt);
        const bcastInt = netInt + numIPsPerSubnet - 1;
        const bcastStr = int2ip(bcastInt);

        let usableIPStr = "";
        if (cidr === 32 || cidr === 31) {
          usableIPStr = netStr; // For /31 and /32, network address is usable
        } else {
          usableIPStr = int2ip(netInt + 1); // For others, network + 1 is the first usable
        }

        blockStr = blockStr.replace(/\{\{ip\}\}/g, usableIPStr);
        blockStr = blockStr.replace(/\{\{mask\}\}/g, mask);
        blockStr = blockStr.replace(/\{\{cidr\}\}/g, cidr);
        blockStr = blockStr.replace(/\{\{net\}\}/g, netStr);
        blockStr = blockStr.replace(/\{\{bcast\}\}/g, bcastStr);

        currentIPNum += numIPsPerSubnet;
      } else {
        blockStr = blockStr.replace(/\{\{ip\}\}/g, "");
        blockStr = blockStr.replace(/\{\{mask\}\}/g, "");
        blockStr = blockStr.replace(/\{\{cidr\}\}/g, "");
        blockStr = blockStr.replace(/\{\{net\}\}/g, "");
        blockStr = blockStr.replace(/\{\{bcast\}\}/g, "");
      }

      out.push(blockStr);
    }
    return out.join("\n\n");
  };

  const output = generateOutput();

  return (
    <div className="card">
      <div className="card-title">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="icon-badge">📝</div>
          Interface Config Generator
        </div>
      </div>
      <div className="card-body">
        <div
          style={{
            marginBottom: 16,
            fontSize: 13,
            color: "var(--muted)",
            lineHeight: 1.5,
          }}
        >
          Generate bulk configuration blocks for multiple interfaces. Use the
          template variables to dynamically inject interface names, IP addresses,
          and VLANs.
        </div>

        <div className="two-col">
          {/* LEFT: Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div className="input-group">
                <label>Prefix</label>
                <input
                  className="input"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Eth1/"
                />
              </div>
              <div className="input-group">
                <label>Start</label>
                <input
                  className="input"
                  type="number"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label>End</label>
                <input
                  className="input"
                  type="number"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: 12,
              }}
            >
              <div className="input-group">
                <label>Base IP (Optional)</label>
                <input
                  className="input"
                  value={baseIP}
                  onChange={(e) => setBaseIP(e.target.value)}
                  placeholder="10.0.0.0"
                />
              </div>
              <div className="input-group">
                <label>CIDR Size</label>
                <input
                  className="input"
                  type="number"
                  value={subnetCIDR}
                  onChange={(e) => setSubnetCIDR(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="input-group">
                <label>Start VLAN</label>
                <input
                  className="input"
                  type="number"
                  value={vlanStart}
                  onChange={(e) => setVlanStart(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div
              className="input-group"
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <label>Configuration Template</label>
              <textarea
                className="input"
                style={{
                  flex: 1,
                  minHeight: 200,
                  fontFamily: "var(--mono)",
                  resize: "vertical",
                  whiteSpace: "pre",
                }}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div
              style={{
                background: "var(--panel)",
                padding: 12,
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                fontSize: 12,
                fontFamily: "var(--mono)",
              }}
            >
              <div
                style={{
                  color: "var(--muted)",
                  marginBottom: 8,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Available Variables
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ color: "var(--cyan)" }}>{"{{int}}"}</span> -
                  Interface Name
                </div>
                <div>
                  <span style={{ color: "var(--cyan)" }}>{"{{i}}"}</span> - Index
                  Number
                </div>
                <div>
                  <span style={{ color: "var(--green)" }}>{"{{ip}}"}</span> -
                  Subnet First IP
                </div>
                <div>
                  <span style={{ color: "var(--green)" }}>{"{{mask}}"}</span> -
                  Subnet Mask
                </div>
                <div>
                  <span style={{ color: "var(--dim)" }}>{"{{cidr}}"}</span> -
                  CIDR Prefix (/{subnetCIDR})
                </div>
                <div>
                  <span style={{ color: "var(--dim)" }}>{"{{net}}"}</span> -
                  Subnet Network IP
                </div>
                <div>
                  <span style={{ color: "var(--dim)" }}>{"{{bcast}}"}</span> -
                  Subnet Broadcast IP
                </div>
                <div>
                  <span style={{ color: "var(--yellow)" }}>{"{{vlan}}"}</span> -
                  Incrementing VLAN
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Output */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
              <button
                className="btn btn-ghost"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => copy(output, "config")}
              >
                {copied === "config" ? "✓ COPIED" : "📋 COPY"}
              </button>
            </div>
            <textarea
              className="input"
              readOnly
              value={output}
              style={{
                flex: 1,
                height: "100%",
                minHeight: 400,
                fontFamily: "var(--mono)",
                backgroundColor: "var(--panel)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                whiteSpace: "pre",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tool: ACL / Firewall Rule Generator ────────────────────


window.InterfaceConfigGen = InterfaceConfigGen;
