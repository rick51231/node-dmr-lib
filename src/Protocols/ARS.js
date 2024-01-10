"use strict";

class ARS {
    static DEVICE_REGISTRATION = 0x0;
    static DEVICE_DEREGISTRATION = 0x1;
    static NAME_RESOLUTION = 0x2;
    static ADDRESS_RESOLUTION = 0x3;
    static DEVICE_QUERY = 0x4;
    static USER_REGISTRATION = 0x5;
    static USER_DEREGISTRATION = 0x6;
    static USER_REGISTRATION_ACK = 0x7;
    static KEEPALIVE = 0x8;
    static REGISTRATION_ACKNOWLEDGEMENT = 0xF;

    constructor() {
        this.extended = 0;
        this.ack = 0;
        this.priority = 0;
        this.controlUser = 0;

        this.type = 0;

        this.isInitial = 0;
        this.encoding = 0;

        this.deviceId = 0;
    }
    //https://github.com/DSheirer/sdrtrunk/blob/master/src/main/java/io/github/dsheirer/module/decode/ip/ars/ARSHeader.java
    static from(buffer) {
        let ars = new ARS();


        //0-1 - len
        let b2 = buffer.readUInt8(2);

        ars.extended = (b2 & 0x80) === 0x80;
        ars.ack = (b2 & 0x40) === 0x40;
        ars.priority = (b2 & 0x20) === 0x20;
        ars.controlUser = (b2 & 0x10) === 0x10;

        ars.type = b2 & 0xF;

        if(ars.extended) {

            let b3 = buffer.readUInt8(3);

            ars.isInitial = (b3 & 0x60) === 0x20;
            ars.encoding = b3 & 0x1F;

            let deviceIdLen = buffer.readUInt8(4);

            ars.deviceId = parseInt(buffer.slice(5, 5 + deviceIdLen), 10);
        }

        return ars;
    }

    getBuffer() {
        let deviceStr = this.deviceId.toString(10);

        let dataSize = 3; // Basic header size

        if(this.extended) {
            dataSize += 1; //Extended byte
            dataSize += 3; //Size for deviceId + userId + password
            dataSize += deviceStr.length;
        }
        let buffer = Buffer.alloc(dataSize);

        let b2 = 0;

        if(this.extended)
            b2 |= 0x80;
        if(this.ack)
            b2 |= 0x40;
        if(this.priority)
            b2 |= 0x20;
        if(this.controlUser)
            b2 |= 0x10;

        b2 |= this.type & 0xF;


        buffer.writeUInt16BE(buffer.length-2, 0);
        buffer.writeUInt8(b2, 2);

        if(this.extended) {
            let b3 = 0;

            if(this.isInitial)
                b3 |= 0x20;

            b3 |= this.encoding & 0x1F;

            buffer.writeUInt8(b3, 3);
            buffer.writeUInt8(deviceStr.length, 4);
            buffer.write(deviceStr, 5);

            buffer.writeUInt8(0x00, buffer.length-2); //User id size
            buffer.writeUInt8(0x00, buffer.length-1); //Password size
        }


        return buffer;
    }
}

module.exports = ARS;