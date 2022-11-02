const VoiceDataCall = require('./VoiceDataCall');
const Packet = require('./Packet');

class PrivateData extends VoiceDataCall {
    constructor() {
        super(Packet.GROUP_DATA);
    }
}

module.exports = PrivateData;