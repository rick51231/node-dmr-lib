class Packet {
    static DATA_TYPE_PI_HEADER = 0;
    static DATA_TYPE_VOICE_HEADER = 1;
    static DATA_TYPE_VOICE_TERMINATOR = 2;
    static DATA_TYPE_CSBK = 3;
    static DATA_TYPE_DATA_HEADER = 6;
    static DATA_TYPE_UNCONFIRMED_DATA_CONT = 7; // Rate 1/2
    static DATA_TYPE_CONFIRMED_DATA_CONT = 8; // Rate 3/4
    static DATA_TYPE_VOICE = 10; //Or Rate 1

    static RATE12_CRC_MASK = 0x00F0;
    static RATE34_CRC_MASK = 0x01FF;

    dataType;

    constructor(dataType) {
        this.dataType = dataType;
    }

    static from(buffer, dataType) {
        let packetClass;

        switch(dataType) {
            case Packet.DATA_TYPE_VOICE_HEADER:
            case Packet.DATA_TYPE_VOICE_TERMINATOR:
                packetClass = require('./VoiceBase');
                break;
            case Packet.DATA_TYPE_CSBK:
                packetClass = require('./CSBK');
                break;
            case Packet.DATA_TYPE_DATA_HEADER:
                packetClass = require('./DataHeader');
                break;
            case Packet.DATA_TYPE_PI_HEADER:
                packetClass = require('./PIHeader');
                break;
            default:
                packetClass = require('./Raw');
        }

        return packetClass.from(buffer, dataType);
    }

    // getBuffer(appendBuffer) {
    //     let buffer = Buffer.alloc(5);
    //
    //     buffer.writeUInt8(this.type, 0);
    //     buffer.writeUInt32BE(this.peerId, 1);
    //
    //     if(appendBuffer!==undefined)
    //         buffer = Buffer.concat([buffer, appendBuffer]);
    //
    //     return buffer;
    // }


}

module.exports = Packet;