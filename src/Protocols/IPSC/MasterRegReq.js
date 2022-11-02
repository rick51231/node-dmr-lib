const Packet = require('./Packet');
const PeerMode = require('./types/PeerMode');
const PeerProtocol = require('./types/PeerProtocol');
const PeerFlags = require('./types/PeerFlags');

class MasterRegReq extends Packet {
    peerMode = new PeerMode();
    peerFlags = new PeerFlags();
    peerProtocol = new PeerProtocol();

    constructor(peerMode, peerFlags, peerProtocol) {
        super(Packet.MASTER_REG_REQ);
        this.peerMode = peerMode;
        this.peerFlags = peerFlags;
        this.peerProtocol = peerProtocol;
    }

    static from(buffer) {
        if(buffer.length!==9)
            return null;

        let peerMode = PeerMode.from(buffer.slice(0, 1));
        let peerFlags = PeerFlags.from(buffer.slice(1, 5));
        let peerProtocol = PeerProtocol.from(buffer.slice(5, 9));

        if(peerMode===null || peerFlags===null || peerProtocol===null)
            return null;

        return new MasterRegReq(peerMode, peerFlags, peerProtocol);
    }

    getBuffer() {
        let modeBuffer = this.peerMode.getBuffer();
        let flagsBuffer = this.peerFlags.getBuffer();
        let protocolBuffer = this.peerProtocol.getBuffer();

        return super.getBuffer(Buffer.concat([modeBuffer, flagsBuffer, protocolBuffer]));
    }
}

module.exports = MasterRegReq;