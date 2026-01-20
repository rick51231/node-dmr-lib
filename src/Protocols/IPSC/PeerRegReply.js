const Packet = require('./Packet');
const PeerProtocol = require('./types/PeerProtocol');

class PeerRegReply extends Packet {
    peerProtocol = new PeerProtocol();

    constructor(peerProtocol) {
        super(Packet.PEER_REGISTER_REPLY);
        this.peerProtocol = peerProtocol;
    }

    static from(buffer) {
        if(buffer.length!==4)
            return null;

        let peerProtocol = PeerProtocol.from(buffer);

        if(peerProtocol===null)
            return null;

        return new PeerRegReply(peerProtocol);
    }

    getBuffer() {
        let protocolBuffer = this.peerProtocol.getBuffer();

        return super.getBuffer(protocolBuffer);
    }
}

module.exports = PeerRegReply;