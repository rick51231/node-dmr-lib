const Packet = require('./Packet');

class Raw extends Packet {
    data = Buffer.alloc(0);

    constructor(type, data) {
        super(type);
        this.data = data;
    }

    static from(buffer, packetType) {
        return new Raw(packetType, buffer);
    }

    getBuffer(appendBuffer) {
        return super.getBuffer(this.data);
    }
}

module.exports = Raw;