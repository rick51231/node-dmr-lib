const EventEmitter = require('events');
const DMR = require('../DMR');
const Network = require('../Motorola/Network');
const IP = require('../IP');
const IPSCPeer = require('./IPSCPeer');

class DMRIPGateway extends EventEmitter {
    static EVENT_DATA = 'data';

    dmrGateway;
    dataBuffer = {};
    sendPacketConfirmationIDS;

    constructor(dmrGateway, sendPacketConfirmationIDS = []) {
        super();
        this.dmrGateway = dmrGateway;
        this.sendPacketConfirmationIDS = sendPacketConfirmationIDS;

        this.dmrGateway.on(IPSCPeer.EVENT_DMRDATA, (data) => {
            this.onDMRPacket(data);
        });
    }

    onDMRPacket(data) {//TODO: validate service access point + compressed packets
        if(data.data instanceof DMR.DataHeader.Unconfirmed || data.data instanceof DMR.DataHeader.Confirmed) {
            this.dataBuffer[data.src_id] = new DMR.Util.DataBlock(data.data);
            return;
        }

        if(this.dataBuffer[data.src_id]===undefined)
            return;


        this.dataBuffer[data.src_id].addPacket(data.data);

        if(this.dataBuffer[data.src_id].remainPackets > 0)
            return;

        let header = this.dataBuffer[data.src_id].dataHeader;
        let secondHeader = this.dataBuffer[data.src_id].secondDataHeader;
        let buffer = this.dataBuffer[data.src_id].getBuffer();
        this.dataBuffer[data.src_id] = undefined;

        if(buffer===null)
            return;

        let ip = null;

        if(header.serviceAccessPoint===DMR.DataHeader.SAP_IP_PACKET)
            ip = IP.IP4Packet.from(buffer);
        else if(header.serviceAccessPoint===DMR.DataHeader.SAP_UDP_COMPRESSION)
            ip = IP.IP4Packet.fromCompressedUDPDMRStandart(buffer, header.src_id, header.dst_id);
        else if(header.serviceAccessPoint===DMR.DataHeader.SAP_PROPRIETARY && secondHeader!==null && secondHeader.serviceAccessPoint===DMR.DataHeader.SAP_UDP_COMPRESSION_MOTO) {
            ip = IP.IP4Packet.fromCompressedUDPAdvantage(buffer, header.src_id, header.dst_id, secondHeader);
        }

        if(ip===null)
            return;

        if(header instanceof DMR.DataHeader.Confirmed && this.sendPacketConfirmationIDS.indexOf(header.dst_id) !== -1) {
            let response = new DMR.DataHeader.Response();

            response.src_id = header.dst_id;
            response.dst_id = header.src_id;
            response.dstIsGroup = false;
            response.serviceAccessPoint = header.serviceAccessPoint;
            response.type = 1;
            response.sendSequenceNumber = header.sendSequenceNumber;

            this.dmrGateway.sendDMRData(response, response.src_id, response.dst_id, response.dstIsGroup, true, true, data.slot);
        }

        this.emit(DMRIPGateway.EVENT_DATA, ip, data.slot);
    }

    async sendIPPacket(ip, slot, csbkCount = 0) {
        let dmr_src = ip.src_addr & 0xFFFFFF;
        let dmr_dst = ip.dst_addr & 0xFFFFFF;
        let dstIsGroup = ((ip.dst_addr >> 24) & 0xFF) === Network.NETWORK_GROUP;
        let ipPayload = ip.getBuffer();

        let packets = DMR.Util.DataBlock.createDataBlock(ipPayload, dmr_src, dmr_dst, dstIsGroup);

        if(csbkCount>0) {
            let blocksCount = packets.length;

            for(let i = 0; i < csbkCount; i++) {
                let csbk = new DMR.CSBK.PreCSBK();

                csbk.src_id = dmr_src;
                csbk.dst_id = dmr_dst;
                csbk.dstIsGroup = dstIsGroup;
                csbk.blocksToFollow = blocksCount + i;
                csbk.dataNext = true;

                packets.unshift(csbk);
            }
        }

        for(let i = 0; i < packets.length; i++) {
            this.dmrGateway.sendDMRData(packets[i], dmr_src, dmr_dst, dstIsGroup, (i===0), (i===packets.length-1), slot);
        }
    }
}

module.exports = DMRIPGateway;
