const QR1676 = require("../../../Encoders/QR1676");
const BitUtils = require("../../../BitUtils");

class VoicePayload {
    colorCode = 0;
    PI = false;
    LCSS = 0;
    isSync = false;
    syncData = Buffer.alloc(0);
    embData = Buffer.alloc(0);
    ambe1 = ''; //72 bit AMBE
    ambe2 = '';
    ambe3 = '';

    constructor(isSync) {
        this.isSync = isSync;
    }

    static from(buffer, isSync) {
        if(buffer.length!==33)
            return null;

        let pkt = new VoicePayload(isSync);

        let bitsStr = BitUtils.bufferToBitsStr(buffer);
        let payload = bitsStr.substring(0, 108) + bitsStr.substring(156);

        pkt.ambe1 = payload.substr(0, 72);
        pkt.ambe2 = payload.substr(72, 72);
        pkt.ambe3 = payload.substr(144, 72);

        if(isSync) {
            pkt.syncData = BitUtils.bitsStrToBuffer(bitsStr.substring(108, 156));
        } else {
            let data = [];
            data[0] = (buffer.readUInt8(13) << 4) & 0xF0;
            data[0] |= (buffer.readUInt8(14) >> 4) & 0x0F;

            data[1] = (buffer.readUInt8(18) << 4) & 0xF0;
            data[1] |= (buffer.readUInt8(19) >> 4) & 0x0F;

            let dec = QR1676.decode(data);

            pkt.colorCode = (dec >> 3) & 0xF;
            pkt.PI = (dec & 0x04) > 0;
            pkt.LCSS = dec & 0x03;

            pkt.embData = BitUtils.bitsStrToBuffer(bitsStr.substring(116, 148));
        }

        return pkt;
    }

    getBuffer() {
        let center;

        if(this.isSync) {
            center = BitUtils.bufferToBitsStr(this.syncData);
        } else {
            let byte = 0;

            byte |= (this.colorCode << 3) & 0xF;
            byte |= this.LCSS & 0x03;

            if(this.PI)
                byte |= 0x04;

            let enc = QR1676.encode(byte);

            let bits = BitUtils.bufferToBitsStr(Buffer.from(enc));

            center = bits.substr(0, 8) + BitUtils.bufferToBitsStr(this.embData) + bits.substr(8, 8);
        }

        let ambeStr = this.ambe1 + this.ambe2 + this.ambe3;
        let outStr = ambeStr.substr(0, 108) + center + ambeStr.substring(108);

        return BitUtils.bitsStrToBuffer(outStr);
    }
}

module.exports = VoicePayload;
