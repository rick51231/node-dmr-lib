class BatteryInfo {
    static ledState = {
        0x00    : 'Off',
        0x01    : 'Flashing RED',
        0x02    : 'Flashing YELLOW',
        0x04    : 'Steady GREEN',
        0x08    : 'Flashing GREEN',
        0x10    : 'Steady RED',
        0x20    : 'Steady YELLOW',
        0x40    : 'Alternating RED GREEN',
        0x80    : 'Alternating YELLOW GREEN'
    };

    static ledStateDescr = {
        0x00    : '',
        0x01    : 'Error',
        0x02    : 'Too hot/cold',
        0x04    : 'Charge complete',
        0x08    : 'Charge 90% complete',
        0x10    : 'Charging',
        0x20    : 'Reconditioning',
        0x40    : 'End of life',
        0x80    : 'Recondition required'
    };

    static chargeState = {
        8   : 'Discharging',
        16  : 'Standby',
        33  : 'Constant Current',
        65  : 'Constant Voltage',
        129 : 'Completed',
        600 : 'Invalid status',
        601 : 'Hot',
        602 : 'Cold',
        604 : 'Low Voltage',
        605 : 'Hot & Low Voltage',
        606 : 'Hot & Low Voltage'
    }

    static radioFamily = {
        1	: 'XTS 3500, 5000',
        2	: 'XTS 1500, 2500',
        4	: 'Saber',
        5	: 'MOTOTRBO Pro Series',
        6	: 'HT/GP/PRO Series',
        7	: 'APX 5000, 6000, 7000',
        14	: 'APX 3000',
        16	: 'APX 2000, 4000, MOTOTRBO Pro Series (UL)',
        17	: 'APX 2000, 3000, 4000, MOTOTRBO Pro Series (FM)',
        19	: 'MOTOTRBO Pro Series (CSA)',
        22	: 'MOTOTRBO Pro Series (ATEX)',
        23	: 'APX 4000XH (CSA)',
        25	: 'APX 6000/XE (UL)',
        26	: 'APX 5000, 6000, 7000, 8000',
        28	: 'MOTOTRBO Pro Series (UL)',
        29	: 'APX 8000/XE (UL)',
        30	: 'LEX M20',
        32	: 'MTP8000Ex Series (ATEX)',
        33	: 'MTP6000 Series',
        34	: 'Si500, Si700',
        35	: 'ST7000, ST7500, TPG2200',
        36	: 'APX 6000/XE, 7000/XE, 8000H/8000HXE (UL)',
        37	: 'LEX L11',
        39	: 'MXP600',
        40	: 'MOTOTRBO ION',
        41	: 'MOTOTRBO ION (UL)',
        42	: 'APX NEXT',
        43	: 'APX NEXT (UL)',
        44	: 'APX 2000, 4000',
        45	: 'APX 2000, 4000, MOTOTRBO Pro Series',
        46	: 'APX 900, 1000i, MOTOTRBO Pro Series (UL)',
        47	: 'APX 900, 1000i, MOTOTRBO Pro Series',
        48	: 'APX4000XH',
        49	: 'MOTOTRBO R7',
        50	: 'MOTOTRBO R7 (UL)',
        51	: 'APX NEXT XN',
        52	: 'APX N30, N50',
        53	: 'APX N70',
        54	: 'MXP7000',
        56	: 'SRX 2200',
        57	: 'APX N70 (UL)',
        58	: 'APX N30, N50 (UL)',
        59	: 'HT/GP/PRO Series (FM)',
        60	: 'TPG2200',
        61	: 'MOTOTRBO Pro Series (M1)',
        62	: 'XTS 1500, 2500 (FM)',
        63	: 'XTS 3500, 5000 (FM)',
        64	: 'MOTOTRBO R2',
    };

    static batteryTypeIDs = {
        0   : 'External Power Source',
        1   : 'Non-IMPRES',
        2   : 'IMPRES'
    };

    static batteryKITList = { // [radioFamilyId, FM, Chemistry, RatedCapacity, TIA4950, UL2504Div2, CSA157, ATEX, NFPA, BatteryTypeID]
        HNN9031:	[1, 0, 1, 1525, 0, 0, 0, 0, 0, 2],
        HNN9032:	[63, 1, 1, 1525, 0, 0, 0, 0, 0, 2],
        NNTN4435:	[1, 0, 2, 1800, 0, 0, 0, 0, 0, 2],
        NNTN4436:	[63, 1, 2, 1700, 0, 0, 0, 0, 0, 2],
        NNTN4437:	[63, 1, 2, 1700, 0, 0, 0, 0, 0, 2],
        NNTN6034:	[1, 0, 3, 4150, 0, 0, 0, 0, 0, 2],
        NNTN7453:	[63, 1, 3, 3950, 0, 0, 0, 0, 0, 2],
        NTN9862:	[1, 0, 3, 2750, 0, 0, 0, 0, 0, 2],
        PMNN4093:	[1, 0, 2, 3000, 0, 0, 0, 0, 0, 2],
        NNTN6263:	[62, 1, 2, 2000, 0, 0, 0, 0, 0, 2],
        NNTN7335:	[2, 0, 3, 2700, 0, 0, 0, 0, 0, 2],
        NNTN7554:	[2, 0, 3, 2050, 0, 0, 0, 0, 0, 2],
        NTN9857:	[62, 1, 2, 2000, 0, 0, 0, 0, 0, 2],
        NTN9858:	[2, 0, 2, 2100, 0, 0, 0, 0, 0, 2],
        HNN9033:	[4, 0, 1, 2000, 0, 0, 0, 0, 0, 2],
        HNN9034:	[4, 1, 1, 2000, 0, 0, 0, 0, 0, 2],
        PMNN4066:	[5, 0, 3, 1500, 0, 0, 0, 0, 0, 2],
        PMNN4069:	[5, 1, 3, 1400, 0, 0, 0, 0, 0, 2],
        PMNN4077:	[5, 0, 3, 2150, 0, 0, 0, 0, 0, 2],
        PMNN4101:	[5, 0, 3, 1500, 0, 0, 0, 0, 0, 2],
        PMNN4102:	[5, 1, 3, 1400, 0, 0, 0, 0, 0, 2],
        PMNN4103:	[5, 0, 3, 2150, 0, 0, 0, 0, 0, 2],
        PMNN4262:	[5, 0, 3, 2850, 0, 0, 0, 0, 0, 2],
        HNN4001:	[6, 0, 2, 1800, 0, 0, 0, 0, 0, 2],
        HNN4002:	[59, 1, 2, 1690, 0, 0, 0, 0, 0, 2],
        HNN4003:	[6, 0, 3, 2000, 0, 0, 0, 0, 0, 2],
        HNN9028:	[6, 0, 1, 1500, 0, 0, 0, 0, 0, 2],
        HNN9029:	[59, 1, 1, 1500, 0, 0, 0, 0, 0, 2],
        PMNN4156:	[6, 0, 2, 2000, 0, 0, 0, 0, 0, 2],
        PMNN4157:	[59, 1, 2, 1850, 0, 0, 0, 0, 0, 2],
        PMNN4159:	[6, 0, 3, 2350, 0, 0, 0, 0, 0, 2],
        NNTN7033:	[7, 1, 3, 4100, 0, 0, 0, 0, 0, 2],
        NNTN7034:	[7, 0, 3, 4200, 0, 0, 0, 0, 0, 2],
        NNTN7035:	[7, 1, 2, 2000, 0, 0, 0, 0, 0, 2],
        NNTN7036:	[7, 1, 2, 2000, 0, 0, 0, 0, 0, 2],
        NNTN7037:	[7, 0, 2, 2100, 0, 0, 0, 0, 0, 2],
        NNTN7038:	[7, 0, 3, 2900, 0, 0, 0, 0, 0, 2],
        NNTN7573:	[7, 0, 2, 2100, 0, 0, 0, 0, 0, 2],
        NNTN8092:	[7, 1, 3, 2300, 0, 0, 0, 0, 0, 2],
        PMNN4403:	[7, 0, 3, 2150, 0, 0, 0, 0, 0, 2],
        PMNN4407:	[5, 0, 3, 1500, 0, 0, 0, 0, 0, 2],
        PMNN4409:	[5, 0, 3, 2150, 0, 0, 0, 0, 0, 2],
        PMNN4488:	[5, 0, 3, 3000, 0, 0, 0, 0, 0, 2],
        PMNN4491:	[47, 0, 3, 2100, 0, 0, 0, 0, 0, 2],
        PMNN4493:	[47, 0, 3, 3000, 0, 0, 0, 0, 0, 2],
        PMNN4499:	[5, 0, 3, 3000, 0, 0, 0, 0, 0, 2],
        NNTN8128:	[44, 0, 3, 1900, 0, 0, 0, 0, 0, 2],
        NNTN8305:	[14, 0, 3, 1250, 0, 0, 0, 0, 0, 2],
        PMNN4424:	[44, 0, 3, 2300, 0, 0, 0, 0, 0, 2],
        NNTN8560:	[16, 0, 3, 2500, 1, 0, 0, 0, 0, 2],
        NNTN8129:	[17, 1, 3, 2300, 0, 0, 0, 0, 0, 2],
        NNTN8386:	[19, 0, 3, 1800, 0, 0, 1, 0, 0, 2],
        NNTN7789:	[19, 0, 3, 1750, 0, 0, 0, 0, 0, 2],
        NNTN8287:	[19, 0, 3, 1750, 0, 0, 1, 0, 0, 2],
        PMNN4417:	[5, 0, 3, 1500, 0, 0, 0, 0, 0, 2],
        PMNN4418:	[5, 0, 3, 2150, 0, 0, 0, 0, 0, 2],
        PMNN4448:	[45, 0, 3, 2800, 0, 0, 0, 0, 0, 2],
        NNTN8359:	[22, 0, 3, 2075, 0, 0, 0, 1, 0, 2],
        NNTN8750:	[23, 0, 3, 2050, 0, 0, 1, 0, 0, 2],
        NNTN8840:	[61, 0, 3, 2000, 0, 0, 0, 1, 0, 2],
        NNTN8921:	[25, 0, 3, 4500, 1, 0, 0, 0, 0, 2],
        NNTN8930:	[25, 0, 3, 2650, 1, 0, 0, 0, 0, 2],
        PMNN4485:	[26, 0, 3, 2550, 0, 0, 0, 0, 0, 2],
        PMNN4486:	[26, 0, 3, 3400, 0, 0, 0, 0, 0, 2],
        PMNN4487:	[26, 0, 3, 4850, 0, 0, 0, 0, 0, 2],
        PMNN4494:	[26, 0, 3, 5100, 0, 0, 0, 0, 0, 2],
        PMNN4489:	[46, 0, 3, 2900, 1, 0, 0, 0, 0, 2],
        PMNN4490:	[28, 0, 3, 2900, 1, 0, 0, 0, 0, 2],
        PMNN4504:	[29, 0, 3, 3400, 0, 1, 0, 0, 0, 2],
        PMNN4505:	[29, 0, 3, 4850, 0, 1, 0, 0, 0, 2],
        PMNN4474:	[30, 0, 3, 2800, 0, 0, 0, 0, 0, 2],
        PMNN4530:	[34, 0, 3, 3700, 0, 0, 0, 0, 0, 2],
        NNTN8570:	[32, 0, 3, 1200, 0, 0, 0, 1, 0, 2],
        PMNN4522:	[33, 0, 3, 3300, 0, 0, 0, 0, 0, 2],
        PMNN4549:	[34, 0, 3, 2800, 0, 0, 0, 0, 0, 2],
        PMNN4510:	[35, 0, 3, 2300, 0, 0, 0, 0, 0, 2],
        PMNN4547:	[36, 0, 3, 3100, 1, 0, 0, 0, 0, 2],
        PMNN4546:	[37, 0, 3, 5000, 0, 0, 0, 0, 0, 2],
        PMNN4545:	[37, 0, 3, 2500, 0, 0, 0, 0, 0, 2],
        PMNN4543:	[5, 0, 3, 2450, 0, 0, 0, 0, 0, 1],
        PMNN4544:	[5, 0, 3, 2450, 0, 0, 0, 0, 0, 2],
        PMNN4548:	[5, 0, 3, 2450, 0, 0, 0, 0, 0, 1],
        PMNN4573:	[36, 0, 3, 4600, 1, 0, 0, 0, 0, 2],
        NNTN8091:	[7, 1, 3, 2300, 0, 0, 0, 0, 0, 2],
        PMNN4582:	[39, 0, 3, 2900, 0, 0, 0, 0, 0, 2],
        PMNN4801:	[39, 0, 3, 1900, 0, 0, 0, 0, 0, 2],
        PMNN4802:	[39, 0, 3, 3400, 0, 0, 0, 0, 0, 2],
        PMNN4803:	[40, 0, 3, 2800, 0, 0, 0, 0, 0, 2],
        PMNN4804:	[41, 0, 3, 2850, 1, 0, 0, 0, 0, 2],
        PMNN4805:	[41, 0, 3, 4000, 1, 0, 0, 0, 0, 2],
        NNTN9087:	[42, 0, 3, 3850, 0, 0, 0, 0, 0, 2],
        NNTN9088:	[43, 0, 3, 3850, 0, 1, 0, 0, 0, 2],
        NNTN9089:	[42, 0, 3, 5850, 0, 0, 0, 0, 0, 2],
        NNTN9090:	[43, 0, 3, 5850, 0, 1, 0, 0, 0, 2],
        NNTN9216:	[42, 0, 3, 4400, 0, 0, 0, 0, 0, 2],
        NNTN9217:	[43, 0, 3, 4400, 0, 1, 0, 0, 0, 2],
        PMNN4579:	[36, 0, 3, 3850, 0, 0, 0, 0, 0, 2],
        PMNN4502:	[5, 0, 3, 3000, 0, 0, 0, 0, 0, 2],
        PMNN4525:	[5, 0, 3, 1950, 0, 0, 0, 0, 0, 2],
        NNTN4321:	[48, 0, 3, 2050, 0, 0, 0, 0, 0, 2],
        PMNN4807:	[49, 0, 3, 2050, 0, 0, 0, 0, 0, 2],
        PMNN4808:	[49, 0, 3, 2300, 0, 0, 0, 0, 0, 1],
        PMNN4809:	[49, 0, 4, 2700, 0, 0, 0, 0, 0, 2],
        PMNN4810:	[50, 0, 3, 3100, 1, 0, 0, 0, 0, 2],
        PMNN4812:	[51, 0, 3, 3400, 0, 0, 0, 0, 1, 2],
        PMNN4813:	[52, 0, 4, 2700, 0, 0, 0, 0, 0, 2],
        PMNN4816:	[53, 0, 3, 3000, 0, 0, 0, 0, 0, 2],
        PMNN4830:	[54, 0, 3, 5600, 0, 0, 0, 0, 0, 2],
        PMNN4815:	[58, 0, 3, 3100, 0, 1, 0, 0, 0, 2],
        PMNN4817:	[53, 0, 3, 4400, 0, 0, 0, 0, 0, 2],
        PMNN4818:	[57, 0, 3, 3450, 1, 0, 0, 0, 0, 2],
        NNTN8182:	[56, 0, 3, 3100, 0, 0, 0, 0, 0, 2],
        PMNN4586:	[60, 0, 3, 3500, 0, 0, 0, 0, 0, 2],
        PMNN4598:	[64, 0, 3, 2300, 0, 0, 0, 0, 0, 1],
        PMNN4600:	[64, 0, 3, 2100, 0, 0, 0, 0, 0, 1],
        PMNN4406:	[5, 0, 3, 1500, 0, 0, 0, 0, 0, 1],
    }
}

module.exports = BatteryInfo;