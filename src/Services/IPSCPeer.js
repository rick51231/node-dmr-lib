const IPSC = require('../Protocols/IPSC');
const EventEmitter = require('events');
const udp = require("dgram");
const { getTime, delay } = require('./Utils');

class IPSCPeer extends EventEmitter { //TODO: XNL support
    static STATE_NONE = 0;
    static STATE_OK = 1;
    static STATE_CONNECTING = 2;
    static STATE_XNL_INIT = 2;

    static EVENT_DMRDATA = 'dmrdata';
    static EVENT_DATA = 'data';
    static EVENT_CONNECTED = 'connected';
    static EVENT_CLOSED = 'closed';

    socket;
    options;
    state = 0;
    lostPings = 0; //TODO: lost pings increment ?
    interval;
    dmrSeq = 0;
    streamId = 0;

    isTXActive = false;
    sendDataBuffer = [];
    lastDataPacket = (new Date()).getTime();

    constructor(options) { //TODO: auth support
        super();

        this.options = {
            host: options.host,
            port: options.port ?? 50000,
            peerId: options.peerId ?? 100,
            peerMode: options.peerMode ?? new IPSC.Types.PeerMode(),
            peerFlags: options.peerFlags ?? new IPSC.Types.PeerFlags(),
            peerProtocol: options.peerProtocol ?? new IPSC.Types.PeerProtocol(),
            sendDataWhenActive: options.sendDataWhenActive ?? false,
            xnlEnabled: options.xnlEnabled ?? false,
            xnlKey: options.xnlKey ?? []
        };

        this.socket = udp.createSocket('udp4');

        this.socket.on('close', () => {
            console.log('Close');
        });
        this.socket.on('message', (msg) => {
            this.onData(msg);
        });

        setTimeout(() => {
            this.dataPacketSender();
        }, 100);
    }

    connect() {
        if(this.state!==IPSCPeer.STATE_NONE)
            return;
        this.state = IPSCPeer.STATE_CONNECTING;
        this.lostPings = 0;

        let packet = new IPSC.MasterRegReq(this.options.peerMode, this.options.peerFlags, this.options.peerProtocol);

        this.send(packet);

        this.interval = setInterval(() => {
            this.intervalFunction();
        }, 15000);
    }

    close() {
        if(this.state===IPSCPeer.STATE_NONE)
            return;

        let packet = new IPSC.DeregisterReq();
        this.send(packet);

        this.state = IPSCPeer.STATE_NONE;
        clearInterval(this.interval);
        this.interval = null;

        this.emit(IPSCPeer.EVENT_CLOSED);
    }

    send(packet) {
        let buffer;
        if(packet instanceof IPSC.Packet) {
            packet.peerId = this.options.peerId;
            buffer = packet.getBuffer();
        } else if(packet instanceof Buffer) {
            buffer = packet;
        } else {
            return;
        }

        this.socket.send(buffer, this.options.port, this.options.host, (error) => {

        });
    }

    onData(buffer) {
        if(this.state===IPSCPeer.STATE_NONE)
            return;
        // console.log('D: '+buffer.toString('hex'));
        let packet = IPSC.Packet.from(buffer);

        console.log('P: '+JSON.stringify(packet));

        if(packet===null)
            return;

        this.emit(IPSCPeer.EVENT_DATA, packet);

        if(this.state === IPSCPeer.STATE_CONNECTING && packet instanceof IPSC.MasterRegReply) {
            this.state = IPSCPeer.STATE_OK;
            this.emit(IPSCPeer.EVENT_CONNECTED);
            return;
        }

        if(packet instanceof IPSC.MasterAliveReply) {
            this.lostPings = 0;
            return;
        }

        if(packet instanceof IPSC.RepeaterBlock || packet instanceof IPSC.PrivateData || packet instanceof IPSC.GroupData || packet instanceof IPSC.PrivateVoice || packet instanceof IPSC.GroupVoice)
            this.lastDataPacket = getTime();

        if(packet instanceof IPSC.RepeaterBlock) {
            this.isTXActive = packet.status === IPSC.RepeaterBlock.SIGNAL_INTERFERENCE1_END;
            return;
        }

        if(packet instanceof IPSC.PrivateData || packet instanceof  IPSC.GroupData) {
            this.emit(IPSCPeer.EVENT_DMRDATA, {
                data: packet.dmrPayload.data,
                src_id: packet.src_id,
                dst_id: packet.dst_id,
                dstIsGroup: packet instanceof  IPSC.GroupData,
                slot: packet.slot
            });
        }
    }

    sendDMRData(data, src_id, dst_id, dstIsGroup, isFirst, isLast, slot=0) {
        if(this.dmrSeq>=65535)
            this.dmrSeq = 0;
        else
            this.dmrSeq++;

        let dmrPayload = new IPSC.Types.DMRPayload();

        dmrPayload.pduDataType = data.dataType;
        dmrPayload.pduSlot = slot;
        dmrPayload.rssiStatus = false;
        dmrPayload.lengthToFollow = 10;
        dmrPayload.rssiPresent = false;
        dmrPayload.slotTypePresent = true;
        dmrPayload.sync = IPSC.Types.DMRPayload.SYNC_VOICE;
        dmrPayload.dataSizeBits = 96;
        dmrPayload.colorCode = 1;
        dmrPayload.dataType = data.dataType;
        dmrPayload.data = data;

        let rtpPayload = new IPSC.Types.Rtp();

        rtpPayload.version = 2;
        rtpPayload.marker = isFirst;
        rtpPayload.payloadType = isLast ? 94 : 93;
        rtpPayload.seq = this.dmrSeq;
        rtpPayload.timestamp = getTime() & 0xFFFFFFFF;

        let packet = dstIsGroup ? (new IPSC.GroupData()) : (new IPSC.PrivateData());

        packet.streamId = this.streamId;
        packet.src_id = src_id;
        packet.dst_id = dst_id;
        packet.callPriority = 1;
        packet.floorControlTag = 19382; //TODO: what does it mean?
        packet.slot = slot;
        packet.lastPacket = isLast;
        packet.rtp = rtpPayload;
        packet.dmrPayload = dmrPayload;
// console.log(packet);
        this.sendDataBuffer.push(packet);

        if(isLast) {
            if(this.streamId>255)
                this.streamId = 0;
            else
                this.streamId++;
        }
    }

    intervalFunction() {
        if(this.state===IPSCPeer.STATE_NONE)
            return;

        if(this.state===IPSCPeer.STATE_CONNECTING || this.lostPings > 2) {
            console.log('Timeout');
            this.close(); //Close by timeout
            return;
        }

        let packet = new IPSC.MasterAliveReq(this.options.peerMode, this.options.peerFlags, this.options.peerProtocol);

        this.send(packet);
    }

    async dataPacketSender() {
        if(this.state !== IPSCPeer.STATE_OK || this.sendDataBuffer.length===0 || this.lastDataPacket + 500 > getTime() || (this.options.sendDataWhenActive && !this.isTXActive)) {
            setTimeout(() => {
                this.dataPacketSender();
            }, 50);
            return;
        }

        while(this.sendDataBuffer.length > 0) {
            let p = this.sendDataBuffer.shift();
            this.send(p);
            console.log('S: '+p.getBuffer().toString('hex')+ ' ['+this.sendDataBuffer.length+']');

            await delay(60);

            // if(p.lastPacket !== undefined && p.lastPacket) {
            //     await delay(1000);
            //     break; //Run function state checks again
            // }
        }

        setTimeout(() => {
            this.dataPacketSender();
        }, 50);
    }
}

module.exports = IPSCPeer;