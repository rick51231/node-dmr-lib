const Packet = require('./Packet');

class RegistrationAck extends Packet {
    unknown = 0x02;
    hash = Buffer.alloc(3);

    constructor(hash) {
        super(Packet.TYPE_REGISTRATION_ACK);
        this.hash = hash;
    }

    static from(buffer) {
        if(buffer.length!==4)
            return null;

        let pkt = new RegistrationAck(buffer.subarray(1));

        pkt.unknown = buffer.readUInt8(0);

        return pkt;
    }

    getBuffer() {
        let b = Buffer.concat([
            Buffer.from([this.unknown]),
            this.hash
        ]);

        return super.getBuffer(b);
    }
}

module.exports = RegistrationAck;