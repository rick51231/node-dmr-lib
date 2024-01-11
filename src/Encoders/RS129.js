// https://github.com/pd0mz/go-dmr/blob/ecea90fd7937aa1b145f304e28a3870790b161ff/fec/rs_12_9.go
// https://github.com/pd0mz/go-dmr/blob/master/fec/rs_12_9.go
// https://www.etsi.org/deliver/etsi_ts/102300_102399/10236101/02.05.01_60/ts_10236101v020501p.pdf (page 143)

class RS129 { // Reed-Solomon (12,9) error-correction coding
    static DATASIZE     = 9;
    static CHECKSUMSIZE = 3;
    static POLY_MAXDEG = this.CHECKSUMSIZE * 2;

    static galois_exp_table = [
        0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1d, 0x3a, 0x74, 0xe8, 0xcd, 0x87, 0x13, 0x26,
        0x4c, 0x98, 0x2d, 0x5a, 0xb4, 0x75, 0xea, 0xc9, 0x8f, 0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0,
        0x9d, 0x27, 0x4e, 0x9c, 0x25, 0x4a, 0x94, 0x35, 0x6a, 0xd4, 0xb5, 0x77, 0xee, 0xc1, 0x9f, 0x23,
        0x46, 0x8c, 0x05, 0x0a, 0x14, 0x28, 0x50, 0xa0, 0x5d, 0xba, 0x69, 0xd2, 0xb9, 0x6f, 0xde, 0xa1,
        0x5f, 0xbe, 0x61, 0xc2, 0x99, 0x2f, 0x5e, 0xbc, 0x65, 0xca, 0x89, 0x0f, 0x1e, 0x3c, 0x78, 0xf0,
        0xfd, 0xe7, 0xd3, 0xbb, 0x6b, 0xd6, 0xb1, 0x7f, 0xfe, 0xe1, 0xdf, 0xa3, 0x5b, 0xb6, 0x71, 0xe2,
        0xd9, 0xaf, 0x43, 0x86, 0x11, 0x22, 0x44, 0x88, 0x0d, 0x1a, 0x34, 0x68, 0xd0, 0xbd, 0x67, 0xce,
        0x81, 0x1f, 0x3e, 0x7c, 0xf8, 0xed, 0xc7, 0x93, 0x3b, 0x76, 0xec, 0xc5, 0x97, 0x33, 0x66, 0xcc,
        0x85, 0x17, 0x2e, 0x5c, 0xb8, 0x6d, 0xda, 0xa9, 0x4f, 0x9e, 0x21, 0x42, 0x84, 0x15, 0x2a, 0x54,
        0xa8, 0x4d, 0x9a, 0x29, 0x52, 0xa4, 0x55, 0xaa, 0x49, 0x92, 0x39, 0x72, 0xe4, 0xd5, 0xb7, 0x73,
        0xe6, 0xd1, 0xbf, 0x63, 0xc6, 0x91, 0x3f, 0x7e, 0xfc, 0xe5, 0xd7, 0xb3, 0x7b, 0xf6, 0xf1, 0xff,
        0xe3, 0xdb, 0xab, 0x4b, 0x96, 0x31, 0x62, 0xc4, 0x95, 0x37, 0x6e, 0xdc, 0xa5, 0x57, 0xae, 0x41,
        0x82, 0x19, 0x32, 0x64, 0xc8, 0x8d, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xdd, 0xa7, 0x53, 0xa6,
        0x51, 0xa2, 0x59, 0xb2, 0x79, 0xf2, 0xf9, 0xef, 0xc3, 0x9b, 0x2b, 0x56, 0xac, 0x45, 0x8a, 0x09,
        0x12, 0x24, 0x48, 0x90, 0x3d, 0x7a, 0xf4, 0xf5, 0xf7, 0xf3, 0xfb, 0xeb, 0xcb, 0x8b, 0x0b, 0x16,
        0x2c, 0x58, 0xb0, 0x7d, 0xfa, 0xe9, 0xcf, 0x83, 0x1b, 0x36, 0x6c, 0xd8, 0xad, 0x47, 0x8e, 0x01,
    ];
    static galois_log_table = [
        0, 0, 1, 25, 2, 50, 26, 198, 3, 223, 51, 238, 27, 104, 199, 75,
        4, 100, 224, 14, 52, 141, 239, 129, 28, 193, 105, 248, 200, 8, 76, 113,
        5, 138, 101, 47, 225, 36, 15, 33, 53, 147, 142, 218, 240, 18, 130, 69,
        29, 181, 194, 125, 106, 39, 249, 185, 201, 154, 9, 120, 77, 228, 114, 166,
        6, 191, 139, 98, 102, 221, 48, 253, 226, 152, 37, 179, 16, 145, 34, 136,
        54, 208, 148, 206, 143, 150, 219, 189, 241, 210, 19, 92, 131, 56, 70, 64,
        30, 66, 182, 163, 195, 72, 126, 110, 107, 58, 40, 84, 250, 133, 186, 61,
        202, 94, 155, 159, 10, 21, 121, 43, 78, 212, 229, 172, 115, 243, 167, 87,
        7, 112, 192, 247, 140, 128, 99, 13, 103, 74, 222, 237, 49, 197, 254, 24,
        227, 165, 153, 119, 38, 184, 180, 124, 17, 68, 146, 217, 35, 32, 137, 46,
        55, 63, 209, 91, 149, 188, 207, 205, 144, 135, 151, 178, 220, 252, 190, 97,
        242, 86, 211, 171, 20, 42, 93, 158, 132, 60, 57, 83, 71, 109, 65, 162,
        31, 45, 67, 216, 183, 123, 164, 118, 196, 23, 73, 236, 127, 12, 111, 246,
        108, 161, 59, 82, 41, 157, 85, 170, 251, 96, 134, 177, 187, 204, 62, 90,
        203, 89, 95, 176, 156, 169, 160, 81, 11, 245, 22, 235, 122, 117, 44, 215,
        79, 174, 213, 233, 230, 231, 173, 232, 116, 214, 244, 234, 168, 80, 88, 175
    ];

