const DMRConst = require('../DMRConst');

class Raw {
    rawData = Buffer.alloc(12);
    dataType;

    constructor(buffer) {
        this.rawData = buffer;
    }

    static fromBuffer(buffer, dataType) {
        let constructor;

        if(dataType===DMRConst.DT_CSBK)
            constructor = require('./CSBK');
        else if(dataType===DMRConst.DT_DATA_HEADER)
            constructor = require('./DataHeader');
        else
            constructor = Raw;

        let packet = new constructor(buffer);

        packet.dataType = dataType;

        return packet;
    }

    getBuffer() {
        return this.rawData;
    }
}

module.exports = Raw;