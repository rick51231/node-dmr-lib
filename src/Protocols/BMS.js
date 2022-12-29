const DMRConst = require('../DMRConst');

class BMS {
    static TYPE_DISCOVERY            = 0x01;
    static TYPE_REGISTRATION         = 0x02;
    static TYPE_REGISTRATION_ACK     = 0x03;
    static TYPE_QUERY_REQUEST        = 0x04;
    static TYPE_QUERY_REPLY          = 0x05;

    static QUERY_TYPE_SHORT    = 0x1;
    static QUERY_TYPE_NORMAL   = 0x2;
    static QUERY_TYPE_EXTENDED = 0x3;

    static CHEMISTRY_NICD   = 0x01;
    static CHEMISTRY_NIMN   = 0x02;
    static CHEMISTRY_LIION  = 0x03;


    static BATTERY_DISCHARGING      = 0x08;
    static BATTERY_CONSTANT_CURRENT = 0x20;
    static BATTERY_COMPLETED        = 0x80;

    static LED_OFF                      = 0x00;
    static LED_FLASHING_RED             = 0x01;
    static LED_FLASHING_YELLOW          = 0x02;
    static LED_STEADY_GREEN             = 0x04;
    static LED_FLASHING_GREEN           = 0x08;
    static LED_STEADY_RED               = 0x10;
    static LED_STEADY_YELLOW            = 0x20;
    static LED_ALTERNATING_RED_GREEN    = 0x40;
    static LED_ALTERNATING_YELLOW_GREEN = 0x80;


    constructor() {
        this.type = 0;
        this.reqId = 0;

        //BMS_REGISTRATION + BMS_REGISTRATION_ACK
        this.registerHash = [0x00, 0x00, 0x00];

        //BMS_QUERY_REQUEST + BMS_QUERY_REPLY
        this.queryType = [];

        //Battery query response
        this.code = 0;
        this.voltage = 0.0;
        this.temperature = 0.0;
        this.charge = 0;
        this.capacityCurrent = 0;
        this.capacityPotential = 0;
        this.serial = '';

        this.chargeCyclesImpres = 0;
        this.chargeCyclesNonImpres = 0;
        this.calibrationCycles = 0;

        this.daysSinceCalibration = 0;
        this.daysSinceLastRemovalFromImpres = 0;
        this.estimatedDaysUntilNextCalibration = 0; //TODO: fix it

        this.chargeAdded = [];
        this.chargeRemaining = [];
        this.ledState = 0;
        this.batteryState = 0;

        //Battery query response - extended
        this.chemistry = 0;
        this.partNumber = '';
        this.capacityRated = 0;
        this.softwareVersion = 0;
        this.dateOfManufacture = '';
        this.dateOfFirstUse = '';
        this.health = 0;
    }

