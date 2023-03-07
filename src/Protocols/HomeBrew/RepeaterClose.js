const Packet = require('./Packet');

class RepeaterClose extends Packet {
    constructor() {
        super(Packet.TYPE_RPTCL);
    }

    static from(buffer) {
        return new RepeaterClose();
    }
}


module.exports = RepeaterClose;