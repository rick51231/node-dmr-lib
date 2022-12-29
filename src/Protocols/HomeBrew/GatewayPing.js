const Packet = require('./Packet');

class GatewayPing extends Packet {
    constructor() {
        super(Packet.GATEWAY_PING);
    }

    static from(buffer) {
        return new GatewayPing();
    }
}


module.exports = GatewayPing;