const Wireline = require("../Wireline");

class RegistrationReply extends Wireline {

    static STATUS_TYPE_SUCCESS = 0x00;
    static STATUS_TYPE_UNSUCCESS = 0x01;

    static STATUS_CODE_EMPTY = 0x00;
    static STATUS_CODE_CFS_NOT_ENABLED = 0x01;
    static STATUS_CODE_MAX_LIMIT_EXCEED = 0x02;
    static STATUS_CODE_INVALID_VERSION = 0x03;

    pduId;
    registrationIdSlot1;
    registrationIdSlot2;
    statusType;
    statusCode;

    constructor() {
        super(Wireline.OPCODE_REGISTRATION_REQUEST);
    }

    static from(buffer) {
        if(buffer.length!==10)
            return null;

        let pkt = new RegistrationReply();
        pkt.pduId = buffer.readUInt32BE(0);
        pkt.registrationIdSlot1 = buffer.readUInt16BE(4);
        pkt.registrationIdSlot2 = buffer.readUInt16BE(6);
        pkt.statusType = buffer.readUInt8(8);
        pkt.statusCode = buffer.readUInt8(9);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(10);

        buffer.writeUInt32BE(this.pduId, 0);
        buffer.writeUInt16BE(this.registrationIdSlot1, 4);
        buffer.writeUInt16BE(this.registrationIdSlot1, 6);
        buffer.writeUInt8(this.statusType, 8);
        buffer.writeUInt8(this.statusCode, 9);

        return super.getBuffer(buffer);
    }
}

module.exports = RegistrationReply;