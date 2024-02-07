// https://github.com/n0mjs710/dmr_utils/blob/master/dmr_utils/ambe_utils.py
// https://github.com/ea3ihi/HomebrewTS/blob/master/DMRUtils.ts
// https://github.com/f4exb/dsdcc/blob/master/dmr.cpp

// Test data: ACAA40200044408080 E5A8C54557061DEC0A

const BitUtils = require("../BitUtils");

class AMBE {
    static rW = [
        0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 1,
        0, 1, 0, 1, 0, 2,
        0, 2, 0, 2, 0, 2,
        0, 2, 0, 2, 0, 2
    ]

    static rX = [
        23, 10, 22, 9, 21, 8,
        20, 7, 19, 6, 18, 5,
        17, 4, 16, 3, 15, 2,
        14, 1, 13, 0, 12, 10,
        11, 9, 10, 8, 9, 7,
        8, 6, 7, 5, 6, 4
    ]

    static rY = [
        0, 2, 0, 2, 0, 2,
        0, 2, 0, 3, 0, 3,
        1, 3, 1, 3, 1, 3,
        1, 3, 1, 3, 1, 3,
        1, 3, 1, 3, 1, 3,
        1, 3, 1, 3, 1, 3
    ]

    static rZ = [
        5, 3, 4, 2, 3, 1,
        2, 0, 1, 13, 0, 12,
        22, 11, 21, 10, 20, 9,
        19, 8, 18, 7, 17, 6,
        16, 5, 15, 4, 14, 3,
        13, 2, 12, 1, 11, 0
    ];

    static convert72BitTo49BitAMBE(ambe72) {
        let bitArray = ambe72.split('').map(i => i==="1"); //Compatibility mode
        let ambe_fr = this.deinterleave(bitArray);
        ambe_fr = this.demodulateAmbe3600x2450(ambe_fr);
        return this.eccAmbe3600x2450Data(ambe_fr);
    }

    static convert49BitTo72BitAMBE(ambe49) {
        let bitArray = ambe49.split('').map(i => i==="1"); //Compatibility mode
        let ambe_fr = this.convert49BitAmbeTo72BitFrames(bitArray);
        ambe_fr = this.demodulateAmbe3600x2450(ambe_fr);
        let byteArray = this.interleave(ambe_fr);
        return BitUtils.bufferToBitsStr(Buffer.from(byteArray));
    }

    static convert49BitAmbeTo72BitFrames(ambe_d) {
        let ambe_fr = [
            new Uint8Array(24),
            new Uint8Array(24),
            new Uint8Array(24),
            new Uint8Array(24)
        ];

        let tmp = 0
        for(let i = 11; i > -1; i--)
            tmp = (tmp << 1) | ambe_d[i];

        tmp = this.golay2312(tmp);
        let parityBit = this.parity(tmp);
        tmp = tmp | (parityBit << 23);
        for(let i = 23; i > -1; i--) {
            ambe_fr[0][i] = (tmp & 1)
            tmp = tmp >>> 1;
        }

        tmp = 0
        for(let i = 23; i > 11; i--)
            tmp = (tmp << 1) | ambe_d[i];
        tmp = this.golay2312(tmp);

        for(let j = 22; j > -1; j--) {
            ambe_fr[1][j] = (tmp & 1);
            tmp = tmp >>> 1;
        }

        for(let j = 10; j > -1; j--)
            ambe_fr[2][j] = ambe_d[34 - j];

        for(let j = 13; j > -1; j--)
            ambe_fr[3][j] = ambe_d[48 - j];

        return ambe_fr
    }

