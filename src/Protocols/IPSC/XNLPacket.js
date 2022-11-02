const Packet = require('./Packet');
const XNL = require('../../Protocols/XNL');

class XNLPacket extends Packet {
    xnl = new XNL();

    constructor(xnl) {
        super(Packet.XNL_PACKET);
        this.xnl = xnl;
    }

    static from(buffer) {
        if(buffer.length<1)
            return null;

        let xnl = XNL.from(buffer);

        if(xnl===null)
            return null;

        return new XNLPacket(xnl);
    }

    getBuffer() {
        let xnlBuffer = this.xnl.getBuffer();

        return super.getBuffer(xnlBuffer);
    }
}

module.exports = XNLPacket;