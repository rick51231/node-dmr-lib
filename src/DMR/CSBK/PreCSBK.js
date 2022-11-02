const CSBK = require("../CSBK");

class PreCSBK extends CSBK {
    dataNext = false;
    dstIsGroup = false;
    blocksToFollow = 0;
    src_id = 0;
    dst_id = 0;

    constructor() {
        super(CSBK.OPCODE_PRECCSBK);
    }

    static from(buffer) {
        if(buffer.length!==8)
            return null;

        let preamble = new PreCSBK();

        let b0 = buffer.readUInt8(0); //TODO: rest csbk bits?

        preamble.dataNext =   (b0 & 0b10000000) > 0;
        preamble.dstIsGroup = (b0 & 0b01000000) > 0;

        preamble.blocksToFollow = buffer.readUInt8(1);

        preamble.dst_id = (buffer.readUInt8(2)<<16) + buffer.readUInt16BE(3);
        preamble.src_id = (buffer.readUInt8(5)<<16) + buffer.readUInt16BE(6);

        return preamble;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8);

        let b0 = 0;

        if(this.dataNext)
            b0 |= 0b10000000;
        if(this.dstIsGroup)
            b0 |= 0b01000000;

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(this.blocksToFollow, 1);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 2); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 3);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        return super.getBuffer(buffer);
    }
}

module.exports = PreCSBK;