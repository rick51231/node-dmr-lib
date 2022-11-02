const DMR = require('../index')
const CRC32 = require('../../encoders/CRC32');
const CRC9 = require('../../encoders/CRC9');


class DataBlock {
    static PART_SIZE = 12;
    static CRC_SIZE = 4;
    dataHeader;
    secondDataHeader = null;
    remainPackets = 0;
    dataBuffer = [];


    constructor(dataHeader) {
        this.dataHeader = dataHeader;
        this.remainPackets = dataHeader.blocksToFollow;
    }

    addPacket(packet) {
        if(this.remainPackets===0)
            return false;

        if(packet instanceof DMR.Raw && packet.dataType === DMR.Packet.DATA_TYPE_UNCONFIRMED_DATA_CONT) {
            this.dataBuffer.push(packet.data);

        } else if(packet instanceof DMR.Raw && packet.dataType === DMR.Packet.DATA_TYPE_CONFIRMED_DATA_CONT) {
            let b0 = packet.data.readUInt8(0);
            let b1 = packet.data.readUInt8(1);

            let serial = b0 >> 1;
            let packetCRC = ((b0 & 0x1) << 8) | b1;
            let rawPart = packet.data.slice(2, packet.data.length);
            let crc = CRC9.compute(rawPart, serial) ^ DMR.Packet.RATE34_CRC_MASK;

            if(crc!==packetCRC) {

                console.log('[DataBlock] Invalid data fragment CRC '+crc+'!='+packetCRC); //TODO: remove it
                //Do we need to clear data buffer ?
                return false;
            }
            this.dataBuffer.push(rawPart);
        } else if(packet instanceof DMR.DataHeader.ProprietaryCompressed) { //TODO: validate something else ?
            this.secondDataHeader = packet;
            this.dataBuffer.push(packet.userData);
        } else {
            return false;
        }

        this.remainPackets--;

        return true;
    }

    getBuffer() {
        if(this.remainPackets>0)
            return null;

        let buffer = Buffer.concat(this.dataBuffer);

        let bufferCrc = buffer.readUInt32LE(buffer.length-DataBlock.CRC_SIZE);
        let computedCrc = CRC32.compure(buffer.subarray(0, buffer.length-DataBlock.CRC_SIZE));

        if(bufferCrc!==computedCrc)
            return null;

        return buffer.subarray(0, buffer.length-DataBlock.CRC_SIZE-this.dataHeader.padOctetCount);
    }

    static createDataBlock(buffer, src_id, dst_id, dstIsGroup, serviceAccessPoint = DMR.DataHeader.SAP_IP_PACKET) {
        let partsCount = Math.ceil((buffer.length + DataBlock.CRC_SIZE) / DataBlock.PART_SIZE);
        let tmpBuffer = Buffer.alloc(partsCount*DataBlock.PART_SIZE);

        buffer.copy(tmpBuffer, 0, 0);

        let crc = CRC32.compure(tmpBuffer.subarray(0, tmpBuffer.length-DataBlock.CRC_SIZE));
        tmpBuffer.writeUInt32LE(crc, tmpBuffer.length-DataBlock.CRC_SIZE);

        let dataPackets = [];

        let dataHeader = new DMR.DataHeader.Unconfirmed();

        dataHeader.padOctetCount = tmpBuffer.length - buffer.length - DataBlock.CRC_SIZE;
        dataHeader.blocksToFollow = partsCount;
        dataHeader.fullMessage = true;
        dataHeader.serviceAccessPoint = serviceAccessPoint

        dataHeader.dstIsGroup = dstIsGroup;
        dataHeader.src_id = src_id;
        dataHeader.dst_id = dst_id;

        dataPackets.push(dataHeader);

        for(let i = 0; i < partsCount; i++) {
            let partBuffer = tmpBuffer.subarray(i * DataBlock.PART_SIZE, i * DataBlock.PART_SIZE + DataBlock.PART_SIZE);
            dataPackets.push(new DMR.Raw(partBuffer, DMR.Packet.DATA_TYPE_UNCONFIRMED_DATA_CONT));
        }

        return dataPackets;
    }
}

module.exports = DataBlock;