class Packet {
    static TYPE_DISCOVERY            = 0x01;
    static TYPE_REGISTRATION         = 0x02;
    static TYPE_REGISTRATION_ACK     = 0x03;
    static TYPE_QUERY_REQUEST        = 0x04;
    static TYPE_QUERY_REPLY          = 0x05;

    type = Packet.TYPE_DISCOVERY;

    constructor(type) {
        this.type = type;
    }

    static from(buffer) {
        if(buffer.length<1)
            return null;

        let type = buffer.readUInt8(0);
        let packetClass;

        switch(type) {
            case Packet.TYPE_DISCOVERY:
                packetClass = require('./Discovery');
                break;
            case Packet.TYPE_REGISTRATION:
                packetClass = require('./Registration');
                break;
            case Packet.TYPE_REGISTRATION_ACK:
                packetClass = require('./RegistrationAck');
                break;
            case Packet.TYPE_QUERY_REQUEST:
                packetClass = require('./Query');
                break;
            case Packet.TYPE_QUERY_REPLY:
                packetClass = require('./QueryReply');
                break;
            default:
                return null;
        }

        return packetClass.from(buffer.subarray(1));
    }

    getBuffer(appendBuffer) {
        let buffer = Buffer.alloc(1);

        buffer.writeUInt8(this.type, 0);

        if(appendBuffer!==undefined)
            buffer = Buffer.concat([buffer, appendBuffer]);

        return buffer;
    }

    static getRegisterHash(A_0) {
        let regKey = this.getRegisterKey();

        let t1 = this.initRC4(regKey, regKey.length, A_0, A_0.length);
        let [A_1, ] = this.transformRC4(t1, 3, A_0);

        return A_1;
    }

    static getRegisterKey() {
        let kInput = [67, 89, 90, 59, 113];
        let kKey = [147, 236, 118, 219, 93, 197];
        let kIV = [56, 93, 156, 135];

        let [A_1,] = this.transformRC4( this.initRC4(kKey, kKey.length, kIV, kIV.length), 5, kInput);

        return A_1;
    }

    static transformRC4(RC4Sbox, len, input) {
        let A_1 = [];
        let index1 = RC4Sbox.a;
        let index2 = RC4Sbox.b;
        let c = RC4Sbox.c;

        for(let index3 = 0; index3 < len; index3++) {
            index1 = (index1 + 1 & 0xFF);
            index2 = (index2 +c[ index1] & 0xFF);
            let num2 = c[index1];
            c[index1] = c[index2];
            c[index2] = num2;

            A_1[index3] = (input[ index3] ^  c[ c[ index1] +  num2 & 0xFF]);
        }

        RC4Sbox.a = index1;
        RC4Sbox.b = index2;

        return [A_1, RC4Sbox];
    }

    static initRC4(key, keyLen, IV, IVLen) {
        let A_1_1 = [];
        let A_0_1 = { c: [], a: 0, b: 0};

        let A_1_2 = keyLen + IVLen;
        let numArray = key;

        for(let index = 0; index < IVLen; index++) {
            numArray[keyLen + index] = IV[index];
        }

        A_0_1 = this.setRC4Key(numArray, A_1_2);

        [A_1_1, A_0_1]  = this.transformRC4(A_0_1, 256, A_1_1);

        return A_0_1;
    }

    static setRC4Key(key, keyLen) {
        let rc4SboxT1 = { c: [], a: 0, b: 0};
        let numArray = [];

        let c = rc4SboxT1.c;
        let index1 = 0;

        for (let index2 = 0; index2 < 256; index2++) {
            if (index1 === keyLen)
                index1 = 0;

            c[index2] = index2;
            numArray[index2] = key[index1];

            ++index1;
        }

        index1 = 0;
        for (let index2 = 0; index2 < 256; index2++) {
            index1 = (index1 + c[index2] + numArray[index2] & 0xFF);

            let num2 = c[index2];
            c[index2] = c[index1];
            c[index1] = num2;
        }

        // rc4SboxT1.a = 0;
        // rc4SboxT1.b = 0;

        return rc4SboxT1;
    }
}

module.exports = Packet;