const Packet = require('./Packet');

class RepeaterAuth extends Packet {
    passwordHash = Buffer.alloc(0);

    constructor() {
        super(Packet.TYPE_RPTK);
    }

    static from(buffer) {
        if(buffer.length<1)
            return null;

        let pkt = new RepeaterAuth();

        pkt.passwordHash = buffer;

        return pkt;
    }

    getBuffer() {
        return super.getBuffer(this.passwordHash);
    }
}


module.exports = RepeaterAuth;