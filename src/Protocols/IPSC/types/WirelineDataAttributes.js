class WirelineDataAttributes {
    static PRIVACY_TYPE_NONE = 0x00;
    static PRIVACY_TYPE_BASIC = 0x01;
    static PRIVACY_TYPE_ENHANCED = 0x02;

    static PRIVACY_ALGORITHM_ARC4 = 0x01;

    seqNumber = 0;
    fragmentSeqNumber = 0;
    privacyType = WirelineDataAttributes.PRIVACY_TYPE_NONE;
    hasAdvantageCompressedHeader = false;
    hasDMRCompressedHeader = false;
    algId = 0;
    keyId = 0;
    iv = 0;



    static from(buffer) {
        if(buffer.length!==8)
            return null;

        let pkt = new WirelineDataAttributes();

        let b0 = buffer.readUInt8(0);
        pkt.seqNumber = (b0 >> 4) & 0x7;
        pkt.fragmentSeqNumber = b0 & 0xF;

        let b1 = buffer.readUInt8(1);
        pkt.privacyType = (b1 >> 1) & 0x7;
        pkt.hasAdvantageCompressedHeader = (b1 & 0x1) > 0;
        pkt.hasDMRCompressedHeader = (b1 & 0x10) > 0;

        pkt.algId = buffer.readUInt8(2);
        pkt.keyId = buffer.readUInt8(3);
        pkt.iv = buffer.readUInt32BE(4);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8);

        buffer.writeUInt8(((this.seqNumber & 0x7) << 4) | (this.fragmentSeqNumber & 0xF), 0);

        let b1 = (this.privacyType & 0x7) << 1;
        if(this.hasAdvantageCompressedHeader)
            b1 |= 0x01;
        if(this.hasDMRCompressedHeader)
            b1 |= 0x10;

        buffer.writeUInt8(b1, 1);
        buffer.writeUInt8(this.algId, 2);
        buffer.writeUInt8(this.keyId, 3);
        buffer.writeUInt32BE(this.iv, 4);

        return buffer;
    }

}

module.exports = WirelineDataAttributes;