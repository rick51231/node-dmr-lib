const Packet = require("./Packet");
const CRC16 = require("../Encoders/CRC16");

class CSBK extends Packet {
    static CRC_MASK = 0xA5A5;

    static OPCODE_NONE           = 0x00;
    static OPCODE_UUVREQ         = 0x04;
    static OPCODE_UUANSRSP       = 0x05;
    static OPCODE_CTCSBK         = 0x07;
    static OPCODE_CALL_ALERT     = 0x1F;
    static OPCODE_CALL_ALERT_ACK = 0x20;
    static OPCODE_NACKRSP        = 0x26;
    static OPCODE_CALL_EMERGENCY = 0x27;
    static OPCODE_BSDWNACT       = 0x38;
    static OPCODE_PRECCSBK       = 0x3D;
    
    opcode;
    isLast = false;
    PF = false; //TODO: what is this?
    mfId = 0;

    constructor(opcode) {
        super(Packet.DATA_TYPE_CSBK);
        
        this.opcode = opcode;
    }

    //TODO: byte 1 ?
    static from(buffer) {
        if(buffer.length!==12)
            return null;

        let packetCRC = buffer.readUInt16BE(10);
        let bufferCRC = CRC16.compute(buffer.slice(0, 10)) ^ CSBK.CRC_MASK;

        if(packetCRC!==bufferCRC)
            return null;

        let b0 = buffer.readUInt8(0);
        let opcode = b0 & 0x3F;
        let isLast = (b0 & 0b10000000) > 0;
        let PF =     (b0 & 0b01000000) > 0;

        let packetClass;

        switch(opcode) {
            case CSBK.OPCODE_PRECCSBK:
                packetClass = require('./CSBK/PreCSBK');
                break;
            case CSBK.OPCODE_CALL_ALERT_ACK:
                packetClass = require('./CSBK/CallAlertACK');
                break;
            case CSBK.OPCODE_CALL_EMERGENCY:
                packetClass = require('./CSBK/CallEmergency');
                break;

            default:
                packetClass = require('./CSBK/Raw');
        }

        let packet = packetClass.from(buffer.slice(2, 10), opcode);

        if(packet===null)
            return;

        packet.isLast = isLast;
        packet.PF = PF;
        packet.mfId = buffer.readUInt8(1);

        return packet;
    }

    getBuffer(appendBuffer) {
        let buffer = Buffer.alloc(12);

        let b0 = this.opcode & 0x3F;

        if(this.isLast)
            b0 |= 0b10000000;
        if(this.PF)
            b0 |= 0b01000000;

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8(this.mfId, 1);

        buffer.write(appendBuffer.toString('hex'), 2, 'hex');

        let crc = CRC16.compute(buffer.subarray(0, 10)) ^ CSBK.CRC_MASK;

        buffer.writeUInt16BE(crc, 10);
        return buffer;
    }
}

module.exports = CSBK;