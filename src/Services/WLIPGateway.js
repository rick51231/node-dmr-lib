const EventEmitter = require('events');
const { Wireline } = require('../Protocols/IPSC');
const IPSCPeer = require('./IPSCPeer');
const {IP4Packet, IPUDPPacket} = require("../IP");
const ARC4 = require("../Encryption/ARC4");
const WirelineDataAttributes = require("../Protocols/IPSC/types/WirelineDataAttributes");
const {delay, getTime} = require("./Utils");

class WLIPGateway extends EventEmitter {
    static EVENT_DATA = 'data';

    static COMPRESSION_NONE = 0x00;
    static COMPRESSION_ADVANTAGE = 0x01;
    static COMPRESSION_DMR_STANDART = 0x02;


    maxPending = 1;
    timeout = 10000;
    ipscPeer;
    compression;
    retryCount;
    packetSeq = Math.round(Math.random()*0xFFFFFF);
    encryptionKeys = [];
    outgoingKeyId = -1;

    packetsQueue = [];
    pendingCount = 0;


    constructor(ipscPeer, compression = WLIPGateway.COMPRESSION_NONE, retryCount = 3) {
        super();
        this.ipscPeer = ipscPeer;
        this.compression = compression;
        this.retryCount = retryCount;


        this.ipscPeer.on(IPSCPeer.EVENT_WLDATA, (data) => {
            this.onWLPacket(data.data);
        });

        this.packetSender();
    }

    async packetSender() {
        for(let seqId of Object.keys(this.packetsQueue)) {
            if(this.packetsQueue[seqId]===undefined)
                continue;
            if(this.packetsQueue[seqId].sent === 0 && this.pendingCount<this.maxPending) {

                if(this.packetsQueue[seqId].retryCount>=this.retryCount) {
                    console.log('WL: retry failed '+seqId);
                    delete this.packetsQueue[seqId];
                    continue;
                }


                if(this.packetsQueue[seqId].retryCount>0)
                    await delay(500);

                this.packetsQueue[seqId].sent = 1;
                this.packetsQueue[seqId].sentTime = getTime();
                this.pendingCount++;

                this.ipscPeer.send(this.packetsQueue[seqId].packet, true);
                await delay(100);
            } else if(this.packetsQueue[seqId].sent === 1 && this.packetsQueue[seqId].sentTime+this.timeout < getTime()) {
                // delete this.packetsQueue[seqId];
                this.packetsQueue[seqId].sent = 0;
                this.packetsQueue[seqId].retryCount++;
                console.log('WL: timeout '+seqId);
                this.pendingCount--;
            }
        }

        setTimeout(() => {
            this.packetSender();
        },100);
    }

    addEncryptionKey(keyId, keyValue, isDefault) { //Only enchanced
        this.encryptionKeys[keyId] = new ARC4(keyValue);
        if(isDefault)
            this.outgoingKeyId = keyId;
    }

    onWLPacket(data) {
        if(data instanceof Wireline.DataCallReceive) {
            let ipPacket;

            if(data.dataAttributes.privacyType!==WirelineDataAttributes.PRIVACY_TYPE_NONE) {
                if(
                    data.dataAttributes.privacyType!==WirelineDataAttributes.PRIVACY_TYPE_ENHANCED
                    || data.dataAttributes.algId!==WirelineDataAttributes.PRIVACY_ALGORITHM_ARC4
                    || this.encryptionKeys[data.dataAttributes.keyId]===undefined
                )
                    return;

                this.encryptionKeys[data.dataAttributes.keyId].setIV(data.dataAttributes.iv);
                data.payload = this.encryptionKeys[data.dataAttributes.keyId].processBuffer(data.payload);
            }


            // console.log(data);
            console.log(data.payload.toString('hex'));
            if(data.dataAttributes.hasAdvantageCompressedHeader)
                ipPacket = IPUDPPacket.fromCompressedUDPAdvantageWL(data.payload, data.sourceId, data.targetId);
            else if(data.dataAttributes.hasDMRCompressedHeader)
                ipPacket = IPUDPPacket.fromCompressedUDPDMRStandart(data.payload, data.sourceId, data.targetId);
            else
                ipPacket = IP4Packet.from(data.payload);

            if(ipPacket===null)
                return;

            this.emit(WLIPGateway.EVENT_DATA, ipPacket, data.dataAttributes.keyId);
        } else if(data instanceof Wireline.DataCallStatus) {
            if(this.packetsQueue[data.callId]===undefined)
                return;

            if(data.channelControlStatus===Wireline.DataCallStatus.STATUS_TRANSMIT_OK) {
                delete this.packetsQueue[data.callId];
                console.log('WL: ok '+data.callId);
                this.pendingCount--;
            } else if(data.channelControlStatus > Wireline.DataCallStatus.STATUS_TRANSMIT_OK) {
                // delete this.packetsQueue[data.callId];
                console.log('WL: failed '+data.callId);
                this.pendingCount--;

                // if(this.packetsQueue[data.callId].retryCount>=this.retryCount) {
                //     console.log('WL: retry failed '+data.callId);
                //     delete this.packetsQueue[data.callId];
                //     return;
                // }
                //
                this.packetsQueue[data.callId].retryCount++;
                //
                // setTimeout(()=>{
                //     console.log('WL: retry '+data.callId);
                //     this.ipscPeer.send(this.packetsQueue[data.callId].packet);
                // }, 1000+Math.round(Math.random() * 20000));
            }
        }
    }

    async sendIPPacket(ip) {
        this.packetSeq++;

        if(this.packetSeq>0xFFFFFE)
            this.packetSeq = 1;

        console.log('WL: send '+this.packetSeq);

        let wPacket = new Wireline.DataCallRequest();
        wPacket.slot = 0;
        wPacket.callId = this.packetSeq;
        wPacket.callType = Wireline.DataCallRequest.CALL_TYPE_PRIVATE_DATA_UNCONFIRMED;
        wPacket.sourceId = ip.src_addr & 0xFFFFFF;
        wPacket.targetId = ip.dst_addr & 0xFFFFFF;


        if(this.compression===WLIPGateway.COMPRESSION_ADVANTAGE) {
            wPacket.dataAttributes.hasAdvantageCompressedHeader = true;
            wPacket.payload = ip.getCompressedUDPAdvantageWL();
        } else if(this.compression===WLIPGateway.COMPRESSION_DMR_STANDART) {
            wPacket.dataAttributes.hasDMRCompressedHeader = true;
            wPacket.payload = ip.getCompressedUDPDMRStandart();
        } else {
            wPacket.payload = ip.getBuffer();
        }


        if(this.outgoingKeyId!==-1) {
            wPacket.dataAttributes.privacyType = WirelineDataAttributes.PRIVACY_TYPE_ENHANCED;
            wPacket.dataAttributes.iv = Math.round(Math.random()*0xFFFFFFFF);
            wPacket.dataAttributes.algId = WirelineDataAttributes.PRIVACY_ALGORITHM_ARC4;
            wPacket.dataAttributes.keyId = this.outgoingKeyId;

            this.encryptionKeys[this.outgoingKeyId].setIV(wPacket.dataAttributes.iv);

            wPacket.payload = this.encryptionKeys[this.outgoingKeyId].processBuffer(wPacket.payload);
        }

        this.packetsQueue[this.packetSeq] = {
            packet: wPacket,
            retryCount: 0,
            sent: 0,
            sentTime: 0
        }

        // this.ipscPeer.send(wPacket, true);
    }
}

module.exports = WLIPGateway;