    static from(buffer) {
        let bms = new BMS();

        bms.type = buffer.readUInt8(0);

        if(bms.type === DMRConst.BMS_QUERY_REPLY || bms.type === DMRConst.BMS_QUERY_REQUEST) {
            bms.reqId = buffer.readUInt16LE(1);
        }

        if(bms.type===DMRConst.BMS_REGISTRATION) {
            bms.registerHash = Array.from(buffer.slice(12, 15));

            let serial = Array.from(buffer.slice(15, 21)).reverse();
            bms.serial = Buffer.from(serial).toString('hex').toUpperCase();
        } else if(bms.type === DMRConst.BMS_QUERY_REQUEST) {
            let str = buffer.slice(3, buffer.length).toString('hex');

            if(str===DMRConst.BMS_QUERY_TYPE_SHORT_HEX)
                bms.queryType = DMRConst.BMS_QUERY_TYPE_SHORT;
            else if(str===DMRConst.BMS_QUERY_TYPE_NORMAL_HEX)
                bms.queryType = DMRConst.BMS_QUERY_TYPE_NORMAL;
            else if(str===DMRConst.BMS_QUERY_TYPE_EXTENDED_HEX)
                bms.queryType = DMRConst.BMS_QUERY_TYPE_EXTENDED;

        } else if(bms.type === DMRConst.BMS_QUERY_REPLY) {
            bms.code = buffer.readUInt8(3);

            if(bms.code===DMRConst.BMS_QUERY_STATUS_OK) {
                if (buffer.length === 112)
                    bms.queryType = DMRConst.BMS_QUERY_TYPE_EXTENDED;
                else if (buffer.length === 91)
                    bms.queryType = DMRConst.BMS_QUERY_TYPE_NORMAL;
                else if (buffer.length === 31)
                    bms.queryType = DMRConst.BMS_QUERY_TYPE_SHORT;

                let key = buffer.readUInt8(4); //Key = first byte of the serial number
                let key2 = buffer.readUInt8(9); //Key2 = last byte of the serial number, only for date

                if(bms.queryType!==DMRConst.BMS_QUERY_TYPE_SHORT) {
                    let offset = bms.queryType === DMRConst.BMS_QUERY_TYPE_EXTENDED ? 21 : 0;

                    bms.voltage = buffer.readUInt16LE(offset + 38) / 100 + 0.13500000536441803;
                    bms.temperature = buffer.readInt8(offset + 41) + buffer.readUInt8(offset + 40) / 256;
                    bms.charge = buffer.readUInt8(offset + 90);

                    let serial = Array.from(buffer.slice(4, 10)).reverse();
                    bms.serial = Buffer.from(serial).toString('hex').toUpperCase();


                    bms.chargeCyclesNonImpres = buffer.readUInt16LE(offset + 32);
                    bms.calibrationCycles = this.decryptInt(buffer.readUInt16LE(offset + 34), 2, key);

                    // See BMS_LED_* and BMS_BATTERY_* constants
                    bms.ledState = buffer.readUInt8(offset + 36);
                    bms.batteryState = buffer.readUInt8(offset + 37);


                    for (let i = 0; i < 20; i += 2) {
                        bms.chargeAdded.push(buffer.readUInt16LE(offset + 42 + i));
                    }

                    let sum = bms.chargeAdded.reduce((a, b) => a + b, 0);
                    let tmp = sum - bms.chargeAdded[0];

                    if(bms.chargeAdded[0] >= tmp)
                        bms.chargeAdded[0] -= tmp;

                    bms.chargeCyclesImpres = tmp + bms.chargeAdded[0];

                    for (let i = 0; i < 20; i += 2) {
                        bms.chargeRemaining.push(buffer.readUInt16LE(offset + 62 + i));
                    }

                    //Calculations
                    let b9 = buffer.readUInt16LE(offset + 10) / 100000;
                    let a6 = BMS.decryptInt(buffer.readUInt8(offset + 13), 1, key);
                    let v = BMS.decryptInt(buffer.readUInt16LE(offset + 82), 2, key);
                    let s = BMS.decryptInt(buffer.readUInt16LE(offset + 16), 2, key);
                    let ay = buffer.readUInt32LE(offset + 84);
                    let ah = buffer.readUInt16LE(offset + 88);
                    let m = buffer.readUInt8(offset + 12);
                    let bg = buffer.readUInt8(offset + 14) / 10;
                    let bh = buffer.readUInt8(offset + 15) / 10;
                    let ai = buffer.readUInt8(offset + 18);
                    let aj = buffer.readUInt8(offset + 19);

                    let a8 = ((1000 * a6) / (2048 * b9));
                    let at = ay / 86400;

                    let num20 = ay - at * 86400;
                    let av = num20 / 3600;
                    let num21 = num20 - av * 3600;
                    // let aw = num21 / 60;
                    // let ax = num21 - obj.aw * 60;
                    let ak = ah * 86400 + ai * 3600 + aj * 60;

                    let chargeCalibration = this.getChargeCalibration(ah, ak, bg, bh, s, ay, a8);

                    bms.capacityPotential = a8;
                    bms.capacityCurrent = ((1000 * m) / (2048 * b9)) - chargeCalibration;

                    bms.daysSinceCalibration = Math.floor(at > v ? at - v : 0); //TODO: au - v ?
                    bms.daysSinceLastRemovalFromImpres = Math.floor(at - ah);
                }

                if (bms.queryType !== DMRConst.BMS_QUERY_TYPE_NORMAL) {
                    bms.chemistry = buffer.readUInt8(10);
                    bms.capacityRated = buffer.readUInt8(23) * 25;
                    bms.partNumber = buffer.slice(11, 23).toString().replace(/\0/g, '');
                    let bb = buffer.readUInt8(24);
                    bms.softwareVersion = (bb >> 4) + 0.1 * (bb & 15); //TODO: check it
                    bms.dateOfManufacture = this.decryptDate(buffer.readUInt16LE(25), key, key2); //let c =

                    let o = BMS.decryptInt(buffer.readUInt16LE(27), 2, key);
                    let tmpDate = (new Date(bms.dateOfManufacture));
                    tmpDate.setDate(bms.dateOfManufacture.getDate() + o);
                    bms.dateOfFirstUse = tmpDate; // let n =

                    bms.health = Math.min(100, Math.round((bms.capacityPotential / bms.capacityRated) * 100));


                    //More calculations:
                    let ba = BMS.decryptInt(buffer.readUInt16LE(21 + 20), 2, key);
                    let q = Math.max(1,  Math.floor(((new Date()).getTime() -  bms.dateOfFirstUse.getTime()) / 86400000));
                    let bf = [];
                    for(let i = 0; i < 10; i += 1) {
                        bf[i] = buffer.readUInt8(21 + 20 + i);
                    }

                    bms.estimatedDaysUntilNextCalibration = Math.ceil(this.getReconditioningDays(bms.chargeRemaining, bf, q, bms.chargeCyclesImpres, bms.chargeCyclesNonImpres, bms.daysSinceCalibration, ba));
                }
            } // if(code===DMRConst.BMS_QUERY_STATUS_OK) {
        }

        return bms;
    }

