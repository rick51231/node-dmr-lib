const Packet = require('./Packet');
const Peer = require('./types/Peer');

class PeerListReply extends Packet {
    peers = [];

    constructor(peers) {
        super(Packet.PEER_LIST_REPLY);
        this.peers = peers;
    }

    static from(buffer) {
        if(buffer.length<2)
            return null;

        let len = buffer.readUInt16BE(0);

        if(buffer.length-2 !== len)
            return null;

        let peersCount = len/Peer.SIZE;
        let offset = 2;
        let peers = [];

        for(let i = 0; i < peersCount; i++) {
            let peer = Peer.from(buffer.slice(offset, offset+Peer.SIZE));
            offset += Peer.SIZE;

            if(peer === null)
                return null;

            peers.push(peer);
        }

        return new PeerListReply(peers);
    }

    getBuffer() {
        let sizeBuffer = Buffer.alloc(2);
        sizeBuffer.writeUInt16BE(this.peers.length*Peer.SIZE);

        let buffers = this.peers.map(i => i.getBuffer());

        buffers.unshift(sizeBuffer);

        return super.getBuffer(Buffer.concat(buffers));
    }
}

module.exports = PeerListReply;