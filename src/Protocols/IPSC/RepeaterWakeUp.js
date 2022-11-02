const Packet = require('./Packet');

class RepeaterWakeUp extends Packet {
    static TYPE_ALLSITE = 0x1;
    static TYPE_BEACON = 0x2;

    seq = 0;
    slots = 0; // ChannelNumber ?
    wakeupType = 0;

    constructor(seq, slots, wakeupType = RepeaterWakeUp.TYPE_ALLSITE) {
        super(Packet.RPT_WAKE_UP);

        this.seq = seq;
        this.slots = slots;
        this.wakeupType = wakeupType;
    }

    static from(buffer) {
        if(buffer.length!==6)
            return null;

        let seq = buffer.readUInt32BE(0);
        let slots = buffer.readUInt8(4);
        let wakeupType = buffer.readUInt8(5);

        return new RepeaterWakeUp(seq, slots, wakeupType);
    }

    getBuffer() {
        let buffer = Buffer.alloc(6);

        buffer.writeUInt32BE(this.seq, 0);
        buffer.writeUInt8(this.slots, 4);
        buffer.writeUInt8(this.wakeupType, 5);

        return super.getBuffer(buffer);
    }
}

module.exports = RepeaterWakeUp;