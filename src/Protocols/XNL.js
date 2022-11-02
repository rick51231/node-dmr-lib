const XCMP = require('./XCMP');

class XNL {
    static HEADER_SIZE = 14;

    static OPCODE_MASTER_STATUS_BROADCAST = 0x02;
    static OPCODE_DEVICE_MASTER_QUERY = 0x03;
    static OPCODE_DEVICE_AUTH_KEY_REQUEST = 0x04;
    static OPCODE_DEVICE_AUTH_KEY_REPLY = 0x05;
    static OPCODE_DEVICE_CONNECTION_REQUEST = 0x06;
    static OPCODE_DEVICE_CONNECTION_REPLY = 0x07;
    static OPCODE_DEVICE_SYS_MAP_REQUEST = 0x08;
    static OPCODE_DEVICE_SYS_MAP_REPLY = 0x09;
    static OPCODE_DATA_MESSAGE = 0x0b;
    static OPCODE_DATA_MESSAGE_ACK = 0x0c;

    opcode;
    isXCMP = false;
    flags = 0;
    dst = 0;
    src = 0;
    transactionID = 0;

    data = Buffer.alloc(); //Can be buffer or XCMP class depending on isXCMP value

    constructor(opcode) {
        this.opcode = opcode;
    }

    static from(buffer) {
        if(buffer.length<XNL.HEADER_SIZE)
            return null;

        let opcode = buffer.readUInt16BE(2);

        let packet = new XNL(opcode);

        packet.isXCMP = buffer.readUInt8(4)===1;
        packet.flags = buffer.readUInt8(5);
        packet.dst = buffer.readUInt16BE(6);
        packet.src = buffer.readUInt16BE(8);
        packet.transactionID = buffer.readUInt16BE(10);

        let dataLen = buffer.readUInt16BE(12);

        if(buffer.length-XNL.HEADER_SIZE !== dataLen)
            return null;

        if(dataLen>0) {
            let raw = buffer.slice(XNL.HEADER_SIZE, XNL.HEADER_SIZE + dataLen);
            if(packet.isXCMP) {
                let xcmp = XCMP.from(raw);
                if(xcmp===null)
                    return null;

                packet.data = xcmp;
            } else {
                packet.data = raw;
            }
        }

        return packet;
    }

    getBuffer() {
        let buffer = Buffer.alloc(XNL.HEADER_SIZE);
        let dataBuffer;

        if(this.isXCMP)
            dataBuffer = this.data.getBuffer();
        else
            dataBuffer = this.data;


        buffer.writeUInt16BE(buffer.length+dataBuffer.length-2, 0);
        buffer.writeUInt16BE(this.opcode, 2);
        buffer.writeUInt8(this.isXCMP ? 1 : 0, 4);
        buffer.writeUInt8(this.flags, 5);
        buffer.writeUInt16BE(this.dst, 6);
        buffer.writeUInt16BE(this.src, 8);
        buffer.writeUInt16BE(this.transactionID, 10);

        buffer.writeUInt16BE(dataBuffer.length, 12);

        return Buffer.concat([buffer, dataBuffer]);
    }

    static createXNLHash(buffer, key) {
        // https://github.com/pboyd04/MotoGo/blob/7f53359a750403368e84987882b166df336e57ad/internal/moto/mototrbo/xnl/encrypter.go#L4
        // https://github.com/pboyd04/Moto.Net/blob/master/Moto.Net/Mototrbo/XNL/Encrypter.cs

        // key is array of 6 int32 values. Can be found in TRBOnet.Server.exe (class NS.Enginee.Mototrbo.Utils.XNLRepeaterCrypter). See links above

        let dword1 = buffer.readUInt32BE(0);
        let dword2 = buffer.readUInt32BE(4);

        let num1 = key[0];
        let num2 = key[1];
        let num3 = key[2];
        let num4 = key[3];
        let num5 = key[4];
        let num6 = key[5];

        for(let index = 0; index < 32; index++) {
            num1 += num2;

            dword1 += (((dword2 << 4) + num3) ^ (dword2 + num1) ^ ((dword2 >>> 5) + num4));
            dword2 += (((dword1 << 4) + num5) ^ (dword1 + num1) ^ ((dword1 >>> 5) + num6));
        }

        let a = Buffer.alloc(8);

        a.writeUInt32BE(dword1>>>0, 0);
        a.writeUInt32BE(dword2>>>0, 4);

        return a;
    }
}

module.exports = XNL;