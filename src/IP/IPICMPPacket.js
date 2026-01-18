const IP4Packet = require("./IP4Packet");

class IPICMPPacket extends IP4Packet {
    static TYPE_ECHO_REPLY = 0x00;
    static TYPE_ECHO = 0x08;
    type = 0;
    code = 0;
    icmpIdentifier = 0;
    seq = 0;
    payload = Buffer.alloc(0);

    constructor() {
        super(IP4Packet.PROTOCOL_ICMP);
    }

    static from(buffer) {
        if(buffer.length<8)
            return null;

        if(IPICMPPacket.getICMPChecksum(buffer)!==0)
            return null;

        let pkt = new IPICMPPacket();

        pkt.type = buffer.readUInt8(0);
        pkt.code = buffer.readUInt8(1);
        pkt.icmpIdentifier = buffer.readUInt16BE(4);
        pkt.seq = buffer.readUInt16BE(6);

        pkt.payload = buffer.subarray(8);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8+this.payload.length);

        buffer.writeUInt8(this.type, 0);
        buffer.writeUInt8(this.code, 1);
        buffer.writeUInt16BE(this.icmpIdentifier, 4);
        buffer.writeUInt16BE(this.seq, 6);

        buffer.write(this.payload.toString('hex'), 8, 'hex');

        let chk = IPICMPPacket.getICMPChecksum(buffer);

        buffer.writeUInt16BE(chk, 2);

        return super.getBuffer(buffer);
    }

    static getICMPChecksum(buffer) {
        let icmpChk = 0x00;

        for(let i = 0; i<buffer.length; i+=2) {
            if(i === buffer.length-1 && buffer.length % 2 === 1) {
                icmpChk += buffer.readUInt8(i) << 8;
            } else {
                icmpChk += buffer.readUInt16BE(i);
            }

        }

        while (icmpChk>>16) {
            icmpChk = (icmpChk & 0xffff) + (icmpChk >> 16);
        }
        icmpChk = 0xffff - icmpChk;

        return icmpChk;
    }
}

module.exports = IPICMPPacket;