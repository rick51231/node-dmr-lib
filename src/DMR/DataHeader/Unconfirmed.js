const DataHeader = require("../DataHeader");

class Unconfirmed extends DataHeader {
    dstIsGroup = false;
    responseRequested = false;
    headerCompression = false;
    padOctetCount = 0;
    serviceAccessPoint = 0; //aka SAP
    src_id = 0;
    dst_id = 0;
    fullMessage = false;
    blocksToFollow = 0;
    fragmentSequenceNumber = 0;

    constructor() {
        super(DataHeader.DPF_UNCONFIRMED);
    }

    static from(buffer) {
        if(buffer.length!==10)
            return null;

        let header = new Unconfirmed();

        let b0 = buffer.readUInt8(0);
        let b1 = buffer.readUInt8(1);

        header.dstIsGroup =        (b0 & 0b10000000) > 0;
        header.responseRequested = (b0 & 0b01000000) > 0;
        header.headerCompression = (b0 & 0b00100000) > 0;

        header.padOctetCount = (b0 & 0b00010000) | (b1 & 0b00001111);
        header.serviceAccessPoint = (b1 & 0b11110000) >>> 4;

        header.dst_id = (buffer.readUInt8(2)<<16) + buffer.readUInt16BE(3);
        header.src_id = (buffer.readUInt8(5)<<16) + buffer.readUInt16BE(6);

        let b8 = buffer.readUInt8(8);

        header.fullMessage =    (b8 & 0b10000000) > 0;
        header.blocksToFollow = (b8 & 0b01111111);

        header.fragmentSequenceNumber = buffer.readUInt8(9) & 0b00001111;

        return header;
    }

    getBuffer() {
        let buffer = Buffer.alloc(10);

        let b0 = 0;
        let b1 = 0;

        if(this.dstIsGroup)
            b0 |= 0b10000000;
        if(this.responseRequested)
            b0 |= 0b01000000;
        if(this.headerCompression)
            b0 |= 0b00100000;

        b0 |= this.padOctetCount & 0b00010000;

        b1 |= this.padOctetCount & 0b00001111;
        b1 |= (this.serviceAccessPoint << 4) & 0b11110000;

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(b1, 1);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 2); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 3);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        let b8 = this.blocksToFollow & 0b01111111;

        if(this.fullMessage)
            b8 |= 0b10000000;

        buffer.writeUInt8(b8, 8);
        buffer.writeUInt8(this.fragmentSequenceNumber & 0b00001111, 9);

        return super.getBuffer(buffer);
    }
}

module.exports = Unconfirmed;