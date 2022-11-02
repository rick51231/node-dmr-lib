const Packet = require('./Packet');

class DeregisterReq extends Packet {

    constructor() {
        super(Packet.DEREGISTER_REQ);
    }

    static from(buffer) {
        return new DeregisterReq();
    }

    getBuffer() {
        return super.getBuffer();
    }
}

module.exports = DeregisterReq;