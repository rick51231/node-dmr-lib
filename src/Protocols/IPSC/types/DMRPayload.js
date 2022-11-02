const PDU_OFFSET = 8;

const DMR = require('../../../DMR');

class DMRPayload {
    static DATA_TYPE_PI_HEADER = 0;
    static DATA_TYPE_VOICE_HEADER = 1;
    static DATA_TYPE_VOICE_TERMINATOR = 2;
    static DATA_TYPE_CSBK = 3;
    static DATA_TYPE_DATA_HEADER = 6;
    static DATA_TYPE_UNCONFIRMED_DATA_CONT = 7; // Rate 1/2
    static DATA_TYPE_CONFIRMED_DATA_CONT = 8; // Rate 3/4
    static DATA_TYPE_VOICE = 10; //Or Rate 1
    /*
      public enum DataType
  {
    PIHeader,
    VoiceLCHeader,
    TerminatorWithLC,
    CSBK,
    MBCHeader,
    MBCContinuation,
    DataHeader,
    Rate_1_2_Data,
    Rate_3_4_Data,
    Idle,
    Rate_1_Data,
    Reserved_0x0B,
    Reserved_0x0C,
    Reserved_0x0D,
    Reserved_0x0E,
    Reserved_0x0F,
  }
     */

    
    pduDataType = 0;
    pduSlot = 0;

    rssiStatus = false;
    RSParity = false;
    CRCParity = false;
    EmbLCParity = false;
    lengthToFollow = 0;
    rssiPresent = false;
    burstSource = false;
    embSigBit10 = false;
    syncHardBits = false;
    slotTypePresent = false;
    sync = false;
    dataSizeBits = 0;
    colorCode = 0;
    dataType = 0;
    rssi = 0;

    data;

    constructor() {

    }

    static from(buffer) {
        let bytes = Uint8Array.from(buffer);
        let dmr = new DMRPayload();

        //TODO: fix it
        // if((bytes[0] & 0b11000000)>0)
        //     throw new Error("[IPSC/DMRPayload] Found unexcepted b0 "+buffer.toString('hex'));
        //
        // if((bytes[1] & 0b00111000)>0)
        //     throw new Error("[IPSC/DMRPayload] Found unexcepted b1 "+buffer.toString('hex'));
        //
        // if((bytes[4] & 0b0101011)>0)
        //     throw new Error("[IPSC/DMRPayload] Found unexcepted b4 "+buffer.toString('hex'));
        //
        // if((bytes[5] & 0b1010100)>0)
        //     throw new Error("[IPSC/DMRPayload] Found unexcepted b5 "+buffer.toString('hex'));

        dmr.pduDataType = (bytes[0] & 0b00111111);
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

        let slotTypeOffset = 9 + dataSize;
        let rssiOffset = dmr.lengthToFollow * 2;

        if(dmr.slotTypePresent) {
            dmr.colorCode = bytes[slotTypeOffset] >>> 4;
            dmr.dataType = bytes[slotTypeOffset] & 0b00001111;
        }

        if(dmr.rssiPresent) {
            let val = buffer.readUInt16BE(rssiOffset);
            dmr.rssi = -( ( val >>> 8) +  (( val & 0xFF) * 1000 + 128) / 256000.0);
        }


        let data = buffer.slice(PDU_OFFSET, PDU_OFFSET + (dmr.pduDataType === DMRPayload.DATA_TYPE_CONFIRMED_DATA_CONT ? 18 : 12)); //TODO: 12 rate1/2, 18 rate3/4;
        dmr.data = DMR.Packet.from(data, dmr.dataType);


        return dmr;
    }

    getBuffer() {
        let buffer = Buffer.alloc(8 + (this.rssiPresent ? 2 : 0) + (this.pduDataType === DMRPayload.DATA_TYPE_CONFIRMED_DATA_CONT  ? 18 : 12) + 2);

        buffer.writeUInt8(this.pduDataType & 0b00111111, 0);

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

        //TODO: write rssi

        if(this.slotTypePresent) {
            let slotTypeOffset = 9 + this.getDataSize();
            let byte = ((this.colorCode<<4) & 0b11110000) | (this.dataType & 0b00001111);
            buffer.writeUInt8(byte, slotTypeOffset);
        }

        buffer.write(this.data.getBuffer().toString('hex').get, PDU_OFFSET, 'hex');

        return buffer;
    }


    getDataSize() {
        return (Math.floor(this.dataSizeBits / 16) + (this.dataSizeBits % 16 > 0 ? 1 : 0)) * 2;
    }
}

module.exports = DMRPayload;