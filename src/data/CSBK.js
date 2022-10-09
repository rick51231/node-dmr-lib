const DMRRaw = require('./Raw');
const DMRUtil = require('../DMRUtil');
const DMRConst = require('../DMRConst');

class CSBK extends DMRRaw {
    isLast = false;
    CSBKtype = 0;
    dst_id = 0;
    src_id = 0;

    dataFollows = false;
    dstIsGroup = false;
    blocks = 0;


    constructor(rawData) {
        super(rawData);

        let b0 = rawData.readUInt8(0);
        let b2 = rawData.readUInt8(2);

        this.isLast = (b0 & 0x80) === 0x80;
        this.CSBKtype= b0 & 0x3F;

        this.dst_id = (rawData.readUInt8(4)<<16) + rawData.readUInt16BE(5);
        this.src_id = (rawData.readUInt8(7)<<16) + rawData.readUInt16BE(8);

        //CSBK preamble
        if(this.CSBKtype===DMRConst.CSBKO_PRECCSBK) {
            this.dataFollows = (b2 & 0x80) > 0;
            this.dstIsGroup = (b2 & 0x40) > 0;
            this.blocks = rawData.readUInt8(3);
        }

    }

    getBuffer() {
        let buffer = Buffer.alloc(12);

        let b0 = this.type;
        let b1 = 0;
        let b2 = 0;

        if(this.isLast)
            b0 |= 0x80;

        //CSBK preamble
        if(this.type===DMRConst.CSBKO_PRECCSBK) {
            if (this.dataFollows)
                b2 |= 0x80;
            if (this.dstIsGroup)
                b2 |= 0x40;
        } else if(this.type===DMRConst.CSBKO_CALL_ALERT_ACK) {
            b1 = 0x10;
            b2 = 0xA7;
        }

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(b1, 1);
        buffer.writeUInt8(b2, 2);
        buffer.writeUInt8(this.blocks, 3); //CSBK preamble

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 4); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 5);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 7); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 8);

        let crc = DMRUtil.crc.compute(buffer.slice(0, 10)) ^ 0xa5a5;

        buffer.writeUInt16BE(crc, 10);

        return buffer;
    }
}

module.exports = CSBK;