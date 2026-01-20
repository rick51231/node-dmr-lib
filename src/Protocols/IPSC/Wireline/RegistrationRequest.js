const Wireline = require("../Wireline");
const WirelineRegistrationEntry = require("../types/WirelineRegistrationEntry");

class RegistrationRequest extends Wireline {

    static SLOT_1 = 0x01;
    static SLOT_2 = 0x02;
    static SLOT_BOTH = 0x03;

    slots;
    pduId;
    id;
    channelStatusSubscribe;
    unknownSubscribe;
    phoneCallSubscribe;
    entries = [];

    constructor() {
        super(Wireline.OPCODE_REGISTRATION_REQUEST);
    }

    static from(buffer) {
        if(buffer.length<9)
            return null;

        let pkt = new RegistrationRequest();
        pkt.slots = buffer.readUInt8(0);
        pkt.pduId = buffer.readUInt32BE(1);
        pkt.id = buffer.readUInt16BE(5);
        let b = buffer.readUInt8(7);
        pkt.channelStatusSubscribe = (b & 0x80) > 0;
        pkt.unknownSubscribe = (b & 0x40) > 0;
        pkt.phoneCallSubscribe = (b & 0x20) > 0;

        let numEntries = buffer.readUInt8(8);

        if(buffer.length<9 + (numEntries*12))
            return null;

        for(let i = 0; i < numEntries; i++)
            pkt.entries.push(WirelineRegistrationEntry.from(buffer.subarray(
                9+i*12,
                9+i*12+12
            )));

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(9); //TODO: rewrite

        buffer.writeUInt8(this.slots, 0);
        buffer.writeUInt32BE(this.pduId, 1);
        buffer.writeUInt16BE(this.id, 5);

        let b = 0;

        if(this.channelStatusSubscribe)
            b |= 0x80;
        if(this.unknownSubscribe)
            b |= 0x40;
        if(this.phoneCallSubscribe)
            b |= 0x20;

        buffer.writeUInt8(b, 7);

        buffer.writeUInt8(this.entries.length, 8);


        return super.getBuffer(Buffer.concat([
            buffer,
            Buffer.concat(this.entries.map(i => i.getBuffer()))
        ]));
    }
}

module.exports = RegistrationRequest;