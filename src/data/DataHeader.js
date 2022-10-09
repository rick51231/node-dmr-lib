const DMRRaw = require('./Raw');
const DMRConst = require('../DMRConst');
const DMRUtil = require('../DMRUtil');

class DataHeader extends DMRRaw {
    dstIsGroup = 0;
    responseRequested = 0;
    headerCompression = 0;
    serviceAccessPoint = 0;
    dpf = DMRConst.DPF_UNCONFIRMED_DATA;
    src_id = 0;
    dst_id = 0;

    //DPF_UNCONFIRMED_DATA + DPF_CONFIRMED_DATA + DPF_RESPONSE
    blocksToFollow = 0;

    //DPF_UNCONFIRMED_DATA + DPF_CONFIRMED_DATA
    padOctetCount = 0;
    fragmentSequenceNumber = 0;

    //DPF_CONFIRMED_DATA
    sendSequenceNumber = 0;

    //DPF_CONFIRMED_DATA + DPF_DEFINED_SHORT
    resync = 0;

    //DPF_DEFINED_SHORT
    appendedBlocks = 0;
    ddFormat = 0;
    bitPadding = 0;

    //DPF_RESPONSE
    classType = 0;
    status = 0;

    //DPF_UNCONFIRMED_DATA + DPF_DEFINED_SHORT + DPF_CONFIRMED_DATA
    fullMessage = 0;

    constructor(rawData) {
        super(rawData);

        let b0 = rawData.readUInt8(0);
        let b1 = rawData.readUInt8(1);

        let b8 = rawData.readUInt8(8);
        let b9 = rawData.readUInt8(9);

        this.dstIsGroup = (b0 & 0x80) === 0x80; //dmrdata.GI
        this.responseRequested = (b0 & 0x40) === 0x40; //dmrdata.A
        this.headerCompression = (b0 & 0x20) === 0x20; //
        this.serviceAccessPoint = (b1 & 0xF0) >> 4;

        this.dpf = b0 & 0x0F; //thisFormat

        this.dst_id = (rawData.readUInt8(2)<<16) + rawData.readUInt16BE(3);
        this.src_id = (rawData.readUInt8(5)<<16) + rawData.readUInt16BE(6);

        if(this.dpf===DMRConst.DPF_UNCONFIRMED_DATA) {
            this.padOctetCount = (b0 & 0x10) | (b1 & 0xF);
            this.fullMessage = (b8 & 0x80) === 0x80; //dmrdata.F
            this.blocksToFollow = b8 & 0x7F; //dmrdata.blocks
            this.fragmentSequenceNumber = b9 & 0xF;
        } else if(this.dpf===DMRConst.DPF_DEFINED_SHORT) {
            this.appendedBlocks = (b0 & 0x30) | (b1 & 0xF);
            this.ddFormat = (b8 & 0xFC) >> 2;
            this.resync = (b8 & 0x2) > 0;
            this.fullMessage = (b8 & 0x1) > 0;
            this.bitPadding = b9;
        } else if(this.dpf===DMRConst.DPF_CONFIRMED_DATA) {
            this.padOctetCount = (b0 & 0x10) | (b1 & 0xF);
            this.fullMessage = (b8 & 0x80) === 0x80;
            this.blocksToFollow = b8 & 0x7F;
            this.resync = (b9 & 0x80) > 0;
            this.sendSequenceNumber = (b9 & 0x70) >> 4;
            this.fragmentSequenceNumber = b9 & 0xF;
        } else if(this.dpf===DMRConst.DPF_RESPONSE) {
            this.blocksToFollow = b8 & 0x7F;
            this.classType = (b9 & 0xF8) >> 3;
            this.status = b9 & 0x7;
        } else {
            throw new Error("Invalid this dpf "+this.dpf+" for data "+rawData.toString('hex'));
        }

    }

    getBuffer() {
        let buffer = Buffer.alloc(12);

        let b0 = this.dpf & 0xF;

        if(this.dstIsGroup)
            b0 |= 0x80;
        if(this.responseRequested)
            b0 |= 0x40;
        if(this.headerCompression)
            b0 |= 0x20;

        let b1 = (this.serviceAccessPoint << 4) & 0xF0;

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 2); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 3);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        if(this.dpf===DMRConst.DPF_UNCONFIRMED_DATA) {
            let b8 = 0;

            b0 |= this.padOctetCount & 0x10;
            b1 |= this.padOctetCount & 0xF;

            b8 |= this.blocksToFollow & 0x7F;

            if (this.fullMessage)
                b8 |= 0x80;

            buffer.writeUInt8(b8, 8);
            buffer.writeUInt8(this.fragmentSequenceNumber & 0xF, 9);
        } else if(this.dpf===DMRConst.DPF_DEFINED_SHORT) {
            let b8 = 0;

            b0 |= this.appendedBlocks & 0x30;
            b1 |= this.appendedBlocks & 0xF;

            b8 |= (this.ddFormat & 0xFC) << 2;

            if (this.resync)
                b8 |= 0x2;

            if (this.fullMessage)
                b8 |= 0x1;

            buffer.writeUInt8(b8, 8);
            buffer.writeUInt8(this.bitPadding, 9);
        } else if(this.dpf===DMRConst.DPF_CONFIRMED_DATA) {
            let b8 = 0;
            let b9 = 0;

            b0 |= this.padOctetCount & 0x10;
            b1 |= this.padOctetCount & 0xF;

            b8 |= this.blocksToFollow & 0x7F;

            if (this.fullMessage)
                b8 |= 0x80;

            b9 = (this.fragmentSequenceNumber & 0xF) | ((this.sendSequenceNumber & 0xF) << 4);

            if (this.resync)
                b9 |= 0x80;


            buffer.writeUInt8(b8, 8);
            buffer.writeUInt8(b9, 9);
        } else if(this.dpf===DMRConst.DPF_RESPONSE) {
            let b8 = 0;
            let b9 = 0;

            b8 |= this.blocksToFollow & 0x7F;
            b9 |= this.status | (this.classType<<3);

            buffer.writeUInt8(b8, 8);
            buffer.writeUInt8(b9, 9);
        } else {
            throw new Error("Invalid packet dpf "+this.dpf+" for packet "+this);
        }

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(b1, 1);

        // https://github.com/g4klx/MMDVMHost/blob/master/CRC.cpp + https://www.etsi.org/deliver/etsi_ts/102300_102399/10236101/02.02.01_60/ts_10236101v020201p.pdf (page 143)
        let crcHeader = DMRUtil.crc.compute(buffer.slice(0, 10)) ^ 0xCCCC;
        buffer.writeUInt16BE(crcHeader, 10);

        return buffer;
    }
}

module.exports = DataHeader;