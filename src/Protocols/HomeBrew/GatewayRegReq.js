const Packet = require('./Packet');

class GatewayRegReq extends Packet {
    callsign = '';
    rxFreq = 0;
    txFreq = 0;
    power = 0;
    colorCode = 0;
    slots = 0;
    version = '';
    software = '';

    constructor() {
        super(Packet.GATEWAY_REG_REQ);
    }

    static from(buffer) {
        if(buffer.length!==111)
            return null;

        let dmrc = new GatewayRegReq();
        let bufferStr = buffer.toString('binary');

        dmrc.callsign = bufferStr.substr(0,8).trimRight();
        dmrc.rxFreq = parseInt(bufferStr.substr(8, 9), 10);
        dmrc.txFreq = parseInt(bufferStr.substr(17, 9), 10);
        dmrc.power = parseInt(bufferStr.substr(26, 2), 10);
        dmrc.colorCode = parseInt(bufferStr.substr(28, 2), 10);
        dmrc.slots = parseInt(bufferStr.substr(30, 1), 10); //TODO: check it
        dmrc.version = bufferStr.substr(31, 40).trimRight();
        dmrc.software = bufferStr.substr(71, 40).trimRight();

        return dmrc;
    }

    getBuffer() {
        let str = '';

        str += this.callsign.padEnd(8, ' ');
        str += this.rxFreq.toString(10);
        str += this.txFreq.toString(10);
        str += this.power.toString(10).padStart(2, '0');
        str += this.colorCode.toString(10).padStart(2, '0');
        str += this.slots.toString(10);
        str += this.version.padEnd(40, ' ');
        str += this.software.padEnd(40, ' ');

        return super.getBuffer(Buffer.from(str, 'binary'));
    }
}


module.exports = GatewayRegReq;