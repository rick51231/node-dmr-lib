const IP4Packet = require("./IP4Packet");
const MotorolaNetwork = require("../Motorola/Network");
const ProprietaryCompressed = require("../DMR/DataHeader/ProprietaryCompressed");

class IPUDPPacket extends IP4Packet {
    src_port = 0;
    dst_port = 0;
    payload = Buffer.alloc(0);


    constructor() {
        super(IP4Packet.PROTOCOL_UDP);
    }

    static from(buffer, src_addr, dst_addr) {
        if(buffer.length<8)
            return null;

        if(IPUDPPacket.getUDPChecksum(buffer, src_addr, dst_addr)!==0)
            return null;

        let pkt = new IPUDPPacket();

        pkt.src_port = buffer.readUInt16BE(0);
        pkt.dst_port = buffer.readUInt16BE(2);

        let udpLen = buffer.readUInt16BE(4);

        if(buffer.length<udpLen)
            return null;

        pkt.payload = buffer.subarray(8, 8+udpLen);

        return pkt;
    }

    static fromCompressedUDPAdvantageWL(buffer, src_id, dst_id) {
        let AID = buffer.readUInt8(0);
        let PID = buffer.readUInt8(1);


        let proprietaryHeader = {
            SAID: (AID >> 4) & 0x0F,
            DAID: AID & 0x0F,
            SPID: (PID >> 4) & 0x0F,
            DPID: PID & 0x0F,
            ipIdent: buffer.readUInt16BE(2)
        };

        return this.fromCompressedUDPAdvantage(buffer.subarray(4), src_id, dst_id, proprietaryHeader);
    }

    static fromCompressedUDPAdvantage(buffer, src_id, dst_id, proprietaryHeader) {
        let packet = new IPUDPPacket();

        packet.identification = proprietaryHeader.ipIdent;

        let sourcePrefix = MotorolaNetwork.AddressID2Network(proprietaryHeader.SAID);

        if(sourcePrefix===null)
            return null;

        let destPrefix = MotorolaNetwork.AddressID2Network(proprietaryHeader.DAID);

        if(destPrefix===null)
            return null;

        packet.src_addr = (sourcePrefix << 24) | src_id;
        packet.dst_addr = (destPrefix << 24) | dst_id;


        let dataOffset = 0;

        if(proprietaryHeader.SPID===0) {
            packet.src_port = buffer.readUInt16BE(0);
            dataOffset += 2;
        } else {
            packet.src_port = MotorolaNetwork.PortID2Port(proprietaryHeader.SPID, false);
        }

        if(proprietaryHeader.DPID===0) {
            packet.dst_port = buffer.readUInt16BE(proprietaryHeader.SPID === 0 ? 0 : 2);
            dataOffset += 2;
        } else {
            packet.dst_port = MotorolaNetwork.PortID2Port(proprietaryHeader.DPID, false);
        }

        packet.payload = buffer.subarray(dataOffset);

        return packet;
    }

    static fromCompressedUDPDMRStandart(buffer, src_id, dst_id) {
        let packet = new IPUDPPacket();

        packet.identification = buffer.readUInt16BE(0);

        let b2 = buffer.readUInt8(2);
        let SAID = b2 >> 4;
        let DAID = b2 & 0xF;



        let sourcePrefix = MotorolaNetwork.AddressID2Network(SAID);

        if(sourcePrefix===null)
            return null;

        let destPrefix = MotorolaNetwork.AddressID2Network(DAID);

        if(destPrefix===null)
            return null;

        packet.src_addr = (sourcePrefix << 24) | src_id;
        packet.dst_addr = (destPrefix << 24) | dst_id;

        //Ignoring OP1 & OP2 ?
        let SPID = buffer.readUInt8(3);
        let DPID = buffer.readUInt8(4);

        if(SPID>>7 > 0 || DPID>>7 > 0) {
            throw new Error("Found OP "+SPID+"-"+DPID+" for buffer "+buffer.toString('hex'));
        }

        SPID &= 0x7F;
        DPID &= 0x7F;
        let dataOffset = 5;

        if(SPID===0) {
            packet.src_port = buffer.readUInt16BE(5);
            dataOffset += 2;
        } else {
            packet.src_port = MotorolaNetwork.PortID2Port(SPID, true);
        }

        if(DPID===0) {
            packet.dst_port = buffer.readUInt16BE(SPID === 0 ? 5 : 7);
            dataOffset += 2;
        } else {
            packet.dst_port = MotorolaNetwork.PortID2Port(DPID, true);
        }

        packet.payload = buffer.slice(dataOffset, buffer.length);

        return packet;
    }

    getCompressedUDPAdvantageWL() {
        let [payload, proprietaryHeader] = this.getCompressedUDPAdvantage();

        let buffer = Buffer.alloc(4);

        buffer.writeUInt8((proprietaryHeader.SAID<<4)|(proprietaryHeader.DAID), 0);
        buffer.writeUInt8((proprietaryHeader.SPID<<4)|(proprietaryHeader.DPID), 1);
        buffer.writeUInt16BE(proprietaryHeader.ipIdent, 2);

        return Buffer.concat([buffer, payload]);
    }

