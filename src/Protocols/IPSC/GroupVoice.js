const VoiceDataCall = require('./VoiceDataCall');
const Packet = require('./Packet');

class GroupVoice extends VoiceDataCall {
    constructor() {
        super(Packet.GROUP_VOICE);
    }
}

module.exports = GroupVoice;