    static eccAmbe3600x2450Data(ambe_fr) {
        let ambe = new Array(0);

        for(let j = 23; j > 11; j--)
            ambe.push(ambe_fr[0][j]);

        /*
#        # ecc and copy C1
#        gin = 0
#        for j in range(23):
#            gin = (gin << 1) | ambe_fr[1][j]
#
#        gout = BitArray(hex(golay2312(gin)))
#        for j in range(22, 10, -1):
#            ambe[bitIndex] = gout[j]
#            bitIndex += 1
         */
        // let gin = 0;
        // for(let j = 0; j < 23; j++)
        //     gin = (gin << 1) | ambe_fr[1][j];
        //
        // let gout = ("00000000" + this.golay2312(gin).toString(2)).substr(-8).split('').map(i => parseInt(i, 10)); //TODO: normal conversion
        //
        // let bitIndex = 0;
        // for(let j = 22; j > 10; j--) {
        //     // ambe[]
        // }


        for(let j = 22; j > 10; j--)
            ambe.push(ambe_fr[1][j]);

        for(let j = 10; j > -1; j--)
            ambe.push(ambe_fr[2][j]);

        for(let j = 13; j > -1; j--)
            ambe.push(ambe_fr[3][j]);

        return ambe.join('');
    }

    static demodulateAmbe3600x2450(ambe_fr) {
        let pr = new Int32Array(115);
        let foo = 0

        for (let i =23; i>11; i--) {
            foo = foo << 1
            foo = foo | ambe_fr[0][i];
        }

        pr[0] = (16 * foo);

        for (let i = 1; i<24; i++) {
            // pr[i] = (173 * pr[i - 1]) + 13849 - (65536 * (((173 * pr[i - 1]) + 13849) / 65536));
            let tmp = (173 * pr[i - 1]) + 13849
            let tmp1 = ((tmp>>>16) & 0xFFFF ) << 16;
            pr[i] =  tmp -tmp1
        }
        for (let i = 1; i<24; i++) {
            // pr[i] = pr[i] / 32768;
            pr[i] = pr[i] >> 15;
        }

        let k = 1
        for (let j = 22; j>-1; j--) {
            ambe_fr[1][j] = ((ambe_fr[1][j]) ^ pr[k]);
            k = k + 1
        }

        return ambe_fr;
    }

    static deinterleave(data) {
        let ambe_fr = [
            new Uint8Array(24),
            new Uint8Array(24),
            new Uint8Array(24),
            new Uint8Array(24)
        ];

        let bitIndex = 0;
        let w = 0;
        let x = 0;
        let y = 0;
        let z = 0;

        for(let i = 0; i < 36; i++) {
            let bit1 = data[bitIndex];
            bitIndex += 1

            let bit0 = data[bitIndex];
            bitIndex += 1

            ambe_fr[this.rW[w]][this.rX[x]] = bit1;
            ambe_fr[this.rY[y]][this.rZ[z]] = bit0;

            w += 1
            x += 1
            y += 1
            z += 1
        }

        return ambe_fr
    }

    static interleave(ambe_fr) {
        let bitIndex = 0;
        let w = 0;
        let x = 0;
        let y = 0;
        let z = 0;
        let data = new Uint8Array(9);

        for(let i = 0; i < 36; i++) {
            let bit1 = ambe_fr[this.rW[w]][this.rX[x]];
            let bit0 = ambe_fr[this.rY[y]][this.rZ[z]];


            data[bitIndex >>> 3] = ((data[bitIndex >>> 3] << 1) & 0xfe) | bit1;
            bitIndex += 1;

            data[bitIndex >>> 3] = ((data[bitIndex >>> 3] << 1) & 0xfe) | bit0;
            bitIndex += 1;

            w += 1;
            x += 1;
            y += 1;
            z += 1;
        }
        return data
    }

    static golay2312(cw) {
        let POLY = 0xAE3;
        cw = cw & 0xfff;
        let c = cw;

        for(let i = 1; i < 13; i++) {
            if(cw & 1)
                cw = cw ^ POLY;
            cw = cw >>> 1;
        }

        return (cw << 12) | c;
    }

    static parity(cw) {
        let p = cw & 0xff;

        p = p ^ ((cw >>> 8) & 0xff);
        p = p ^ ((cw >>> 16) & 0xff);

        p = p ^ (p >>> 4);
        p = p ^ (p >>> 2);
        p = p ^ (p >>> 1);

        return p & 1;
    }
}

module.exports = AMBE;