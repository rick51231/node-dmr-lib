class BitUtils {
    static bitsStrToBuffer(bitsStr) {
        let buffer = Buffer.alloc(Math.ceil(bitsStr.length / 8));

        for (let c = 0; c < bitsStr.length; c += 8)
            buffer.writeUInt8(parseInt(bitsStr.substr(c, 8).padEnd(8, '0'), 2), c / 8); //padEnd need because last byte can be without trailing zeroes

        return buffer;
    };

    static bufferToBitsStr(buffer) {
        let bitsStr = '';

        for(let i = 0; i < buffer.length; i++)
            bitsStr += ("00000000" + (buffer.readUInt8(i)>>>0).toString(2)).substr(-8);

        return bitsStr;
    };
}

module.exports = BitUtils;