const CSBK = require("../CSBK");

class Raw extends CSBK {
    data;
    constructor(data, opcode) {
        super(opcode);
        this.data = data;
    }

    static from(buffer, opcode) {
        if(buffer.length!==8)
            return null;

        return new Raw(buffer, opcode);
    }

    getBuffer() {
        return super.getBuffer(this.data);
    }
}

module.exports = Raw;