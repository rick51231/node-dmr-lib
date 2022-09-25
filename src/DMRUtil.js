"use strict";

const Iconv  = require('iconv').Iconv;
const CRC = require('crc-full').CRC;

module.exports.decode_sms = (new Iconv('UTF-16LE', 'UTF-8')).convert;
module.exports.encode_sms = (new Iconv('UTF-8', 'UTF-16LE')).convert;
module.exports.crc = new CRC("CRC16", 16, 0x1021, 0x0000, 0xFFFF, false, false);

module.exports.bitsToBuffer = function(bitsStr) {
    let buffer = Buffer.alloc(Math.ceil(bitsStr.length / 8));

    for (let c = 0; c < bitsStr.length; c += 8)
        buffer.writeUInt8(parseInt(bitsStr.substr(c, 8).padEnd(8, '0'), 2), c / 8); //padEnd need because last byte can be without trailing zeroes

    return buffer;
};

module.exports.bufferToBits = function(buffer) {
    let bitsStr = '';

    for(let i = 0; i < buffer.length; i++)
        bitsStr += ("00000000" + (buffer.readUInt8(i)>>>0).toString(2)).substr(-8);

    return bitsStr;
};

module.exports.crc32 = function(_crc, byte) {
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
};

module.exports.crc32end = function(_crc) {
    let crc = _crc;
    for(let i = 0; i < 32; i++) {
        let xor = (crc & 0x80000000) !== 0;

        crc <<= 1;

        if(xor)
            crc ^= 0x04c11db7;
    }
    crc &= 0xFFFFFFFF;

    return crc;
};

module.exports.crc16 = function(_crc, byte) {
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
};


module.exports.crc16end = function(_crc) {
    let crc = _crc;
    for(let i = 0; i < 16; i++) {
        let xor = (crc & 0x8000) !== 0;

        crc <<= 1;

        if(xor)
            crc ^= 0x1021;
    }
    crc &= 0xFFFF;
    return crc;
};


module.exports.packetCRC32 = function(buffer, length) {
    let crc = 0;

    if(length===undefined)
        length = buffer.length;

    for (let i = 0; i < length; i+=2) {
        crc = module.exports.crc32(crc, i+1 >= length ? 0 : buffer.readUInt8(i + 1));
        crc = module.exports.crc32(crc, buffer.readUInt8(i));

    }

    crc = module.exports.crc32end(crc);

    return crc>>>0;
};