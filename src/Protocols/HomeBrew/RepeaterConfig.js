const Packet = require('./Packet');

class RepeaterConfig extends Packet {
    callsign = '';
    rxFreq = 0;
    txFreq = 0;
    power = 0;
    colorCode = 0;
    latitude = 0;
    longitude = 0;
    height = 0;
    location = '';
    description = '';
    slots = 0;
    url = '';
    software = '';
    package = '';

    constructor() {
        super(Packet.TYPE_RPTC);
    }

    static from(buffer) {
        if(buffer.length!==294)
            return null;

        let pkt = new RepeaterConfig();
        let bufferStr = buffer.toString('binary');

        pkt.callsign = bufferStr.substr(0,8).trimRight();
        pkt.rxFreq = parseInt(bufferStr.substr(8, 9), 10);
        pkt.txFreq = parseInt(bufferStr.substr(17, 9), 10);
        pkt.power = parseInt(bufferStr.substr(26, 2), 10);
        pkt.colorCode = parseInt(bufferStr.substr(28, 2), 10);
        pkt.latitude = parseFloat(bufferStr.substr(30, 8));
        pkt.longitude = parseFloat(bufferStr.substr(38, 9));
        pkt.height = parseInt(bufferStr.substr(47, 3), 10);
        pkt.location = bufferStr.substr(50, 20).trimRight();
        pkt.description = bufferStr.substr(70, 19).trimRight();
        pkt.slots = parseInt(bufferStr.substr(89, 1), 10);
        pkt.url = bufferStr.substr(90, 124).trimRight();
        pkt.software = bufferStr.substr(214, 40).trimRight();
        pkt.package = bufferStr.substr(254, 40).trimRight();

        return pkt;
    }

    getBuffer() {
        let str = '';

        str += this.callsign.padEnd(8, ' ');
        str += this.rxFreq.toString(10);
        str += this.txFreq.toString(10);
        str += this.power.toString(10).padStart(2, '0');
        str += this.colorCode.toString(10).padStart(2, '0');
        str += this.latitude.toString(10).padEnd(8, '0');
        str += this.longitude.toString(10).padEnd(9, '0');
        str += this.height.toString(10).padStart(3, '0');
        str += this.location.padEnd(20, ' ');
        str += this.description.padEnd(19, ' ');
        str += this.slots.toString(10);
        str += this.url.padEnd(124, ' ');
        str += this.software.padEnd(40, ' ');
        str += this.package.padEnd(40, ' ');


        return super.getBuffer(Buffer.from(str, 'binary'));
    }
}


module.exports = RepeaterConfig;