class LinkControl {
    static FLCO_GROUP_VOICE_CHANNEL = 0x0;
    static FLCO_UNIT_TO_UNIT_VOICE_CHANNEL = 0x3;
    static FLCO_TALKER_ALIAS_HEADER = 0x4;
    static FLCO_TALKER_ALIAS_BLOCK1 = 0x5;
    static FLCO_TALKER_ALIAS_BLOCK2 = 0x6;
    static FLCO_TALKER_ALIAS_BLOCK3 = 0x7;
    static FLCO_GPS_INFO = 0x8;
    static FLCO_TERMINATOR_DATA_LINK_CONTROL = 0x30;

    flco;
    protectFlag = false;
    fid = 0; //TODO
    serviceOptions = 0; // 0b11000000 priority 0b00100000 OVCM 0b00010000 broadcast 0b00001100 TransmitInterrupt (TransmitInterruptControl) 0b00000010 Privacy 0b000000001 Emergency
    src_id = 0;
    dst_id = 0;

    constructor(flco) {
        this.flco = flco;
    }

    static from(buffer) {
        if(buffer.length!==9)
            return null;

        let b0 = buffer.readUInt8(0);
        let flco = b0 & 0b00111111;

        let pkt = new LinkControl(flco);

        pkt.protectFlag = (b0 & 0b10000000) > 0;
        pkt.fid = buffer.readUInt8(1);
        pkt.serviceOptions = buffer.readUInt8(2);


        pkt.dst_id = (buffer.readUInt8(3) << 16) + buffer.readUInt16BE(4);
        pkt.src_id = (buffer.readUInt8(6) << 16) + buffer.readUInt16BE(7);

        return pkt;
    }

    getBuffer() {
        let b = Buffer.alloc(9);

        let b0 = this.flco & 0b00111111;

        if(this.protectFlag)
            b0 |= 0b10000000;

        b.writeUInt8(b0, 0);
        b.writeUInt8(this.fid, 1);
        b.writeUInt8(this.serviceOptions, 2);

        b.writeUInt8((this.dst_id>>16) & 0xFF, 3); //dst HI
        b.writeUInt16BE(this.dst_id & 0xFFFF, 4);

        b.writeUInt8((this.src_id>>16) & 0xFF, 6); //src HI
        b.writeUInt16BE(this.src_id & 0xFFFF, 7);

        return b;
    }
}

module.exports = LinkControl;