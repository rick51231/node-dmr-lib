class Packet {
    static TYPE_RPTL        = 'RPTL';
    static TYPE_MSTNAK      = 'MSTNAK';
    static TYPE_MSTACK      = 'MSTACK';
    static TYPE_RPTK        = 'RPTK';
    static GATEWAY_REG_REQ  = 'DMRC';
    static GATEWAY_PING     = 'DMRP';
    static VOICE_DATA       = 'DMRD';

    type;
    repeaterId = 0;

    constructor(type) {
        this.type = type;
    }

    static from(buffer) {
        if(buffer.length<4)
            return null;

        let packetClass;

        let type = buffer.slice(0, 4).toString('binary');
        let offset = 4; // type
        let normalRepeaterId = true;

        if(type===Packet.GATEWAY_REG_REQ) {
            packetClass = require('./GatewayRegReq');
        } else if(type===Packet.GATEWAY_PING) {
            packetClass = require('./GatewayPing');
        } else if(type===Packet.VOICE_DATA) {
            packetClass = require('./VoiceData');
            normalRepeaterId = false;
        } else {
            return null;
        }

        if(normalRepeaterId)
            offset += 4; //RepeaterID;

        let packet = packetClass.from(buffer.slice(offset, buffer.length), type);

        if(packet===null)
            return null;

        if(normalRepeaterId)
            packet.repeaterId = buffer.readUInt32BE(4);

        return packet;
    }

    getBuffer(appendBuffer) {
        let buffer = Buffer.from(this.type, 'binary');
        if(this.type!==Packet.VOICE_DATA) {
            let idBuffer = Buffer.alloc(4);

            idBuffer.writeUInt32BE(this.repeaterId, 0);

            buffer = Buffer.concat([buffer, idBuffer]);
        }

        if(appendBuffer!==undefined)
            buffer = Buffer.concat([buffer, appendBuffer]);

        return buffer;
    }
}

module.exports = Packet;