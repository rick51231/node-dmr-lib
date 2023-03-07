const Packet = require('./Packet');

class RepeaterLogin extends Packet {
    constructor() {
        super(Packet.TYPE_RPTL);
    }

    static from(buffer) {
        return new RepeaterLogin();
    }
}


module.exports = RepeaterLogin;