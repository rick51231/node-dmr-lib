class CRC16 {
    static compute(buffer) {
        let crc = 0;

        for (let i = 0; i < buffer.length; i++) {
            crc = this.crc16(crc, buffer.readUInt8(i));
        }

        crc = this.crc16end(crc);

        crc = 0xFFFF - crc; // crc = ^crc;

        return crc>>>0;
    }

    static crc16(_crc, byte) {
        let crc = _crc;
        let v = 0x80;

        for(let i = 0; i < 8; i++) {
            let xor = (crc & 0x8000) !== 0;
            crc <<= 1;

            if((byte & v) > 0)
                crc++;

            if(xor)
                crc ^= 0x1021;

            v >>= 1;
        }

        crc &= 0xFFFF;

        return crc;
    }


    static crc16end(_crc) {
        let crc = _crc;
        for(let i = 0; i < 16; i++) {
            let xor = (crc & 0x8000) !== 0;

            crc <<= 1;

            if(xor)
                crc ^= 0x1021;
        }
        crc &= 0xFFFF;
        return crc;
    }
}

module.exports = CRC16;