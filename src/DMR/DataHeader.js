const Packet = require("./Packet");
const CRC16 = require("../encoders/CRC16");

class DataHeader extends Packet {
    static CRC_MASK = 0xCCCC;

    static DPF_UDT           = 0x00;
    static DPF_RESPONSE      = 0x01;
    static DPF_UNCONFIRMED   = 0x02;
    static DPF_CONFIRMED     = 0x03;
    static DPF_DEFINED_SHORT = 0x0D;
    static DPF_DEFINED_RAW   = 0x0E;
    static DPF_PROPRIETARY   = 0x0F;

    // aka ServiceAccessPoint
    static SAP_UDP_COMPRESSION_MOTO = 0x01; // DPF == DPF_PROPRIETARY
    static SAP_UDP_COMPRESSION      = 0x03;
    static SAP_IP_PACKET            = 0x04;
    static SAP_PROPRIETARY          = 0x09;

    DPF;

    constructor(DPF) {
        super(Packet.DATA_TYPE_DATA_HEADER);

        this.DPF = DPF;
    }

    static from(buffer) {
        if(buffer.length!==12)
            return null;

        let packetCRC = buffer.readUInt16BE(10);
        let bufferCRC = CRC16.compute(buffer.slice(0, 10)) ^ DataHeader.CRC_MASK;

        if(packetCRC!==bufferCRC)
            return null;

        let DPF = buffer.readUInt8(0) & 0b00001111;

        let packetClass;

        switch(DPF) {
            case DataHeader.DPF_RESPONSE:
                packetClass = require('./DataHeader/Response');
                break;
            case DataHeader.DPF_UNCONFIRMED:
                packetClass = require('./DataHeader/Unconfirmed');
                break;
            case DataHeader.DPF_CONFIRMED:
                packetClass = require('./DataHeader/Confirmed');
                break;
            case DataHeader.DPF_PROPRIETARY:
                packetClass = require('./DataHeader/Proprietary');
                break;

            default:
                return null;
        }

        return packetClass.from(buffer.slice(0, 10), DPF);
    }

    getBuffer(inBuffer) {
        let buffer = Buffer.alloc(12);

        buffer.write(inBuffer.toString('hex'), 0, 'hex');

        let b0 = buffer.readUInt8(0);
        b0 |= this.DPF & 0b00001111
        buffer.writeUInt8(b0, 0);

        let crc = CRC16.compute(buffer.subarray(0, 10)) ^ DataHeader.CRC_MASK;

        buffer.writeUInt16BE(crc, 10);
        return buffer;
    }
}

module.exports = DataHeader;