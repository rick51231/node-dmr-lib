const DataHeader = require("../DataHeader");

class Proprietary extends DataHeader {
    static OPCODE_COMPRESSED = 0x02;

    static MFID_MOTOROLA = 0x10;

    serviceAccessPoint = 0; //aka SAP
    mfId = 0;
    opcode;

    constructor(opcode) {
        super(DataHeader.DPF_PROPRIETARY);
        this.opcode = opcode;
    }

    static from(buffer) {
        if(buffer.length!==10)
            return null;

        let opcode = buffer.readUInt8(2) & 0b00001111;
        let mfId = buffer.readUInt8(1);

        if(mfId!==Proprietary.MFID_MOTOROLA)
            return null;

        if(opcode!==Proprietary.OPCODE_COMPRESSED)
            return null;

        let header = require('./ProprietaryCompressed').from(buffer.subarray(3));

        header.serviceAccessPoint = (buffer.readUInt8(0) & 0b11110000) >>>4;
        header.mfId = mfId;

        return header;
    }

    getBuffer(appendBuffer) {

        let buffer = Buffer.alloc(10);

        buffer.writeUInt8((this.serviceAccessPoint << 4) & 0b11110000, 0);
        buffer.writeUInt8(this.mfId, 1);
        buffer.writeUInt8(this.opcode & 0b00001111, 2);

        buffer.write(appendBuffer.toString('hex'), 3, 'hex');

        return super.getBuffer(buffer);
    }
}

module.exports = Proprietary;