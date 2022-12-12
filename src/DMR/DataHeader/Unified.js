const DataHeader = require("../DataHeader");

class Unified extends DataHeader {
    static DATA_FORMAT_BINARY = 0x00;
    static DATA_FORMAT_MSADDRESS = 0x01;
    static DATA_FORMAT_BCD = 0x02;
    static DATA_FORMAT_ISO_7 = 0x03;
    static DATA_FORMAT_ISO_8 = 0x04;
    static DATA_FORMAT_NMEA = 0x05;
    static DATA_FORMAT_IPADDRESS = 0x06;
    static DATA_FORMAT_UTF_16 = 0x07;
    static DATA_FORMAT_CUSTOM_1 = 0x08;
    static DATA_FORMAT_CUSTOM_2 = 0x09;

    static CONTENT_TYPE_UNIFIED_DATA_TRANSPORT = 0x00;
    static CONTENT_TYPE_TCP_HEADER_COMPRESSION = 0x02;
    static CONTENT_TYPE_UDP_HEADER_COMPRESSION = 0x03;
    static CONTENT_TYPE_IPPACKET = 0x04;
    static CONTENT_TYPE_ARP = 0x05;
    static CONTENT_TYPE_PROPRIETARY_DATA = 0x09;
    static CONTENT_TYPE_SHORT_DATA = 0x0A;
    static CONTENT_TYPE_STATUS = 0x0E;


    dstIsGroup = false;
    responseRequested = false;
    contentType = 0;
    dataFormat = 0;
    src_id = 0;
    dst_id = 0;
    padNibbles = 0;
    appendedBlocks = 0;
    supplementaryFlag = false;
    protectFlag = false;
    unifiedOpcode = 0;


    constructor() {
        super(DataHeader.DPF_UDT);
    }

    static from(buffer) {
        if (buffer.length !== 10)
            return null;

        let header = new Unified();

        let b = Array.from(buffer);

        header.dstIsGroup =        (b[0] & 0b10000000) > 0;
        header.responseRequested = (b[0] & 0b01000000) > 0;

        header.dataFormat = b[1] & 0b00001111;
        header.contentType = (b[1] & 0b11110000) >> 4;

        header.dst_id = (b[2]<<16) + buffer.readUInt16BE(3);
        header.src_id = (b[5]<<16) + buffer.readUInt16BE(6);

        header.padNibbles = (b[8] & 0b11111100) >> 3;
        header.appendedBlocks = b[8] && 0b00000011;
        header.supplementaryFlag = (b[9] & 0b10000000) > 0;
        header.protectFlag = (b[9] & 0b01000000) > 0;
        header.unifiedOpcode = b[9] & 0b00111111;

        return header;
    }

    getBuffer() {
        let b = Array(10);

        if(this.dstIsGroup)
            b[0] |= 0b10000000;
        if(this.responseRequested)
            b[0] |= 0b01000000;

        b[1] |= this.dataFormat & 0b00001111;
        b[1] |= (this.contentType << 4) & 0b11110000;

        b[8] |= (this.padNibbles << 3) & 0b11111100;
        b[8] |= this.appendedBlocks & 0b00000011;

        b[9] |= this.unifiedOpcode & 0b00111111;

        if(this.supplementaryFlag)
            b[9] |= 0b10000000;
        if(this.protectFlag)
            b[9] |= 0b01000000;

        let buffer = Buffer.from(b);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 2); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 3);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        return super.getBuffer(buffer);
    }
}

module.exports = Unified;