    getCompressedUDPAdvantage() {
        let buffers = [];
        let proprietaryHeader = new ProprietaryCompressed();

        proprietaryHeader.ipIdent = this.identification;

        let sourcePrefix = (this.src_addr >>> 24) & 0xFF;
        let destPrefix = (this.dst_addr >>> 24) & 0xFF;

        proprietaryHeader.SAID = MotorolaNetwork.Network2AddressID(sourcePrefix);
        proprietaryHeader.DAID = MotorolaNetwork.Network2AddressID(destPrefix);

        proprietaryHeader.SPID = MotorolaNetwork.Port2PortID(this.src_port);
        if(proprietaryHeader.SPID===null) {
            proprietaryHeader.SPID = 0;
            let b = Buffer.alloc(2);
            b.writeUInt16BE(this.src_port, 0);
            buffers.push(b);
        }

        proprietaryHeader.DPID = MotorolaNetwork.Port2PortID(this.dst_port);
        if(proprietaryHeader.DPID===null) {
            proprietaryHeader.DPID = 0;
            let b = Buffer.alloc(2);
            b.writeUInt16BE(this.dst_port, 0);
            buffers.push(b);
        }

        buffers.push(this.payload);

        return [
            Buffer.concat(buffers),
            proprietaryHeader
        ];
    }

    getCompressedUDPDMRStandart() {
        let buffers = [];

        let bIdent = Buffer.alloc(2);
        bIdent.writeUInt16BE(this.identification);
        buffers.push(bIdent);

        let sourcePrefix = (this.src_addr >>> 24) & 0xFF;
        let destPrefix = (this.dst_addr >>> 24) & 0xFF;

        let SAID = MotorolaNetwork.Network2AddressID(sourcePrefix);
        let DAID = MotorolaNetwork.Network2AddressID(destPrefix);


        buffers.push(Buffer.from([(SAID<<4) | DAID]));

        let SPID = MotorolaNetwork.Port2PortID(this.src_port, true);
        let DPID = MotorolaNetwork.Port2PortID(this.dst_port, true);

        if(SPID===null)
            SPID = 0;
        if(DPID===null)
            DPID = 0;

        let b = Buffer.alloc(2);
        b.writeUInt8(SPID, 0);
        b.writeUInt8(DPID, 1);
        buffers.push(b);

        if(SPID===0){
            let b = Buffer.alloc(2);
            b.writeUInt16BE(this.src_port, 0);
            buffers.push(b);
        }

        if(DPID===0){
            let b = Buffer.alloc(2);
            b.writeUInt16BE(this.dst_port, 0);
            buffers.push(b);
        }

        buffers.push(this.payload);

        return Buffer.concat(buffers);
    }

    getBuffer() {
        let buffer = Buffer.alloc(8+this.payload.length);

        buffer.writeUInt16BE(this.src_port, 0); //Src port
        buffer.writeUInt16BE(this.dst_port, 2); //DST port
        buffer.writeUInt16BE(this.payload.length+8, 4); //udp size
        buffer.writeUInt16BE(0x00, 6); //udp checksum  (will be added later)

        //Data
        buffer.write(this.payload.toString('hex'), 8, 'hex');

        let udpChk = IPUDPPacket.getUDPChecksum(buffer, this.src_addr, this.dst_addr);

        buffer.writeUInt16BE(udpChk, 6); //udp checksum

        return super.getBuffer(buffer);
    }

    static getUDPChecksum(buffer, src_addr, dst_addr) {
        let udpSize = buffer.readUInt16BE(4);

        if(udpSize > buffer.length)
            udpSize = buffer.length;

        let udpChk = 0x00;

        udpChk += src_addr & 0xFFFF; //(this.src_addr>>16)&0xFFFF;
        udpChk += (src_addr >> 16) & 0xFFFF; //(this.src_addr)&0xFFFF;
        udpChk += dst_addr & 0xFFFF; //(this.dst_addr>>16)&0xFFFF;
        udpChk += (dst_addr >> 16) & 0xFFFF; //(this.dst_addr)&0xFFFF;
        udpChk += IP4Packet.PROTOCOL_UDP; //Protocol udp
        udpChk += udpSize;

        for(let i = 0; i<udpSize; i+=2) {
            if(i === udpSize-1 && udpSize % 2 === 1) {
                udpChk += buffer.readUInt8(i) << 8;
            } else {
                udpChk += buffer.readUInt16BE(i);
            }

        }

        while (udpChk>>16) {
            udpChk = (udpChk & 0xffff) + (udpChk >> 16);
        }
        udpChk = 0xffff - udpChk;

        return udpChk;
    }
}

module.exports = IPUDPPacket;