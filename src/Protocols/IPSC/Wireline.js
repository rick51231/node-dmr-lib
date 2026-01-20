const Packet = require('./Packet');
const crypto = require('crypto')

class Wireline extends Packet {
    static OPCODE_REGISTRATION_REQUEST = 0x01;
    static OPCODE_REGISTRATION_REPLY = 0x02;
    static OPCODE_DATA_CALL_REQUEST = 0x07;
    static OPCODE_DATA_CALL_STATUS  = 0x08;
    static OPCODE_DATA_CALL_RECEIVE = 0x09;

    opcode;
    currentVersion;
    oldestVersion;

    constructor(opcode) {
        super(Packet.WIRELINE);

        this.opcode = opcode;
    }

    static from(buffer) {
        if(buffer.length<1)
            return null;

        let opcode = buffer.readUInt8(0);

        let callClass;

        switch(opcode) {
            case Wireline.OPCODE_REGISTRATION_REQUEST:
                callClass = require('./Wireline/RegistrationRequest');
                break;
            case Wireline.OPCODE_REGISTRATION_REPLY:
                callClass = require('./Wireline/RegistrationReply');
                break;
            case Wireline.OPCODE_DATA_CALL_REQUEST:
                callClass = require('./Wireline/DataCallRequest');
                break;
            case Wireline.OPCODE_DATA_CALL_STATUS:
                callClass = require('./Wireline/DataCallStatus');
                break;
            case Wireline.OPCODE_DATA_CALL_RECEIVE:
                callClass = require('./Wireline/DataCallReceive');
                break;
            default:
                return null;
        }

        let pkt = callClass.from(buffer.subarray(1, buffer.length-2));

        if(pkt===null)
            return null;
//TODO: remove signature ?
        pkt.currentVersion = buffer.readUInt8(buffer.length-2) >>> 2;
        pkt.oldestVersion = buffer.readUInt8(buffer.length-1) >>> 2;

        return pkt;
    }

    getBuffer(inBuffer) {
        let b = Buffer.alloc(1);
        b.writeUInt8(this.opcode);

        let b2 = Buffer.alloc(2);

        b2.writeUInt8((this.currentVersion << 2) & 0xFF, 0);
        b2.writeUInt8((this.oldestVersion << 2) & 0xFF, 1);

        return super.getBuffer(Buffer.concat([b, inBuffer, b2]));
    }

    getSignedBuffer(keyId, keyValue) {
        // 4 byte key id and 20 bytes application key

        let buffer = this.getBuffer();

        let digest = crypto.createHmac('sha1', Buffer.concat([keyValue, Buffer.from('0000000000000000000000000000000000000000', 'hex')]))
            .update(buffer)
            .digest();

        return Buffer.concat([
            buffer,
            keyId,
            digest.subarray(0, 10)
        ])
    }
}

module.exports = Wireline;