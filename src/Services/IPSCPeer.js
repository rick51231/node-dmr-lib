const IPSC = require('../Protocols/IPSC');
const XNL = require('../Protocols/XNL');
const EventEmitter = require('events');
const udp = require("dgram");
const { getTime, delay } = require('./Utils');
const {DMRPayload, WirelineRegistrationEntry} = require("../Protocols/IPSC/types");
const  { Wireline } = require("../Protocols/IPSC");

class IPSCPeer extends EventEmitter {
    static STATE_NONE = 0;
    static STATE_OK = 1;
    static STATE_CONNECTING = 2;
    static STATE_XNL_INIT = 3;
    static STATE_WL_INIT = 3;

    static EVENT_DMRDATA = 'dmrdata';
    static EVENT_VOICEDATA = 'voicedata';
    static EVENT_WLDATA = 'wldata';
    static EVENT_DATA = 'data';
    static EVENT_XCMPDATA = 'xcmpdata';
    static EVENT_CONNECTED = 'connected';
    static EVENT_CLOSED = 'closed';

    socket;
    options;
    state = 0;
    lostPings = 0; //TODO: lost pings increment ?
    interval;
    dmrSeq = 0;
    streamId = 0;
    xnlTXId = 0;
    xnlRequestFlag = 0;
    xnlPeerId = 0;
    xnlLocalId = 0;
    voiceLcData = []; //For both slots
    wlRevertPeer = ['', 0];

