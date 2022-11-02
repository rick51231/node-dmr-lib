"use strict";

const DMRUtil = require('../DMRUtil');

// public enum MessageType
// {
//     SimpleText = 0,
//         ServiceAvailability = 0x10,
//         Ack = 0x1F
// }

class TMS {
    constructor() {
        this.op_B = 0xa0; // extensionExists 0x80, requiresACK 0x40, reservedFlag 0x20, system 0x10, MessageType 0x1F
        this.msgId = 0x00; // Should be with 0x80 bit ? https://github.com/pboyd04/Moto.Net/blob/3364ecfa4f7c1229136b1265313cd42dc8db1c90/Moto.Net/Mototrbo/TMS/TMSMessage.cs#L109
        this.text = '';
    }

    static from(buffer) {
        let sms = new TMS();

        sms.op_B = buffer.readUInt8(2);
        sms.msgId = buffer.readUInt8(4); //TODO: first bit changing motorola sms charset

        sms.text = DMRUtil.decode_sms(buffer.slice(6, buffer.length)).toString();

        if(sms.text.substr(0, 2)==="\r\n")
            sms.text = sms.text.substr(2);

        return sms;
    }

    getBuffer() {
        let textBuffer = DMRUtil.encode_sms("\r\n" + this.text);

        let buffer = Buffer.alloc(6 + textBuffer.length); // https://github.com/KD8EYF/TRBO-NET/blob/master/TMS.pm

        buffer.writeUInt16BE(buffer.length-2, 0); //https://github.com/pboyd04/Moto.Net/blob/b34c4449e6e9fe20b4fab696228207c807fe6bb0/Moto.Net/Mototrbo/TMS/TMSMessage.cs
        buffer.writeUInt8(this.op_B, 2); // OP_B (can be 0xa0 or 0x0e ?)
        buffer.writeUInt8(0x00, 3);
        buffer.writeUInt8(this.msgId, 4); //Msg id
        buffer.writeUInt8(0x04, 5); //Prefix len or encoding ?
        buffer.write(textBuffer.toString('hex'), 6, 'hex');

        return buffer;
    }
}

module.exports = TMS;