const Packet = require('./Packet');
const DMR = require('../../DMR');
const Golay2087 = require('../../Encoders/Golay2087');
const Trellis = require('../../Encoders/Trellis');
const BPTC19696 = require('../../Encoders/BPTC19696');
const BitUtils = require("../../BitUtils");
const VoicePayload = require("./types/VoicePayload");

class VoiceData extends Packet {
    static CALL_TYPE_GROUP      = 0;
    static CALL_TYPE_PRIVATE    = 1;

    static FRAME_TYPE_VOICE         = 0x00;
    static FRAME_TYPE_VOICE_SYNC    = 0x01;
    static FRAME_TYPE_DATA_SYNC     = 0x02;

    seq = 0;
    src_id = 0;
    dst_id = 0;
    slot = 0;
    call_type = 0;
    frame_type = 0;
    data_type = 0;
    stream_id = 0;
    data = Buffer.alloc(0);
    colorCode = 0;
    ber = 0;
    rssi = 0;

    constructor() {
        super(Packet.VOICE_DATA);
    }

    static from(buffer) {
        if(buffer.length!==51)
            return null;

        let dmrd = new VoiceData();

        dmrd.seq = buffer.readUInt8(0);
        dmrd.src_id = (buffer.readUInt8(1)<<16) + buffer.readUInt16BE(2);
        dmrd.dst_id = (buffer.readUInt8(4)<<16) + buffer.readUInt16BE(5);
        dmrd.repeaterId = buffer.readUInt32BE(7);

        let infoByte = buffer.readUInt8(11);

        dmrd.data_type = infoByte & 0xF;
        dmrd.frame_type = (infoByte >> 4) & 0x3;
        dmrd.call_type = (infoByte >> 6) & 0x1;
        dmrd.slot = (infoByte >> 7) & 0x1;

        dmrd.stream_id = buffer.readUInt32BE(12);

        let data = buffer.slice(16, 49);
        dmrd.payload = data.toString('hex');
        if(dmrd.frame_type===this.FRAME_TYPE_DATA_SYNC) {
            [dmrd.data, dmrd.colorCode] = this.decodeDMR(data);
        } else {
            dmrd.data = VoicePayload.from(data, dmrd.frame_type===this.FRAME_TYPE_VOICE_SYNC);
            dmrd.colorCode = dmrd.data.colorCode;
        }

        if(dmrd.data===null)
            dmrd.data = data;

        dmrd.ber = buffer.readUInt8(49);
        dmrd.rssi = buffer.readUInt8(50);

        return dmrd;
    }

    getBuffer() {
        let buffer = Buffer.alloc(51);

        buffer.writeUInt8(this.seq, 0);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 1); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 2);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 4); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 5);

        buffer.writeUInt32BE(this.repeaterId, 7);

        let infoByte = 0;
        infoByte |= this.data_type & 0xF;
        infoByte |= (this.frame_type & 0x3) << 4;
        infoByte |= (this.call_type & 0x1) << 6;
        infoByte |= (this.slot & 0x1) << 7;

        buffer.writeUInt8(infoByte, 11);

        buffer.writeUInt32BE(this.stream_id, 12);

        if(this.data instanceof Buffer)
            this.data.copy(buffer, 16, 0);
        else if(this.frame_type !== VoiceData.FRAME_TYPE_DATA_SYNC)
            this.data.getBuffer().copy(buffer, 16, 0);
        else
            VoiceData.encodeDMR(this.data, this.colorCode).copy(buffer, 16, 0);

        buffer.writeUInt8(this.ber, 49);
        buffer.writeUInt8(this.rssi, 50);

        return super.getBuffer(buffer);
    }


    static decodeDMR(buffer) {
        let slotType = [];

        slotType[0] = (buffer.readUInt8(12)<<2) & 0xFC;
        slotType[0] |= (buffer.readUInt8(13)>>6) & 0x03;

        slotType[1] = (buffer.readUInt8(13)<<2) & 0xC0;
        slotType[1] |= (buffer.readUInt8(19)<<2) & 0x3C;
        slotType[1] |= (buffer.readUInt8(20)>>6) & 0x03;

        slotType[2] = (buffer.readUInt8(20)<<2) & 0xF0;

        let code = Golay2087.decode(slotType);

        let colorCode = (code >> 4) & 0x0F;
        let dataType = (code >> 0) & 0x0F;
        let bitsStr = BitUtils.bufferToBitsStr(buffer);
        let dataBits;

        if(dataType===DMR.Packet.DATA_TYPE_CONFIRMED_DATA_CONT) {
            dataBits = Trellis.decode(bitsStr);
        } else {
            // let tmpByte = (intArray[12] & 0b11000000) | (intArray[20] & 0b00000000);
            // intArray = intArray.slice(0, 12).concat([[tmpByte], intArray.slice(21)]);
            dataBits = BPTC19696.decode(bitsStr.substring(0, 98) + bitsStr.substring(166))
        }

        return [DMR.Packet.from(BitUtils.bitsStrToBuffer(dataBits), dataType), colorCode];
    }

    static encodeDMR(dmr, colorCode) {
        let slotType =  Golay2087.encode(((colorCode << 4) & 0xF0) | ((dmr.dataType << 0) & 0x0F));

        let bitsSlot = BitUtils.bufferToBitsStr(Buffer.from(slotType));

        let l_slot = bitsSlot.substr(0, 10);
        let r_slot = bitsSlot.substr(10, 10);

        let sync_data = '110101011101011111110111011111111101011101010111';

        let bitsPayload = BitUtils.bufferToBitsStr(dmr.getBuffer());

        let encodedData = BPTC19696.encode(bitsPayload);

        let outPacket = encodedData.substr(0, 98) + l_slot + sync_data + r_slot + encodedData.substr(98);

        return BitUtils.bitsStrToBuffer(outPacket);
    }
}


module.exports = VoiceData;