    getBuffer() {
        let size = 0;

        if(this.type===DMRConst.BMS_DISCOVERY)
            size = 2;
        else if(this.type===DMRConst.BMS_REGISTRATION_ACK)
            size = 5;
        else if(this.type===DMRConst.BMS_QUERY_REQUEST)
            size = this.queryType === DMRConst.BMS_QUERY_TYPE_EXTENDED ? 7 : 6;

        let buffer = Buffer.alloc(size);

        buffer.writeUInt8(this.type, 0);

        if(this.type===DMRConst.BMS_REGISTRATION_ACK) {
            buffer.writeUInt8(0x02, 1); //Code?

            buffer.fill(Buffer.from(this.registerHash), 2, 5);
        } else if(this.type===DMRConst.BMS_QUERY_REQUEST) {
            buffer.writeUInt16LE(this.reqId, 1);

            let str = '';

            if(this.queryType===DMRConst.BMS_QUERY_TYPE_SHORT)
                str = DMRConst.BMS_QUERY_TYPE_SHORT_HEX;
            else if(this.queryType===DMRConst.BMS_QUERY_TYPE_NORMAL)
                str = DMRConst.BMS_QUERY_TYPE_NORMAL_HEX;
            else if(this.queryType===DMRConst.BMS_QUERY_TYPE_EXTENDED)
                str = DMRConst.BMS_QUERY_TYPE_EXTENDED_HEX;

            buffer.write(str, 3, 'hex');
        }

        return buffer;
    }

    static getReconditioningDays(ag, bf, q, w, bj, u, ba) {
        let val1 = 0;

        let objArray = [ag, bf, q, w, bj, u];

        let index1 = 0;
        let num1 = 12;
        let num2 = 0;

        loop: while(true) {
            let num3 = 0.0;
            let flag1 = false;
            let num4 = 0.0;
            let index2 = 0;
            let flag2 = false;
            let A_0 = 0;
            let calibrationNeeded = false;
            let num5 = 0;
            let index3 = 0;
            let num6 = 0.0;
            let flag3 = false;
            let flag4 = false;
            let flag5 = false;
            let flag6 = false;
            let flag7 = false;
            let num7 = 0;
            let num8 = 0;

            switch (num1)
            {
                case 0:
                    if (!flag5)
                    {
                        ++index1;
                        num1 = 41;
                        continue;
                    }
                    num1 = 15;
                    continue;
                case 1:
                case 20:
                    let val2 = (30 - Math.min(30, u));

                    num2 = Math.max(val1, val2); //TODO: should be Math.min(val1, val2)
                    num1 = 21;
                    continue;
                case 2:
                    if (index1 >= objArray.length)
                    {
                        num1 = 39;
                        continue;
                    }
                    A_0 = objArray[index1];
                    num1 = 5;
                    continue;
                case 3:
                    num1 = 32;
                    continue;
                case 4:
                case 24:
                    index3 =  (num6 / 10.0);
                    flag3 = bf[index3] !== 0;
                    num1 = 36;
                    continue;
                case 5:
                    num1 = 33; //TODO: !cc(A_0) ? 33 : 27;
                    continue;
                case 6:
                    num1 = v !== 0 ? 28 : 8;
                    continue;
                case 7:
                    if (!flag2)
                    {
                        num1 = 31;
                        continue;
                    }
                    num3 +=  ag[index2] * (10 * index2 + 5);
                    num6 += ag[index2];
                    ++index2;
                    num1 = 25;
                    continue;
                case 8:
                    num1 = 38;
                    continue;
                case 9:
                    num7 = 1; //TODO: !cd(A_0) ? 1 : 0;
                    break;
                case 10:
                    if (calibrationNeeded)
                    {
                        num1 = 18;
                        continue;
                    }
                    num6 = 0.0;
                    num3 = 0.0;
                    num4 = 0.0;
                    num5 = 0;
                    index2 = 0;
                    num1 = 11;
                    continue;
                case 11:
                case 25:
                    flag2 = index2 < 10;
                    num1 = 7;
                    continue;
                case 12:
                case 41:
                    num1 = 2;
                    continue;
                case 13:
                    num6 = 95.0;
                    num1 = 4;
                    continue;
                case 14:
                case 23:
                    flag6 = q > 0;
                    num1 = 35;
                    continue;
                case 15:
                    num1 = 6;
                    continue;
                case 16:
                    num4 = (w + bj) / q;
                    num1 = 37;
                    continue;
                case 17:

                    val1 = num5 / num4;
                    num1 = 1;
                    continue;
                case 18:
                    num2 = val1;
                    num1 = 19;
                    continue;
                case 19:
                case 34:
                    break loop;
                case 21:
                    break loop;
                case 22:
                case 37:
                    flag4 = num4 > 0.001;
                    num1 = 40;
                    continue;
                case 26:
                    if (flag7)
                    {
                        num1 = 3;
                        continue;
                    }
                    num1 = 32;
                    continue;
                case 27:
                    num1 = 9;
                    continue;
                case 28:
                    num8 = 1;
                    flag7 = num8 !== 0;
                    num1 = 26;
                    continue;
                case 29:

                    num5 = ba / bf[index3];
                    num1 = 14;
                    continue;
                case 30:
                    if (flag1)
                    {
                        num1 = 13;
                        continue;
                    }
                    num6 /= num3;
                    num1 = 24;
                    continue;
                case 31:
                    flag1 = num3 === 0.0;
                    num1 = 30;
                    continue;
                case 32:
                    num2 = val1;
                    num1 = 34;
                    continue;
                case 33:
                    num7 = 1;
                    break;
                case 35:
                    if (flag6)
                    {
                        num1 = 16;
                        continue;
                    }
                    num4 = w + bj;
                    num1 = 22;
                    continue;
                case 36:
                    if (!flag3)
                    {
                        num5 = 0;
                        num1 = 23;
                        continue;
                    }
                    num1 = 29;
                    continue;
                case 38:
                    num8 = 1; //TODO: !cd(v) ? 1 : 0;
                    flag7 = num8 !== 0;
                    num1 = 26;
                    continue;
                case 39:
                    calibrationNeeded = false; //TODO: IsCalibrationNeeded;
                    num1 = 10;
                    continue;
                case 40:
                    if (flag4)
                    {
                        num1 = 17;
                        continue;
                    }
                    val1 = 1;
                    num1 = 20;
                    continue;
                default:

            }
            flag5 = num7 !== 0;
            num1 = 0;
        }

        return num2;
    }

