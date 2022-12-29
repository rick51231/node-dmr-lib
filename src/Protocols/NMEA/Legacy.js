const Base = require('./Base');
const CRC16 = require("../../Encoders/CRC16");

// Used in chinese Ailunce and TYT radios

class Legacy extends Base {
    // TYT - in my case MD390 model used a static 0xBE7E sequence instead of CRC
    static AILUNCE_CRC_MASK = 0xFFFF; //HD1 GPS model

    alt = 0;
    crcMask;

    static from(buffer, crcMask) {
        let d = Array.from(buffer);

        let nmea = super.from(d, new Legacy());

        if(nmea===null)
            return null

        nmea.alt = ((d[8] & 0x3F) << 8) | d[9];

        if(crcMask!==undefined) {
            let packetCRC = buffer.readUInt16BE(10);
            let bufferCRC = CRC16.compute(buffer.subarray(0, 10)) ^ crcMask;

            if(packetCRC!==bufferCRC)
                return null;

            nmea.crcMask = crcMask;
        }

        return nmea;
    }

    getBuffer() {
        let d = super.getBuffer();

        d[8] |= (this.alt >> 8) & 0x3F;
        d[9] |= this.alt & 0xFF;

        let ret = Buffer.from(d);

        if(this.crcMask!==undefined) {
            let crc = CRC16.compute(ret) ^ this.crcMask;
            let crcBuffer = Buffer.alloc(2);
            crcBuffer.writeUInt16BE(crc, 0);

            ret = Buffer.concat([ret, crcBuffer]);
        }

        return ret;
    }
}

module.exports = Legacy;