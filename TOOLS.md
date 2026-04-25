# RDA Net Kit - Feature Guide

A comprehensive overview of the specialized tools and interactive references supported by the application, organized by network domain.

## IPv4 & Fundamental Subnetting
These tools provide core calculations for IPv4 address space management and planning.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **Subnet Calculator** | Tool | Core CIDR calculator for network/broadcast boundaries, usable hosts, and wildcard masks. |
| **VLSM Planner** | Tool | Plans Variable Length Subnet Masking based on a list of required hosts per subnet. |
| **Supernet / Summary** | Tool | Aggregates multiple network routes into a single summary or supernet address. |
| **Range <-> CIDR** | Tool | Efficiently converts IP ranges into the smallest possible set of CIDR blocks and vice-versa. |
| **Wildcard Mask** | Tool | Dedicated tool for calculating Cisco-style inverse masks for ACLs. |
| **Overlap Detector** | Tool | Audits a list of CIDR blocks to identify conflicting or overlapping address spaces. |
| **Split & Merge** | Tool | Interactive tool to divide subnets into smaller segments or combine them. |
| **Subnet Visual Map** | Tool | Generates a proportional grid visualization showing how subnets fit within a parent block. |
| **DHCP Scope Planner** | Tool | Calculates DHCP pool ranges from a CIDR block with excluded addresses, lease times, and DNS/domain config. |
| **IP Converter** | Tool | Instant translation between Dotted Decimal, Binary, Hexadecimal, and Integer formats. |
| **ACL Generator** | Tool | Generates firewall syntax for Cisco (IOS/ASA), Juniper, iptables, AWS SG, Azure NSG, and more. |

## IPv6 Management
Native IPv6 tools designed for the massive 128-bit address space.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **IPv6 Subnet Calc** | Tool | Advanced CIDR calculator for IPv6 prefixes, supporting massive address counts. |
| **IPv6 Transition Mech** | Ref | Comparison of NAT64/DNS64, DS-Lite, 464XLAT, and standard 6in4/GRE tunneling. |

## IP & MAC Classification
Tools focusing on address classification and hardware addressing across both IPv4 and IPv6.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **IP Classifier** | Tool | Cross-version (v4/v6) role classifier (Private, Public, Link-Local, Loopback, etc.). |
| **MAC Address Tools** | Tool 🌐 | OUI vendor lookup, format cleaning, and EUI-64/IPv6 Link-Local address derivation. |
| **IP Cheat Sheet** | Ref | Quick-reference for IP classes, RFC 1918, and CIDR masks. |

## Multicast Specialist Suite
A deep-dive toolset for IP Multicast (Class D and IPv6 ff::/8) engineering.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **Multicast Reference** | Ref | Massive reference for well-known groups, IGMP/MLD versions, and TTL scopes. |
| **Multicast Planner** | Tool | Allocates multicast group ranges within a 239.x.x.x admin-scoped block. |
| **Multicast IP-MAC Map** | Tool | Precise mapping of Multicast IPs to Ethernet MACs (RFC 1112/2464). |
| **Multicast Analyzer** | Tool | Breaks down scopes, T/P/R flags, and well-known group assignments. |
| **IPv6 Mcast Builder** | Tool | Interactive UI to construct valid IPv6 multicast addresses by scope and flag bits. |
| **Solicited-Node Calc** | Tool | Computes IPv6 Solicited-Node Multicast addresses for Neighbor Discovery troubleshooting. |
| **GLOP Calculator** | Tool | Encodes/Decodes 16-bit AS numbers into 233.x.y.z GLOP blocks (RFC 3180). |
| **MAC Collision Check** | Tool | Identifies IP-to-MAC 32:1 overlaps in a list of IPv4 multicast groups. |

## Switching (Layer 2)
References and tools for fabric protocols, switching, and overlay networking.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **Switching (STP/VPC)** | Ref | Guides for STP/RSTP/MST standards, Bridge ID selection, and Cisco Nexus vPC. |
| **LACP / Port-Channel** | Tool | Traffic hashing simulator using XOR logic for EtherChannel/LACP link selection. |
| **Interface Config Gen** | Tool | Generates bulk interface configs with incrementing IPs/VLANs from a template. |
| **VXLAN Reference** | Ref | Essential breakdown of VXLAN overlay, VTEP formats, VNI allocation, and BGP EVPN. |