    static getChargeCalibration(ah, ak, bg, bh, s, ay, a8) {
        let num1 = 1440;
        let num2 = 60;
        let num3 = num2 * 60 * 24;
        let num4 = 0;
        let num5 = 7;
        let num6;
        let num7;
        let num8;
        let num9;
        let num10;
        let flag1 = s===ah;
        let flag2;
        let flag3;
        loop: while (true) {
            switch (num5) {

                case 0:
                    num9 = num8;
                    num5 = 8;
                    break;
                case 1:
                case 3:
                    num5 = 0;
                    break;
                case 2:
                    num6 = num10 - num4;
                    flag2 = num6 <= num1;
                    num5 = 6;
                    break;
                case 4:
                    if (flag3)
                    {
                        num5 = 2;
                        break;
                    }
                    num5 = 0;
                    break;
                case 5:
                    num4 = ak / num2;
                    num5 = 11;
                    break;
                case 6:
                    if (!flag2)
                    {
                        num6 -= num1;
                        num8 = bg / 100 *  num7 +  ( num6 / num1 * ( bh / 100)) *  num7;
                        num5 = 1;
                        break;
                    }
                    num5 = 10;
                    break;
                case 7:
                    if (flag1)
                    {
                        num5 = 5;
                        break;
                    }
                    num4 = s * num1;
                    num5 = 9;
                    break;
                case 8:
                    break loop;
                case 9:
                case 11:
                    num8 = 0;
                    num10 = ay / 60;
                    num7 = a8;
                    flag3 = num10 > num4;
                    num5 = 4;
                    break;
                case 10:
                    num8 =   num6 /  num1 * ( bg / 100) *  num7;
                    num5 = 3;
                    break;
                default:

            }
        }

        return num9;
    }

    static decryptInt(intVal, len, key) {
        let num1 = 216;
        let num2 = key & 15;
        let flag1 = len === 1;
        let num3 = 20;
        let flag2 = false;
        let flag3 = false;
        let flag4 = false;
        let flag5 = false;
        let num4 = 0;

        loop: while(true) {
            // console.log(intVal + '-'+num3);
            switch(num3) {
                case 0:
                    break loop;

                case 1:
                    intVal = intVal - num1;
                    intVal = (intVal >>> 0) & 0xFF;
                    num3 = 3;
                    break;

                case 2:
                    intVal -= num1;
                    intVal = (intVal >>> 0) & 0xFFFF;
                    num3 = 10;
                    break;

                case 3:
                case 10:
                    num4 = intVal;
                    num3 = 0;
                    break;

                case 4:
                    intVal >>= 1;
                    intVal |= 128;
                    num3 = 18;
                    break;

                case 5:
                    num3 = 12;
                    break;

                case 6:
                    if(flag3) {
                        flag2 = (intVal & 1) > 0;
                        num3 = 7;
                        break;
                    }
                    num3 = 2;
                    break;

                case 7:
                    if(!flag2) {
                        intVal >>>= 1;
                        num3 = 13;
                        break;
                    }
                    num3 = 17;
                    break;

                case 8:
                case 9:
                    flag3 = num2-- > 0; //TODO: check it
                    num3 = 6;
                    break;

                case 11:
                case 18:
                    num3 = 16;
                    break;

                case 12:
                case 16:
                    flag5 = num2-- > 0;
                    num3 = 15;
                    break;

                case 13:
                case 19:
                    num3 = 8;
                    break;

                case 14:
                    if(flag4) {
                        num3 = 4;
                        break;
                    }

                    intVal >>>= 1;
                    num3 = 11;
                    break;

                case 15:
                    if(flag5) {
                        flag4 = (intVal & 1) > 0;
                        num3 = 14;
                        break;
                    }

                    num3 = 1;
                    break;

                case 17:
                    intVal >>>= 1;
                    intVal |= 32768;
                    num3 = 19;
                    break;

                case 20:
                    num3 = !flag1 ? 9 : 5;
                    break;

                default:
                    throw new Error("Hi");

            }
        }

        return num4;
    }

