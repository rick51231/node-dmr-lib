const MotorolaNetwork = require('../Motorola/Network');

class IP4Packet {
    static PROTOCOL_UDP = 0x11;
    static PROTOCOL_TCP = 0x06;
    static PROTOCOL_ICMP = 0x01;

    protocol;
    identification = 0;
    flags = 0;
    services = 0;
    ttl = 0x80;

    src_addr = 0;
    dst_addr = 0;

    constructor(protocol) {
        this.protocol = protocol;
    }

    static from(buffer) {
        if(IP4Packet.getIPChecksum(buffer)!==0) //Invalid IP checksum
            return null;

        let protocol = buffer.readUInt8(9);
        let src_addr = buffer.readUInt32BE(12);
        let dst_addr = buffer.readUInt32BE(16);

        let callClass;

        switch(protocol) {
            case IP4Packet.PROTOCOL_ICMP:
                callClass = require('./IPICMPPacket');
                break;
            case IP4Packet.PROTOCOL_TCP:
                callClass = require('./IPTCPPacket');
                break;
            case IP4Packet.PROTOCOL_UDP:
                callClass = require('./IPUDPPacket');
                break;
            default:
                return null;
        }

        let pkt = callClass.from(buffer.subarray(20), src_addr, dst_addr);

        if(pkt===null)
            return null;

        pkt.services = buffer.readUInt8(1);
        pkt.identification = buffer.readUInt16BE(4);
        pkt.flags = buffer.readUInt16BE(6);
        pkt.ttl = buffer.readUInt8(8);
        pkt.src_addr = src_addr;
        pkt.dst_addr = dst_addr;



        return pkt;
    }



    getDMRSrc() {
        return this.src_addr & 0xFFFFFF;
    }

    getDMRDst() {
        return this.dst_addr & 0xFFFFFF;
    }

    getBuffer(payload) {
        let ipHeaderSize = 20; //5 = 20 ???
        let totalSize = payload.length + ipHeaderSize; //total packet size (udp size + ipv4 header size)

        let buffer = Buffer.alloc(ipHeaderSize);

        //IP header
        buffer.writeUInt8((0x4 << 4) | (ipHeaderSize/4), 0); //ip version (4) + header size;
        buffer.writeUInt8(this.services, 1); // services
        buffer.writeUInt16BE(totalSize, 2); //Total size
        buffer.writeUInt16BE( this.identification, 4); //Identification  //TMS: old 0x00, used to prevent messages resending
        buffer.writeUInt16BE(this.flags, 6); //Fragment offset + Flags
        buffer.writeUInt8(this.ttl, 8); //TTL
        buffer.writeUInt8(this.protocol, 9); //Protocol 0x11 (17) = UDP
        buffer.writeUInt16BE(0x00, 10); //Header checksum (will be added later)
        buffer.writeUInt32BE(this.src_addr>>>0, 12); //Src
        buffer.writeUInt32BE(this.dst_addr>>>0, 16); //Dst

        let headerChk = IP4Packet.getIPChecksum(buffer);
        buffer.writeUInt16BE(headerChk, 10); //Header checksum

        return Buffer.concat([buffer, payload]);
    }

    static getIPChecksum(buffer) {
        let headerChk = 0x00;
        for(let i = 0; i<10; i++) {
            headerChk += buffer.readUInt16BE(i*2);
        }

        while (headerChk>>16) {
            headerChk = (headerChk & 0xffff) + (headerChk >> 16);
        }

        headerChk = 0xffff - headerChk;

        return headerChk;
    }
}

module.exports = IP4Packet;
