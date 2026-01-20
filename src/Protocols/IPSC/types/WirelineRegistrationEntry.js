class WirelineRegistrationEntry {
    static ADDRESS_TYPE_INDIVIDUAL = 0x01;
    static ADDRESS_TYPE_GROUP = 0x02;
    static ADDRESS_TYPE_ALL_INDIVIDUAL = 0x03;
    static ADDRESS_TYPE_ALL_TALKGROUPS = 0x04;
    static ADDRESS_TYPE_ALL_WIDE_TALKGROUPS = 0x05;
    static ADDRESS_TYPE_ALL_LOCAL_TALKGROUPS = 0x06;

    addressType = WirelineRegistrationEntry.ADDRESS_TYPE_INDIVIDUAL;
    rangeStart;
    rangeEnd;
    //TODO: create ServiceStatus for each (0x80 - registration, 0x40 - monitor)
    voiceRegistration;
    voiceMonitor;
    csbkRegistration;
    csbkMonitor;
    dataRegistration;
    dataMonitor;

    static from(buffer) {
        if(buffer.length!==12)
            return null;

        let entry = new WirelineRegistrationEntry();

        entry.addressType = buffer.readUInt8(0);
        entry.rangeStart = buffer.readUInt32BE(1);
        entry.rangeEnd = buffer.readUInt32BE(5);

        let b9 = buffer.readUInt8(9);

        entry.voiceRegistration = (b9 & 0x80) > 0;
        entry.voiceMonitor = (b9 & 0x40) > 0;

        let b10 = buffer.readUInt8(10);

        entry.csbkRegistration = (b10 & 0x80) > 0;
        entry.csbkMonitor = (b10 & 0x40) > 0;

        let b11 = buffer.readUInt8(11);

        entry.dataRegistration = (b11 & 0x80) > 0;
        entry.dataMonitor = (b11 & 0x40) > 0;

        return entry;
    }

    getBuffer() {
        let d = Buffer.alloc(12);

        d.writeUInt8(this.addressType, 0);
        d.writeUInt32BE(this.rangeStart, 1)
        d.writeUInt32BE(this.rangeEnd, 5);

        let b9 = 0;
        if(this.voiceRegistration)
            b9 |= 0x80;
        if(this.voiceMonitor)
            b9 |= 0x40;
        d.writeUInt8(b9, 9);

        let b10 = 0;
        if(this.csbkRegistration)
            b10 |= 0x80;
        if(this.csbkMonitor)
            b10 |= 0x40;
        d.writeUInt8(b10, 10);

        let b11 = 0;
        if(this.dataRegistration)
            b11 |= 0x80;
        if(this.dataMonitor)
            b11 |= 0x40;
        d.writeUInt8(b11, 11);

        return d;
    }

}

module.exports = WirelineRegistrationEntry;