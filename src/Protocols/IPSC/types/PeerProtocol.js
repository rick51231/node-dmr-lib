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

    }

 */

class PeerProtocol {
    static PROTOCOL_IPSC = 0x1;
    static PROTOCOL_CAPACITY_PLUS = 0x2;
    static PROTOCOL_APPLICATION = 0x3;
    static PROTOCOL_LINKED_CAPACITY_PLUS = 0x4;

    //TODO: min protocol - max protocol ?
    // Byte 0-1
    mainProtocolType = PeerProtocol.PROTOCOL_IPSC;
    mainProtocolVersion = 0x00;

    // Byte 2-3
    oldProtocolType = PeerProtocol.PROTOCOL_IPSC;
    oldProtocolVersion = 0x00;

    static from(buffer) {
        if(buffer.length!==4)
            return null;

        let d = Array.from(buffer);
        let protocol = new PeerProtocol();

        protocol.mainProtocolType = (d[0] & 0b11111100) >> 2;
        protocol.mainProtocolVersion = ((d[0] & 0b00000011) << 8) | d[1];

        protocol.oldProtocolType = (d[2] & 0b11111100) >> 2;
        protocol.oldProtocolVersion = ((d[2] & 0b00000011) << 8) | d[3];

        return protocol;
    }

    getBuffer() {
        let d = Array(4);

        d[0] = ((this.mainProtocolType << 2) & 0b11111100) | ((this.mainProtocolVersion >> 8) & 0b00000011);
        d[1] = this.mainProtocolVersion & 0xFF;

        d[2] = ((this.oldProtocolType << 2) & 0b11111100) | ((this.oldProtocolVersion >> 8) & 0b00000011);
        d[3] = this.oldProtocolVersion & 0xFF;

        return Buffer.from(d);
    }

}

module.exports = PeerProtocol;