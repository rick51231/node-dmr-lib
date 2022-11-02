const Packet = require('./Packet');

class RepeaterCallControl extends Packet {
    static STATE_ACTIVE = 0x1;
    static STATE_IDLE = 0x2;
    static STATE_SLOT_DISABLED = 0x3;
    static STATE_SLOT_REENABLED = 0x4;
    static STATE_UNKNOWN = 0xFF;

    stateSlot1 = RepeaterCallControl.STATE_IDLE;
    stateSlot2 = RepeaterCallControl.STATE_IDLE;

    constructor(stateSlot1, stateSlot2) {
        super(Packet.REPEATER_CALL_CONTROL);

        this.stateSlot1 = stateSlot1;
        this.stateSlot2 = stateSlot2;
    }

    static from(buffer) {
        if(buffer.length!==2)
            return null;

        let stateSlot1 = buffer.readUInt8(0);
        let stateSlot2 = buffer.readUInt8(1);

        return new RepeaterCallControl(stateSlot1, stateSlot2);
    }

    getBuffer() {
        let buffer = Buffer.alloc(2);

        buffer.writeUInt8(this.stateSlot1, 0);
        buffer.writeUInt8(this.stateSlot2, 1);

        return super.getBuffer(buffer);
    }
}

module.exports = RepeaterCallControl;