const VoiceDataCall = require('./VoiceDataCall');
const Packet = require('./Packet');

class PrivateVoice extends VoiceDataCall {
    constructor() {
        super(Packet.PRIVATE_VOICE);
    }
}

module.exports = PrivateVoice;