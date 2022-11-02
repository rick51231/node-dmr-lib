class Rtp {
    static HEADER_SIZE = 12;

    version = 0;
    padding = false;
    extension = false;
    csrcCount = 0;
    marker = false; //  = isFirstPacket,
    payloadType = 0; //  (isLastPacket ? (byte) 94 : (byte) 93),
    seq = 0;
    timestamp = 0;
    ssrc = 0;
    payloadOffset = 0;

    constructor() {

    }

    static from(buffer) {
        if(buffer.length < Rtp.HEADER_SIZE)
            return null;

        let rtp = new Rtp();

        let b0 = buffer.readUInt8(0);

        rtp.version =   (b0 & 0b11000000) >>> 6;
        rtp.padding =   (b0 & 0b00100000) > 0;
        rtp.extension = (b0 & 0b00010000) > 0;
        rtp.csrcCount = (b0 & 0b00001111);

        let b1 = buffer.readUInt8(1);

        rtp.marker =      (b1 & 0b10000000) > 0;
        rtp.payloadType = (b1 & 0b01111111);

        rtp.seq = buffer.readUInt16BE(2);
        rtp.timestamp = buffer.readUInt32BE(4);
        rtp.ssrc = buffer.readUInt32BE(8);

        let extensionLen = 0; //TODO: fix it
        let extensionOffset = rtp.getExtensionOffset();
        rtp.payloadOffset = extensionOffset + (rtp.extension ? 4 + extensionLen : 0);
        // let payloadSize = buffer.length - payloadOffset;

        if(rtp.extension)
            throw new Error("[IPSC/rtp] Found extension "+buffer.toString('hex'));

        if(rtp.csrcCount > 0)
            throw new Error("[IPSC/rtp] Found csrcCount "+buffer.toString('hex'));

        return rtp;
    }

    getBuffer() {
        let buffer = Buffer.alloc(Rtp.HEADER_SIZE + this.csrcCount*4); //TODO: calc extesions

        let b0 = 0;

        b0 |= (this.version<<6) & 0b11000000;

        if(this.padding)
            b0 |= 0b00100000;
        if(this.extension)
            b0 |= 0b00010000;

        b0 |= this.csrcCount & 0b00001111;

        buffer.writeUInt8(b0, 0);

        let b1 = 0;

        if(this.marker)
            b1 |= 0b10000000;

        b1 |= this.payloadType & 0b01111111;

        buffer.writeUInt8(b1, 1);

        buffer.writeUInt16BE(this.seq, 2);
        buffer.writeUInt32BE(this.timestamp, 4);
        buffer.writeUInt32BE(this.ssrc, 8);

        return buffer;
    }

    getExtensionOffset() {
        let csrcOffset = Rtp.HEADER_SIZE;
        return csrcOffset + this.csrcCount*4;
    }
}

module.exports = Rtp;