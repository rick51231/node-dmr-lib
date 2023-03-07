const Packet = require('./Packet');

class MasterNACK extends Packet {
    constructor() {
        super(Packet.TYPE_MSTNAK);
    }

    static from(buffer) {
        return new MasterNACK();
    }
}


module.exports = MasterNACK;