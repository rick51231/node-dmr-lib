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

#### Services:
- IPSCPeer - IPSC peer node, maintains master connection and provides DMR sending/receiving.
- DMRIPGateway - DMR to UDP/IP gateway. Connects to the IPSCPeer.
- DMRServices - ARS/LRRP/BMS service. Connects to the DMRIPGateway.

#### Supported encodings/checksums:
- BPTC 196/96
- CRC 9/16/32
- Hamming
- Trellis
- Golay 20/8/7

#### Supported IP features:
- UDP/IP4 over dmr (plain)
- UDP/IP4 over dmr (DMR Standart header compression)
- UDP/IP4 over dmr (Advantage header compression)

#### Supported DMR blocks:
- DataHeader (Response, Confirmed, Unconfirmed, Proprietary, ProprietaryCompressed)
- CSBK (CallAlertACK, CallEmergency, Preamble)
- Rate 1/2 and 3/4 data
- DataBlock with CRC32 (encapsulates IP packets)

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