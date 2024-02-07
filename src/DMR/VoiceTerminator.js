const VoiceBase = require("./VoiceBase");
const Packet = require("./Packet");

class VoiceTerminator extends VoiceBase {
    static CRC_MASK = 0x999999;

    constructor() {
        super(Packet.DATA_TYPE_VOICE_TERMINATOR, VoiceTerminator.CRC_MASK);
    }
}

module.exports = VoiceTerminator;