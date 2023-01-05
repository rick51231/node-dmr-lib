const EventEmitter = require('events');
const HomeBrew = require("../Protocols/HomeBrew");

const udp = require("dgram");

const {getTime, delay} = require("./Utils");

class HBDMRGateway extends EventEmitter {
    static STATE_NONE = 0;
    static STATE_OK = 1;

    static EVENT_DMRDATA = 'dmrdata';
    static EVENT_DATA = 'data';
    static EVENT_CONNECTED = 'connected'; //TODO: fix it ?
    // static EVENT_CLOSED = 'closed';

    socket;
    options;
    state = HBDMRGateway.STATE_NONE;
    peerInfo;
    lastPing = 0; //TODO: timeout support
    streamId = Math.round((new Date()).getTime()/1000);
    packetSeq = 0;

    sendDataBuffer = [];
    lastDataPacket = (new Date()).getTime();

    constructor(options) {
        super();
        this.socket = udp.createSocket('udp4');

        this.options = {
            host: options.host ?? '127.0.0.1',
            port: options.port ?? 62029,
            repeaterId: options.repeaterId ?? 500
        };

        this.socket.on('close', () => {
            // Is it possible on udp socket ?
        });
        this.socket.on('message', (msg, info) => {
            this.onData(msg, info);
        });

        this.socket.bind(this.options.port, this.options.host);

        setTimeout(() => {
            this.dataPacketSender();
        }, 100);
    }

    send(packet) {
        if(this.state!==HBDMRGateway.STATE_OK)
            return;

        let buffer;
        if(packet instanceof HomeBrew.Packet) {
            packet.repeaterId = this.options.repeaterId;
            buffer = packet.getBuffer();
        } else if(packet instanceof Buffer) {
            buffer = packet;
        } else {
            return;
        }

        this.socket.send(buffer, this.peerInfo.port, this.peerInfo.address, (error) => {

        });
    }

    onData(buffer, info) {
        let packet = HomeBrew.Packet.from(buffer);

        if(packet===null)
            return;

        this.emit(HBDMRGateway.EVENT_DATA, packet);

        if(packet instanceof HomeBrew.GatewayRegReq) {
            if(this.state !== HBDMRGateway.STATE_OK || this.peerInfo.address !== info.address || this.peerInfo.port !== info.port)
                this.emit(HBDMRGateway.EVENT_CONNECTED, info);

            this.state = HBDMRGateway.STATE_OK;
            this.peerInfo = info;
            this.lastPing = (new Date()).getTime();

            let packet = new HomeBrew.GatewayPing();
            this.send(packet);

            return;
        }

        if(this.state !== HBDMRGateway.STATE_OK)
            return;

        if(packet instanceof HomeBrew.VoiceData) {
            this.lastDataPacket = (new Date()).getTime();

            if(packet.frame_type === HomeBrew.VoiceData.FRAME_TYPE_DATA_SYNC)
                this.emit(HBDMRGateway.EVENT_DMRDATA, {
                    data: packet.data,
                    src_id: packet.src_id,
                    dst_id: packet.dst_id,
                    dstIsGroup: packet.call_type === HomeBrew.VoiceData.CALL_TYPE_GROUP,
                    slot: packet.slot
                });
        }
    }

    sendDMRData(data, src_id, dst_id, dstIsGroup, isFirst, isLast, slot=0) {
        if(this.packetSeq>=255)
            this.packetSeq = 0;
        else
            this.packetSeq++;

        let packet = new HomeBrew.VoiceData();

        packet.seq = this.packetSeq;
        packet.src_id = src_id;
        packet.dst_id = dst_id;
        packet.slot = slot;
        packet.call_type = dstIsGroup ? HomeBrew.VoiceData.CALL_TYPE_GROUP : HomeBrew.VoiceData.CALL_TYPE_PRIVATE;
        packet.frame_type = HomeBrew.VoiceData.FRAME_TYPE_DATA_SYNC;
        packet.data_type = data.dataType;
        packet.stream_id = this.streamId;

        packet.data = data;

        this.sendDataBuffer.push(packet);

        if(isLast) {
            this.streamId = Math.round((new Date()).getTime()/1000);
        }
    }

    async dataPacketSender() {
        if(this.state !== HBDMRGateway.STATE_OK || this.sendDataBuffer.length===0 || this.lastDataPacket + 500 > getTime()) {
            setTimeout(() => {
                this.dataPacketSender();
            }, 50);
            return;
        }

        while(this.sendDataBuffer.length > 0) {
            let p = this.sendDataBuffer.shift();
            this.send(p);
            // console.log('S: '+p.getBuffer().toString('hex')+ ' ['+this.sendDataBuffer.length+']');

            await delay(60);
        }

        setTimeout(() => {
            this.dataPacketSender();
        }, 50);
    }
}

module.exports = HBDMRGateway;