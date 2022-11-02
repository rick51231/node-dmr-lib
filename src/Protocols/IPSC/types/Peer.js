const PeerMode = require('./PeerMode');

class Peer {
    static SIZE = 11;
    peerId = 0;
    address = 0;
    port = 0;
    mode = new PeerMode();


    constructor(peerId, address, port, mode) {
        this.peerId = peerId;
        this.address = address;
        this.port = port;
        this.mode = mode;
    }

    static from(buffer) {
        if(buffer.length!==Peer.SIZE)
            return null;

        let peerId = buffer.readUInt32BE(0);
        let address = buffer.readUInt32BE(4);
        let port = buffer.readUInt16BE(8);
        let mode = PeerMode.from(buffer.slice(10, 11));

        if(mode===null)
            return null;

        return new Peer(peerId, address, port, mode);
    }

    getBuffer() {
        let buffer = Buffer.alloc(Peer.SIZE-1); //Peer.SIZE - PeerMode size

        buffer.writeUInt32BE(this.peerId, 0);
        buffer.writeUInt32BE(this.address, 4);
        buffer.writeUInt16BE(this.port, 8);

        let modeBuffer = this.mode.getBuffer();

        return Buffer.concat([buffer, modeBuffer]);
    }
}

module.exports = Peer;