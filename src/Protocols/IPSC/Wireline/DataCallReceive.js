const Wireline = require("../Wireline");
const WirelineDataAttributes = require("../types/WirelineDataAttributes");

class DataCallReceive extends Wireline {
    slot;
    callId;
    callType;
    sourceId;
    targetId;
    dataAttributes = new WirelineDataAttributes();
    payload;
    rawRssi;

    constructor() {
        super(Wireline.OPCODE_DATA_CALL_RECEIVE);
    }

    static from(buffer) {
        if(buffer.length<30)
            return null;

        let pkt = new DataCallReceive();
        pkt.slot = buffer.readUInt8(0);
        pkt.callId = buffer.readUInt32BE(1);
        pkt.callType = buffer.readUInt8(5);
        pkt.sourceId = buffer.readUInt32BE(6);
        pkt.targetId = buffer.readUInt32BE(10);
        pkt.dataAttributes = WirelineDataAttributes.from(buffer.subarray(14, 22));

        let dataSize = buffer.readUInt16BE(22);

        if(buffer.length < 30+dataSize)
            return null;

        pkt.payload = buffer.subarray(24, 24+dataSize);
        let crc = buffer.readUInt32BE(24+dataSize);
        //TODO: validate crc
        pkt.rawRssi = buffer.readUInt16BE(24+dataSize+4);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(14);

        buffer.writeUInt8(this.slot, 0);
        buffer.writeUInt32BE(this.callId, 1);
        buffer.writeUInt8(this.callType, 5);
        buffer.writeUInt32BE(this.sourceId, 6);
        buffer.writeUInt32BE(this.targetId, 10);


        let buffer2 = Buffer.alloc(2);
        buffer2.writeUInt16BE(this.payload.length, 0);

        let buffer3 = Buffer.alloc(6);
        buffer3.writeUInt32BE(0, 0); //TODO: write crc
        buffer3.writeUInt16BE(this.rawRssi, 4);

        return super.getBuffer(Buffer.concat([buffer, this.dataAttributes.getBuffer(), buffer2, this.payload, buffer3]));
    }
}

module.exports = DataCallReceive;