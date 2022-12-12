const Hamming = require('./Hamming');

// https://github.com/g4klx/MMDVMHost/blob/master/BPTC19696.cpp
class BPTC19696 {
    static decode(data) {
        let bitArray = data.split('').map(i => i==="1");

        let deinterleaved = this.decodeDeInterleave(bitArray);
        let errorChecked = this.decodeErrorCheck(deinterleaved);
        let dataBits = this.decodeExtractData(errorChecked);

        return dataBits.map(i => i ? 1 : 0).join('');
    }

    static encode(data) {
        let extractedData = this.encodeExtractData(data);
        let errorChecked = this.encodeErrorCheck(extractedData);
        let interleaved = this.encodeInterleave(errorChecked);

        return interleaved.join('');
    }

    static decodeDeInterleave(bitArray) {
        let ret = [];
        bitArray[0] = true;
        for(let a = 0; a < 196; a++) {
            let interleaveSequence = (a * 181) % 196;
            ret[a] = bitArray[interleaveSequence];
        }

        return ret;
    }

    static decodeErrorCheck(bitArray) {
        let fixing = false;
        let count = 0;
        let status = false;

        let ret = bitArray;

        do {
            fixing = false;
            let col = [];

            for(let c = 0; c < 15; c++) {
                let pos = c + 1;
                for(let a = 0; a < 13; a++) {
                    col[a] = ret[pos];
                    pos = pos + 15;
                }

                [col, status] = Hamming.decode1393(col);

                if(status) {
                    let pos2 = c + 1;
                    for(let a = 0; a < 13; a++) {
                        ret[pos2] = col[a];
                        pos2 += 15;
                    }

                    fixing = true;
                }
            }

            for(let r = 0; r < 9; r++) {
                let pos = (r * 15) + 1;
                [ret, status] = Hamming.decode15113_2(ret, pos);
                if(status)
                    fixing = true;
            }

            count++;
        } while(fixing && count < 5);

        return ret;
    }

    static decodeExtractData(bitArray) {
        let ret = [];

        let pos = 0;

        for (let a = 4; a <= 11; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 16; a <= 26; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 31; a <= 41; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 46; a <= 56; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 61; a <= 71; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 76; a <= 86; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 91; a <= 101; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 106; a <= 116; a++, pos++)
        ret[pos] = bitArray[a];

        for (let a = 121; a <= 131; a++, pos++)
        ret[pos] = bitArray[a];

        return ret;
    }

    static encodeExtractData(bitArray) {
        let ret = [];

        for (let i = 0; i < 196; i++)
            ret[i] = 0;

        let pos = 0;

        for (let a = 4; a <= 11; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 16; a <= 26; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 31; a <= 41; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 46; a <= 56; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 61; a <= 71; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 76; a <= 86; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 91; a <= 101; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 106; a <= 116; a++, pos++)
            ret[a] = bitArray[pos];

        for (let a = 121; a <= 131; a++, pos++)
            ret[a] = bitArray[pos];

        return ret;
    }

    static encodeErrorCheck(bitArray) {
        let ret = bitArray;
        // Run through each of the 9 rows containing data
        for (let r = 0; r < 9; r++) {
            let pos = (r * 15) + 1;
            ret = Hamming.encode15113_2(ret, pos);
        }

        // Run through each of the 15 columns
        let col = Array(13);
        for (let c = 0; c < 15; c++) {
            let pos = c + 1;
            for (let a = 0; a < 13; a++) {
                col[a] = bitArray[pos];
                pos = pos + 15;
            }

            col = Hamming.encode1393(col);

            pos = c + 1;
            for (let a = 0; a < 13; a++) {
                ret[pos] = col[a];
                pos = pos + 15;
            }
        }

        return ret;
    }

    static encodeInterleave(bitArray) {
        let ret = [];

        for (let i = 0; i < 196; i++)
            ret[i] = 0;

        // The first bit is R(3) which is not used so can be ignored
        for (let a = 0; a < 196; a++)	{
            // Calculate the interleave sequence
            let interleaveSequence = (a * 181) % 196;
            // Unshuffle the data
            ret[interleaveSequence] = bitArray[a];
        }

        return ret;
    }
}

module.exports = BPTC19696;