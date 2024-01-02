const Packet = require('./Packet');

class Discovery extends Packet {
    constructor() {
        super(Packet.TYPE_DISCOVERY);
    }

    static from(buffer) {
        if(buffer.length!==1)
            return null;

        return new Discovery();
    }

    getBuffer() {
        return super.getBuffer(Buffer.from([0x00]));
    }
}

module.exports = Discovery;