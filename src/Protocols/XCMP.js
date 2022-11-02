
class XCMP {
    static OPCODE_RADIO_STATUS_REQUEST = 0x000e;
    static OPCODE_RADIO_STATUS_REPLY = 0x800e;

    static STATUS_OK = 0x00;

    // https://github.com/pboyd04/Moto.Net/blob/3364ecfa4f7c1229136b1265313cd42dc8db1c90/Moto.Net/Mototrbo/XNL/XCMP/XCMPStatus.cs
    // ModelNumber = 0x07,
    // SerialNumber = 0x08,
    // RepeaterSerialNumber = 0x0B,
    // RadioID = 0x0E,
    // RadioName = 0x0F, //Only seems to work on repeaters for some reason... very irritating...
    // RadioAlias = 0x0F

    // RDAC params
    static REPEATER_REGISTER_RSSI = 0x02;
    static REPEATER_REGISTER_AC_VOLTAGE = 0x36;
    static REPEATER_REGISTER_DC_CURRENT = 0x37;
    static REPEATER_REGISTER_CONTROL_VOLTAGE = 0x3c;
    static REPEATER_REGISTER_EXCITER_CURRENT_SENSE = 0x3b;
    static REPEATER_REGISTER_BATTERY_CHARGE_CURRENT = 0x34;
    static REPEATER_REGISTER_BATTERY_CHARGE_VOLTAGE = 0x35;
    static REPEATER_REGISTER_BATTERY_VOLTAGE = 0x33;
    static REPEATER_REGISTER_MODEM_CURRENT = 0x39;
    static REPEATER_REGISTER_MODEM_TEMPERATURE = 0x38;
    static REPEATER_REGISTER_MODEM_VOLTAGE = 0x3a;
    static REPEATER_REGISTER_OUTPUT_POWER = 0x42;
    static REPEATER_REGISTER_PA_CURRENT1 = 0x3d;
    static REPEATER_REGISTER_PA_CURRENT2 = 0x3e;
    static REPEATER_REGISTER_PA_CURRENT3 = 0x3f;
    static REPEATER_REGISTER_PA_CURRENT4 = 0x40;
    static REPEATER_REGISTER_PA_TEMPERATURE = 0x41;
    static REPEATER_REGISTER_WSWR = 0x43;


    opcode;
    data;

    constructor(opcode, data) {
        this.opcode = opcode;
        this.data = data;
    }

    static from(buffer) {
        if(buffer.length<2)
            return null;

        let opcode = buffer.readUInt16BE(0);
        let data = buffer.slice(2, buffer.length);

        return new XCMP(opcode, data);
    }

    getBuffer() {
        let buffer = Buffer.alloc(2);

        buffer.writeUInt16BE(this.opcode, 0);

        return Buffer.concat([buffer, this.data]);
    }
}

module.exports = XCMP;
