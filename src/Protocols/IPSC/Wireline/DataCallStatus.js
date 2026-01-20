const Wireline = require("../Wireline");

class DataCallStatus extends Wireline {

    static STATUS_RECEIVED = 0x01;
    static STATUS_TRANSMITTING = 0x02;
    static STATUS_TRANSMIT_OK = 0x03;
    static STATUS_GRANT = 0x04;
    static STATUS_DECLINED = 0x05;
    static STATUS_INTERRUPTING = 0x06;
    static STATUS_MSI_INTERRUPT_REQUEST = 0x07;
    static STATUS_DMR_INTERRUPT_REQUEST = 0x08;

    slot;
    callId;
    channelControlStatus;
    reason;
    subOpcode;


    constructor() {
        super(Wireline.OPCODE_DATA_CALL_STATUS);
    }

    static from(buffer) {
        if(buffer.length<9)
            return null;

        let pkt = new DataCallStatus();
        pkt.slot = buffer.readUInt8(0);
        pkt.callId = buffer.readUInt32BE(1);
        pkt.channelControlStatus = buffer.readUInt8(5);
        pkt.reason = buffer.readUInt8(6);
        pkt.subOpcode = buffer.readUInt16BE(7);

        return pkt;
    }

    getBuffer() {
        let buffer = Buffer.alloc(9);

        buffer.writeUInt8(this.slot, 0);
        buffer.writeUInt32BE(this.callId, 1);
        buffer.writeUInt8(this.channelControlStatus, 5);
        buffer.writeUInt8(this.reason, 6);
        buffer.writeUInt16BE(this.subOpcode, 7);

        return super.getBuffer(buffer);
    }
}

module.exports = DataCallStatus;