    isTXActive = false;
    sendDataBuffer = [];
    lastDataPacket = getTime();
    xnlStarted = getTime();
    wlStarted = getTime();

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
            xnlKey: options.xnlKey ?? [],
            wlEnabled: options.wlEnabled ?? false,
            wlId: options.wlId ?? 0,
            wlCapPusRevert: options.wlCapPusRevert ?? false,
            wlKey: options.wlKey ?? [Buffer.alloc(0), Buffer.alloc(0)],
        };

        this.socket = udp.createSocket('udp4');

        this.socket.on('close', () => {
           // Is it possible on udp socket ?
        });
        this.socket.on('message', (msg, addr) => {
            this.onData(msg, addr);
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

    initWireline() {
        this.state = IPSCPeer.STATE_WL_INIT;

        let initPacket = new Wireline.RegistrationRequest();
        initPacket.slots = 3;
        initPacket.pduId = 2352093212;
        initPacket.id = 1;
        initPacket.channelStatusSubscribe = true;
        initPacket.unknownSubscribe = true;

        let entry1 = new WirelineRegistrationEntry();
        entry1.addressType = WirelineRegistrationEntry.ADDRESS_TYPE_INDIVIDUAL;
        entry1.rangeStart = this.options.wlId;
        entry1.rangeEnd = this.options.wlId;
        entry1.dataRegistration = true;
        let entry2 = new WirelineRegistrationEntry();
        entry2.addressType = WirelineRegistrationEntry.ADDRESS_TYPE_ALL_TALKGROUPS;
        entry2.rangeStart = 0;
        entry2.rangeEnd = 0;
        entry2.dataRegistration = true;

        initPacket.entries = [
            entry1,
            entry2,
        ];

        this.send(initPacket);

        this.wlStarted = getTime();
    }

    initDone() {
        this.state = IPSCPeer.STATE_OK;
        this.emit(IPSCPeer.EVENT_CONNECTED);
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

    send(packet, isRevert=false) {
        let buffer;
        if(packet instanceof IPSC.Packet) {
            packet.peerId = this.options.peerId;

            if(packet instanceof Wireline) {
                packet.currentVersion = 5;
                packet.oldestVersion = 1;

                buffer = packet.getSignedBuffer(this.options.wlKey[0], this.options.wlKey[1]);
            }  else {
                buffer = packet.getBuffer();
            }
        } else if(packet instanceof Buffer) {
            buffer = packet;
        } else {
            return;
        }

        if(isRevert && this.wlRevertPeer[0]!=='' && this.wlRevertPeer[1] > 0) {
            this.socket.send(buffer, this.wlRevertPeer[1], this.wlRevertPeer[0], (error) => {

            });
        } else {
            this.socket.send(buffer, this.options.port, this.options.host, (error) => {

            });
        }
    }

    onData(buffer, addr) {
        if(this.state===IPSCPeer.STATE_NONE)
            return;
        // console.log('D: '+buffer.toString('hex'));
        let packet = IPSC.Packet.from(buffer);


        if(packet===null)
            return;

        this.emit(IPSCPeer.EVENT_DATA, packet);

        if(this.state === IPSCPeer.STATE_CONNECTING && packet instanceof IPSC.MasterRegReply) {
            if(this.options.xnlEnabled) {
                this.state = IPSCPeer.STATE_XNL_INIT;
                this.xnlStarted = getTime();
                let xnl = new XNL(XNL.OPCODE_DEVICE_MASTER_QUERY);
                this.sendXNL(xnl);
            } else if(this.options.wlEnabled) {
                this.initWireline();
            } else {
                this.initDone();
            }

            return;
        }

        if(packet instanceof IPSC.MasterAliveReply) {
            this.lostPings = 0;
            return;
        }

        if(packet instanceof  IPSC.PeerRegReq || packet instanceof IPSC.PeerAliveReq) {
            if(this.options.wlEnabled && this.options.wlCapPusRevert) {
                this.wlRevertPeer[0] = addr.address;
                this.wlRevertPeer[1] = addr.port;

                if(this.state===IPSCPeer.STATE_WL_INIT)
                    this.initDone();

                let pkt;
                if(packet instanceof  IPSC.PeerRegReq)
                    pkt = new IPSC.PeerRegReply(packet.peerProtocol);
                else
                    pkt = new IPSC.PeerAliveReply(this.options.peerMode, this.options.peerFlags)

                this.send(pkt, true);
            }

            return;
        }

        if(packet instanceof IPSC.XNLPacket) {
            this.onXNLData(packet.xnl);
            return;
        }

        if(packet instanceof IPSC.Wireline) {
            this.onWlData(packet);
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

        if(packet instanceof IPSC.PrivateVoice || packet instanceof IPSC.GroupVoice) {
            if(packet.dmrPayload.pduDataType === DMRPayload.DATA_TYPE_VOICE_HEADER)
                this.voiceLcData[packet.slot] = packet.dmrPayload.data.LC;
            else if(packet.dmrPayload.pduDataType === DMRPayload.DATA_TYPE_VOICE && packet.dmrPayload.embLCPresent)
                this.voiceLcData[packet.slot] = packet.dmrPayload.embLC;

            if(this.voiceLcData[packet.slot]!==undefined) {
                let ambe = [];

                if(packet.dmrPayload.pduDataType === DMRPayload.DATA_TYPE_VOICE) {
                    ambe = [
                        packet.dmrPayload.ambe1,
                        packet.dmrPayload.ambe2,
                        packet.dmrPayload.ambe3
                    ];
                }
                this.emit(IPSCPeer.EVENT_VOICEDATA, {
                    lc: this.voiceLcData[packet.slot],
                    dataType: packet.dmrPayload.pduDataType,
                    dstIsGroup:  packet instanceof IPSC.GroupVoice,
                    ambe:ambe,
                    slot: packet.slot
                })
            }
        }
    }

    onWlData(packet) {
        if(!this.options.wlEnabled)
            return;

        if(packet instanceof Wireline.RegistrationReply) {
            if(packet.statusType===Wireline.RegistrationReply.STATUS_TYPE_SUCCESS) {

                if(this.options.wlCapPusRevert)
                    this.send(new IPSC.PeerListReq());
                else
                    this.initDone();
            } else {
                this.close();
            }

            return;
        }

        if(packet instanceof IPSC.Wireline) {
            this.emit(IPSCPeer.EVENT_WLDATA, {
                data: packet
            });
        }
    }

    onXNLData(xnl) {
        if(!this.options.xnlEnabled)
            return;

        if(xnl.opcode === XNL.OPCODE_DATA_MESSAGE) {
            let replyPacket = new XNL(XNL.OPCODE_DATA_MESSAGE_ACK);

            replyPacket.dst = xnl.src;
            replyPacket.src = xnl.dst;
            replyPacket.transactionID = xnl.transactionID;
            replyPacket.flags = xnl.flags;
            replyPacket.isXCMP = xnl.isXCMP;

            this.sendXNL(replyPacket);

            if(xnl.isXCMP)
                this.emit(IPSCPeer.EVENT_XCMPDATA, xnl.data);

            return;
        }

        if(this.state === IPSCPeer.STATE_XNL_INIT) {
            if (xnl.opcode === XNL.OPCODE_MASTER_STATUS_BROADCAST) {
                this.xnlPeerId = xnl.src;

                let replyPacket = new XNL(XNL.OPCODE_DEVICE_AUTH_KEY_REQUEST);

                replyPacket.dst = this.xnlPeerId;

                this.sendXNL(replyPacket);
                return;
            }

            if (xnl.opcode === XNL.OPCODE_DEVICE_AUTH_KEY_REPLY) {
                let authHash = xnl.data.slice(2, 10);
                let authKey = XNL.createXNLHash(authHash, this.options.xnlKey);

                let replyPacket = new XNL(XNL.OPCODE_DEVICE_CONNECTION_REQUEST);
                // replyPacket.flags = 8;
                replyPacket.dst = this.xnlPeerId;
                replyPacket.data = Buffer.concat([Buffer.from('00000a00', 'hex'), authKey]); //TODO: make constants and enums

                this.sendXNL(replyPacket);
                return;
            }

            if (xnl.opcode === XNL.OPCODE_DEVICE_CONNECTION_REPLY) {
                this.xnlLocalId = xnl.data.readUInt16BE(2);

                if(this.options.wlEnabled) {
                    this.initWireline();
                } else {
                    this.initDone();
                }
            }
        }
    }

    sendXCMP(xcmp) {
        if(!this.options.xnlEnabled)
            return;

        if(this.xnlTXId> 65000)
            this.xnlTXId = 0;
        else
            this.xnlTXId++;

        if(this.xnlRequestFlag > 6)
            this.xnlRequestFlag = 0;
        else
            this.xnlRequestFlag++;

        let xnl = new XNL(XNL.OPCODE_DATA_MESSAGE);

        xnl.isXCMP = true;
        xnl.data = xcmp;
        xnl.src = this.xnlLocalId;
        xnl.dst = this.xnlPeerId;
        xnl.transactionID = this.xnlTXId;
        xnl.flags = this.xnlRequestFlag;

        this.sendXNL(xnl);
    }

    sendXNL(xnl) {
        if(!this.options.xnlEnabled)
            return;

        let ipsc = new IPSC.XNLPacket(xnl);

        this.send(ipsc);
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
        rtpPayload.timestamp = (getTime() & 0xFFFFFFFF) >>> 0;

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
            if(this.streamId>=255)
                this.streamId = 0;
            else
                this.streamId++;
        }
    }

    intervalFunction() {
        if(this.state===IPSCPeer.STATE_NONE)
            return;

        if(this.state!==IPSCPeer.STATE_OK || this.lostPings > 2) {
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
            // console.log('S: '+p.getBuffer().toString('hex')+ ' ['+this.sendDataBuffer.length+']');

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