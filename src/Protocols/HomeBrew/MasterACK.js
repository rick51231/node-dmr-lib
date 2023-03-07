const Packet = require('./Packet');

class MasterACK extends Packet {
    seq = null;

    constructor() {
        super(Packet.TYPE_MSTACK);
    }

    static from(buffer) {
        let pkt = new MasterACK();

        pkt.seq = buffer.length === 4 ? buffer.readUInt32BE(0) : null;

        return pkt;
    }

    getBuffer() {
        if(this.seq!==null) {
            let buffer = Buffer.alloc(4);

            buffer.writeUInt32BE(this.seq, 0);

            return super.getBuffer(buffer);
        }

        return super.getBuffer();
    }
}


module.exports = MasterACK;