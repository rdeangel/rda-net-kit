const { useState, useEffect, useCallback, useRef, useMemo } = React;

      function CheatSheet() {
        const privateRanges = PRIVATE_RANGES;
        const specialRanges = SPECIAL_RANGES;
        const ipv6Special = IPV6_SPECIAL;
        const classTable = CLASS_TABLE;

        return (
          <div className="fadein">
            <div className="cs-section">
              <div className="cs-title">IPv4 Classes</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Class</th><th>First Octet</th><th>Default Mask</th><th>Networks</th><th>Hosts/Network</th><th>Use</th></tr></thead>
                <tbody>{classTable.map(r => <tr key={r.cls}>
                  <td><span className="badge badge-cyan">{r.cls}</span></td>
                  <td>{r.range}</td><td>{r.mask}</td><td>{r.networks}</td>
                  <td style={{color:'var(--green)'}}>{r.hostsPerNet}</td><td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{r.use}</td>
                </tr>)}</tbody>
              </table></div>
            </div>

            <div className="cs-section">
              <div className="cs-title">Private & Special IPv4 Ranges (RFC1918 + others)</div>
              <div className="table-wrap"><table>
                <thead><tr><th>CIDR</th><th>Start</th><th>End</th><th>Usable Hosts</th><th>RFC</th><th>Use</th></tr></thead>
                <tbody>{privateRanges.map(r => <tr key={r.range}>
                  <td style={{color:'var(--cyan)'}}>{r.range}</td><td>{r.start}</td><td>{r.end}</td>
                  <td style={{color:'var(--green)'}}>{r.hosts}</td>
                  <td><RFCLink rfc={r.rfc} className="badge badge-blue" /></td>
                  <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{r.use}</td>
                </tr>)}</tbody>
              </table></div>
            </div>

            <div className="cs-section">
              <div className="cs-title">Other Special-Use IPv4 Ranges</div>
              <div className="table-wrap"><table>
                <thead><tr><th>CIDR</th><th>RFC</th><th>Use</th></tr></thead>
                <tbody>{specialRanges.map(r => <tr key={r.range}>
                  <td style={{color:'var(--yellow)'}}>{r.range}</td>
                  <td><RFCLink rfc={r.rfc} className="badge badge-gray" /></td>
                  <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{r.use}</td>
                </tr>)}</tbody>
              </table></div>
            </div>

            <div className="cs-section">
              <div className="cs-title">Common Subnet Reference</div>
              <div className="table-wrap"><table>
                <thead><tr><th>CIDR</th><th>Subnet Mask</th><th>Wildcard</th><th>Hosts</th><th>Typical Use</th></tr></thead>
                <tbody>{[
                  ['/30','255.255.255.252','0.0.0.3','2','Point-to-point links'],
                  ['/29','255.255.255.248','0.0.0.7','6','Tiny LAN segments'],
                  ['/28','255.255.255.240','0.0.0.15','14','Small VLAN'],
                  ['/27','255.255.255.224','0.0.0.31','30','Small office floor'],
                  ['/26','255.255.255.192','0.0.0.63','62','Department subnet'],
                  ['/25','255.255.255.128','0.0.0.127','126','Half a /24'],
                  ['/24','255.255.255.0','0.0.0.255','254','Standard LAN / VLAN'],
                  ['/23','255.255.254.0','0.0.1.255','510','Two /24s combined'],
                  ['/22','255.255.252.0','0.0.3.255','1,022','Campus block'],
                  ['/21','255.255.248.0','0.0.7.255','2,046','Medium enterprise'],
                  ['/20','255.255.240.0','0.0.15.255','4,094','Large enterprise'],
                  ['/16','255.255.0.0','0.0.255.255','65,534','Class B block'],
                  ['/8','255.0.0.0','0.255.255.255','16,777,214','Class A block'],
                ].map(([cidr,mask,wc,hosts,use]) => (
                  <tr key={cidr}>
                    <td style={{color:'var(--cyan)'}}>{cidr}</td><td>{mask}</td>
                    <td style={{color:'var(--yellow)'}}>{wc}</td>
                    <td style={{color:'var(--green)'}}>{hosts}</td>
                    <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{use}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </div>

            <div className="cs-section">
              <div className="cs-title">IPv6 Special Ranges</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Prefix</th><th>Type</th><th>RFC</th><th>Use Case</th></tr></thead>
                <tbody>{ipv6Special.map(r => <tr key={r.addr}>
                  <td style={{color:'var(--purple)',fontFamily:'var(--mono)'}}>{r.addr}</td>
                  <td style={{fontFamily:'var(--sans)'}}>{r.type}</td>
                  <td><RFCLink rfc={r.rfc} className="badge badge-gray" /></td>
                  <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{r.use}</td>
                </tr>)}</tbody>
              </table></div>
            </div>

            <div className="cs-section">
              <div className="cs-title">IPv6 Multicast Scopes (ff0X::)</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Prefix</th><th>Scope Name</th><th>Use Case</th></tr></thead>
                <tbody>{IPV6_SCOPES.map(s => <tr key={s.scope}>
                  <td style={{color:'var(--purple)',fontFamily:'var(--mono)'}}>{s.scope}</td>
                  <td>{s.name}</td>
                  <td style={{fontFamily:'var(--sans)',color:'var(--muted)'}}>{s.use}</td>
                </tr>)}</tbody>
              </table></div>
            </div>

          </div>
        );
      }



// ─── Tool: Interface Config Generator ──────────────────────────────────────────
window.CheatSheet = CheatSheet;