    static galois_Inv(elt) {
        return this.galois_exp_table[255-this.galois_log_table[elt]];
    }

    static galois_Mul(a, b)  {
        if(a === 0 || b === 0)
            return 0;

        return this.galois_exp_table[(this.galois_log_table[a]+this.galois_log_table[b])%255];
    }

    static mulPolyZ(poly) {
        for(let i = this.POLY_MAXDEG - 1; i > 0; i--)
            poly[i] = poly[i-1];

        poly[0] = 0

        return poly;
    }

    static mulPolys(p1, p2) {
        let dst = new Uint8Array(this.POLY_MAXDEG*2);
        let tmp = new Uint8Array(this.POLY_MAXDEG*2);

        for(let i = 0; i < this.POLY_MAXDEG; i++) {
            for(let j = this.POLY_MAXDEG; j < (this.POLY_MAXDEG * 2); j++)
                tmp[j] = 0;

            for(let j = 0; j < this.POLY_MAXDEG; j++)
                tmp[j] = this.galois_Mul(p2[j], p1[i]);

            for(let j = (this.POLY_MAXDEG * 2) - 1; j >= i; j--)
                tmp[j] = tmp[j-i];

            for(let j = 0; j < i; j++)
                tmp[j] = 0;

            for(let j = 0; j < (this.POLY_MAXDEG * 2); j++)
                dst[j] ^= tmp[j];
        }

        return dst;
    }

    static calcErrorEvaluatorPoly(locator, syndrome, evaluator) {
        let product = this.mulPolys(locator, syndrome);

        let i = 0;

        for( ; i < this.CHECKSUMSIZE; i++)
            evaluator[i] = product[i];

        for( ; i < this.POLY_MAXDEG; i++)
            evaluator[i] = 0;

        return evaluator;
    }

    static calcDiscrepancy(locator, syndrome, L, n) {
        let sum = 0;

        for(let i = 0; i <= L; i++)
            sum ^= this.galois_Mul(locator[i], syndrome[n-i])

        return sum & 0xFF;
    }

