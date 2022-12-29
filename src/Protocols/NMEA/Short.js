const Base = require('./Base');

// https://www.etsi.org/deliver/etsi_ts/102300_102399/10236104/01.08.01_60/ts_10236104v010801p.pdf (page 262)
class Short extends Base {
    hour = 0;
    minute = 0;
    seconds_3 = 0; // UTC time 10's seconds ([0 to 5] x 10)

    static from(buffer) {
        let d = Array.from(buffer);

        let nmea = super.from(d, new Short());

        if(nmea===null)
            return null

        nmea.hour = (d[8] & 0b00111110) >>> 1;
        nmea.minute = (d[8] & 0b00000001) | ((d[9] & 0b11111000) >>> 3);
        nmea.seconds_3 = (d[9] & 0b00000111);

        return nmea;
    }

    getBuffer() {
        let d = super.getBuffer();

        d[8] |= (this.hour << 1) & 0b00111110;
        d[8] |= this.minute & 0b00000001;
        d[9] |= (this.minute << 3) & 0b11111000;
        d[9] |= this.seconds_3 & 0b00000111;

        return Buffer.from(d);
    }
}

module.exports = Short;