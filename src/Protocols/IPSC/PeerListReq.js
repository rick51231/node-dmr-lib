const Packet = require('./Packet');

class PeerListReq extends Packet {
    constructor() {
        super(Packet.PEER_LIST_REQ);
    }

    static from(buffer) {
        return new PeerListReq();
    }

    getBuffer() {
        return super.getBuffer(Buffer.alloc(0));
    }
}

module.exports = PeerListReq;