    static calc(syndrome, locator, evaluator) {

        let D = new Uint8Array(this.POLY_MAXDEG*2);
        D[1] = 1; // = Poly{0, 1, 0}
        let psi2 = new Uint8Array(this.POLY_MAXDEG);
        let d = 0;
        let L = 0;
        let L2 = 0;
        let k = -1

        for(let i = 0; i < this.POLY_MAXDEG; i++)
            locator[i] = 0

        locator[0] = 1

        for(let n = 0; n < this.CHECKSUMSIZE; n++) {
            d = this.calcDiscrepancy(locator, syndrome, L, n)

            if(d !== 0) {
                for(let i = 0; i < this.POLY_MAXDEG; i++)
                    psi2[i] = locator[i] ^ this.galois_Mul(d, D[i]);


                if((L & 0xFF) < (n-k)) {
                    L2 = (n- k) & 0xFF;
                    k = (n - (L & 0xFF)) & 0xFF;

                    for(let i = 0; i < this.POLY_MAXDEG; i++)
                        D[i] = this.galois_Mul(locator[i], this.galois_Inv(d));

                    L = L2;
                }

                for(let i = 0; i < this.POLY_MAXDEG; i++)
                    locator[i] = psi2[i];
            }
            D = this.mulPolyZ(D);
        }
        evaluator = this.calcErrorEvaluatorPoly(locator, syndrome, evaluator);

        return [locator, evaluator];
    }

    static findRoots(locator) {
        let roots = [];

        for(let r = 1; r < 256; r++) {
            let sum = 0;

            for(let k = 0; k < this.CHECKSUMSIZE+1; k++) {
                sum ^= this.galois_Mul(this.galois_exp_table[(k*r)%255], locator[k]);
                sum &= 0xFF; //Keep it uint8
            }

            if(sum === 0)
                roots.push((255-r) & 0xFF);
        }

        return roots;
    }

    static calcSyndrome(data) {

        if(data.length !== this.DATASIZE+this.CHECKSUMSIZE)
            return null; //"fec/rs_12_9: unexpected size "+data.length+", expected "+(this.DATASIZE+this.CHECKSUMSIZE)+" bytes"];

        let syndrome = new Uint8Array(RS129.POLY_MAXDEG);

        for(let j = 0; j < 3; j++) {
            for(let i = 0; i < data.length; i++) {
                syndrome[j] = data[i] ^ this.galois_Mul(this.galois_exp_table[j+1], syndrome[j])
            }
        }

        return syndrome;
    }

    static checkSyndrome(syndrome) {
        for(let v of syndrome)
            if(v!==0)
                return true

        return false
    }

    static correct(data, syndrome) {
        if(data.length !== this.DATASIZE+this.CHECKSUMSIZE)
            return [-1, null]; // "fec/rs_12_9: unexpected size "+data.length+", expected "+(this.DATASIZE+this.CHECKSUMSIZE)+" bytes"

        let locator = new Uint8Array(this.POLY_MAXDEG*2); // Poly{}
        let evaluator = new Uint8Array(this.POLY_MAXDEG*2); // Poly{}
        let roots;

        [locator, evaluator] = this.calc(syndrome, locator, evaluator);

        roots = this.findRoots(locator);

        let errorsFound = roots.length;

        if(errorsFound === 0)
            return [0, data];

        if(errorsFound > 0 && errorsFound < this.CHECKSUMSIZE) {
            for(let r = 0; r < errorsFound; r++) {
                if(roots[r] >= this.DATASIZE+this.CHECKSUMSIZE) {
                    return [errorsFound, null];
                }
            }

            for(let r = 0; r < errorsFound; r++) {
                let i = roots[r]

                let num = 0;
                let denom = 0;

                for(let j = 0; j < this.POLY_MAXDEG; j++) {
                    num ^= this.galois_Mul(evaluator[j], this.galois_exp_table[((255-i)*j)%255]);
                    num &= 0xFF; //Keep it uint8
                }

                for(let j = 1; j < this.POLY_MAXDEG; j += 2) {
                    denom ^= this.galois_Mul(locator[j], this.galois_exp_table[((255-i)*(j-1))%255]);
                    denom &= 0xFF; //Keep it uint8
                }

                data[data.length-i-1] ^= this.galois_Mul(num, this.galois_Inv(denom))
            }

            return [errorsFound, data];
        }

        return [0, data];
    }

    static calcChecksum(data) {
        let checksum = new Uint8Array(3);
        let genpoly = [0x40, 0x38, 0x0e, 0x0];

        for(let i = 0; i < 9; i++) {
            let feedback = (data[i] ^ checksum[0]) & 0xFF;
            checksum[0] = checksum[1] ^ this.galois_Mul(genpoly[2], feedback);
            checksum[1] = checksum[2] ^ this.galois_Mul(genpoly[1], feedback);
            checksum[2] = this.galois_Mul(genpoly[0], feedback);
        }

        return checksum
    }
}

module.exports = RS129;