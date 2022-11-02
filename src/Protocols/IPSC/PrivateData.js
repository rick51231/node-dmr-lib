const VoiceDataCall = require('./VoiceDataCall');
const Packet = require('./Packet');

class PrivateData extends VoiceDataCall {
    constructor() {
        super(Packet.PRIVATE_DATA);
    }
}

module.exports = PrivateData;