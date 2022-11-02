const VoiceDataCall = require('./VoiceDataCall');
const Packet = require('./Packet');

class GroupData extends VoiceDataCall {
    constructor() {
        super(Packet.GROUP_DATA);
    }
}

module.exports = GroupData;