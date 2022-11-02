const Packet = require('./Packet');

/*
  public enum RCM_CallType
  {
    PreamblePrivateDataCall = 48, // 0x00000030
    PreambleGroupDataCall = 49, // 0x00000031
    PreamblePrivateCSBKCall = 50, // 0x00000032
    PreambleGroupCSBKCall = 51, // 0x00000033
    PreambleEmergencyCall = 52, // 0x00000034
    EmergencyCSBKAlarmRequest = 64, // 0x00000040
    EmergencyCSBKAlarmResponse = 65, // 0x00000041
    EmergencyVoiceCall = 66, // 0x00000042
    PrivateCallRequest = 67, // 0x00000043
    PrivateCallResponse = 68, // 0x00000044
    CallAlertRequest = 69, // 0x00000045
    CallAlertResponse = 70, // 0x00000046
    RadioCheckRequest = 71, // 0x00000047
    RadioCheckResponse = 72, // 0x00000048
    RadioInhibitRequest = 73, // 0x00000049
    RadioInhibitResponse = 74, // 0x0000004A
    RadioUnInhibitRequest = 75, // 0x0000004B
    RadioUnInhibitResponse = 76, // 0x0000004C
    RadioMonitorRequest = 77, // 0x0000004D
    RadioMonitorResponse = 78, // 0x0000004E
    GroupVoiceCall = 79, // 0x0000004F
    PrivateVoiceCall = 80, // 0x00000050
    GroupDataCall = 81, // 0x00000051
    PrivateDataCall = 82, // 0x00000052
    AllCall = 83, // 0x00000053
    ConfirmedDataResponse = 84, // 0x00000054
    OtherCalls = 85, // 0x00000055
    IPConsoleRadioUnInhibitRequest = 86, // 0x00000056
    IPConsoleRadioInhibitRequest = 87, // 0x00000057
    IPConsoleRadioUnInhibitResponse = 88, // 0x00000058
    IPConsoleRadioInhibitResponse = 89, // 0x00000059
    GroupPhoneCall = 90, // 0x0000005A
    PrivatePhoneCall = 91, // 0x0000005B
    PhoneAllCall = 92, // 0x0000005C
    ArsCsbk = 93, // 0x0000005D
    GpsCsbk = 94, // 0x0000005E
    Unknown = 255, // 0x000000FF
  }
 */


/*
  public enum RCM_CallStatus
  {
    CallStartedSuccessfully = 1,
    CallEndedSuccessfully = 2,
    RaceConditionFailure = 3,
    InvalidOrProhibitedCallFailure = 4,
    DestinationSlotBusyFailure = 5,
    SubscriberDestinationBusyFailure = 6,
    AllChannelsBusyFailure = 7,
    OTARepeatDisabledFailure = 8,
    SignalInterferenceFailure = 9,
    CWIDInProgressFailure = 10, // 0x0000000A
    TOTExpiryPrematureCallEndFailure = 11, // 0x0000000B
    TransmitInterruptedCallFailure = 12, // 0x0000000C
    HigherPriorityCallTakeoverFailure = 13, // 0x0000000D
    OtherUnknownCallFailure = 14, // 0x0000000E
    Unknown = 255, // 0x000000FF
  }
 */

/* //TODO: где это используется? 25 байт?
public enum RCMCallSources : byte
{
	Unknown = byte.MaxValue,
	Radio = 0,
	RemoteSite = 1,
	PhonePatch = 2,
	NAIApplication = 3
}

 */

class RepeaterCallTransmission extends Packet {
    static MFID_STANDART = 0x0;
    static MFID_RESERVED = 0x1;
    static MFID_MOTOROLA_PROPRIETARY = 0x10;

    static SECURITY_CLEAR = 0x0;
    static SECURITY_BASIC = 0x1;
    static SECURITY_ENHANCED = 0x2;
    //AES ??




    sourcePeerId = 0;
    callSeq = 0;
    slot = 0; //Channel number ?
    status = 0; //CallStatus
    src_id = 0;
    dst_id = 0;
    callType = 0;
    callPriority = 0;
    securityType = 0;
    mfId = 0;

    rssi = null;

    constructor() {
        super(Packet.REPEATER_CALL_TRANSMISSION);
    }

    static from(buffer) {
        if(buffer.length!==21 && buffer.length!==26)
            return null;

        let call = new RepeaterCallTransmission();

        call.sourcePeerId = buffer.readUInt32BE(0);
        call.callSeq = buffer.readUInt32BE(4);
        call.slot = buffer.readUInt8(8);
        call.status = buffer.readUInt16BE(9);

        call.src_id = (buffer.readUInt8(11) << 16) + buffer.readUInt16BE(12);
        call.dst_id = (buffer.readUInt8(14) << 16) + buffer.readUInt16BE(15);

        call.callType = buffer.readUInt8(17);
        call.callPriority = buffer.readUInt8(18);
        call.securityType = buffer.readUInt8(19);
        call.mfId = buffer.readUInt8(20);

        if(buffer.length===26) {
            let b23 = buffer.readUInt8(23);
            let b24 = buffer.readUInt8(24);

            if(b23>0 || b24>0)
                call.rssi = -(b23 + (b24 * 1000 + 128) / 256000); //  new double?(-((double) this._block[28] + ((double) this._block[29] * 1000.0 + 128.0) / 256000.0));
        }

        return call;
    }

    getBuffer() {
        let buffer = Buffer.alloc(this.rssi===null ? 21 : 26);

        buffer.writeUInt32BE(this.sourcePeerId, 0);
        buffer.writeUInt32BE(this.callSeq, 4);
        buffer.writeUInt8(this.slot, 8);
        buffer.writeUInt8(this.status, 9);

        buffer.writeUInt8((this.src_id>>16) & 0xFF, 11); //src HI
        buffer.writeUInt16BE(this.src_id & 0xFFFF, 12);

        buffer.writeUInt8((this.dst_id>>16) & 0xFF, 14); //src HI
        buffer.writeUInt16BE(this.dst_id & 0xFFFF, 15);

        buffer.writeUInt8(this.callType, 17);
        buffer.writeUInt8(this.callPriority, 18);
        buffer.writeUInt8(this.securityType, 19);
        buffer.writeUInt8(this.mfId, 20);

        if(this.rssi!==null) { //TODO: validate RSSI calculations
            let rssi = this.rssi * -1;

            let b24 = (rssi/1000 - 128) / 256000;
            let b23 = rssi - b24;

            buffer.writeUInt8(b23, 23);
            buffer.writeUInt8(b23, 24);

        }

        return super.getBuffer(buffer);
    }
}

module.exports = RepeaterCallTransmission;