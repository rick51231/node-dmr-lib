const Packet = require('./Packet');

class MasterClose extends Packet {
    constructor() {
        super(Packet.TYPE_MSTCL);
    }

    static from(buffer) {
        return new MasterClose();
    }
}


module.exports = MasterClose;