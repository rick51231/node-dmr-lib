class Packet {
    static TYPE_RPTL        = 'RPTL';
    static TYPE_MSTNAK      = 'MSTNAK';
    static TYPE_MSTACK      = 'MSTACK';
    static TYPE_MSTCL       = 'MSTCL';
    static TYPE_MSTPING     = 'MSTPING';
    static TYPE_RPTPONG     = 'RPTPONG';
    static TYPE_RPTCL       = 'RPTCL';
    static TYPE_RPTK        = 'RPTK';
    static TYPE_RPTC        = 'RPTC';
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
``
        let type4 = buffer.slice(0, 4).toString('binary');
        let type5 = buffer.slice(0, 5).toString('binary');
        let type6 = buffer.slice(0, 6).toString('binary');
        let type7 = buffer.slice(0, 7).toString('binary');
        let offset = 4; // type
        let normalRepeaterId = true;

        if(type4===Packet.GATEWAY_REG_REQ) {
            packetClass = require('./GatewayRegReq');
        } else if(type4===Packet.GATEWAY_PING) {
            packetClass = require('./GatewayPing');
        } else if(type4===Packet.VOICE_DATA) {
            packetClass = require('./VoiceData');
            normalRepeaterId = false;
        } else if(type4===Packet.TYPE_RPTL) {
            packetClass = require('./RepeaterLogin');
        } else if(type4===Packet.TYPE_RPTC) {
            packetClass = require('./RepeaterConfig');


        } else if(type5===Packet.TYPE_RPTCL) {
            offset = 5;
            packetClass = require('./RepeaterClose');
        } else if(type5===Packet.TYPE_MSTCL) {
            offset = 5;
            packetClass = require('./MasterClose');


        } else if(type6===Packet.TYPE_MSTACK) {
            offset = 6;
            packetClass = require('./MasterACK');
        } else if(type6===Packet.TYPE_MSTNAK) {
            offset = 6;
            packetClass = require('./MasterNACK');


        } else if(type7===Packet.TYPE_MSTPING) {
            offset = 7;
            packetClass = require('./MasterPing');
        } else if(type7===Packet.TYPE_RPTPONG) {
            offset = 7;
            packetClass = require('./RepeaterPong');
        } else {
            return null;
        }

        if(normalRepeaterId)
            offset += 4; //RepeaterID;

        let packet = packetClass.from(buffer.slice(offset, buffer.length), type4);

        if(packet===null)
            return null;

        if(normalRepeaterId)
            packet.repeaterId = buffer.readUInt32BE(offset-4);

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