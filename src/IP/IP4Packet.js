const MotorolaNetwork = require('../Motorola/Network');

class IP4Packet {
    static PROTOCOL_UDP = 0x11;
    protocol = 0;
    identification = 0;

    src_addr = 0;
    dst_addr = 0;

    src_port = 0;
    dst_port = 0;

    payload = Buffer.alloc(0);

    static from(buffer) {
        let packet = new IP4Packet();

        if(IP4Packet.getIPChecksum(buffer)!==0) //Invalid IP checksum
            return null;

        packet.protocol = buffer.readUInt8(9);
        packet.identification = buffer.readUInt16BE(4);

        packet.src_addr = buffer.readUInt32BE(12);
        packet.dst_addr = buffer.readUInt32BE(16);

        if(packet.protocol === IP4Packet.PROTOCOL_UDP) {

            if(IP4Packet.getUDPChecksum(buffer)!==0)
                return null;

            packet.src_port = buffer.readUInt16BE(20);
            packet.dst_port = buffer.readUInt16BE(22);

            let udpLen = buffer.readUInt16BE(24);

            packet.payload = buffer.subarray(28, 28+udpLen-8); //8 = udp header size
        } else {
            return null;
        }

        return packet;
    }

    static fromCompressedUDPAdvantage(buffer, src_id, dst_id, proprietaryHeader) {
        let packet = new IP4Packet();

        packet.protocol = IP4Packet.PROTOCOL_UDP;
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
        let packet = new IP4Packet();

        packet.protocol = IP4Packet.PROTOCOL_UDP;
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

    getDMRSrc() {
        return this.src_addr & 0xFFFFFF;
    }

    getDMRDst() {
        return this.dst_addr & 0xFFFFFF;
    }

    getBuffer() {
        let ipHeaderSize = 20; //5 = 20 ???
        let udpSize = this.payload.length + 8; //udp size  (data size  + udp header size)
        let totalSize = udpSize + ipHeaderSize; //total packet size (udp size + ipv4 header size)

        let buffer = Buffer.alloc(totalSize);

        //IP header
        buffer.writeUInt8((0x4 << 4) | (ipHeaderSize/4), 0); //ip version (4) + header size;
        buffer.writeUInt8(0x00, 1); //.... ..01 = Explicit Congestion Notification: ECN-Capable transport codepoint '01' (1)
        buffer.writeUInt16BE(totalSize, 2); //Total size
        buffer.writeUInt16BE( this.identification, 4); //Identification  //TMS: old 0x00, used to prevent messages resending
        buffer.writeUInt16BE(0x00, 6); //Fragment offset + Flags
        buffer.writeUInt8(0x40, 8); //TTL
        buffer.writeUInt8(0x11, 9); //Protocol 0x11 (17) = UDP
        buffer.writeUInt16BE(0x00, 10); //Header checksum (will be added later)
        buffer.writeUInt32BE(this.src_addr>>>0, 12); //Src
        buffer.writeUInt32BE(this.dst_addr>>>0, 16); //Dst


        let headerChk = IP4Packet.getIPChecksum(buffer);
        buffer.writeUInt16BE(headerChk, 10); //Header checksum

        //UDP header
        buffer.writeUInt16BE(this.src_port, 20); //Src port
        buffer.writeUInt16BE(this.dst_port, 22); //DST port
        buffer.writeUInt16BE(udpSize, 24); //udp size
        buffer.writeUInt16BE(0x00, 26); //udp checksum  (will be added later)

        //Data
        buffer.write(this.payload.toString('hex'), 28, 'hex'); //TODO: более красиво записывать

        let udpChk = IP4Packet.getUDPChecksum(buffer);

        buffer.writeUInt16BE(udpChk, 26); //udp checksum

        return buffer;
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

    static getUDPChecksum(buffer) {
        let ipHeaderSize = 20; //5 = 20 ???

        let udpSize = buffer.readUInt16BE(24);

        if(udpSize+ipHeaderSize > buffer.length)
            udpSize = buffer.length - ipHeaderSize;

        let udpChk = 0x00;

        udpChk += buffer.readUInt32BE(12) & 0xFFFF; //(this.src_addr>>16)&0xFFFF;
        udpChk += (buffer.readUInt32BE(12) >> 16) & 0xFFFF; //(this.src_addr)&0xFFFF;
        udpChk += buffer.readUInt32BE(16) & 0xFFFF; //(this.dst_addr>>16)&0xFFFF;
        udpChk += (buffer.readUInt32BE(16) >> 16) & 0xFFFF; //(this.dst_addr)&0xFFFF;
        udpChk += 17; //Protocol udp
        udpChk += udpSize;

        for(let i = 0; i<udpSize; i+=2) {
            if(i === udpSize-1 && udpSize % 2 === 1) {
                udpChk += buffer.readUInt8(ipHeaderSize + i) << 8;
            } else {
                udpChk += buffer.readUInt16BE(ipHeaderSize + i);
            }

        }

        while (udpChk>>16) {
            udpChk = (udpChk & 0xffff) + (udpChk >> 16);
        }
        udpChk = 0xffff - udpChk;

        return udpChk;
    }
}

module.exports = IP4Packet;