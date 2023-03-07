const Packet = require('./Packet');

class RepeaterPong extends Packet {
    constructor() {
        super(Packet.TYPE_RPTPONG);
    }

    static from(buffer) {
        return new RepeaterPong();
    }
}


module.exports = RepeaterPong;