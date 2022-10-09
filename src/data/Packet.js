const DMRRaw = require('./Raw');
const DMRUtil = require('../DMRUtil');
const DMRConst = require('../DMRConst');
const DMRCoders = require('../DMRCoders');
const BPTC19696 = require('../encoders/BPTC19696');
const Trellis = require('../encoders/Trellis');


// const BS_SOURCED_AUDIO_SYNC   = '755FD7DF75F7';
// const BS_SOURCED_DATA_SYNC    = 'DFF57D75DF5D';
// const MS_SOURCED_AUDIO_SYNC   = '7F7D5DD57DFD';
// const MS_SOURCED_DATA_SYNC    = 'D5D7F77FD757';
// const DIRECT_SLOT1_AUDIO_SYNC = '5D577F7757FF';
// const DIRECT_SLOT1_DATA_SYNC  = 'F7FDD5DDFD55';
// const DIRECT_SLOT2_AUDIO_SYNC = '7DFFD5F55D5F';
// const DIRECT_SLOT2_DATA_SYNC  = 'D7557F5FF7F5';


const SYNC_LIST = [
    '011101010101111111010111110111110111010111110111',
    '110111111111010101111101011101011101111101011101',
    '011111110111110101011101110101010111110111111101',
    '110101011101011111110111011111111101011101010111',
    '010111010101011101111111011101110101011111111111',
    '111101111111110111010101110111011111110101010101',
    '011111011111111111010101111101010101110101011111',
    '110101110101010101111111010111111111011111110101'
];


class Packet {
    colorCode;
    data;


    static from(buffer) {
        let binary_packet = DMRUtil.bufferToBits(buffer);

        let slotType = [];

        slotType[0] = (buffer.readUInt8(12)<<2) & 0xFC;
        slotType[0] |= (buffer.readUInt8(13)>>6) & 0x03;

        slotType[1] = (buffer.readUInt8(13)<<2) & 0xC0;
        slotType[1] |= (buffer.readUInt8(19)<<2) & 0x3C;
        slotType[1] |= (buffer.readUInt8(20)>>6) & 0x03;

        slotType[2] = (buffer.readUInt8(20)<<2) & 0xF0;

        let code = DMRCoders.decode2087(slotType);

        let centerData = binary_packet.substr(98, 68);
        let syncData = centerData.substr(10, 48);

        let colorCode = (code >> 4) & 0x0F;
        let dataType = (code >> 0) & 0x0F;

        let decoded_bits = '';

        if(dataType===DMRConst.DT_RATE_34_DATA) {
            decoded_bits = Trellis.decode(binary_packet);
        } else {
            decoded_bits =  BPTC19696.decode(binary_packet.substring(0, 98) + binary_packet.substring(166));
        }


        let rawData = DMRUtil.bitsToBuffer(decoded_bits);

        let isVoice = false;
        if(SYNC_LIST.indexOf(syncData)===-1) { //TODO: temporary voice fix
            isVoice = true;
        }

        return this.fromRawData(rawData, colorCode, dataType, isVoice);
    }

    static fromRawData(buffer, colorCode, dataType, isVoice) {
        let packet = new Packet();

        packet.colorCode = colorCode;
        packet.data = DMRRaw.fromBuffer(buffer, isVoice ? 0 : dataType);

        return packet;
    }

    getBuffer() {
        // slot and color generation https://github.com/g4klx/MMDVM/blob/master/DMRSlotType.cpp
        let slotType = Buffer.alloc(3);

        slotType.writeUInt8(((this.colorCode << 4) & 0xF0) | ((this.dataType << 0) & 0x0F), 0);

        let cksum = DMRConst.ENCODING_TABLE_2087[slotType.readUInt8(0)];

        slotType.writeUInt8((cksum >> 0) & 0xFF, 1);
        slotType.writeUInt8((cksum >> 8) & 0xFF, 2);

        let bitData = DMRUtil.bufferToBits(slotType);

        let l_slot = bitData.substr(0, 10);
        let r_slot = bitData.substr(10, 10);

        // https://git.linux.us.org/HBNet/DMRlink/src/commit/9f40c170e18ec7ad8cc39666dd6f747eb596ada5/dmrlink_to_mmdvm.py
        // if(slot===1) {
        //     sync_data = '111101111111110111010101110111011111110101010101'; //TS1 - F7FDD5DDFD55
        // } else {
        //     // sync_data = '110101110101010101111111010111111111011111110101'; //TS2 - D7557F5FF7F5
        let sync_data = '110101011101011111110111011111111101011101010111'; //TS2 - D5D7F77FD757

        let rawData = this.data.getBuffer();

        //TODO: Trellis support
        let bitsData = DMRUtil.bufferToBits(rawData);
        let encodedData = DMRCoders.interleave_19696(DMRCoders.encode_19696(bitsData)).join('');

        let outPacket = encodedData.substr(0, 98) + l_slot + sync_data + r_slot + encodedData.substr(98);

        return DMRUtil.bitsToBuffer(outPacket);
    }
}

module.exports = Packet;