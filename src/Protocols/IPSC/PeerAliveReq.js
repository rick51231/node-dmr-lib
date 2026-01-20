const Packet = require('./Packet');
const PeerMode = require('./types/PeerMode');
const PeerFlags = require('./types/PeerFlags');

class PeerAliveReq extends Packet {
    peerMode = new PeerMode();
    peerFlags = new PeerFlags();

    constructor(peerMode, peerFlags) {
        super(Packet.PEER_ALIVE_REQ);
        this.peerMode = peerMode;
        this.peerFlags = peerFlags;
    }

    static from(buffer) {
        if(buffer.length!==5)
            return null;

        let peerMode = PeerMode.from(buffer.slice(0, 1));
        let peerFlags = PeerFlags.from(buffer.slice(1, 5));

        if(peerMode===null || peerFlags===null )
            return null;

        return new PeerAliveReq(peerMode, peerFlags);
    }

    getBuffer() {
        let modeBuffer = this.peerMode.getBuffer();
        let flagsBuffer = this.peerFlags.getBuffer();

        return super.getBuffer(Buffer.concat([modeBuffer, flagsBuffer]));
    }
}

module.exports = PeerAliveReq;