/*
69 2402 804d 04020400
Status info: mode + flags
800000e00804020400

byte 0 - mode
2bit 10 = knockdown 01=enabled 00=disabled / 2 bit 10=digital 01= analog 11=mix / 2 bits TS 1 (10 = IPSC, 01 = local, 00 = disabled)   / 2 bits TS 2 (10 = IPSC, 01 = local, 00 = disabled)

byte 3 - flags1
csbk / rpt mon / 3rd Party "Console" Application /

byte 4 - flags2
xnl con / xnl master / xnl slave / pkt auth ? / data call / voice call / ?? / master

 */



class PeerFlags { //a.k.a. PeerServices
    byte0 = 0x00;
    // 1 bit uknown
    // 1 bit uknown
    // 1 bit uknown
    // 1 bit Slot2Wireline
    // 1 bit Slot1Wireline
    // 1 bit WirelineService
    // 1 bit uknown
    // 1 bit uknown

    byte1 = 0x00;
    // 1 bit Mnis
    // 1 bit IpSiteSingleFrequency
    // 1 bit uknown
    // 1 bit Slot2Phone
    // 1 bit Slot1Phone
    // 1 bit VirtualPeer
    // 1 bit CPSAvaible or FirmwareNet
    // 1 bit uknown

    //Byte 2
    isCSBK = false;
    isRPTMon = false;
    is3rdPartyApp = false;
    byte3RestBits = 0;
    // 1 bit SystemController
    // 2 bits Slot2AssignmentInCP
    // 2 bits Slot1AssignmentInCP


    //Byte 3
    isXNLCon = false;
    isXNLMaster = false;
    isXNLSlave = false;
    isPktAuth = false;
    isDataCall = false;
    isVoiceCall = false;
    byte4bit7 = false;
    isMaster = false;

    static from(buffer) {
        if(buffer.length!==4)
            return null;

        let byteArray = Uint8Array.from(buffer);
        let status = new PeerFlags();


        status.byte0 = byteArray[0];
        status.byte1 = byteArray[1];

        status.isCSBK =        (byteArray[2] & 0b10000000) > 0;
        status.isRPTMon =      (byteArray[2] & 0b01000000) > 0;
        status.is3rdPartyApp = (byteArray[2] & 0b00100000) > 0;
        status.byte3RestBits = (byteArray[2] & 0b00011111);

        status.isXNLCon =    (byteArray[3] & 0b10000000) > 0;
        status.isXNLMaster = (byteArray[3] & 0b01000000) > 0;
        status.isXNLSlave =  (byteArray[3] & 0b00100000) > 0;
        status.isPktAuth =   (byteArray[3] & 0b00010000) > 0;
        status.isDataCall =  (byteArray[3] & 0b00001000) > 0;
        status.isVoiceCall = (byteArray[3] & 0b00000100) > 0;
        status.byte4bit7 =   (byteArray[3] & 0b00000010) > 0;
        status.isMaster =    (byteArray[3] & 0b00000001) > 0;


        return status;
    }

    getBuffer() {
        let byteArray = new Uint8Array(4);

        byteArray[0] = this.byte0;
        byteArray[1] = this.byte1;

        if(this.isCSBK)
            byteArray[2] |= 0b10000000;
        if(this.isRPTMon)
            byteArray[2] |= 0b01000000;
        if(this.is3rdPartyApp)
            byteArray[2] |= 0b00100000;

        byteArray[2] |= this.byte3RestBits & 0b00011111;

        if(this.isXNLCon)
            byteArray[3] |= 0b10000000;
        if(this.isXNLMaster)
            byteArray[3] |= 0b01000000;
        if(this.isXNLSlave)
            byteArray[3] |= 0b00100000;
        if(this.isPktAuth)
            byteArray[3] |= 0b00010000;
        if(this.isDataCall)
            byteArray[3] |= 0b00001000;
        if(this.isVoiceCall)
            byteArray[3] |= 0b00000100;
        if(this.byte4bit7)
            byteArray[3] |= 0b00000010;
        if(this.isMaster)
            byteArray[3] |= 0b00000001;


        return Buffer.from(byteArray);
    }

}

module.exports = PeerFlags;