    static decryptDate(intVal, key1, key2) {
        let num1 = 55488;
        let num2 = key1 & 15;
        let num3 = (key2 >> 4) ^ num2;
        let num4 = intVal;
        let num5 = 2;



        let flag1 = false;
        let flag2 = false;
        let dateTime = null;

        loop: while(true) {
            // console.log(num4);
            switch(num5) {
                case 0:
                case 2:
                    flag1 = num3-- > 0;
                    num5 = 8;
                    break;

                case 1:
                case 4:
                    num5 = 0;
                    break;

                case 3:
                    num4 -= num1;
                    num4 = (num4 >>> 0) & 0xFFFF; //Keep it unsigned 2byte short
                    // dateTime = new Date((num4 >> 9) + 1980, (num4 >> 5 & 15) - 1, num4 & 31);
                    let year = (num4 >> 9) + 1980;
                    let month = num4 >> 5 & 15;
                    let day = num4 & 31;
                    dateTime = year.toString(10) + '-' + month.toString(10).padStart(2, '0') + '-' + day.toString(10).padStart(2, '0');
                    dateTime = new Date(dateTime);
                    num5 = 5;
                    break;

                case 5:
                    break loop;

                case 6:
                    if(!flag2) {
                        num4 >>= 1;
                        num5 = 1;
                        break;
                    }
                    num5 = 7;
                    break;

                case 7:
                    num4 = (num4 >> 1) | 32768;

                    num5 = 4;
                    break;

                case 8:
                    if(!flag1) {
                        num5 = 3;
                        break;
                    }

                    flag2 = (num4 & 1) > 0;
                    num5 = 6;
                    break;

                default:
                    throw new Error("Hi2");
            }
        }

        return dateTime;
    }

    static getRegisterHash(A_0) {
        let A_0_1 = this.h();

        let t1 = this.c2(A_0_1, A_0_1.length, A_0, A_0.length);
        let [A_1, ] = this.c3(t1, /*222,*/ 3, A_0);

        return A_1;
    }

    static h() {
        let A_3 = [67, 89, 90, 59, 113];
        let A_0 = [147, 236, 118, 219, 93, 197];
        let A_2 = [56, 93, 156, 135];

        let [A_1,] = this.c3(this.c2(A_0, A_0.length, A_2, A_2.length), /*222,*/ 5, A_3);
        return A_1;
    }

    static c3(A_0, /*A_1_old,*/ A_2, A_3) { // rc4_sbox_t c(rc4_sbox_t A_0, ref byte[] A_1, ushort A_2, byte[] A_3)
        let A_1 = [];
        let index1 = A_0.a;
        let index2 = A_0.b;
        let c = A_0.c;
        let index3 = 0;
        let num1 = 7;
        let flag1 = false;
        let num2 = 0;
        // let flag2 = false;

        loop: while(true) {
            switch (num1)
            {
                case 0:
                    if (!flag1) {
                        num1 = 5;
                        break;
                    }
                    index1 =  (index1 + 1 & 0xFF);
                    index2 = (index2 +c[ index1] & 0xFF);
                    num2 = c[index1];
                    c[index1] = c[index2];
                    c[index2] = num2;
                    // flag2 = A_1 != null;
                    num1 = 1;
                    break;
                case 1:
                    // if (flag2)
                    // {
                    num1 = 3;
                    break;
                // }
                // num1 = 4;
                // break;
                case 2:
                    break loop;
                case 3:
                    A_1[index3] = (A_3[ index3] ^  c[ c[ index1] +  num2 & 0xFF]);
                    num1 = 4;
                    break;
                case 4:
                    A_0.a = index1;
                    A_0.b = index2;
                    ++index3;
                    num1 = 6;
                    break;
                case 5:
                    num1 = 2;
                    break;
                case 6:
                case 7:
                    flag1 = index3 < A_2;
                    num1 = 0;
                    break;
                default:

            }
        }

        return [A_1, A_0];
    }

