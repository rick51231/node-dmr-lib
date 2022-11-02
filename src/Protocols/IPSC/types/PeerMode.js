/*
69 2402 804d 04020400
Status info: mode + flags
800000e00804020400

byte 0 - mode
2bit 10 = knockdown 01=enabled 00=disabled / 2 bit 10=digital 01= analog 11=mix / 2 bits TS 1 (10 = IPSC, 01 = local, 00 = disabled)   / 2 bits TS 2 (10 = IPSC, 01 = local, 00 = disabled)

byte 3 - flags1
csbk / rpt mon / 3rd Party "Console" Application /

byte 4 - flags2
xnl con / xnl master / xnl slave / pkt auth ? / data call / voice call / ?? / master

 */



class PeerMode {
    static STATUS_LOCKED = 0x3;
    static STATUS_KNOCKDOWN = 0x2;
    static STATUS_ENABLED = 0x1;
    static STATUS_DISABLED = 0x0;

    static SIGNALING_MIXED = 0x3;
    static SIGNALING_DIGITAL = 0x2;
    static SIGNALING_ANALOG = 0x1;
    static SIGNALING_NONE = 0x0;

    static SLOT_RESERVED = 0x3; //Reserved value
    static SLOT_IPSC = 0x2;
    static SLOT_LOCAL = 0x1;
    static SLOT_DISABLED = 0x0;


    //Byte 0
    status = PeerMode.STATUS_DISABLED;
    signaling = PeerMode.SIGNALING_DIGITAL;
    slot1 = PeerMode.SLOT_DISABLED;
    slot2 = PeerMode.SLOT_DISABLED;



    static from(buffer) {
        if(buffer.length!==1)
            return null;

        let byte = buffer.readUInt8(0);
        let status = new PeerMode();

        status.status =    (byte>>6) & 0b11;
        status.signaling = (byte>>4) & 0b11;
        status.slot1 =     (byte>>2) & 0b11;
        status.slot2 =     (byte>>0) & 0b11;

        return status;
    }

    getBuffer() {
        let byte = 0;

        byte |= (this.status    & 0b11) << 6;
        byte |= (this.signaling & 0b11) << 4;
        byte |= (this.slot1     & 0b11) << 2;
        byte |= (this.slot2     & 0b11);

        return Buffer.from([byte]);
    }

}

module.exports = PeerMode;