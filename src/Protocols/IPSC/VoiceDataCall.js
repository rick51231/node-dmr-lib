const Packet = require('./Packet');
const RtpPacket = require('./types/Rtp');
const DMRPayload = require('./types/DMRPayload');

//TODO: 80000000140000274a0000ff00000064a500805dfab805f327a00000000001000008100000600000080000ff00274a000000 - invalid with possible included LRRP on PTT press

class VoiceDataCall extends Packet {
    streamId = 0; //CallSeq
    src_id = 0;
    dst_id = 0;
    callPriority = 0;
    floorControlTag = 0;

    secure = false;
    slot = 0; // channelNumber
    lastPacket = false;
    phoneCall = false;

    rtp = new RtpPacket();
    dmrPayload = new DMRPayload();

    constructor(type) {
        super(type);
    }

    static from(buffer, dataType) {
        if(buffer.length < 13)
            return null;
        let callClass;

        switch(dataType) {
            case Packet.GROUP_DATA:
                callClass = require('./GroupData');
                break;
            case Packet.PRIVATE_DATA:
                callClass = require('./PrivateData');
                break;
            case Packet.GROUP_VOICE:
                callClass = require('./GroupVoice');
                break;
            case Packet.PRIVATE_VOICE:
                callClass = require('./PrivateVoice');
                break;
            default:
                return null;
        }

        let call = new callClass();

        call.streamId = buffer.readUInt8(0);

        call.src_id = (buffer.readUInt8(1) << 16) + buffer.readUInt16BE(2);
        call.dst_id = (buffer.readUInt8(4) << 16) + buffer.readUInt16BE(5);

        call.callPriority = buffer.readUInt8(7);
        call.floorControlTag = buffer.readUInt32BE(8);

        let callInfo = buffer.readUInt8(12);

        call.secure =     (callInfo & 0b10000000) > 0;
        call.lastPacket = (callInfo & 0b01000000) > 0;
        call.slot =       (callInfo & 0b00100000) >>> 5;
        call.phoneCall =  (callInfo & 0b00010000) > 0;

        let rtpOffset = 13;

        call.rtp = RtpPacket.from(buffer.slice(rtpOffset, buffer.length));

        if(call.rtp === null || rtpOffset+call.rtp.payloadOffset >= buffer.length)
            return null;

        call.dmrPayload = DMRPayload.from(buffer.slice(rtpOffset+call.rtp.payloadOffset, buffer.length));

        if(call.dmrPayload===null)
            return null;

        return call;
    }

    getBuffer() {
        let buffer = Buffer.alloc(13);

        buffer.writeUInt8(this.streamId, 0);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 1); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 2);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 4); //dst HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 5);

        buffer.writeUInt8(this.callPriority, 7);
        buffer.writeUInt32BE(this.floorControlTag, 8);

        let callInfo = 0;

        if(this.secure)
            callInfo |= 0b10000000;
        if(this.lastPacket)
            callInfo |= 0b01000000;
        if(this.phoneCall)
            callInfo |= 0b00010000;

        callInfo |= (this.slot << 5) & 0b00100000;

        buffer.writeUInt8(callInfo, 12);

        let packetBuffers = Buffer.concat([
            buffer,
            this.rtp.getBuffer(),
            this.dmrPayload.getBuffer()
        ]);

        return super.getBuffer(packetBuffers);
    }
}

module.exports = VoiceDataCall;