    static c2(A_0, A_1, A_2, A_3) { // rc4_sbox_t c(byte[] A_0, ushort A_1, byte[] A_2, ushort A_3)
        let A_1_1 = [];
        let A_0_1 = { c: [], a: 0, b: 0};

        let A_1_2 = A_1 + A_3;
        let numArray = [];
        numArray = A_0;
        let index = 0;
        let num = 4;
        let flag = false;

        loop: while(true) {
            switch(num) {
                case 0:
                case 4:
                    flag = index <  A_3;
                    num = 1;
                    break;
                case 1:
                    if (!flag)   {
                        num = 2;
                        break;
                    }
                    numArray[A_1 + index] = A_2[index];
                    ++index;
                    num = 0;
                    break;
                case 2:
                    A_0_1 = this.c1(numArray, A_1_2);
                    // let par = JSON.parse(JSON.stringify(A_0_1));
                    [A_1_1, A_0_1]  = this.c3(A_0_1, /*123,*/ 256, A_1_1);
                    num = 3;
                    break;
                case 3:
                    break loop;
            }


        }
        return A_0_1;
    }

    static c1(A_0, A_1) { // rc4_sbox_t c(byte[] A_0, ushort A_1)
        let rc4SboxT1 = { c: [], a: 0, b: 0};
        let numArray = [];


        let c = rc4SboxT1.c;
        let index1 = 0;
        let index2 = 0;

        let num1 = 7;
        let flag1 = false;
        let flag2 = false;
        let flag3 = false;

        loop: while (true) {
            switch (num1) {
                case 0:
                    index2 = index1 = 0;
                    num1 = 2;
                    break;

                case 1:
                case 7:
                    flag3 = index2 < 256;
                    num1 = 3;
                    break;

                case 2:
                case 4:
                    flag2 = index2 < 256;
                    num1 = 8;
                    break;
                case 3:
                    if (flag3)
                    {
                        flag1 = index1 === A_1;
                        num1 = 6;
                        break;
                    }
                    num1 = 0;
                    break;
                case 5:
                    num1 = 11;
                    break;
                case 6:
                    if (flag1) {
                        num1 = 9;
                        break;
                    }
                    num1 = 10;
                    break;
                case 8:
                    if (flag2) {
                        index1 = (index1 +c[index2] + numArray[index2] & 0xFF);

                        let num2 = c[index2];
                        c[index2] = c[index1];
                        c[index1] = num2;
                        ++index2;
                        num1 = 4;
                        break;
                    }
                    num1 = 5;
                    break;
                case 9:
                    index1 =  0;
                    num1 = 10;
                    break;
                case 10:
                    c[index2] = index2;
                    numArray[index2] = A_0[index1];
                    ++index2;
                    ++index1;
                    num1 = 1;
                    break;
                case 11:
                    break loop;
            }
        }

        // rc4SboxT1.a = 0;
        // rc4SboxT1.b = 0;

        return rc4SboxT1;
    }


    static radioFamily = {
        1	: 'XTS 5000/3500/3000',
        2	: 'XTS 2500, XTS/MT/PR 1500',
        4	: 'Saber',
        5	: 'MOTOTRBO CoreTier',
        6	: 'HT/GP/PRO Series',
        7	: 'APX7000/6000/5000',
        8	: 'APX4000',
        9	: 'MOTOTRBO EnhancedTier/EntryTier',
        10	: 'DP2000/XiR P6000',
        11	: 'MOTOTRBO CSA',
        12	: 'APX3000',
        13	: 'MOTOTRBO EnhancedTier/APX4000',
        14	: 'APX2000/3000/4000',
        15	: 'APX2000/3000/4000 / MOTOTRBO Enhanced tier',
        16	: 'APX4000/2000 / MOTOTRBO EnhancedTier',
        17	: 'MOTOTRBO EnhancedTier/APX4000/3000/2000',
        18	: 'MOTOTRBO EnhancedTier/EntryTier CSA',
        19	: 'MOTOTRBO Core tier CSA',
        20	: 'MOTOTRBO entry tier',
        21	: 'APX2000/3000/4000/ MOTOTRBO Enhanced tier',
        22	: 'MOTOTRBO EnhancedTier ATEX',
        23	: 'APX8000/7000/6000/5000 CSA157',
        24	: 'MOTOTRBO EnhancedTier',
        25	: 'APX6000 TIA4950',
        26	: 'APX8000/7000/6000/5000',
        27	: 'MOTOTRBO EnhancedTier TIA4950',
        28	: 'MOTOTRBO EntryTier TIA4950',
        29	: 'APX8000 UL2504 Div 2',
        30	: 'LEX M20',
        31	: 'Si-500',
        32	: 'MTP8000Ex/MTP8550Ex',
        33	: 'Aragorn MTP6550/MTP6650/MTP6750',
        34	: 'Fusion Si500, Fusion Si700',
        35	: 'Monte',
        36	: 'APX8000HXE/7000/6000',
        37	: 'Lex L11',
        38	: 'MOTOTRBO EnhancedTier/EntryTier/DTR',
        39	: 'MXP600',
        40	: 'MOTOTRBO ION',
        41	: 'MOTOTRBO ION (UL,',
        42	: 'APX Next',
        43	: 'APX Next (UL,',
        44	: 'APX900/2000/3000/4000',
        45	: 'APX900/2000/3000/4000 / MOTOTRBO EnhancedTier',
        46	: 'APX900 / MOTOTRBO EnhancedTier TIA4950',
        47	: 'APX900 / MOTOTRBO EnhancedTier/EntryTier',
        48	: 'APX4000XH'
    };

