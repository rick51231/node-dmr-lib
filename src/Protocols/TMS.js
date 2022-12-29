"use strict";

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
        let textBuffer = buffer.slice(6, buffer.length);
        sms.text = this.decodeUTF16LE(textBuffer).toString('utf8');

        if(sms.text.substr(0, 2)==="\r\n")
            sms.text = sms.text.substr(2);

        return sms;
    }

    getBuffer() {
        let textBuffer = Buffer.from("\r\n" + this.text, 'utf16le');

        let buffer = Buffer.alloc(6 + textBuffer.length); // https://github.com/KD8EYF/TRBO-NET/blob/master/TMS.pm

        buffer.writeUInt16BE(buffer.length-2, 0); //https://github.com/pboyd04/Moto.Net/blob/b34c4449e6e9fe20b4fab696228207c807fe6bb0/Moto.Net/Mototrbo/TMS/TMSMessage.cs
        buffer.writeUInt8(this.op_B, 2); // OP_B (can be 0xa0 or 0x0e ?)
        buffer.writeUInt8(0x00, 3);
        buffer.writeUInt8(this.msgId, 4); //Msg id
        buffer.writeUInt8(0x04, 5); //Prefix len or encoding ?
        buffer.write(textBuffer.toString('hex'), 6, 'hex');

        return buffer;
    }

    // https://stackoverflow.com/questions/33781295/how-to-convert-a-utf16-file-into-a-utf8-file-in-nodejs
    static decodeUTF16LE(binary) {
        const utf8 = [];
        for (var i = 0; i < binary.length; i += 2) {
            let charcode = binary.readUInt16LE(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                // UTF-16 encodes 0x10000-0x10FFFF by
                // subtracting 0x10000 and splitting the
                // 20 bits of 0x0-0xFFFFF into two halves
                charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (charcode & 0x3ff));
                utf8.push(
                    0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f)
                );
            }
        }
        return Buffer.from(utf8);
    }
}

module.exports = TMS;