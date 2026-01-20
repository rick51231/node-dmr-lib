const Wireline = require("../Wireline");
const WirelineDataAttributes = require("../types/WirelineDataAttributes");

class DataCallRequest extends Wireline {
    static CALL_TYPE_CONFIRMED_DATA_RESPONSE = 0x54;
    static CALL_TYPE_PRIVATE_DATA_CONFIRMED = 0x80;
    static CALL_TYPE_PRIVATE_DATA_UNCONFIRMED = 0x81;
    static CALL_TYPE_GROUP_DATA = 0x82;

    static DATA_PRIORITY_NORMAL = 0x00;
    static DATA_PRIORITY_PRIORITY = 0x01;
    static DATA_PRIORITY_IMMEDIATE = 0x02;

    static DATA_ACCESS_TYPE_REGULAR = 0x00
    static DATA_ACCESS_TYPE_CENTRIC_ACCESS = 0x01;



    slot = 0;
    callId = 0;
    callType = 0;
    sourceId = 0;
    targetId = 0;
    attrImportance = 0;
    attrCentric = 0;
    ipSiteFlags = 0;
    preambleDuration = 0;
    attrDataParameters = 0;
    dataAttributes = new WirelineDataAttributes();
    payload;

    constructor() {
        super(Wireline.OPCODE_DATA_CALL_REQUEST);
    }

    static from(buffer) {
        if(buffer.length<29)
            return null;

        let pkt = new DataCallRequest();
        pkt.slot = buffer.readUInt8(0);
        pkt.callId = buffer.readUInt32BE(1);
        pkt.callType = buffer.readUInt8(5);
        pkt.sourceId = buffer.readUInt32BE(6);
        pkt.targetId = buffer.readUInt32BE(10);
        pkt.attrImportance = buffer.readUInt8(14);
        pkt.attrCentric = buffer.readUInt8(15);
        pkt.ipSiteFlags = buffer.readUInt8(16);
        pkt.preambleDuration = buffer.readUInt8(17);
        pkt.attrDataParameters = buffer.readUInt8(18);
        pkt.dataAttributes = WirelineDataAttributes.from(buffer.subarray(19, 27));

        let dataSize = buffer.readUInt16BE(27);

        if(buffer.length < 29+dataSize)
            return null;

        pkt.payload = buffer.subarray(29, 29+dataSize);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(19);

        buffer.writeUInt8(this.slot, 0);
        buffer.writeUInt32BE(this.callId, 1);
        buffer.writeUInt8(this.callType, 5);
        buffer.writeUInt32BE(this.sourceId, 6);
        buffer.writeUInt32BE(this.targetId, 10);
        buffer.writeUInt8(this.attrImportance, 14);
        buffer.writeUInt8(this.attrCentric, 15);
        buffer.writeUInt8(this.ipSiteFlags, 16);
        buffer.writeUInt8(this.preambleDuration, 17);
        buffer.writeUInt8(this.attrDataParameters, 18);


        let buffer2 = Buffer.alloc(2);
        buffer2.writeUInt16BE(this.payload.length, 0);

        return super.getBuffer(Buffer.concat([buffer, this.dataAttributes.getBuffer(), buffer2, this.payload]));
    }
}

module.exports = DataCallRequest;