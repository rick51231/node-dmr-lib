const Packet = require('./Packet');

class MasterPing extends Packet {
    constructor() {
        super(Packet.TYPE_MSTPING);
    }

    static from(buffer) {
        return new MasterPing();
    }
}


module.exports = MasterPing;