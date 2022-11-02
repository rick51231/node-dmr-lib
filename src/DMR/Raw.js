const Packet = require("./Packet");

class Raw extends Packet {
    data;
    constructor(buffer, dataType) {
        super(dataType);

        this.data = buffer;
    }

    static from(buffer, dataType) {
        return new Raw(buffer, dataType);
    }

    getBuffer() {
        return this.data;
    }
}

module.exports = Raw;