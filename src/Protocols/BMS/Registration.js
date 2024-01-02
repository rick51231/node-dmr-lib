const Packet = require('./Packet');

class Registration extends Packet {
    hash = Buffer.alloc(3);
    code = 0; //TODO: 0x02 = IMPRES, 0x01 = nonIMPRES ?
    radioESN = Buffer.alloc(10);
    batterySerial = '';

    constructor() {
        super(Packet.TYPE_REGISTRATION);
    }

    static from(buffer) {
        if(buffer.length<14)
            return null;

        let pkt = new Registration();

        pkt.radioESN = buffer.subarray(0, 10);
        pkt.code = buffer.readUInt8(10);
        pkt.hash = buffer.subarray(11, 14);

        if(buffer.length>=20) {
            let serial = Array.from(buffer.subarray(14, 20)).reverse();
            pkt.batterySerial = Buffer.from(serial).toString('hex').toUpperCase();
        }

        return pkt;
    }

    getBuffer() {
        let bCode = Buffer.from([this.code]);
        let arr = [
            this.radioESN,
            bCode,
            this.hash
        ];

        if(this.batterySerial!=='') {
            let serial = Array.from(Buffer.from(this.batterySerial, 'hex')).reverse();

            arr.push(Buffer.from(serial));
        }

        return super.getBuffer(Buffer.concat(arr));
    }
}

module.exports = Registration;
// ProcessBatteryRegistrationResponse ProcessBatteryRegistration VerifyBatteryDataReadResponse