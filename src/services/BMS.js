const DMRConst = require('../DMRConst');

class BMS {
    constructor() {
        this.type = 0;
        this.reqId = 0;

        //Battery query response
        this.code = 0;
        this.extended = false;
        this.voltage = 0.0;
        this.temperature = 0.0;
        this.charge = 0;
        this.capacityCurrent = 0;
        this.serial = '';
        this.chargeCyclesImpress = 0;
        this.chargeCyclesNonImpress = 0;
        this.calibrationCycles = 0;
        this.chargeAdded = [];
        this.chargeRemaining = [];
        this.ledState = 0;
        this.batteryState = 0;

        //Battery query response - extended
        this.partNumber = '';
        this.capacityRated = 0;


    }

    static from(buffer) {
        let bms = new BMS();

        bms.extended = buffer.length === 112;
        bms.type = buffer.readUInt8(0);

        if(bms.type === DMRConst.BMS_REGISTRATION_REPLY || bms.type === DMRConst.BMS_QUERY_REPLY || bms.type === DMRConst.BMS_QUERY_REQUEST) {
            bms.reqId = buffer.readUInt16LE(1);
        }

        if(bms.type === DMRConst.BMS_QUERY_REPLY) {
            bms.code = buffer.readUInt8(3);

            let offset = bms.extended ? 21 : 0;

            bms.capacityCurrent = buffer.readUInt8(offset + 12) * 23.9375; //TODO: Math.round
            bms.voltage = (buffer.readUInt16LE(offset + 38) + 14) / 100;
            bms.temperature = buffer.readInt8(offset + 41) + buffer.readUInt8(offset + 40) / 255;
            bms.charge = buffer.readUInt8(offset + 90);

            let serial = Array.from(buffer.slice(4, 10)).reverse();
            bms.serial = Buffer.from(serial).toString('hex').toUpperCase();

            bms.chargeCyclesImpress = buffer.readUInt16LE(offset + 42);
            bms.chargeCyclesNonImpress = buffer.readUInt16LE(offset + 32);

            let bytes = buffer.readUInt16LE(offset + 34);
            bms.calibrationCycles = (((bytes & 0x0F00) << 4) | ((bytes & 0x00F0) << 4) | ((bytes & 0x000F) << 4) | ((bytes & 0xF000) >> 12)) - 216 - 28194 + 762;

            // See BMS_LED_* and BMS_BATTERY_* constants
            bms.ledState = buffer.readUInt8(offset+36);
            bms.batteryState = buffer.readUInt8(offset+37);


            // https://github.com/jelimoore/trbodatasvc/blob/b0753ab8fe8f7241bb85715184ba59fea2de0c2d/src/TrboDataSvc/battery.py
            bms.chargeAdded.push(0); // First value will be calculated later
            for(let i = 0; i < 18; i+=2) {
                bms.chargeAdded.push(buffer.readUInt16LE(offset + 44+i));
            }
            bms.chargeAdded[0] = bms.chargeCyclesImpress - (bms.chargeAdded.reduce((a, b) => a + b, 0));

            for(let i = 0; i < 20; i+=2) {
                bms.chargeRemaining.push(buffer.readUInt16LE(offset + 62+i));
            }


            if(bms.extended) {
                bms.capacityRated = buffer.readUInt8(23) * 25;
                bms.partNumber = buffer.slice(11, 23).toString().replace(/\0/g, '');
            }

        }

        return bms;
    }
}

module.exports = BMS;