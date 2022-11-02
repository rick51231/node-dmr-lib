// https://github.com/g4klx/MMDVMHost/blob/master/DMRTrellis.cpp

const BIT_MASK_TABLE = [0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01];
const INTERLEAVE_TABLE = [
    0, 1, 8,  9,  16, 17, 24, 25, 32, 33, 40, 41, 48, 49, 56, 57, 64, 65, 72, 73, 80, 81, 88, 89, 96, 97,
    2, 3, 10, 11, 18, 19, 26, 27, 34, 35, 42, 43, 50, 51, 58, 59, 66, 67, 74, 75, 82, 83, 90, 91,
    4, 5, 12, 13, 20, 21, 28, 29, 36, 37, 44, 45, 52, 53, 60, 61, 68, 69, 76, 77, 84, 85, 92, 93,
    6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63, 70, 71, 78, 79, 86, 87, 94, 95
];
const ENCODE_TABLE = [
    0,  8, 4, 12, 2, 10, 6, 14,
    4, 12, 2, 10, 6, 14, 0,  8,
    1,  9, 5, 13, 3, 11, 7, 15,
    5, 13, 3, 11, 7, 15, 1,  9,
    3, 11, 7, 15, 1,  9, 5, 13,
    7, 15, 1,  9, 5, 13, 3, 11,
    2, 10, 6, 14, 0,  8, 4, 12,
    6, 14, 0,  8, 4, 12, 2, 10];


class Trellis {
    static decode(data) {
        let dibits = this.deinterleave(data);

        let points = this.dibitsToPoints(dibits);

        let [tribits, failPos] = this.checkCode(points);

        if(failPos===999)
            return this.tribitsToBits(tribits);

        let savePoints = [];
        for(let i = 0; i < 49; i++) {
            savePoints[i] = points[i];
        }

        let ret = this.fixCode(points, failPos);

        if(ret!==false)
            return ret;

        if(failPos===0)
            return false;

        return this.fixCode(savePoints, failPos-1);
    }

    static deinterleave(data) {
        let dibits = [];
        for(let i = 0; i < 98; i++) {
            let n = 0;

            n= i * 2;
            if(n>=98)
                n+= 68;

            let b1 = data.substr(n, 1);

            n = i * 2 + 1;
            if(n>=98)
                n+= 68;

            let b2 = data.substr(n, 1);

            let dibit = 0;

            if(b1==="0" && b2==="1")
                dibit = 3;
            else if(b1==="0" && b2==="0")
                dibit = 1;
            else if(b1==="1" && b2==="0")
                dibit = -1;
            else
                dibit = -3;

            n = INTERLEAVE_TABLE[i];
            dibits[n] = dibit;
        }

        return dibits;
    }

    static dibitsToPoints(dibits) {
        let points = [];
        for(let i = 0; i < 49; i++) {
            if (dibits[i * 2] === +1 && dibits[i * 2 + 1] === -1)
                points[i] = 0;
            else if (dibits[i * 2] === -1 && dibits[i * 2 + 1] === -1)
                points[i] = 1;
            else if (dibits[i * 2] === +3 && dibits[i * 2 + 1] === -3)
                points[i] = 2;
            else if (dibits[i * 2] === -3 && dibits[i * 2 + 1] === -3)
                points[i] = 3;
            else if (dibits[i * 2] === -3 && dibits[i * 2 + 1] === -1)
                points[i] = 4;
            else if (dibits[i * 2] === +3 && dibits[i * 2 + 1] === -1)
                points[i] = 5;
            else if (dibits[i * 2] === -1 && dibits[i * 2 + 1] === -3)
                points[i] = 6;
            else if (dibits[i * 2] === +1 && dibits[i * 2 + 1] === -3)
                points[i] = 7;
            else if (dibits[i * 2] === -3 && dibits[i * 2 + 1] === +3)
                points[i] = 8;
            else if (dibits[i * 2] === +3 && dibits[i * 2 + 1] === +3)
                points[i] = 9;
            else if (dibits[i * 2] === -1 && dibits[i * 2 + 1] === +1)
                points[i] = 10;
            else if (dibits[i * 2] === +1 && dibits[i * 2 + 1] === +1)
                points[i] = 11;
            else if (dibits[i * 2] === +1 && dibits[i * 2 + 1] === +3)
                points[i] = 12;
            else if (dibits[i * 2] === -1 && dibits[i * 2 + 1] === +3)
                points[i] = 13;
            else if (dibits[i * 2] === +3 && dibits[i * 2 + 1] === +1)
                points[i] = 14;
            else if (dibits[i * 2] === -3 && dibits[i * 2 + 1] === +1)
                points[i] = 15;
        }

        return points;
    }

    static checkCode(points) {
        let tribits = [];
        let state = 0;

        for(let i = 0; i < 49; i++) {
            tribits[i] = 9;

            for(let j = 0; j < 8; j++) {
                if(points[i]===ENCODE_TABLE[state * 8 + j]) {
                    tribits[i] = j;
                    break;
                }
            }

            if(tribits[i]===9)
                return [tribits, i];

            state = tribits[i];
        }

        if(tribits[48]!== 0)
            return [tribits, 48];

        return [tribits, 999];
    }

    static tribitsToBits(tribits) {
        let payload = [];

        for(let i = 0; i < 48; i++) {
            let tribit = tribits[i];

            let b1 = (tribit & 0x04) > 0 ? 1 : 0;
            let b2 = (tribit & 0x02) > 0 ? 1 : 0;
            let b3 = (tribit & 0x01) > 0 ? 1 : 0;

            let n = i * 3;

            payload[n] = b1;
            n++;
            payload[n] = b2;
            n++;
            payload[n] = b3;
        }

        return payload.join('');
    }

    static fixCode(points, failPos) {

        for(let j = 0; j < 20; j++) {
            let bestPos = 0;
            let bestVal = 0;

            for(let i = 0; i < 16; i++) {
                points[failPos] = i;

                let [tribits, pos] = this.checkCode(points);

                if(pos===999)
                    return this.tribitsToBits(tribits);

                if(pos > bestPos) {
                    bestPos = pos;
                    bestVal = i;
                }
            }

            points[failPos] = bestVal;
            failPos = bestPos;
        }

        return false;
    }
}

module.exports = Trellis;