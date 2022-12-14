const CSBK = require("../CSBK");

class CallEmergency extends CSBK {
    src_id = 0;
    dst_id = 0;
    EASN = 0;

    constructor() {
        super(CSBK.OPCODE_CALL_EMERGENCY);
    }

    static from(buffer) {
        if(buffer.length!==8)
            return null;

        let ack = new CallEmergency();

        ack.EASN = buffer.readUInt8(0) & 0b00001111; //TODO: rest bits
        //TODO: byte 1

        ack.dst_id = (buffer.readUInt8(2)<<16) + buffer.readUInt16BE(3);
        ack.src_id = (buffer.readUInt8(5)<<16) + buffer.readUInt16BE(6);

        return ack;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8);

        buffer.writeUInt8(this.EASN & 0b00001111, 0);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 2); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 3);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        return super.getBuffer(buffer);
    }
}

module.exports = CallEmergency;