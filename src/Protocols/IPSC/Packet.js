
class Packet {
    static REPEATER_CALL_TRANSMISSION = 0x61;
    static REPEATER_CALL_CONTROL = 0x62;
    static REPEATER_BLOCK = 0x63;


    static XNL_PACKET = 0x70;

    static GROUP_VOICE = 0x80;
    static PRIVATE_VOICE = 0x81;

    static GROUP_DATA = 0x83;
    static PRIVATE_DATA = 0x84;

    static RPT_WAKE_UP = 0x85; //8500000002000000010001 8500000002000000010101
    static CALL_INTERRUPT_REQ = 0x86;

    static MASTER_REG_REQ = 0x90;
    static MASTER_REG_REPLY = 0x91;
    static PEER_LIST_REQ = 0x92;
    static PEER_LIST_REPLY = 0x93; // 930000000a001600000002c0a8c796c3586a000000d4c0a8c796c35060
    static PEER_REGISTER_REQ = 0x94; // 940000000204070401
    static PEER_REGISTER_REPLY = 0x95;

    static MASTER_ALIVE_REQ = 0x96;
    static MASTER_ALIVE_REPLY = 0x97;
    static PEER_ALIVE_REQ = 0x98;
    static PEER_ALIVE_REPLY = 0x99;

    static DEREGISTER_REQ = 0x9A; // 9a00000002
    static DEREGISTER_REPLY = 0x9B; // 9a00000002

    static SYSTEM_MAP_REQ = 0x9C;
    static SYSTEM_MAP_REPLY = 0x9D;
    static UNKNOWN_9E = 0x9E; //Extended peer registration ?

    static NAI_DATA = 0xb2; //TODO: check MNIS packet

    //CPS connect request / 0x14 = repeater id and peer id, 0x97 = cps id, 0xc350 = 50000 tcp port. Possible PeerMode + PeerFlags
    static REMOTE_PROGRAMMING_REQ = 0xE0; // e000000097000000970000001400000000c3500000010000
    static REMOTE_PROGRAMMING_REPLY = 0xE1; // e100000014000000140000009704 // target + initiator + result ?

    type;
    peerId = 0; //Can first by be a site id ????

    constructor(type) {
        this.type = type;
    }

    static from(buffer) {
        if(buffer.length<5)
            return null;

        let packetClass;
        let type = buffer.readUInt8(0);

        switch(type) {
            case Packet.REPEATER_CALL_TRANSMISSION:
                packetClass = require('./RepeaterCallTransmission');
                break;
            case Packet.REPEATER_CALL_CONTROL:
                packetClass = require('./RepeaterCallControl');
                break;
            case Packet.REPEATER_BLOCK:
                packetClass = require('./RepeaterBlock');
                break;
            case Packet.XNL_PACKET:
                packetClass = require('./XNLPacket');
                break;
            case Packet.RPT_WAKE_UP:
                packetClass = require('./RepeaterWakeUp');
                break;
            case Packet.GROUP_DATA:
            case Packet.PRIVATE_DATA:
            case Packet.GROUP_VOICE:
            case Packet.PRIVATE_VOICE:
                packetClass = require('./VoiceDataCall');
                break;
            case Packet.MASTER_REG_REQ:
                packetClass = require('./MasterRegReq');
                break;
            case Packet.PEER_LIST_REQ:
                packetClass = require('./PeerListReq');
                break;
            case Packet.PEER_LIST_REPLY:
                packetClass = require('./PeerListReply');
                break;
            case Packet.PEER_ALIVE_REPLY:
                packetClass = require('./PeerAliveReply');
                break;
            case Packet.PEER_ALIVE_REQ:
                packetClass = require('./PeerAliveReq');
                break;
             case Packet.PEER_REGISTER_REQ:
                packetClass = require('./PeerRegReq');
                break;
            case Packet.PEER_REGISTER_REPLY:
                packetClass = require('./PeerRegReply');
                break;
            case Packet.MASTER_REG_REPLY:
                packetClass = require('./MasterRegReply');
                break;
            case Packet.MASTER_ALIVE_REQ:
                packetClass = require('./MasterAliveReq');
                break;
            case Packet.MASTER_ALIVE_REPLY:
                packetClass = require('./MasterAliveReply');
                break;
            case Packet.DEREGISTER_REQ:
                packetClass = require('./DeregisterReq');
                break;
            default:
                packetClass = require('./Raw');
        }

        let packet = packetClass.from(buffer.slice(5, buffer.length), type);

        if(packet===null)
            return null;

        packet.peerId = buffer.readUInt32BE(1);

        return packet;
    }

    getBuffer(appendBuffer) {
        let buffer = Buffer.alloc(5);

        buffer.writeUInt8(this.type, 0);
        buffer.writeUInt32BE(this.peerId, 1);

        if(appendBuffer!==undefined)
            buffer = Buffer.concat([buffer, appendBuffer]);

        return buffer;
    }
}

module.exports = Packet;