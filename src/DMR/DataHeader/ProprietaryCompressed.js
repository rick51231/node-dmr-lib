const DataHeader = require("../DataHeader");
const Proprietary = require("./Proprietary");

class ProprietaryCompressed extends Proprietary {
    DAID = 0;
    SAID = 0;
    reserved = 0;
    DPID = 0;
    SPID = 0;
    ipIdent = 0;
    // extHeader1; // UInt16BE bytes 4-5
    // extHeader2; // UInt16BE bytes 6-7
    userData = Buffer.alloc(3);
    payload = Buffer.alloc(4);

    constructor() {
        super(Proprietary.OPCODE_COMPRESSED);
    }

    static from(buffer) {
        if(buffer.length!==7)
            return null;

        let header = new ProprietaryCompressed();

        let b0 = buffer.readUInt8(0);

        header.DAID =     (b0 & 0b00000011);
        header.SAID =     (b0 & 0b00001100) >>> 2;
        header.reserved = (b0 & 0b11110000) >>> 4;

        let b1 = buffer.readUInt8(1);

        header.DPID = (b1 & 0b00001111);
        header.SPID = (b1 & 0b11110000) >>> 4;

        // header.extHeader1 = buffer.readUInt16BE(4);
        // header.extHeader2 = buffer.readUInt16BE(6);


        header.ipIdent = buffer.readUInt16BE(2);
        header.payload = buffer.subarray(0, 4);
        header.userData = buffer.subarray(4, 7);

        return header;
    }

    getBuffer() {
        let buffer = Buffer.alloc(4);

        let b0 = (this.DAID & 0b00000011) | ((this.SAID << 2) & 0b00001100) | ((this.reserved << 4) & 0b11110000);

        buffer.writeUInt8(b0, 0);
        buffer.writeUInt8((this.DPID & 0b00001111) |((this.SPID << 4) &0b11110000), 1);
        buffer.writeUInt16BE(this.ipIdent, 2);

        return super.getBuffer(Buffer.concat([buffer, this.userData]));
    }
}

module.exports = ProprietaryCompressed;