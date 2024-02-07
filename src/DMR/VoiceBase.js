const Packet = require("./Packet");
const RS129 = require("../Encoders/RS129");
const LinkControl = require("./LinkControl");

class VoiceBase extends Packet {
    crcMask;
    LC = new LinkControl(LinkControl.FLCO_GROUP_VOICE_CHANNEL);

    constructor(dataType, crcMask) {
        super(dataType);
        this.crcMask = crcMask;
    }

    static from(buffer, dataType) {
        if(buffer.length!==12)
            return null;

        let packetClass = dataType === Packet.DATA_TYPE_VOICE_HEADER ? require('./VoiceHeader') : require('./VoiceTerminator');
        let pkt = new packetClass;

        let d = Array.from(buffer);

        d[9] ^= (pkt.crcMask >> 16) & 0xFF;
        d[10] ^= (pkt.crcMask >> 8) & 0xFF;
        d[11] ^= pkt.crcMask & 0xFF;

        let syndrome = RS129.calcSyndrome(d);

        if(syndrome===null)
            return null;

        if(RS129.checkSyndrome(syndrome)) {
            let errorsCount;
            [errorsCount, d] = RS129.correct(d, syndrome);

            if(d===null)
                return null;
        }


        pkt.LC = LinkControl.from(buffer.subarray(0, 9));

        if(pkt.LC===null)
            return null;

        return pkt;
    }

    getBuffer() {
        let data = Array.from(this.LC.getBuffer());
        let checksum = Array.from(RS129.calcChecksum(data));

        data = data.concat(checksum);

        data[9] ^= (this.crcMask >> 16) & 0xFF;
        data[10] ^= (this.crcMask >> 8) & 0xFF;
        data[11] ^= this.crcMask & 0xFF;

        return Buffer.from(data);
    }
}

module.exports = VoiceBase;