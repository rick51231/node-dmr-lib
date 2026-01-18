const IP4Packet = require("./IP4Packet");

class IPTCPPacket extends IP4Packet {
    src_port = 0;
    dst_port = 0;

    seq = 0;
    ackNum = 0;

    flag_NS = false;
    flag_CWR = false;
    flag_ECE = false;
    flag_URG = false;
    flag_ACK = false;
    flag_PSH = false;
    flag_RST = false;
    flag_SYN = false;
    flag_FIN = false;

    window = 0;
    urgentPointer = 0;

    options = Buffer.alloc(0);
    payload = Buffer.alloc(0);

    constructor() {
        super(IP4Packet.PROTOCOL_TCP);
    }

    static from(buffer, src_addr, dst_addr) {
        if(buffer.length<20)
            return null;

        if(IPTCPPacket.getTCPChecksum(buffer, src_addr, dst_addr)!==0)
            return null;

        let pkt = new IPTCPPacket();

        pkt.src_port = buffer.readUInt16BE(0);
        pkt.dst_port = buffer.readUInt16BE(2);
        pkt.seq = buffer.readUInt32BE(4);
        pkt.ackNum = buffer.readUInt32BE(8);
        let b = buffer.readUInt16BE(12);

        let dataOffset = (b >> 12) & 0xF;
        pkt.flag_NS = (b & 0x100) > 0;
        pkt.flag_CWR = (b & 0x80) > 0;
        pkt.flag_ECE = (b & 0x40) > 0;
        pkt.flag_URG = (b & 0x20) > 0;
        pkt.flag_ACK = (b & 0x10) > 0;
        pkt.flag_PSH = (b & 0x8) > 0;
        pkt.flag_RST = (b & 0x4) > 0;
        pkt.flag_SYN = (b & 0x2) > 0;
        pkt.flag_FIN = (b & 0x1) > 0;

        pkt.window = buffer.readUInt16BE(14);
        pkt.urgentPointer = buffer.readUInt16BE(18);

        pkt.options = buffer.subarray(20, dataOffset*4);
        pkt.payload = buffer.subarray(20 + dataOffset*4 - 20);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(20 + this.options.length + this.payload.length);

        buffer.writeUInt16BE(this.src_port, 0);
        buffer.writeUInt16BE(this.dst_port, 2);
        buffer.writeUInt32BE(this.seq, 4);
        buffer.writeUInt32BE(this.ackNum, 8);

        let dataOffset = 5 + this.options.length / 4;

        let b = (dataOffset & 0xF) << 12;

        if(this.flag_NS)
            b |= 0x100;
        if(this.flag_CWR)
            b |= 0x80;
        if(this.flag_ECE)
            b |= 0x40;
        if(this.flag_URG)
            b |= 0x20;
        if(this.flag_ACK)
            b |= 0x10;
        if(this.flag_PSH)
            b |= 0x8;
        if(this.flag_RST)
            b |= 0x4;
        if(this.flag_SYN)
            b |= 0x2;
        if(this.flag_FIN)
            b |= 0x1;

        buffer.writeUInt16BE(b, 12);
        buffer.writeUInt16BE(this.window, 14);
        buffer.writeUInt16BE(this.urgentPointer, 18);

        buffer.write(this.options.toString('hex'), 20, 'hex');
        buffer.write(this.payload.toString('hex'), 20+this.options.length, 'hex');

        let chk = IPTCPPacket.getTCPChecksum(buffer, this.src_addr, this.dst_addr);

        buffer.writeUInt16BE(chk, 16);

        return super.getBuffer(buffer);
    }
    static getTCPChecksum(buffer, src_addr, dst_addr) {
        let tcpChk = 0x00;

        tcpChk += IP4Packet.PROTOCOL_TCP; //Protocol tcp
        tcpChk += src_addr & 0xFFFF; //(this.src_addr>>16)&0xFFFF;
        tcpChk += (src_addr >> 16) & 0xFFFF; //(this.src_addr)&0xFFFF;
        tcpChk += dst_addr & 0xFFFF; //(this.dst_addr>>16)&0xFFFF;
        tcpChk += (dst_addr >> 16) & 0xFFFF; //(this.dst_addr)&0xFFFF;
        tcpChk += buffer.length;

        for(let i = 0; i<buffer.length; i+=2) {
            if(i === buffer.length-1 && buffer.length % 2 === 1) {
                tcpChk += buffer.readUInt8(i) << 8;
            } else {
                tcpChk += buffer.readUInt16BE(i);
            }

        }

        while (tcpChk>>16) {
            tcpChk = (tcpChk & 0xffff) + (tcpChk >> 16);
        }
        tcpChk = 0xffff - tcpChk;

        return tcpChk;
    }
}

module.exports = IPTCPPacket