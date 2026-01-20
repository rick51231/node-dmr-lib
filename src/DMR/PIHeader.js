const Packet = require("./Packet");
const CRC16 = require("../Encoders/CRC16");

class PIHeader extends Packet {
    static CRC_MASK = 0x6969; // Inverted 0x9696 for the compatibility

    static MANUFACTURER_STANDART = 0x00;
    static MANUFACTURER_MOTOROLA = 0x10;
    static MANUFACTURER_XRC9000 = 0x06;

    dstIsGroup = false;
    algId = 0;
    mfId = PIHeader.MANUFACTURER_STANDART;
    keyId = 0;
    iv = 0;
    dst_id = 0;

    constructor() {
        super(Packet.DATA_TYPE_PI_HEADER);
    }

    static from(buffer, dataType) {
        if(buffer.length!==12)
            return null;

        let packetCRC = buffer.readUInt16BE(10);
        let bufferCRC = CRC16.compute(buffer.slice(0, 10)) ^ PIHeader.CRC_MASK;

        if(packetCRC!==bufferCRC)
            return null;

        let d = Array.from(buffer);

        let pkt = new PIHeader();

        pkt.dstIsGroup = (d[0] & 0x20) > 0;
        pkt.algId = d[0] & 0x07;
        pkt.mfId = d[1];
        pkt.keyId = d[2];
        pkt.iv = buffer.readUInt32BE(3);
        pkt.dst_id = (d[7]<<16) + buffer.readUInt16BE(8);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(12);

        let b0 = this.algId & 0x07;
        if(this.dstIsGroup)
            b0 |= 0x20;

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(this.mfId, 1);
        buffer.writeUInt8(this.keyId, 2);
        buffer.writeUInt32BE(this.iv, 3);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 7); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 8);


        let crc = CRC16.compute(buffer.subarray(0, 10)) ^ PIHeader.CRC_MASK;

        buffer.writeUInt16BE(crc, 10);

        return buffer;
    }
}

module.exports = PIHeader;
