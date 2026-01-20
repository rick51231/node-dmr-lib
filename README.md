# node-dmr-lib
Motorola MotoTRBO DMR protocols research project.

#### Supported protocols:
- ARS (Automatic Registration Service)
- LRRP (Location Request Response Protocol)
- TMS (Text Message Service)
- BMS (IMPRES Battery Management)
- HomeBrew (HBLink repeater protocol)
- IPSC (IP Site Connect)
- XCMP (Extended Control & Management Protocol)
- XNL (XCMP Network Layer)
- NMEA over DMR UDT: Short (ETSI specs) and Legacy (Ailunce and TYT radios).

#### Services:
- IPSCPeer - IPSC peer node, maintains master connection and provides DMR sending/receiving.
- DMRIPGateway - DMR to UDP/IP gateway. Connects to the IPSCPeer.
- DMRServices - ARS/LRRP/BMS service. Connects to the DMRIPGateway.
- AMBEClient - Client for AMBE server for encoding/decoding voice frames ([example](https://github.com/rick51231/ambe-server-docker))

#### Supported encodings/checksums:
- BPTC 196/96
- CRC 9/16/32
- Hamming
- Trellis
- Golay 20/8/7
- AMBE (conversion from 72 to 49 bit and vise-versa)
- Quadratic residue (QR) 16/7/6
- Reed-Solomon 12/9

#### Supported encryption:
- ARC4

#### Supported IP features:
- ICMP/IP4 over dmr (plain)
- TCP/IP4 over dmr (plain)
- UDP/IP4 over dmr (plain)
- UDP/IP4 over dmr (DMR Standart header compression)
- UDP/IP4 over dmr (Advantage header compression)

#### Supported DMR blocks:
- DataHeader (Unified, Response, Confirmed, Unconfirmed, Proprietary, ProprietaryCompressed)
- CSBK (CallAlertACK, CallEmergency, Preamble)
- Rate 1/2 and 3/4 data
- DataBlock with CRC32 (encapsulates IP packets)
- Voice header and terminator including Link Control (LC) data
- Voice data (HomeBrew/IPSC payload)
- PI header

Some development information can be found in [dev](dev) folder.



## Credits
Thanks to the following projects:
- [go-dmr](https://github.com/pd0mz/go-dmr)
- [MMDVMHost](https://github.com/g4klx/MMDVMHost)
- [Moto.Net](https://github.com/pboyd04/Moto.Net)
- [DMRlink](https://github.com/HBLink-org/DMRlink)
- [sdrtrunk](https://github.com/DSheirer/sdrtrunk)
- [SafeNet](https://git.safemobile.org/laurentiu.constantin/SafeNet)
- [TRBO-NET](https://github.com/KD8EYF/TRBO-NET)
- [trbo-data-svc](https://github.com/jelimoore/trbodatasvc)



       
### Full readme coming soon...