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
            return null; //
        }

        return packet;
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