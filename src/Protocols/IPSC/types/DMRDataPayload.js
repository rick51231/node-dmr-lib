const DMRPayload = require("./DMRPayload");
const DMR = require("../../../DMR");

const PDU_OFFSET = 8;

class DMRDataPayload extends DMRPayload {
    rssiStatus = false; //Rssi ok ?
    RSParity = false;
    CRCParity = false;
    EmbLCParity = false;
    lengthToFollow = 0;
    rssiPresent = false;
    burstSource = false;
    embSigBit10 = false;
    syncHardBits = false;
    slotTypePresent = false;
    sync = DMRPayload.SYNC_DATA;
    dataSizeBits = 0;
    colorCode = 0;
    dataType = 0;
    rssi = 0;

    data;

    static from(buffer, pduDataType) {
        let bytes = Uint8Array.from(buffer);

        let dmr = new DMRDataPayload(pduDataType);

        dmr.pduSlot =     (bytes[1] & 0b10000000) >>> 7;
        dmr.rssiStatus =  (bytes[1] & 0b01000000) > 0;
        dmr.RSParity =    (bytes[1] & 0b00000100) > 0;
        dmr.CRCParity =   (bytes[1] & 0b00000010) > 0;
        dmr.EmbLCParity = (bytes[1] & 0b00000001) > 0;

        dmr.lengthToFollow = buffer.readUInt16BE(2);

        dmr.rssiPresent =  (bytes[4] & 0b10000000) > 0;
        dmr.burstSource =  (bytes[4] & 0b00010000) > 0;
        dmr.embSigBit10 =  (bytes[4] & 0b00000100) > 0;

        dmr.syncHardBits =    (bytes[5] & 0b01000000) > 0;
        dmr.slotTypePresent = (bytes[5] & 0b00001000) > 0;
        dmr.sync =            (bytes[5] & 0b00000011);

        dmr.dataSizeBits = buffer.readUInt16BE(6);

        let dataSize = dmr.getDataSize();

        let offset = 8 + dataSize;
        let rssiOffset = dmr.lengthToFollow * 2;

        if(dmr.slotTypePresent) {
            dmr.colorCode = bytes[offset + 1] >>> 4;
            dmr.dataType = bytes[offset + 1] & 0b00001111;

            offset += 2;
        }

        if(dmr.rssiPresent) {
            if(rssiOffset >= buffer.length)
                return null;

            let val = buffer.readUInt16BE(offset);
            dmr.rssi = -( ( val >>> 8) +  (( val & 0xFF) * 1000 + 128) / 256000.0);
        }


        let data = buffer.slice(PDU_OFFSET, PDU_OFFSET + (dmr.pduDataType === DMRPayload.DATA_TYPE_CONFIRMED_DATA_CONT ? 18 : 12)); //TODO: 12 rate1/2, 18 rate3/4;

        //Idk why, but in IPSC checksum is on the end of the packet
        if (dmr.pduDataType === DMRPayload.DATA_TYPE_CONFIRMED_DATA_CONT && dmr.dataSizeBits === 144) {
            let start = data.slice(16, 18);
            let end = data.slice(0, 16);

            data = Buffer.concat([start, end]);
        }
        // dmr.payload = data;

        dmr.data = DMR.Packet.from(data, dmr.dataType);

        return dmr;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8 + (this.rssiPresent ? 2 : 0) + (this.pduDataType === DMRPayload.DATA_TYPE_CONFIRMED_DATA_CONT  ? 18 : 12) + 2);

        let b1 = (this.pduSlot << 7) &  0b10000000;

        if(this.rssiStatus)
            b1 |= 0b01000000;
        if(this.RSParity)
            b1 |= 0b00000100;
        if(this.CRCParity)
            b1 |= 0b00000010;
        if(this.EmbLCParity)
            b1 |= 0b00000001;

        buffer.writeUInt8(b1, 1);
        buffer.writeUInt16BE(this.lengthToFollow, 2);

        let b4 = 0;

        if(this.rssiPresent)
            b4 |= 0b10000000;
        if(this.burstSource)
            b4 |= 0b00010000;
        if(this.embSigBit10)
            b4 |= 0b00000100;

        buffer.writeUInt8(b4, 4);

        let b5 = 0;

        if(this.syncHardBits)
            b5 |= 0b01000000;
        if(this.slotTypePresent)
            b5 |= 0b00001000;

        b5 |= this.sync & 0b00000011;

        buffer.writeUInt8(b5, 5);
        buffer.writeUInt16BE(this.dataSizeBits, 6);

        let offset = 8 + this.getDataSize();

        if(this.slotTypePresent) {
            let byte = ((this.colorCode<<4) & 0b11110000) | (this.dataType & 0b00001111);
            buffer.writeUInt8(byte, offset+1);

            offset += 2;
        }

        if(this.rssiPresent) {
            let v = ((this.rssi * -1 * 256000) - 128) / 1000;
            buffer.writeUInt16BE(v, offset);
        }

        //TODO: do we need to move checksum to end in the DATA_TYPE_CONFIRMED_DATA_CONT packets
        buffer.write(this.data.getBuffer().toString('hex'), PDU_OFFSET, 'hex');

        return super.getBuffer(buffer);
    }

    getDataSize() {
        return (Math.floor(this.dataSizeBits / 16) + (this.dataSizeBits % 16 > 0 ? 1 : 0)) * 2;
    }
}

module.exports = DMRDataPayload;

//TODO: rssi conversion (old style and new style). From version 2.30.10.0 ?
/*
Raw to normal:
old: -56f - (float)((double)(raw >> 8) + ((double)(raw  & 0xFF) * 1000.0 + 128.0) / 256000.0);
new: 0f - (float)((double)(raw  >> 8) + ((double)(raw  & 0xFF) * 1000.0 + 128.0) / 256000.0)

Normal to raw:

old:
v = Math.abs(v);
if(v < 56) v = 56;
let n1 = (ushort)((((int)v  - 56) & 0xFF) << 8);
let n2 = (ushort)((uint)(int)(((double)(v  - (float)(int) ) * 256000.0 - 128.0) / 1000.0) & 0xFFu);
return n1 | n2;

new:
v = Math.abs(v);
let n1 = (ushort)(((int)v & 0xFF) << 8);
let n2 = (ushort)((uint)(int)(((double)(v - (float)(int) ) * 256000.0 - 128.0) / 1000.0) & 0xFFu);
return n1 | n2;
 */