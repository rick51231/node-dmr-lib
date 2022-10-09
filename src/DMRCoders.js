"use strict";

const DMRConst = require('./DMRConst');

class DMRCoders {
    getSyndrome1987(pattern) {
        const X18 = 0x00040000;
        const X11 = 0x00000800;
        const GENPOL = 0x00000c75;
        const MASK8 = 0xfffff800;

        let aux = X18;

        if (pattern >= X11) {
            while ((pattern & MASK8) > 0) {
                while ((aux & pattern)===0)
                    aux = aux >> 1;

                pattern ^= (aux / X11) * GENPOL;
            }
        }

        return pattern;
    }

    decode2087(data_int_array) {
                let code = (data_int_array[0] << 11) + (data_int_array[1] << 3) + (data_int_array[2] >> 5);
        let syndrome = this.getSyndrome1987(code);

        let error_pattern = DMRConst.DECODING_TABLE_1987[syndrome];

        if (error_pattern !== 0x00)
            code ^= error_pattern;

        return code >> 11;
    }

    interleave_19696(_data) {
        let inter = [];

        for(let index = 0; index < 196; index++)
            inter[DMRConst.INDEX_181[index]] = _data[index];

        return inter;
    }

    encode_19696(_data) { //Input - string of bits
        let _bdata = _data.split('').map(e => parseInt(e, 10)); //Bit array

        //Insert R0-R3 bits
        for(let i = 0; i < 4; i++) {
            _bdata.splice(0, 0, 0);
        }

        for(let index = 0; index < 9; index++) {
            let spos = (index*15) + 1;
            let epos = spos + 11;

            let _rowp = this.enc_15113(_bdata.slice(spos, epos));

            for(let pbit = 0; pbit < 4; pbit++) {
                _bdata.splice(epos+pbit, 0, _rowp[pbit]);
            }
        }

        // Get column hamming 13,9,3 and append. +1 is to account for R3 that makes an even 196bit string
        // Pad out the bitarray to a full 196 bits. Can't insert into 'columns'
        for(let i = 0; i < 60; i++) {
            _bdata.push(0);
        }

        let column = []; //bitarray(9, endian='big')  # Temporary bitarray to hold column data

        for(let col = 0; col < 15; col++) {
            let spos = col+1;
            for(let index = 0; index < 9; index++) {
                column[index] = _bdata[spos];
                spos += 15;
            }
            let _colp =  this.enc_1393(column);

            let cpar = 136 + col;
            for(let pbit = 0; pbit < 4; pbit++) {
                _bdata[cpar] = _colp[pbit];
                cpar += 15;
            }
        }

        return _bdata;
    }

    enc_15113(_data) { //Hamming 15,11,3 routines
        let csum = [];

        csum[0] = _data[0] ^ _data[1] ^ _data[2] ^ _data[3] ^ _data[5] ^ _data[7] ^ _data[8];
        csum[1] = _data[1] ^ _data[2] ^ _data[3] ^ _data[4] ^ _data[6] ^ _data[8] ^ _data[9];
        csum[2] = _data[2] ^ _data[3] ^ _data[4] ^ _data[5] ^ _data[7] ^ _data[9] ^ _data[10];
        csum[3] = _data[0] ^ _data[1] ^ _data[2] ^ _data[4] ^ _data[6] ^ _data[7] ^ _data[10];

        return csum
    }

    enc_1393(_data) { //Hamming 13,9,3 routines
        let csum = [];

        csum[0] = _data[0] ^ _data[1] ^ _data[3] ^ _data[5] ^ _data[6];
        csum[1] = _data[0] ^ _data[1] ^ _data[2] ^ _data[4] ^ _data[6] ^ _data[7];
        csum[2] = _data[0] ^ _data[1] ^ _data[2] ^ _data[3] ^ _data[5] ^ _data[7] ^ _data[8];
        csum[3] = _data[0] ^ _data[2] ^ _data[4] ^ _data[5] ^ _data[8];

        return csum
    }

    decode_full(_data) {
        let binlc = '';

        binlc += [_data.charAt(136), _data.charAt(121), _data.charAt(106), _data.charAt(91), _data.charAt(76), _data.charAt(61), _data.charAt(46), _data.charAt(31)].join('');
        binlc += [_data.charAt(152), _data.charAt(137), _data.charAt(122), _data.charAt(107), _data.charAt(92), _data.charAt(77), _data.charAt(62), _data.charAt(47), _data.charAt(32), _data.charAt(17), _data.charAt(2)].join('');
        binlc += [_data.charAt(123), _data.charAt(108), _data.charAt(93), _data.charAt(78), _data.charAt(63), _data.charAt(48), _data.charAt(33), _data.charAt(18), _data.charAt(3), _data.charAt(184), _data.charAt(169)].join('');
        binlc += [_data.charAt(94), _data.charAt(79), _data.charAt(64), _data.charAt(49), _data.charAt(34), _data.charAt(19), _data.charAt(4), _data.charAt(185), _data.charAt(170), _data.charAt(155), _data.charAt(140)].join('');
        binlc += [_data.charAt(65), _data.charAt(50), _data.charAt(35), _data.charAt(20), _data.charAt(5), _data.charAt(186), _data.charAt(171), _data.charAt(156), _data.charAt(141), _data.charAt(126), _data.charAt(111)].join('');
        binlc += [_data.charAt(36), _data.charAt(21), _data.charAt(6), _data.charAt(187), _data.charAt(172), _data.charAt(157), _data.charAt(142), _data.charAt(127), _data.charAt(112), _data.charAt(97), _data.charAt(82)].join('');
        binlc += [_data.charAt(7), _data.charAt(188), _data.charAt(173), _data.charAt(158), _data.charAt(143), _data.charAt(128), _data.charAt(113), _data.charAt(98), _data.charAt(83)].join('');
        //This is the rest of the Full LC data -- the RS1293 FEC that we don't need
        // This is extremely important for SMS and GPS though.

        binlc += [_data.charAt(68), _data.charAt(53), _data.charAt(174), _data.charAt(159), _data.charAt(144), _data.charAt(129), _data.charAt(114), _data.charAt(99), _data.charAt(84), _data.charAt(69), _data.charAt(54), _data.charAt(39)].join('');
        binlc += [_data.charAt(24), _data.charAt(145), _data.charAt(130), _data.charAt(115), _data.charAt(100), _data.charAt(85), _data.charAt(70), _data.charAt(55), _data.charAt(40), _data.charAt(25), _data.charAt(10), _data.charAt(191)].join('');

        return binlc;
    }

    decode_trellis(_data) {
        let data = 123;
    }
}

module.exports = new DMRCoders();