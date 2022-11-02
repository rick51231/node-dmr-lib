const Packet = require('./Packet');

class RepeaterBlock extends Packet {
    static SIGNAL_INTERFERENCE1_START = 0x1;
    static SIGNAL_INTERFERENCE1_END = 0x2;
    static SIGNAL_INTERFERENCE2_START = 0x3;
    static SIGNAL_INTERFERENCE2_END = 0x4;
    static BSI_REPEAT_START = 0x5;
    static BSI_REPEAT_END = 0x6;
    static UNKNOWN = 0xFF;

    status = RepeaterBlock.SIGNAL_INTERFERENCE1_START;

    constructor(status) {
        super(Packet.REPEATER_BLOCK);

        this.status = status;
    }

    static from(buffer) {
        if(buffer.length!==1)
            return null;

        let status = buffer.readUInt8(0);

        return new RepeaterBlock(status);
    }

    getBuffer() {
        let buffer = Buffer.alloc(1);

        buffer.writeUInt8(this.status, 0);

        return super.getBuffer(buffer);
    }
}

module.exports = RepeaterBlock;