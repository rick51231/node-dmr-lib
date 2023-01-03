const Packet = require('./Packet');
const PeerMode = require('./types/PeerMode');
const PeerFlags = require('./types/PeerFlags');
const PeerProtocol = require('./types/PeerProtocol');

class MasterRegReply extends Packet {
    peerMode = new PeerMode();
    peerFlags = new PeerFlags();
    peerProtocol = new PeerProtocol();
    numPeers = 0;

    constructor(peerMode, peerFlags, peerProtocol, numPeers) {
        super(Packet.MASTER_REG_REPLY);
        this.peerMode = peerMode;
        this.peerFlags = peerFlags;
        this.peerProtocol = peerProtocol;
        this.numPeers = numPeers;
    }

    static from(buffer) {
        if(buffer.length!==11)
            return null;


        let peerMode = PeerMode.from(buffer.slice(0, 1));
        let peerFlags = PeerFlags.from(buffer.slice(1, 5));
        let numPeers = buffer.readUInt16BE(5);
        let peerProtocol = PeerProtocol.from(buffer.slice(7, 11));

        if(peerMode===null || peerFlags===null || peerProtocol===null)
            return null;

        return new MasterRegReply(peerMode, peerFlags, peerProtocol, numPeers);
    }

    getBuffer() {
        let modeBuffer = this.peerMode.getBuffer();
        let flagsBuffer = this.peerFlags.getBuffer();
        let protocolBuffer = this.peerProtocol.getBuffer();
        let peersBuffer = Buffer.alloc(2);

        peersBuffer.writeUInt16BE(this.numPeers, 0);

        return super.getBuffer(Buffer.concat([
            modeBuffer,
            flagsBuffer,
            peersBuffer,
            protocolBuffer
        ]));
    }
}

module.exports = MasterRegReply;