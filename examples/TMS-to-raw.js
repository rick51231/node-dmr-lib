const DMRLib = require('../src');

//DMR ID
let src = 11111;
let dst = 22222;

let tms = new DMRLib.Protocols.TMS();

tms.text = 'Hi all';

let tmsBuffer = tms.getBuffer();

let ipPacket = new DMRLib.IP.IP4Packet();

ipPacket.src_addr = (DMRLib.Motorola.Network.NETWORK_SERVER<<24) | src;
ipPacket.dst_addr = (DMRLib.Motorola.Network.NETWORK_RADIO<<24) | dst;
ipPacket.src_port = DMRLib.Motorola.Network.PORT_TMS;
ipPacket.dst_port = DMRLib.Motorola.Network.PORT_TMS;
ipPacket.protocol = DMRLib.IP.IP4Packet.PROTOCOL_UDP;
ipPacket.payload = tmsBuffer;

let ipBuffer = ipPacket.getBuffer();

let dataPackets = DMRLib.DMR.Util.DataBlock.createDataBlock(ipBuffer, src, dst, false);

let rawPackets = dataPackets.map(i => i.getBuffer());

console.log(dataPackets);
console.log(rawPackets);