const VoiceBase = require("./VoiceBase");
const Packet = require("./Packet");

class VoiceHeader extends VoiceBase {
    static CRC_MASK = 0x969696;

    constructor() {
        super(Packet.DATA_TYPE_VOICE_HEADER, VoiceHeader.CRC_MASK);
    }
}

module.exports = VoiceHeader;