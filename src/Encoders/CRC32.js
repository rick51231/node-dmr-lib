class CRC32 {
    static compute(buffer) {
        let crc = 0;

        for (let i = 0; i < buffer.length; i+=2) {
            crc = this.crc32(crc, i+1 >= buffer.length ? 0 : buffer.readUInt8(i + 1));
            crc = this.crc32(crc, buffer.readUInt8(i));

        }

        crc = this.crc32end(crc);

        return crc>>>0;
    }

    static crc32(_crc, byte) {
        let crc = _crc;
        let v = 0x80;

        for(let i = 0; i < 8; i++) {
            let xor = (crc & 0x80000000) !== 0;
            crc <<= 1;

            if((byte & v) > 0)
                crc++;

            if(xor)
                crc ^= 0x04c11db7;

            v >>= 1;
        }

        crc &= 0xFFFFFFFF;

        return crc;
    }

    static crc32end(_crc) {
        let crc = _crc;
        for(let i = 0; i < 32; i++) {
            let xor = (crc & 0x80000000) !== 0;

            crc <<= 1;

            if(xor)
                crc ^= 0x04c11db7;
        }
        crc &= 0xFFFFFFFF;

        return crc;
    }
}

module.exports = CRC32;