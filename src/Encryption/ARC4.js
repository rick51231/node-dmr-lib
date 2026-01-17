class ARC4 {
    s = [];
    i = 0;
    j = 0;
    curBit = 0;
    curByte = 0;
    key = [];

    constructor(key) {
        this.key = Array.from(key);
    }

    setIV(iv) {
        this.s = new Uint8Array(256);
        this.i = 0;
        this.j = 0;
        this.curBit = 0;
        this.curByte = 0;

        for(this.i = 0; this.i < 256; ++this.i) {
            this.s[this.i] = this.i;
        }

        let ivBuffer = Buffer.alloc(4);
        ivBuffer.writeUInt32BE(iv);

        let intKey = this.key.concat(Array.from(ivBuffer));

        for(let i = 0; i < 256; ++i) {
            this.j = (( this.j +  this.s[ i] + intKey[ i % intKey.length]) % 256);
            let num = this.s[i];
            this.s[i] = this.s[this.j];
            this.s[this.j] = num;
        }

        this.i = 0;
        this.j = 0;

        for(let i = 0; i < 256; ++i) {
            this.nextByte();
        }

        this.curBit = 8;
    }

    processBuffer(buffer) {
        let processedBuffer = Buffer.alloc(buffer.length);

        for(let i = 0; i < buffer.length; i++) {
            processedBuffer.writeUInt8(buffer.readUInt8(i) ^ this.nextByte(), i);
        }

        return processedBuffer;
    }

    nextBit() {
        if(this.curBit > 7) {
            this.i = (( this.i + 1) % 256);
            this.j =  (( this.j +  this.s[ this.i]) % 256);
            let num = this.s[ this.j];
            this.s[ this.j] = this.s[ this.i];
            this.s[ this.i] = num;
            this.curByte = this.s[( this.s[ this.i] +  this.s[ this.j]) % 256];
            this.curBit =  0;
        }
        let num1 = ( this.curByte >>> 7 -  this.curBit & 1) === 1 ? 1 : 0;
        ++this.curBit;
        return num1 !== 0;
    }

    nextByte() {
        this.curBit = 8;
        this.nextBit();
        return this.curByte;
    }
}

module.exports = ARC4;