"use strict";

const DMRConst = require('../DMRConst');
const DMRPacket = require('../data/Packet');

//https://bm.pd0zry.nl/images/5/54/DMRplus_IPSC_Protocol_for_HB_repeater.pdf
class HomeBrew {
    constructor() {
        this.seq = 0;
        this.src_id = 0;
        this.dst_id = 0;
        this.repeater_id = DMRConst._REPEATER_ID;

        //Info byte
        this.slot = DMRConst.DMR_SLOT_1;
        this.call_type = DMRConst.DMR_CALL_GROUP;
        this.frame_type = 0x00;
        this.data_type = 0x0E;

        this.stream_id = Math.round((new Date()).getTime()/1000);

        this.data;

        this.ber = 0;
        this.rssi = 60;
    }

    static from(buffer) {
        if(buffer.slice(0, 4).toString()!==DMRConst.HOMEBREW_DATA_PREFIX)
            return undefined;

        let packet = new HomeBrew();

        packet.seq = buffer.readUInt8(4);
        packet.src_id = (buffer.readUInt8(5)<<16) + buffer.readUInt16BE(6);
        packet.dst_id = (buffer.readUInt8(8)<<16) + buffer.readUInt16BE(9);
        packet.repeater_id = buffer.readUInt32BE(11);

        let infoByte = buffer.readUInt8(15);

        // console.log(infoByte);

        packet.slot = (infoByte & 0x80) > 0 ? 2 : 1;
        packet.call_type = ((infoByte & 0x40) & 0x40) >> 6;
        let dataSync = (infoByte & 0x20) > 0;
        let voiceSync = (infoByte & 0x10) > 0;

        if(dataSync) {
            packet.data_type = infoByte & 0xF;
        } else if(voiceSync) {
            packet.data_type = DMRConst.DT_VOICE_SYNC;
        } else {
            packet.data_type = DMRConst.DT_VOICE;
        }

        // packet.slot = (infoByte & 0x1) + 1; //slotIndex = slot - 1
        // packet.call_type = (infoByte >> 1) & 0x1;
        // packet.frame_type = (infoByte >> 2) & 0x3;
        // packet.data_type = (infoByte >> 4) & 0xF;

        packet.stream_id = buffer.readUInt32BE(16);

        packet.data = DMRPacket.from(buffer.slice(20, 53));

        packet.ber = buffer.readUInt8(53);
        packet.rssi = buffer.readUInt8(54);


        return packet;
    }

    getBuffer() {
        let buffer = new Buffer.alloc(55);

        let infoByte = 0;

        infoByte |= (this.slot - 1) << 7; // SlotIndex = slot - 1
        infoByte |= this.call_type << 6;

        if(this.data_type===DMRConst.DT_VOICE_SYNC) {
            infoByte |= 0x10;
        } else if(this.data_type!==DMRConst.DT_VOICE) { //Any DMR data
            infoByte |= 0x20;
            infoByte |= this.data_type & 0xF;
        }


        // infoByte |= (this.slot-1) & 0x1; // SlotIndex = slot - 1
        // infoByte |= (this.call_type & 0x01) << 1;
        // infoByte |= (this.frame_type & 0x3) << 2; //Frame type
        // infoByte |= (this.data_type & 0xF) << 4; //Data type //TMS:   0xE

        buffer.write(DMRConst.HOMEBREW_DATA_PREFIX, 0);
        buffer.writeUInt8(this.seq, 4);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 5); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 6);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 8); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 9);

        buffer.writeUInt32BE(this.repeater_id, 11);
        buffer.writeUInt8(infoByte, 15);
        buffer.writeUInt32BE(this.stream_id, 16); //+slotIndex

        buffer.write(this.data.getBuffer().toString('hex'), 20, 'hex');

        buffer.writeUInt8(this.ber, 53);
        buffer.writeUInt8(this.rssi, 54);

        return buffer;
    }
}

module.exports = HomeBrew;