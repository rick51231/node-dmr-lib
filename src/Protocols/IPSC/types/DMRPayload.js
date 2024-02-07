class DMRPayload {
    static DATA_TYPE_PI_HEADER = 0;
    static DATA_TYPE_VOICE_HEADER = 1;
    static DATA_TYPE_VOICE_TERMINATOR = 2;
    static DATA_TYPE_CSBK = 3;
    static DATA_TYPE_DATA_HEADER = 6;
    static DATA_TYPE_UNCONFIRMED_DATA_CONT = 7; // Rate 1/2
    static DATA_TYPE_CONFIRMED_DATA_CONT = 8; // Rate 3/4
    static DATA_TYPE_VOICE = 10; //Or Rate 1

    //TODO:
    //DATA_TYPE_SYNC_UNDETECT = 19, //840000000aa000273b0027730100003a7a00805daa7659f6b5b0000000000a1441f1f8c6ffe437e5b9843948fff7e8486be437a8
    //DATA_TYPE_VOICE_INTERRUPT = 20
    //DATA_TYPE_VOICE_INTERRUPT = 36 // or BACKWARD_CHANNEL ?
    //DATA_TYPE_VOICE_PLUS = 39

    static SYNC_NOT_DETECTED = 0;
    static SYNC_VOICE = 1;
    static SYNC_DATA = 2;
    /*
      public enum DataType
  {
    PIHeader,
    VoiceLCHeader,
    TerminatorWithLC,
    CSBK,
    MBCHeader,
    MBCContinuation,
    DataHeader,
    Rate_1_2_Data,
    Rate_3_4_Data,
    Idle,
    Rate_1_Data,
    Reserved_0x0B,
    Reserved_0x0C,
    Reserved_0x0D,
    Reserved_0x0E,
    Reserved_0x0F,
  }
     */

    
    pduDataType;
    pduSlot = 0;

    constructor(pduDataType) {
        this.pduDataType = pduDataType;
    }

    static from(buffer) {
        if(buffer.length<=6)
            return null;

        let pduDataType = (buffer.readUInt8(0) & 0b00111111);
        let dmr;

        if(pduDataType===DMRPayload.DATA_TYPE_VOICE) { //TODO: check rate 1 data
            dmr = require('./DMRVoicePayload').from(buffer, pduDataType);
        } else {
            dmr = require('./DMRDataPayload').from(buffer, pduDataType);
        }
        return dmr;
    }

    getBuffer(fixBuffer) {
        fixBuffer.writeUInt8(this.pduDataType & 0b00111111, 0);

        return fixBuffer;
    }
}

module.exports = DMRPayload;