## Routing (Layer 3)
Tools and references for routing protocols, MPLS, VPNs, and BGP.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **IP Proto Reference** | Ref | Master list of IP Protocol numbers and Administrative Distance values for all major routing protocols. |
| **MPLS Reference** | Ref | Interactive breakdown of the 32-bit MPLS label shim header (Label, TC, S-bit, TTL) with field-level details and LSR forwarding concepts. |
| **VPN / IPsec Architect** | Ref | IPsec Phase 1/Phase 2 reference with interactive DH Group / Security Strength calculator. |
| **BGP Looking Glass** | Tool 🌐 | Queries global route servers (via RIPE Stat) to verify prefix propagation. |
| **BGP / ASN Lookup** | Tool 🌐 | Deep lookup for Autonomous System ownership via RIPE and IPWhois. |

## Infrastructure
References and tools for foundational networking concepts and physical-layer planning.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **OSI & TCP/IP Model** | Ref | Interactive 7-layer comparison matrix with PDU descriptions and protocol mapping. |
| **Packet Header Map** | Ref | Visual simulator for IPv4, IPv6, TCP, and UDP headers with Python/Scapy export. |
| **QoS / DSCP Bit Map** | Tool | Maps DSCP names to binary/decimal values and Per-Hop Behavior (PHB) classes. |
| **MTU & Encapsulation** | Tool | Calculates resulting MTU after stacking encapsulations (802.1Q, MPLS, GRE, VXLAN, IPsec, PPPoE, Geneve). |
| **WLAN / 802.11 Planner** | Tool | Wi-Fi channel spectrum map and MCS Index theoretical data rate calculator. |
| **WiFi QR Code Gen** | Tool | Generates scannable QR codes for easy Wi-Fi network joining (WPA/WPA2/WPA3). |

## Media & Broadcast (IPFM)
Specialized tools for the broadcasting and media-over-IP domain (SMPTE ST 2110).

| Tool | Type | Description |
| :--- | :--- | :--- |
| **IPFM / NBM / PTP** | Ref | IP Fabric for Media reference, Non-Blocking Multicast design, and Precision Time Protocol guides. |

## Diagnostics & Utilities
General purpose tools for diagnostics, analysis, and network reconnaissance.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **DNS Lookup** | Tool 🌐 | DoH-powered lookup for A, AAAA, MX, TXT, and CNAME records. |
| **SSL/TLS Inspector** | Tool 🌐 | Full TLS certificate analysis via SSL Labs: grade, expiry, issuer chain, protocol support, and revocation status. |
| **HTTP Header Analyzer** | Tool 🌐 | Fetch and analyze HTTP response headers with security scoring — checks HSTS, CSP, X-Frame-Options, and more. |
| **Self-Signed Cert Gen** | Tool | Browser-side RSA key pair and X.509 self-signed certificate generator. Outputs PEM files for download. |
| **Remote Ping / MTR** | Tool 🌐 | Run ICMP Ping and Path Trace/MTR directly from remote diagnostic nodes. |
| **IP Geolocation** | Tool 🌐 | Public IP to GIS data, ISP ownership, and ASN mapping. |
| **Wireshark Toolkit** | Tool | Pre-built Wireshark capture filters, display queries, and CLI tools for tshark. |
| **SysTool CLI Builder** | Tool | Interactive command builder for Linux (netstat, hping3, iperf, curl, nmtui) and Windows (netsh) network utilities. |
| **Ping Sweep Planner** | Tool | Generates IP target lists and scan commands (Nmap, Fping, Bash) for surveys. |
| **Bandwidth & Throughput** | Tool | Unit converter (bps/MB/s), transfer time calculator, throughput/Pps estimator, and serial bandwidth calculator. |
| **Cypher Deck** | Tool | Encode/decode (Base64, Hex, URL, Binary), hashing (MD5, SHA, HMAC), JWT decoder, and XOR bitwise operations. |
| **CLI Quick Reference** | Tool | Searchable command reference for Cisco IOS, NX-OS, and Juniper JunOS — covers interfaces, routing, OSPF, BGP, ACLs, and more. |
| **Port Reference** | Ref | Searchable database of common TCP/UDP ports and service descriptions. |

## Education
Interactive games for learning and practicing networking concepts.

| Tool | Type | Description |
| :--- | :--- | :--- |
| **Network Arcade** | Tool | Collection of interactive games: Packet Rain (protocol classification), Subnet Sprint (IPv4 subnetting under time pressure), and IPv6 Gauntlet (address manipulation challenges). |

---
*Note: Tools marked with 🌐 require an active internet connection to access external APIs.*