    static batteryKITList = { // [radioFamilyId, FM, Chemistry, RatedCapacity, TIA4950, UL2504Div2, CSA157, ATEX]
        HNN9031:  [1, 0, 1, 1525, 0, 0, 0, 0],
        HNN9032:  [1, 1, 1, 1525, 0, 0, 0, 0],
        NNTN4435: [1, 0, 2, 1800, 0, 0, 0, 0],
        NNTN4436: [1, 1, 2, 1700, 0, 0, 0, 0],
        NNTN4437: [1, 1, 2, 1700, 0, 0, 0, 0],
        NNTN6034: [1, 0, 3, 4150, 0, 0, 0, 0],
        NNTN7453: [1, 1, 3, 3950, 0, 0, 0, 0],
        NTN9862:  [1, 0, 3, 2750, 0, 0, 0, 0],
        PMNN4093: [1, 0, 2, 3000, 0, 0, 0, 0],
        NNTN6263: [2, 1, 2, 2000, 0, 0, 0, 0],
        NNTN7335: [2, 0, 3, 2700, 0, 0, 0, 0],
        NNTN7554: [2, 0, 3, 2050, 0, 0, 0, 0],
        NTN9857:  [2, 1, 2, 2000, 0, 0, 0, 0],
        NTN9858:  [2, 0, 2, 2100, 0, 0, 0, 0],
        HNN9033:  [4, 0, 1, 2000, 0, 0, 0, 0],
        HNN9034:  [4, 1, 1, 2000, 0, 0, 0, 0],
        PMNN4066: [5, 0, 3, 1500, 0, 0, 0, 0],
        PMNN4069: [5, 1, 3, 1400, 0, 0, 0, 0],
        PMNN4077: [5, 0, 3, 2150, 0, 0, 0, 0],
        PMNN4101: [5, 0, 3, 1500, 0, 0, 0, 0],
        PMNN4102: [5, 1, 3, 1400, 0, 0, 0, 0],
        PMNN4103: [5, 0, 3, 2150, 0, 0, 0, 0],
        PMNN4262: [5, 0, 3, 2850, 0, 0, 0, 0],
        HNN4001:  [6, 0, 2, 1800, 0, 0, 0, 0],
        HNN4002:  [6, 1, 2, 1690, 0, 0, 0, 0],
        HNN4003:  [6, 0, 3, 2000, 0, 0, 0, 0],
        HNN9028:  [6, 0, 1, 1500, 0, 0, 0, 0],
        HNN9029:  [6, 1, 1, 1500, 0, 0, 0, 0],
        PMNN4156: [6, 0, 2, 2000, 0, 0, 0, 0],
        PMNN4157: [6, 1, 2, 1850, 0, 0, 0, 0],
        PMNN4159: [6, 0, 3, 2350, 0, 0, 0, 0],
        NNTN7033: [7, 1, 3, 4100, 0, 0, 0, 0],
        NNTN7034: [7, 0, 3, 4200, 0, 0, 0, 0],
        NNTN7035: [7, 1, 2, 2000, 0, 0, 0, 0],
        NNTN7036: [7, 1, 2, 2000, 0, 0, 0, 0],
        NNTN7037: [7, 0, 2, 2100, 0, 0, 0, 0],
        NNTN7038: [7, 0, 3, 2900, 0, 0, 0, 0],
        NNTN7573: [7, 0, 2, 2100, 0, 0, 0, 0],
        NNTN8092: [7, 1, 3, 2300, 0, 0, 0, 0],
        PMNN4403: [7, 0, 3, 2150, 0, 0, 0, 0],
        PMNN4407: [9, 0, 3, 1500, 0, 0, 0, 0],
        PMNN4409: [9, 0, 3, 2150, 0, 0, 0, 0],
        PMNN4488: [9, 0, 3, 3000, 0, 0, 0, 0],
        PMNN4491: [47, 0, 3, 2100, 0, 0, 0, 0],
        PMNN4493: [47, 0, 3, 3000, 0, 0, 0, 0],
        PMNN4499: [9, 0, 3, 3000, 0, 0, 0, 0],
        NNTN8128: [44, 0, 3, 1900, 0, 0, 0, 0],
        NNTN8305: [14, 0, 3, 1250, 0, 0, 0, 0],
        PMNN4424: [45, 0, 3, 2300, 0, 0, 0, 0],
        NNTN8560: [16, 0, 3, 2500, 1, 0, 0, 0],
        NNTN8129: [17, 1, 3, 2300, 0, 0, 0, 0],
        NNTN8386: [18, 0, 3, 1800, 0, 0, 1, 0],
        NNTN7789: [19, 0, 3, 1750, 0, 0, 0, 0],
        NNTN8287: [19, 0, 3, 1750, 0, 0, 1, 0],
        PMNN4417: [20, 0, 3, 1500, 0, 0, 0, 0],
        PMNN4418: [20, 0, 3, 2150, 0, 0, 0, 0],
        PMNN4448: [45, 0, 3, 2800, 0, 0, 0, 0],
        NNTN8359: [22, 0, 3, 2075, 0, 0, 0, 1],
        NNTN8750: [23, 0, 3, 2050, 0, 0, 1, 0],
        NNTN8840: [24, 0, 3, 2000, 0, 0, 0, 1],
        NNTN8921: [25, 0, 3, 4500, 1, 0, 0, 0],
        NNTN8930: [25, 0, 3, 2650, 1, 0, 0, 0],
        PMNN4485: [26, 0, 3, 2550, 0, 0, 0, 0],
        PMNN4486: [26, 0, 3, 3400, 0, 0, 0, 0],
        PMNN4487: [26, 0, 3, 4850, 0, 0, 0, 0],
        PMNN4494: [26, 0, 3, 5100, 0, 0, 0, 0],
        PMNN4489: [46, 0, 3, 2900, 1, 0, 0, 0],
        PMNN4490: [28, 0, 3, 2900, 1, 0, 0, 0],
        PMNN4504: [29, 0, 3, 3400, 0, 1, 0, 0],
        PMNN4505: [29, 0, 3, 4850, 0, 1, 0, 0],
        PMNN4474: [30, 0, 3, 2800, 0, 0, 0, 0],
        PMNN4530: [34, 0, 3, 3700, 0, 0, 0, 0],
        NNTN8570: [32, 0, 3, 1200, 0, 0, 0, 1],
        PMNN4522: [33, 0, 3, 3300, 0, 0, 0, 0],
        PMNN4549: [34, 0, 3, 2800, 0, 0, 0, 0],
        PMNN4510: [35, 0, 3, 2300, 0, 0, 0, 0],
        PMNN4547: [36, 0, 3, 3100, 1, 0, 0, 0],
        PMNN4546: [37, 0, 3, 5000, 0, 0, 0, 0],
        PMNN4545: [37, 0, 3, 2500, 0, 0, 0, 0],
        PMNN4543: [9, 0, 3, 2450, 0, 0, 0, 0],
        PMNN4544: [9, 0, 3, 2450, 0, 0, 0, 0],
        PMNN4548: [9, 0, 3, 2450, 0, 0, 0, 0],
        PMNN4068: [38, 0, 3, 2500, 0, 0, 0, 0],
        PMNN4573: [36, 0, 3, 4600, 1, 0, 0, 0],
        NNTN8091: [7, 1, 3, 2300, 0, 0, 0, 0],
        PMNN4582: [39, 0, 3, 2900, 0, 0, 0, 0],
        PMNN4801: [39, 0, 3, 1950, 0, 0, 0, 0],
        PMNN4802: [39, 0, 3, 3400, 0, 0, 0, 0],
        PMNN4803: [40, 0, 3, 2820, 0, 0, 0, 0],
        PMNN4804: [41, 0, 3, 2900, 1, 0, 0, 0],
        PMNN4805: [41, 0, 3, 4400, 1, 0, 0, 0],
        NNTN9087: [42, 0, 3, 3850, 0, 0, 0, 0],
        NNTN9088: [43, 0, 3, 3850, 0, 1, 0, 0],
        NNTN9089: [42, 0, 3, 5850, 0, 0, 0, 0],
        NNTN9090: [43, 0, 3, 5850, 0, 1, 0, 0],
        NNTN9216: [42, 0, 3, 4400, 0, 0, 0, 0],
        NNTN9217: [43, 0, 3, 4400, 0, 1, 0, 0],
        PMNN4579: [36, 0, 3, 3850, 0, 0, 0, 0],
        PMNN4502: [24, 0, 3, 3000, 0, 0, 0, 0],
        PMNN4525: [24, 0, 3, 1950, 0, 0, 0, 0],
        NNTN4321: [48, 0, 3, 2050, 0, 0, 0, 0],
    }
}

module.exports = BMS;