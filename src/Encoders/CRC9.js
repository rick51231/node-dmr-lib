class CRC9 {
    static compute(buffer, serial) {
        let crc = 0;
        for(let i = 0; i < buffer.length; i++) {
            crc = this.crc9(crc, buffer.readUInt8(i), 8);
        }

        crc = this.crc9(crc, serial, 7);
        crc = this.crc9end(crc, 8);

        crc = 0xFFFF - crc; // crc = ^crc;

        crc &= 0x01FF;

        return crc;
    }

    static crc9(crc, byte, bits) {
        let v = 0x80;

        for(let i = 0; i < 8-bits; i++) {
            v >>= 1;
        }

        for(let i = 0; i < 8; i++) {
            let xor = (crc & 0x0100) > 0;

            crc <<= 1;
            crc &= 0x01FF;

            if((byte & v) > 0)
                crc++;

            if(xor)
                crc ^= 0x0059;

            v >>= 1;
        }

        return crc;
    }

    static crc9end(crc, bits) {
        for(let i = 0; i < bits; i++) {
            let xor = (crc & 0x100) > 0;

            crc <<= 1;
            crc &= 0x01FF;

            if(xor)
                crc ^= 0x0059;
        }

        return crc;
    }
}

module.exports = CRC9;