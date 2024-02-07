const DMRPayload = require("./DMRPayload");
const BitUtils = require("../../../BitUtils");
const {LinkControl} = require("../../../DMR");

class DMRVoicePayload  extends DMRPayload {
    static MIN_SIZE = 22;

    cryptoReady = false;
    lengthToFollow = 0;
    embLCPariry = false;
    sync = false;
    nullLC = false;
    embLCPresent = false;
    ignoreSigBits = false;
    embPresent = false;
    embLCHardBitsPresent = false;
    badVoiceBit1 = false;
    badVoiceBit2 = false;
    badVoiceBit3 = false;

    ambe1 = ''; //49 bit AMBE
    ambe2 = '';
    ambe3 = '';

    //Additional
    embLCHardBits = Buffer.alloc(0);
    embLC = null;
    cryptoParamIV = Buffer.alloc(0);
    cryptoParamKeyId = 0;
    cryptoParamAlgoId = 0;
    embColorCode = 0;
    embPI = false;
    embLCSS = 0;

    static from(buffer, pduDataType) {
        let voice = new DMRVoicePayload(pduDataType);
        let bits = BitUtils.bufferToBitsArray(buffer);

        voice.pduSlot = bits[0] ? 1 : 0;
        voice.cryptoReady = bits[1];
        voice.lengthToFollow = buffer.readUInt8(1);//27

        //Control flags
        voice.embLCPariry = bits[16]; //(bytes[3] & 0b10000000) > 0;
        voice.sync = bits[17]; //(bytes[3] & 0b01000000) > 0;
        voice.nullLC = bits[18]; //(bytes[3] & 0b00100000) > 0;
        voice.embLCPresent = bits[19]; //(bytes[3] & 0b00010000) > 0;
        voice.ignoreSigBits = bits[20]; //(bytes[3] & 0b00001000) > 0;
        voice.embPresent = bits[21]; //(bytes[3] & 0b00000100) > 0;
        voice.embLCHardBitsPresent = bits[22]; //(bytes[3] & 0b00000010) > 0;


        voice.badVoiceBit1 = bits[23]; //(bytes[3] & 0b00000001) > 0;
        voice.badVoiceBit2 = bits[73];
        voice.badVoiceBit3 = bits[123];

        voice.ambe1 = BitUtils.bitsArrayToStr(bits.slice(24, 24+49)).padStart(49, '0');
        voice.ambe2 = BitUtils.bitsArrayToStr(bits.slice(74, 74+49)).padStart(49, '0');
        voice.ambe3 = BitUtils.bitsArrayToStr(bits.slice(124, 124+49)).padStart(49, '0');

        let offset = DMRVoicePayload.MIN_SIZE;

        if(voice.embLCHardBitsPresent) {
            voice.embLCHardBits = buffer.subarray(offset, offset+4);
            offset += 4;
            //TODO:
        }

        if(voice.embLCPresent) {
            voice.embLC =  LinkControl.from(buffer.subarray(offset, offset+9));
            offset += 9;
        }

        if(voice.embPresent) {
            let b = buffer.readUInt8(offset);

            voice.embColorCode = (b & 0b11110000) >> 4;
            voice.embPI = (b & 0b00001000) > 0;
            voice.embLCSS = (b & 0b00000110) >> 2;

            offset += 1;
        }

        if(voice.cryptoReady) {
            voice.cryptoParamIV = buffer.subarray(offset, offset+4);
            voice.cryptoParamKeyId = buffer.readUInt8(offset+4);
            voice.cryptoParamAlgoId = (buffer.readUInt8(offset+5) & 0b11100000) >> 5;
            offset += 6;
        }

        return voice;
    }

    getBuffer() {
        let bitsArray = (new Array(DMRVoicePayload.MIN_SIZE * 8)).fill(false);

        bitsArray[0] = this.pduSlot===1;
        bitsArray[1] = this.cryptoReady;
        bitsArray[16] = this.embLCPariry;
        bitsArray[17] = this.sync;
        bitsArray[18] = this.nullLC;
        bitsArray[19] = this.embLCPresent;
        bitsArray[20] = this.ignoreSigBits;
        bitsArray[21] = this.embPresent;
        bitsArray[22] = this.embLCHardBitsPresent;

        bitsArray[23] = this.badVoiceBit1;
        bitsArray[73] = this.badVoiceBit2;
        bitsArray[123] = this.badVoiceBit3;

        let ambe1 = BitUtils.strToBitsArray(this.ambe1);
        let ambe2 = BitUtils.strToBitsArray(this.ambe2);
        let ambe3 = BitUtils.strToBitsArray(this.ambe3);


        DMRVoicePayload.copyArray(ambe1, bitsArray, 0, 24, 49);
        DMRVoicePayload.copyArray(ambe2, bitsArray, 0, 74, 49);
        DMRVoicePayload.copyArray(ambe3, bitsArray, 0, 124, 49);

        let buffers = [BitUtils.bitsArrayToBuffer(bitsArray)];

        buffers[0].writeUInt8(this.lengthToFollow, 1);

        if(this.embLCHardBitsPresent)
            buffers.push(this.embLCHardBits);

        if(this.embLCPresent)
            buffers.push(this.embLC.getBuffer());

        if(this.embPresent) {
            let b = 0;

            b |= (this.embColorCode << 4) & 0b11110000;
            b |= (this.embLCSS << 2) & 0b00000110;

            if(this.embPI)
                b |= 0b00001000;

            buffers.push(Buffer.from([b]));
        }

        if(this.cryptoReady) {
            buffers.push(this.cryptoParamIV);

            let params = [this.cryptoParamKeyId, (this.cryptoParamAlgoId << 5) & 0b11100000];

            buffers.push(Buffer.from([params]));
        }

        return super.getBuffer(Buffer.concat(buffers));
    }

    static copyArray(src, dst, srcOffset, dstOffset, length) {
        for(let i = 0; i < length; i++) {
            dst[dstOffset+i] = src[srcOffset+i];
        }
    }
}

module.exports = DMRVoicePayload;