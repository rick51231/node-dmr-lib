// https://github.com/g4klx/MMDVMHost/blob/master/Hamming.cpp
class Hamming {
    static decode1393(bitArray) {
        let d = bitArray;

        // Calculate the checksum this column should have
        let c0 = (d[0] ^ d[1] ^ d[3] ^ d[5] ^ d[6]) > 0;
        let c1 = (d[0] ^ d[1] ^ d[2] ^ d[4] ^ d[6] ^ d[7]) > 0;
        let c2 = (d[0] ^ d[1] ^ d[2] ^ d[3] ^ d[5] ^ d[7] ^ d[8]) > 0;
        let c3 = (d[0] ^ d[2] ^ d[4] ^ d[5] ^ d[8]) > 0;

        let n = 0x00;
        n |= (c0 !== d[9])  ? 0x01 : 0x00;
        n |= (c1 !== d[10]) ? 0x02 : 0x00;
        n |= (c2 !== d[11]) ? 0x04 : 0x00;
        n |= (c3 !== d[12]) ? 0x08 : 0x00;

        switch (n) {
            // Parity bit errors
            case 0x01: d[9]  = !d[9];  return [d, true];
            case 0x02: d[10] = !d[10]; return [d, true];
            case 0x04: d[11] = !d[11]; return [d, true];
            case 0x08: d[12] = !d[12]; return [d, true];

            // Data bit erros
            case 0x0F: d[0] = !d[0]; return [d, true];
            case 0x07: d[1] = !d[1]; return [d, true];
            case 0x0E: d[2] = !d[2]; return [d, true];
            case 0x05: d[3] = !d[3]; return [d, true];
            case 0x0A: d[4] = !d[4]; return [d, true];
            case 0x0D: d[5] = !d[5]; return [d, true];
            case 0x03: d[6] = !d[6]; return [d, true];
            case 0x06: d[7] = !d[7]; return [d, true];
            case 0x0C: d[8] = !d[8]; return [d, true];

            // No bit errors
            default: return [d, false];
        }
    }

    static decode15113_2(bitArray, offset) {
        let d = bitArray;

        // Calculate the checksum this row should have
        let c0 = (d[offset+0] ^ d[offset+1] ^ d[offset+2] ^ d[offset+3] ^ d[offset+5] ^ d[offset+7] ^ d[offset+8]) > 0;
        let c1 = (d[offset+1] ^ d[offset+2] ^ d[offset+3] ^ d[offset+4] ^ d[offset+6] ^ d[offset+8] ^ d[offset+9]) > 0;
        let c2 = (d[offset+2] ^ d[offset+3] ^ d[offset+4] ^ d[offset+5] ^ d[offset+7] ^ d[offset+9] ^ d[offset+10]) > 0;
        let c3 = (d[offset+0] ^ d[offset+1] ^ d[offset+2] ^ d[offset+4] ^ d[offset+6] ^ d[offset+7] ^ d[offset+10]) > 0;

        let n = 0x00;
        n |= (c0 !== d[offset+11]) ? 0x01 : 0x00;
        n |= (c1 !== d[offset+12]) ? 0x02 : 0x00;
        n |= (c2 !== d[offset+13]) ? 0x04 : 0x00;
        n |= (c3 !== d[offset+14]) ? 0x08 : 0x00;

        switch (n) {
            // Parity bit errors
            case 0x01: d[offset+11] = !d[offset+11]; return [d, true];
            case 0x02: d[offset+12] = !d[offset+12]; return [d, true];
            case 0x04: d[offset+13] = !d[offset+13]; return [d, true];
            case 0x08: d[offset+14] = !d[offset+14]; return [d, true];

            // Data bit errors
            case 0x09: d[offset+0]  = !d[offset+0];  return [d, true];
            case 0x0B: d[offset+1]  = !d[offset+1];  return [d, true];
            case 0x0F: d[offset+2]  = !d[offset+2];  return [d, true];
            case 0x07: d[offset+3]  = !d[offset+3];  return [d, true];
            case 0x0E: d[offset+4]  = !d[offset+4];  return [d, true];
            case 0x05: d[offset+5]  = !d[offset+5];  return [d, true];
            case 0x0A: d[offset+6]  = !d[offset+6];  return [d, true];
            case 0x0D: d[offset+7]  = !d[offset+7];  return [d, true];
            case 0x03: d[offset+8]  = !d[offset+8];  return [d, true];
            case 0x06: d[offset+9]  = !d[offset+9];  return [d, true];
            case 0x0C: d[offset+10] = !d[offset+10]; return [d, true];

            // No bit errors
            default: return [d, false];
        }
    }

    static encode1393(bitArray) {
        let d = bitArray;

        d[9]  = d[0] ^ d[1] ^ d[3] ^ d[5] ^ d[6];
        d[10] = d[0] ^ d[1] ^ d[2] ^ d[4] ^ d[6] ^ d[7];
        d[11] = d[0] ^ d[1] ^ d[2] ^ d[3] ^ d[5] ^ d[7] ^ d[8];
        d[12] = d[0] ^ d[2] ^ d[4] ^ d[5] ^ d[8];

        return d;
    }

    static encode15113_2(bitArray, offset) {
        let d = bitArray;

        d[offset+11] = d[offset+0] ^ d[offset+1] ^ d[offset+2] ^ d[offset+3] ^ d[offset+5] ^ d[offset+7] ^ d[offset+8];
        d[offset+12] = d[offset+1] ^ d[offset+2] ^ d[offset+3] ^ d[offset+4] ^ d[offset+6] ^ d[offset+8] ^ d[offset+9];
        d[offset+13] = d[offset+2] ^ d[offset+3] ^ d[offset+4] ^ d[offset+5] ^ d[offset+7] ^ d[offset+9] ^ d[offset+10];
        d[offset+14] = d[offset+0] ^ d[offset+1] ^ d[offset+2] ^ d[offset+4] ^ d[offset+6] ^ d[offset+7] ^ d[offset+10];

        return d;
    }
}

module.exports = Hamming;