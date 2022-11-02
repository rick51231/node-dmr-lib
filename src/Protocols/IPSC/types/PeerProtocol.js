/*
69 2402 804d 04020400
Status info: mode + flags
800000e00804020400

byte 0 - mode
2bit 10 = knockdown 01=enabled 00=disabled / 2 bit 10=analog 01= digital 11=mix / 2 bits TS 1 (10 = IPSC, 01 = local, 00 = disabled)   / 2 bits TS 2 (10 = IPSC, 01 = local, 00 = disabled)

byte 3 - flags1
csbk / rpt mon / 3rd Party "Console" Application /

byte 4 - flags2
xnl con / xnl master / xnl slave / pkt auth ? / data call / voice call / ?? / master

 */



class PeerProtocol {
    static PROTOCOL_IPSC = 0x4;

    // Byte 0-1
    mainProtocolType = PeerProtocol.PROTOCOL_IPSC;
    mainProtocolVersion = 0x00;

    // Byte 2-3
    oldProtocolType = PeerProtocol.PROTOCOL_IPSC;
    oldProtocolVersion = 0x00;

    static from(buffer) {
        if(buffer.length!==4)
            return null;

        let protocol = new PeerProtocol();

        protocol.mainProtocolType = buffer.readUInt8(0);
        protocol.mainProtocolVersion = buffer.readUInt8(1);

        protocol.oldProtocolType = buffer.readUInt8(2);
        protocol.oldProtocolVersion = buffer.readUInt8(3);

        return protocol;
    }

    getBuffer() {
        let buffer = Buffer.alloc(4);

        buffer.writeUInt8(this.mainProtocolType, 0);
        buffer.writeUInt8(this.mainProtocolVersion, 1);

        buffer.writeUInt8(this.oldProtocolType, 2);
        buffer.writeUInt8(this.oldProtocolVersion, 3);

        return buffer;
    }

}

module.exports = PeerProtocol;