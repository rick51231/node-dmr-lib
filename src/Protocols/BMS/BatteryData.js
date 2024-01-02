class BatteryData {
    static batterySerialStart = 0;
    static ds2433start = 8;
    static ds2438start = 520;
    static invalidBlock = 0xFFFF;

    static OTA_DATATYPE_STATICDYNAMIC = 0;
    static OTA_DATATYPE_STATIC = 1;
    static OTA_DATATYPE_DYNAMIC = 2;

    static CHEMISTRY_NICD   = 0x01;
    static CHEMISTRY_NIMN   = 0x02;
    static CHEMISTRY_LIION  = 0x03;

    key1 = 0;
    key2 = 0;
    originalSerialNumber = "";
    kitNumber = ""; // partNumber
    manufactureDate = new Date('1970-01-01'); // dateOfManufacture
    dateofLastRemove = new Date('1970-01-01');
    chemistry = 0;
    lowTempHysteresis = 0;
    highTempHysteresis = 0;
    chargeEfficiencyOffset = 0.0
    topOffTime = 0;
    agencyID = 0;
    batteryTypeID = 2;
    chargerLowTemperature = 0.0
    chargerHighTemperature = 0.0
    ratedCapacity = 0; // capacityRated
    ICA = 0;
    dateOfFirstUse = new Date('1970-01-01');
    dayOfInitialUse = 0; // o
    dayOfInitialCharge = 0;
    daysInService = 1; // q
    daysSinceLastCharge = 0;
    dayOfLastCharge = 0;
    daysSinceRemoval = 0; // daysSinceLastRemovalFromImpres
    daysSinceLastCalibration = 0; // daysSinceCalibration | u
    dayOfLastReconditioning = 0; // v
    totalChargeCycles = 0; // chargeCyclesImpres | w
    totalReverts = 0;
    totalTopOffCycles = 0;
    calibrationCycles = 0; // calibrationCycles
    statusBlockSize = 0;
    chargeStatus = "";
    chargerLEDStatus = 3;
    hostID = 0;
    softwareVersion = 0.0
    addedHistogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // chargeAdded
    remainingHistogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // chargeRemaining | ag
    lastKnownDay = 0; // ah
    lastKnownHour = 0; // ai
    lastKnownMin = 0; // aj
    totalLastKnownSec = 0;
    CONF = 0;
    temperature = 0.0
    voltage = 0.0
    current = 0.0
    currentThreshold = 0;
    batteryAgeYears;
    batteryAgeMonths;
    batteryAgeDays;
    batteryAgeTotalDaysETM; // at
    batteryAgeTotalDaysPC;
    ETM_Hours;
    ETM_Minutes;
    ETM_Seconds;
    ETM; // ay
    ICA_MAH;
    capacityMAH; // capacityCurrent
    offset = 0.0
    CCA = 0.0
    DCA = 0.0
    totalCapacityAdded = 0;
    totalCapacityRemoved = 0;
    CTS = 0; // a6
    capacityAtFirstUsage = 0;
    potentialCapacity = 0; // capacityPotential | a8
    topOffCapacity = 0;
    recondTrigger = 0; // ba
    autoRecondVolt = 0.0
    recondEndVolt = 0.0
    recondRestTime = 0;
    recondBaseHigh = 0;
    recondWeights = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // bf
    firstDayDischargePercentage = 0.0 // bg
    dischargePercentagePerDay = 0.0 // bh
    nonIMPRESCCA = 0.0
    nonIMPRESCycles = 0; // chargeCyclesNonImpres | bj
    initalUseNonIMPRESCycles = 0;
    nonIMPRESCyclesPrior = 0;
    nonIMPRESPerThresh = 0;
    lastKnownCCA = 0.0
    lastKnownDCA = 0.0
    lastKnownCapacityAdded = 0;
    lastKnownCapacityRemoved = 0;
    EOSChargeCycles = 0;
    EOSApproxCycles = 0;
    EOSNumReconds = 0;
    EOSNumInsertions = 0;
    EOSNumTrickleCycles = 0;
    dayOfEndOfService = 0;
    EOSPercentage = 0;
    minEOSLPercentage = 0.0
    calAttemptCounter = 0;
    radioLowTemperature = 0.0
    radioHighTemperature = 0.0
    NfpaContinuousOverTempFlag = 0;
    NfpaCumulativeOverTempFlag = 0;
    NfpaOverTempCounter = 0;
    ETMError = 0;
    Page0Error = 0;
    XTVAError = 0;
    CCAError = 0;
    DCAError = 0;
    charging = false;
    errorFieldList = "";
    unsupportedFieldList = "";
    m_SenseResistor = 0; // b9
    estimatedDaysUntilNextReconditioning = 0; // estimatedDaysUntilNextCalibration
    remainingCapacityRatio = 0; // charge
    health = 0;

    getBlockAddress(buffer, vector) {

        let num = buffer.readUInt8(BatteryData.ds2433start+65);
        if(num===0xFF || vector > 2 * num + 65)
            throw new Error('Invalid vector table for '+vector);

        let num2 = buffer.readUInt16BE(BatteryData.ds2433start + vector);

        if(num2 >= 512)
            throw new Error('Invalid vector table 2 for '+vector);

        return num2 + BatteryData.ds2433start;
    }

    verifyBlock(buffer, offset) {
        if(offset===BatteryData.invalidBlock)
            return false;

        let blockSize = buffer.readUInt8(offset);

        if(offset+blockSize - BatteryData.ds2433start > 512 || blockSize > 32)
            return false;

        let checksum = 0;
        for(let i = 0; i < blockSize; i++) {
            // console.log(buffer.readUInt8(offset+i));
            checksum += buffer.readUInt8(offset+i);
        }



        checksum &= 0xFF;

        return checksum===90;
    }

    calculateSelfDischarge() {
        let num1 = 1440;
        let num2 = 60;
        let num4 = this.dayOfLastCharge!==this.lastKnownDay ? this.dayOfLastCharge * num1 : this.totalLastKnownSec / num2;

        let selfDischarge = 0;
        let num10 = this.ETM / 60;
        let num7 = this.potentialCapacity;

        if (num10 > num4) {
            let num6 = num10 - num4;
            if (num6 <= num1) {
                selfDischarge = num6 / num1 * (this.firstDayDischargePercentage / 100) * num7;
            } else {
                num6 -= num1;
                selfDischarge = this.firstDayDischargePercentage / 100 * num7 + (num6 / num1 * (this.dischargePercentagePerDay / 100)) * num7;
            }

        }

        return selfDischarge;
    }

    processSerialBlock(buffer, offset) {
        let serial = Array.from(buffer.slice(offset+1, offset+7)).reverse();
        this.originalSerialNumber = Buffer.from(serial).toString('hex').toUpperCase();

        //Reversed order
        this.key1 = serial[5];
        this.key2 = serial[0];
    }

    processAdditionBlock(buffer, offset) {
        this.chemistry = buffer.readUInt8(offset+1);
        this.lowTempHysteresis = buffer.readUInt8(offset+2);
        this.highTempHysteresis = buffer.readUInt8(offset+3);
        this.autoRecondVolt = buffer.readUInt8(offset+4) * 0.048;
        this.recondEndVolt = buffer.readUInt8(offset+5) * 0.048;
        this.recondRestTime = buffer.readUInt8(offset+6);
        this.recondBaseHigh = buffer.readUInt16BE(offset+7);
        this.chargeEfficiencyOffset = buffer.readUInt8(offset+9);
    }

    processCalibrationBlock(buffer, offset) {
        this.minEOSLPercentage = buffer.readUInt8(offset+1);
        this.calAttemptCounter = buffer.readUInt8(offset+2);
    }

    processChargeAddedBlock(buffer, offset, isBE = true) {
        for (let i = 0; i < 10; i++) {
            this.addedHistogram[i] = isBE ? buffer.readUInt16BE(offset + 1 + i * 2) : buffer.readUInt16LE(offset + 1 + i * 2);
        }

        let sum = this.addedHistogram.reduce((a, b) => a + b, 0);
        let tmp = sum - this.addedHistogram[0];

        if(this.addedHistogram[0] >= tmp)
            this.addedHistogram[0] -= tmp;

        this.totalChargeCycles = tmp + this.addedHistogram[0];
    }

    processChargeRemainingBlock(buffer, offset, isBE = true) {
        for (let i = 0; i < 10; i++) {
            this.remainingHistogram[i] = isBE ? buffer.readUInt16BE(offset + 1 + i * 2) : buffer.readUInt16LE(offset + 1 + i * 2);
        }
    }

    processChargeRetentionBlock(buffer, offset) {
        if(offset!==BatteryData.invalidBlock) {
            this.firstDayDischargePercentage = buffer.readUInt8(offset + 1) / 10;
            this.dischargePercentagePerDay = buffer.readUInt8(offset + 2) / 10;
        } else {
            if (this.chemistry === BatteryData.CHEMISTRY_LIION) {
                this.firstDayDischargePercentage = 1;
                this.dischargePercentagePerDay = 0.1;
            } else if(this.chemistry === BatteryData.CHEMISTRY_NIMN) {
                this.firstDayDischargePercentage = 7;
                this.dischargePercentagePerDay = 0.5;
            } else {
                this.firstDayDischargePercentage = 5;
                this.dischargePercentagePerDay = 0.3;
            }
        }
    }

    processCycleInfoBlock(buffer, offset) {
        this.totalChargeCycles = BatteryData.decryptInt(buffer.readUInt16BE(offset + 1), 2, this.key1);
        this.totalReverts = BatteryData.decryptInt(buffer.readUInt16BE(offset + 3), 2, this.key1);
        this.dayOfLastCharge = BatteryData.decryptInt(buffer.readUInt16BE(offset + 5), 2, this.key1);

        // if(this.batteryAgeTotalDaysETM >= this.dayOfLastCharge)
        //     this.daysSinceLastCharge = Math.floor(this.batteryAgeTotalDaysETM - this.dayOfLastCharge);
        // else if(this.batteryAgeTotalDaysPC >= this.dayOfLastCharge)
        //     this.daysSinceLastCharge = Math.floor(this.batteryAgeTotalDaysPC - this.dayOfLastCharge);
        // else
        //     throw new Error('Invalid cycle info ?');

        this.totalTopOffCycles = BatteryData.decryptInt(buffer.readUInt16BE(offset + 7), 2, this.key1);
    }

    processDateInfoBlock(buffer, offset) {
        this.manufactureDate = BatteryData.decryptDate(buffer.readUInt16BE(offset + 1), this.key1, this.key2);

        this.dayOfInitialUse = BatteryData.decryptInt(buffer.readUInt16BE(offset + 3), 2, this.key1);
        // if(this.dayOfInitialUse > 0) {
        //     let tmpDate = (new Date(this.manufactureDate));
        //     tmpDate.setDate(this.manufactureDate.getDate() + this.dayOfInitialUse);
        //     this.dateOfFirstUse = tmpDate;
        //
        //     if((new Date()) >= this.dateOfFirstUse)
        //         this.daysInService = Math.max(1, Math.floor(((new Date()).getTime() - this.dateOfFirstUse.getTime()) / 1000 / 86400));
        // }

        this.dayOfInitialCharge = BatteryData.decryptInt(buffer.readUInt16BE(offset + 5), 2, this.key1);
        // let totalDays =  Math.floor(((new Date()).getTime() - this.manufactureDate.getTime()) / 1000 / 86400);
        // this.batteryAgeTotalDaysPC = totalDays;
        // this.batteryAgeYears = Math.floor(totalDays / 365.2421875);
        // let num = totalDays % 365;
        // this.batteryAgeMonths = Math.floor(num / 30.436849594116211);
        // this.batteryAgeDays = num % 30;
    }

    processDS2438Block(buffer, offset) {
        this.m_SenseResistor = buffer.readUInt16LE(offset + 56) / 100000;
        this.current = buffer.readUInt16LE(offset + 5);
        this.offset = buffer.readUInt16LE(offset + 13);
        let num1 = buffer.readUInt8(offset+12);
        this.ICA_MAH = Math.floor((1000 * buffer.readUInt8(offset+12)) / (2048 * this.m_SenseResistor));
        this.capacityMAH = this.ICA_MAH;
        this.CCA = buffer.readUInt16LE(offset + 60);
        this.DCA = buffer.readUInt16LE(offset + 62);
        this.totalCapacityAdded = this.CCA * 1000;
        this.totalCapacityRemoved = this.DCA * 1000;
        this.CONF = buffer.readUInt8(offset);
        this.temperature = buffer.readUInt8(offset+2) + buffer.readUInt8(offset+1) / 256;
        this.voltage = buffer.readUInt16LE(offset + 3) / 100.0 + 0.13500000536441803;
        this.currentThreshold = buffer.readUInt8(offset + 7);
        this.ETM = buffer.readUInt32LE(offset + 8);
        // this.batteryAgeTotalDaysETM = this.ETM / 86400;
        // let num2 = this.ETM - this.batteryAgeTotalDaysETM * 86400;
        // this.ETM_Hours = num2 / 3600;
        // let num3 = this.ETM_Hours * 3600;
        // this.ETM_Minutes = num3 / 60;
        // this.ETM_Seconds = num3 - this.ETM_Minutes * 60;
        this.lastKnownDay = buffer.readUInt16LE(offset + 50);
        this.lastKnownHour = buffer.readUInt8(offset + 52);
        this.lastKnownMin = buffer.readUInt8(offset + 53);
        this.ICA = buffer.readUInt8(offset + 12);
    }

    processEndOfServiceBlock(buffer, offset) {
        this.EOSChargeCycles = buffer.readUInt16BE(offset + 1);
        this.EOSApproxCycles = buffer.readUInt16BE(offset + 3);
        this.EOSNumReconds = buffer.readUInt16BE(offset + 5);
        this.EOSNumInsertions = buffer.readUInt16BE(offset + 7);
        this.EOSNumTrickleCycles = buffer.readUInt16BE(offset + 9);
        this.dayOfEndOfService = buffer.readUInt16BE(offset + 11);
        this.EOSPercentage = buffer.readUInt8(offset + 13);
    }

    processErrorTrackingBlock(buffer, offset) {
        this.ETMError = buffer.readUInt8(offset + 1);
        this.Page0Error = buffer.readUInt8(offset + 2);
        this.XTVAError = buffer.readUInt8(offset + 3);
        this.CCAError = buffer.readUInt8(offset + 4);
        this.DCAError = buffer.readUInt8(offset + 5);
    }

    processHostIDBlock(buffer, offset) {
        this.hostID = buffer.readUInt8(offset + 1);
        let num1 = buffer.readUInt8(offset + 2);
        this.softwareVersion = (num1 >>> 4) + 0.1 * (num1 & 15);
    }

    processNonSmartCyclesBlock(buffer, offset) {
        let num1 = buffer.readUInt16BE(offset + 1);
        this.lastKnownCapacityAdded = buffer.readUInt16BE(offset + 3);
        this.lastKnownCapacityRemoved = buffer.readUInt16BE(offset + 5);
        this.nonIMPRESCCA = num1 / (64 * this.m_SenseResistor);
        this.lastKnownCCA = this.lastKnownCapacityAdded / (64 * this.m_SenseResistor);
        this.lastKnownDCA = this.lastKnownCapacityRemoved / (64 * this.m_SenseResistor);
        this.lastKnownCapacityAdded = Math.floor(this.lastKnownCCA * 1000);
        this.lastKnownCapacityRemoved = Math.floor(this.lastKnownDCA * 1000);

        this.nonIMPRESCycles = buffer.readUInt16BE(offset + 7);
        this.initalUseNonIMPRESCycles = buffer.readUInt8(offset + 9);
        this.nonIMPRESCyclesPrior = buffer.readUInt8(offset + 10);
        this.nonIMPRESPerThresh = buffer.readUInt8(offset + 11);
    }

    processRecondBlock(buffer, offset) {
        this.calibrationCycles = BatteryData.decryptInt(buffer.readUInt16BE(offset + 1), 2, this.key1);
        this.dayOfLastReconditioning = BatteryData.decryptInt(buffer.readUInt16BE(offset + 3), 2, this.key1);

        // if(this.batteryAgeTotalDaysETM >= this.dayOfLastReconditioning)
        //     this.daysSinceLastCalibration = Math.floor(this.batteryAgeTotalDaysETM - this.dayOfLastReconditioning);
        // else if(this.batteryAgeTotalDaysPC >= this.dayOfLastReconditioning)
        //     this.daysSinceLastCalibration = Math.floor(this.batteryAgeTotalDaysPC - this.dayOfLastReconditioning);

        this.capacityAtFirstUsage = Math.floor((1000 * BatteryData.decryptInt(buffer.readUInt8(offset + 5), 1, this.key1)) / (2048 * this.m_SenseResistor));
        this.CTS = BatteryData.decryptInt(buffer.readUInt8(offset + 6), 1, this.key1);
        this.potentialCapacity = Math.floor((1000 * this.CTS) / (2048 * this.m_SenseResistor));
        this.topOffCapacity = Math.floor((1000 * BatteryData.decryptInt(buffer.readUInt8(offset + 9), 2, this.key1)) / (2048 * this.m_SenseResistor));
        this.recondTrigger = BatteryData.decryptInt(buffer.readUInt16BE(offset + 7), 2, this.key1);
    }

    processRecondWeightBlock(buffer, offset) {
        for (let i = 0; i < 10; i++)
            this.recondWeights[i] = buffer.readUInt8(offset + i);
    }

    processStatusBlock(buffer, offset) {
        this.chargerLEDStatus = buffer.readUInt8(offset+1);
        let num3 = buffer.readUInt8(offset+2);
        let num4 = num3 & 0xF8;
        let num5 = num3 & 0x07;

        if(this.chemistry === BatteryData.CHEMISTRY_LIION) {
            switch(num4) {
                case 32:
                    num4 = 33;
                    break;
                case 64:
                    num4 = 65;
                    break;
                case 128:
                    num4 = 129;
                    break;
            }
        }

        let num6;

        switch(num5) {
            case 1:
            case 2:
            case 4:
            case 5:
            case 6:
                num6 = num5 + 600;
                break;
            default:
                num6 = 600;
        }

        this.chargeStatus = num4 + '+' + num6;
    }

    processKitNumberBlock(buffer, offset) {
        this.kitNumber = '';
        let num = buffer.readUInt8(offset) - 2;

        for(let i = 0; i < num; i++) {
            let b = buffer.readUInt8(offset+i+1);
            this.kitNumber += String.fromCharCode(b);
        }

        // let i = 0;
        // while(true) {
        //     let b = buffer.readUInt8(offset+i+1);
        //
        //     if(b===0)
        //         break;
        //
        //     this.kitNumber += String.fromCharCode(b);
        //     i++;
        // }
    }

    processData(buffer) {
        this.processSerialBlock(buffer, BatteryData.batterySerialStart);

        let blockAddress1 = this.getBlockAddress(buffer, 70);
        let blockAddress2 = this.getBlockAddress(buffer, 72);
        let blockAddress3 = this.getBlockAddress(buffer, 74);
        let blockAddress4 = this.getBlockAddress(buffer, 76);
        let blockAddress5 = this.getBlockAddress(buffer, 78);
        let blockAddress6 = this.getBlockAddress(buffer, 80);
        let blockAddress7 = this.getBlockAddress(buffer, 82);
        let blockAddress8 = this.getBlockAddress(buffer, 84);
        let blockAddress9 = this.getBlockAddress(buffer, 86);
        let blockAddress10 = this.getBlockAddress(buffer, 88);
        let blockAddress11 = this.getBlockAddress(buffer, 90);
        let blockAddress12 = this.getBlockAddress(buffer, 92);
        let blockAddress13 = this.getBlockAddress(buffer, 94);
        let blockAddress14 = this.getBlockAddress(buffer, 96);
        let blockAddress15 = this.getBlockAddress(buffer, 98);
        let blockAddress16 = this.getBlockAddress(buffer, 100);
        // let blockAddress17 = this.getBlockAddress(buffer, 102);
        // let blockAddress18 = this.getBlockAddress(buffer, 114);

        this.processDS2438Block(buffer, BatteryData.ds2438start);
        this.processPage0Block(buffer, BatteryData.ds2433start);

        // console.log(this.verifyBlock(buffer, 509+BatteryData.ds2433start));
        // console.log(this.verifyBlock(buffer, blockAddress2));
        // console.log(this.verifyBlock(buffer, blockAddress3));
        // console.log(this.verifyBlock(buffer, blockAddress4));
        // console.log(this.verifyBlock(buffer, blockAddress5));
        // console.log(this.verifyBlock(buffer, blockAddress6));

        this.processDateInfoBlock(buffer, blockAddress1);
        this.processAdditionBlock(buffer, blockAddress2);
        this.processStatusBlock(buffer, blockAddress3);
        this.processHostIDBlock(buffer, blockAddress4);
        this.processCycleInfoBlock(buffer, blockAddress5);
        this.processRecondBlock(buffer, blockAddress6);
        this.processRecondWeightBlock(buffer, blockAddress7);
        this.processChargeAddedBlock(buffer, blockAddress8);
        this.processChargeRemainingBlock(buffer, blockAddress9);
        this.processEndOfServiceBlock(buffer, blockAddress10);
        this.processNonSmartCyclesBlock(buffer, blockAddress11);
        this.processErrorTrackingBlock(buffer, blockAddress12);
        // this.processDischargeCharBlock(buffer, blockAddress13);
        this.processKitNumberBlock(buffer, blockAddress14);
        // this.processNfpaInformationBlock(buffer, blockAddress18);
        this.processChargeRetentionBlock(buffer, blockAddress15);
        this.processCalibrationBlock(buffer, blockAddress16);
        // this.processChargeRecoveryCharBlock(buffer, blockAddress17);
        // process.exit(0);

        if(blockAddress14===BatteryData.invalidBlock) {
            this.batteryTypeID = 1;
        } else {
            this.batteryTypeID = 2;

            // let selfDischarge = this.calculateSelfDischarge();
            // console.log(selfDischarge);
            // if(this.capacityMAH > selfDischarge) {
            //     this.capacityMAH = this.capacityMAH - selfDischarge;
            // } else {
            //     this.capacityMAH = 0;
            // }
        }

        this.daysSinceRemoval = 0;

        // if(this.batteryAgeTotalDaysETM > this.lastKnownDay)
        //     this.daysSinceRemoval = Math.floor(this.batteryAgeTotalDaysETM - this.lastKnownDay);
        // else if(this.batteryAgeTotalDaysPC > this.lastKnownDay)
        //     this.daysSinceRemoval = Math.floor(this.batteryAgeTotalDaysPC - this.lastKnownDay);





        /// data correction
        this.performCalculations();
    }

    // Hardware information: https://github.com/rick51231/motorola-battery-reader
    static fromBatteryChip(rawBuffer, rawBuffer38, chipSerial) {
        //TODO: ?
    }

    processOTAData(buffer) {
        let idx1 = 0;
        let idx2 = 0;
        let dataType = 0;

        if(buffer.length===112) { //Static + dynamic
            dataType = BatteryData.OTA_DATATYPE_STATICDYNAMIC;
            idx1 = 10;
            idx2 = 31;
        } else if(buffer.length===91) { //Dynamic
            dataType = BatteryData.OTA_DATATYPE_DYNAMIC;
            idx2 = 10;
        } else if(buffer.length===31) { //Static
            dataType = BatteryData.OTA_DATATYPE_STATIC;
            idx1 = 10;
        } else {
            throw new Error('Invalid OTA len');
        }

        this.processSerialBlock(buffer, 3);

        if(dataType===BatteryData.OTA_DATATYPE_STATICDYNAMIC || dataType===BatteryData.OTA_DATATYPE_STATIC) {
            this.chemistry = buffer.readUInt8(idx1);

            this.kitNumber = '';
            for (let i = 0; i < 12; i++)
                this.kitNumber += String.fromCharCode(buffer.readUInt8(idx1 + 1 + i));

            this.kitNumber = this.kitNumber.replaceAll("\x00", '');

            this.ratedCapacity = buffer.readUInt8(idx1 + 13) * 25;
            this.softwareVersion = (buffer.readUInt8(idx1 + 14) >> 4) + 0.1 * (buffer.readUInt8(idx1 + 14) & 15);
            this.manufactureDate = BatteryData.decryptDate(buffer.readUInt16LE(idx1 + 15), this.key1, this.key2);
            this.dayOfInitialUse = BatteryData.decryptInt(buffer.readUInt16LE(idx1 + 17), 2, this.key1);
            this.chargerLowTemperature = BatteryData.countsToCelcius(buffer.readUInt8(idx1 + 20));
            this.chargerHighTemperature = BatteryData.countsToCelcius(buffer.readUInt8(idx1 + 19));


        }


            this.m_SenseResistor = buffer.readUInt16LE(idx2) / 100000;
            this.ICA = buffer.readUInt8(idx2 + 2)
            this.ICA_MAH = Math.floor((1000 * this.ICA) / (2048.0 * this.m_SenseResistor));
            this.capacityMAH = this.ICA_MAH;
            this.CTS = BatteryData.decryptInt(buffer.readUInt8(idx2 + 3), 1, this.key1);
            this.potentialCapacity = Math.floor((1000 * this.CTS) / (2048.0 * this.m_SenseResistor));
            this.remainingCapacityRatio = buffer.readUInt8(idx2 + 80);

            this.firstDayDischargePercentage = buffer.readUInt8(idx2 + 4) / 10;
            this.dischargePercentagePerDay = buffer.readUInt8(idx2 + 5) / 10;
            this.dayOfLastCharge = BatteryData.decryptInt(buffer.readUInt16LE(idx2 + 6), 2, this.key1);
            this.lastKnownHour = buffer.readUInt8(idx2 + 8);
            this.lastKnownMin = buffer.readUInt8(idx2 + 9);

            this.processRecondWeightBlock(buffer, idx2 + 10);

            this.recondTrigger = BatteryData.decryptInt(buffer.readUInt16LE(idx2 + 20), 2, this.key1);
            this.nonIMPRESCycles = buffer.readUInt16LE(idx2 + 22);
            this.calibrationCycles = BatteryData.decryptInt(buffer.readUInt16LE(idx2 + 24), 2, this.key1);

            this.processStatusBlock(buffer, idx2+26 - 1);

            this.voltage = (buffer.readUInt16LE(idx2 + 28) / 100.0 + 0.13500000536441803);
            this.temperature = (buffer.readUInt8(idx2 + 30 + 1) + buffer.readUInt8(idx2 + 30) / 256);

            this.processChargeAddedBlock(buffer, idx2 + 32 - 1, false);
            this.processChargeRemainingBlock(buffer, idx2 + 52- 1, false);

            this.dayOfLastReconditioning = BatteryData.decryptInt(buffer.readUInt16LE(idx2 + 72), 2, this.key1);
            this.ETM = buffer.readUInt32LE(idx2 + 74);
            this.lastKnownDay = buffer.readUint16LE(idx2 + 78);

            this.performCalculations();

            return dataType;
    }

    processPage0Block(buffer, offset) {
        let flag = true;
        let checksum = 0;

        for(let i = 1; i <= 26; i++) {
            let b = buffer.readUInt8(offset+i);

            checksum += b;

            if(b!==0xFF && b!==0x00)
                flag = false;
        }

        checksum &= 0xFF;

        if(flag || checksum!==0)
            console.log('Invalid page 0');



        this.chargerLowTemperature = BatteryData.countsToCelcius(buffer.readUInt8(offset+6));
        this.chargerHighTemperature = BatteryData.countsToCelcius(buffer.readUInt8(offset+7));
        this.ratedCapacity = 25 * buffer.readUInt8(offset+8);
    }

    performCalculations() {
        if(this.dayOfInitialUse > 0) {
            let tmpDate = (new Date(this.manufactureDate));
            tmpDate.setDate(this.manufactureDate.getDate() + this.dayOfInitialUse);
            this.dateOfFirstUse = tmpDate;

            if((new Date()) >= this.dateOfFirstUse)
                this.daysInService = Math.max(1, Math.floor(((new Date()).getTime() - this.dateOfFirstUse.getTime()) / 1000 / 86400));
        }

        this.batteryAgeTotalDaysETM = this.ETM / 86400;
        let num8 = this.ETM - Math.floor(this.batteryAgeTotalDaysETM) * 86400;
        this.ETM_Hours = Math.floor(num8 / 3600);
        let num9 = num8 - this.ETM_Hours * 3600;
        this.ETM_Minutes = Math.floor(num9 / 60);
        this.ETM_Seconds = Math.floor(num9 - this.ETM_Minutes * 60);
        this.totalLastKnownSec = this.lastKnownDay * 86400 + this.lastKnownHour * 3600 + this.lastKnownMin * 60;

        let selfDischarge = this.calculateSelfDischarge();
        // console.log(selfDischarge);
        if(this.capacityMAH > selfDischarge) {
            this.capacityMAH = Math.floor(this.capacityMAH - selfDischarge);
        } else {
            this.capacityMAH = 0;
        }

        let totalDays =  Math.floor(((new Date()).getTime() - this.manufactureDate.getTime()) / 1000 / 86400);
        this.batteryAgeTotalDaysPC = totalDays;
        this.batteryAgeYears = Math.floor(totalDays / 365.2421875);
        let num10 = totalDays % 365;
        this.batteryAgeMonths = Math.floor(num10 / 30.436849594116211);
        this.batteryAgeDays = num10 % 30;

        if(this.batteryAgeTotalDaysETM >= this.dayOfLastReconditioning)
            this.daysSinceLastCalibration = Math.floor(this.batteryAgeTotalDaysETM - this.dayOfLastReconditioning);
        else if(this.batteryAgeTotalDaysPC >= this.dayOfLastReconditioning)
            this.daysSinceLastCalibration = Math.floor(this.batteryAgeTotalDaysPC - this.dayOfLastReconditioning);

        if(this.batteryAgeTotalDaysETM >= this.dayOfLastCharge)
            this.daysSinceLastCharge = Math.floor(this.batteryAgeTotalDaysETM - this.dayOfLastCharge);
        else if(this.batteryAgeTotalDaysPC >= this.dayOfLastCharge)
            this.daysSinceLastCharge = Math.floor(this.batteryAgeTotalDaysPC - this.dayOfLastCharge);
        // else
        //     throw new Error('Invalid cycle info ?');


        if(this.batteryAgeTotalDaysETM > this.lastKnownDay)
            this.daysSinceRemoval = Math.floor(this.batteryAgeTotalDaysETM - this.lastKnownDay);
        else if(this.batteryAgeTotalDaysPC > this.lastKnownDay)
            this.daysSinceRemoval = Math.floor(this.batteryAgeTotalDaysPC - this.lastKnownDay);

        this.voltage = Math.round(this.voltage * 100) / 100; //Precision to two digits
        this.temperature = Math.round(this.temperature * 100) / 100; //Precision to two digits

        if(this.ratedCapacity > 0) {
            this.remainingCapacityRatio = Math.round((this.capacityMAH / this.ratedCapacity) * 100);

            if(this.remainingCapacityRatio > 100)
                this.remainingCapacityRatio = 100;

            this.health = Math.min(100, Math.round((this.potentialCapacity / this.ratedCapacity) * 100));
        }

        this.estimatedDaysUntilNextReconditioning = this.getReconditioningDays();
    }

    isCalibrationNeeded() {
        return this.daysSinceLastCalibration > 30 || this.recondTrigger <= 0 || this.dayOfLastReconditioning === 0 //TODO: isETMError
    }

    getReconditioningDays() {
        if (this.isCalibrationNeeded())
            return 0;

        let num1 = 0.0;
        let num2 = 0.0;

        for(let i = 0; i < 10; i++) {
            num2 += this.remainingHistogram[i] * (10 * i + 5);
            num1 += this.remainingHistogram[i];
        }

        let index1 =  Math.round((num2 !== 0 ? num1 / num2 : 95.0) / 10.0);
        let num3 =  this.recondWeights[index1] === 0 ? 0 : ( this.recondTrigger /  this.recondWeights[index1]);
        let num4 =  this.daysInService <= 0 ?  ( this.totalChargeCycles +  this.nonIMPRESCycles) :  ( this.totalChargeCycles +  this.nonIMPRESCycles) /  this.daysInService;

        return Math.min(num4 <= 0.001 ? 1 :  ( num3 / num4),  (30 - Math.min(30, this.daysSinceLastCalibration)));
    }

    // Hardware information: https://github.com/rick51231/motorola-battery-reader
    static convertReaderData(str) {
        let p = str.split('_');

        let ids = p[0].split('/');
        let id = '';

        for(let i of ids) {
            if(i.substr(0, 2).toUpperCase()==='A3') {
                id = i;
                break;
            }
        }

        let ds2438 = '';

        for(let i = 0; i < 8; i++) {
            ds2438 += p[1].substr(i*9*2, 8*2)
        }

        return id+p[2]+ds2438;
    }

    static countsToCelcius(counts) {
        let m = [ [ 968, -3000 ], [ 932, -2000 ], [ 856, -700 ], [ 764, 400 ], [ 660, 1400 ], [ 540, 2500 ], [ 420, 3600 ], [ 324, 4600 ], [ 240, 5700 ], [ 176, 6800 ], [ 128, 7900 ], [ 96, 8900 ], [ 72, 10000 ] ];

        counts <<= 2;
        let celcius = 0;
        if(counts >= m[0][0])
            celcius = m[0][1] / 100;
        else if(counts <= m[12][0])
            celcius = m[12][1] / 100;
         else {
             let index = 1;
             while(counts < m[index][0])
                index++;

             celcius = ((m[ index - 1][0]- counts) * (m[ index][1] - m[index - 1][ 1]) / (m[index - 1][0] - m[index][0]) +  m[index - 1][1]) / 100;
        }

         return celcius;
    }

    static decryptDate(intVal, key1, key2) {
        let key = (key2 >> 4) ^ (key1 & 0xF);

        do {
            key--;

            if((intVal & 1) > 0) {
                intVal = (intVal >>> 1) | 0x8000;
            } else {
                intVal >>= 1;
            }
        } while(key > 0)

        intVal += 10048;

        let year = (intVal >> 9) + 1980;
        let month = intVal >> 5 & 0x0F;
        let day = intVal & 0x1F;
        let dateTimeStr = year.toString(10) + '-' + month.toString(10).padStart(2, '0') + '-' + day.toString(10).padStart(2, '0');
        return new Date(dateTimeStr);
    }

    static decryptInt(intVal, len, key) {
        let key2 = 0xD8;
        let num2 = key & 15;
        let is8Bit = len === 1;

        while (true) {
            if (num2-- <= 0) {
                break;
            }

            if ((intVal & 1) > 0) {
                intVal >>>= 1;
                intVal |= is8Bit ? 0x80 : 0x8000;
                continue;
            }

            intVal >>>= 1;
        }

        intVal -= key2;
        intVal = (intVal >>> 0) & (is8Bit ? 0xFF : 0xFFFF);

        return intVal;
    }
}

module.exports = BatteryData;