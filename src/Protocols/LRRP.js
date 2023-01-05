"use strict";

const DMRConst = require('../DMRConst');

// From TRBONet
// 050c2203000007 51 54 62 57 40 01 42  lat / long / dir / speed / precision / alt / date / gpio / periodic 30 ? / + pri beacon
// 05052203000007 lat/long
// 05062203000007 54 lat/long/alt
// 05072203000007 5254 lat/long/alt/date
// 05062203000007 62 lat/long/speed
// 05062203000007 50 lat/long/prec
// 05062203000007 57 lat/long/dir
// 05092203000007 51 54 62 57 lat/long/dir/speed/prec/alt/date
// 05082203000007 400142 lat/long/gpio
// 09082203000001 34311e lat/long + periodic 30
// 090c2203000001 34321ea6b3994c lat/long + periodic 30.3
// 090c2203000003 3431817a788374 lat/long + distance 500m 250sec
// 090b2203000005 400141344a50 lat/long + ptt
// 090b2203000006 400141344a51 lat/long + ptt emerg
// 09082203000002 344a02 lat/long + emerg
// 09082203000004 344a42 lat/long + telemetry

class LRRP {
    static TYPE_ImmediateLocationRequest = 0x05;
    static TYPE_ImmediateLocationResponse = 0x07;
    static TYPE_TriggeredLocationStartRequest = 0x09;
    static TYPE_TriggeredLocationStartResponse = 0x0B;
    static TYPE_TriggeredLocationData = 0x0D;
    static TYPE_TriggeredLocationStopRequest = 0x0F;
    static TYPE_TriggeredLocationStopResponse = 0x11;
    static TYPE_ProtocolVersionRequest = 0x14;
    static TYPE_ProtocolVersionResponse = 0x15;

    constructor() {
        this.type = 0;
        this.id = 1;
        this.locationRequestParams = {
            precision: true,
            time: true,
            speed_horizontal: true,
            altitude: true,
            direction_horizontal: true,
            timeInterval: null,
            distanceInterval: null,
            distanceMinTime: 1
        };

        this.locationData = {
            status: 0,
            status_code: 0,
            latitude: null, //ok
            longitude: null, //ok
            radius: null,  //ok
            altitude: null, //ok
            altitudeAccuracy: null,
            speed: null, //ok
            speed_vrt: null,
            time: null, //ok
            direction: null //ok
        };
    }

    static from(buffer) {
        let lrrp = new LRRP();

        lrrp.type = buffer.readUInt8(0);

        let pos = 2; //type + len

         while (true) {
             if (pos >= buffer.length)
                 break;


             let tokenId = buffer.readUInt8(pos);
                pos++;

             //https://github.com/pboyd04/Moto.Net/blob/b34c4449e6e9fe20b4fab696228207c807fe6bb0/Moto.Net/Mototrbo/LRRP/ImmediateLocationResponsePacket.cs
                if(tokenId === DMRConst.LRRP_TOKEN_ID) {
                    let len = buffer.readUInt8(pos);
                    pos++;

                    if (len === 4)
                        lrrp.id = buffer.readInt32BE(pos);
                    else
                        lrrp.id = (buffer.readUInt8(pos) << 16) | buffer.readUInt16BE(pos + 1);

                    pos += len;

                    continue;
                }

               if(lrrp.type===DMRConst.LRRP_TriggeredLocationData || lrrp.type===DMRConst.LRRP_TriggeredLocationStartResponse) {
                   if (tokenId === DMRConst.LRRP_TOKEN_TIME) { //TODO: check time processing https://git.safemobile.org/laurentiu.constantin/SafeNet/src/branch/master/SafeNetLib/LocationDecoder.cs
                       let b0 = buffer.readUInt8(pos);
                       pos += 1;
                       let b1 = buffer.readUInt8(pos);
                       pos += 1;
                       let b2 = buffer.readUInt8(pos);
                       pos += 1;
                       let b3 = buffer.readUInt8(pos);
                       pos += 1;
                       let b4 = buffer.readUInt8(pos);
                       pos += 1;

                       let year = (b0 << 6) | (b1 >> 2);
                       let month = (((b1 & 0x3) << 2) | (b2 >> 6)) - 1;
                       let day = (b2 & 0x3E) >> 1;
                       let hour = ((b2 & 0x1) << 4) | (b3 >> 4);
                       let minute = ((b3 & 0xF) << 2) | (b4 >> 6);
                       let second = b4 & 0x3F;

                       lrrp.locationData.time = Math.round((new Date(Date.UTC(year, month, day, hour, minute, second))).getTime() / 1000);
                   } else if(tokenId===DMRConst.LRRP_TOKEN_LOCATION || tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D || tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D_ALT || tokenId===DMRConst.LRRP_TOKEN_LOCATION_ALT) {
                       lrrp.locationData.latitude = buffer.readUInt32BE(pos) * (180 / 4294967295);
                       pos += 4;
                       lrrp.locationData.longitude = buffer.readUInt32BE(pos) * (360 / 4294967295);
                       pos += 4;

                       if(tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D || tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D_ALT) {
                           let [radius, count] = LRRP.parseLRRPFloat(buffer, pos);

                           lrrp.locationData.radius = radius;
                           pos += count;
                       }

                       if(tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D_ALT || tokenId===DMRConst.LRRP_TOKEN_LOCATION_ALT) {
                           let [alt, count] = LRRP.parseLRRPFloat(buffer, pos);

                           lrrp.locationData.altitude = alt;
                           pos += count;

                           if(tokenId===DMRConst.LRRP_TOKEN_LOCATION_3D_ALT) {
                               let [altitudeAccuracy, count] = LRRP.parseLRRPFloat(buffer, pos);

                               lrrp.locationData.altitudeAccuracy = altitudeAccuracy;
                               pos += count;
                           }
                       }
                   } else if(tokenId===DMRConst.LRRP_TOKEN_SPEED) {
                       let [speed, count] = LRRP.parseLRRPFloat(buffer, pos);

                       lrrp.locationData.speed = speed * 3.6; //Convert from m/s to km/h
                       pos += count;
                   } else if(tokenId===DMRConst.LRRP_TOKEN_SPEED_VRT) {
                       let [speed, count] = LRRP.parseLRRPFloat(buffer, pos);

                       lrrp.locationData.speed_vrt = speed * 3.6; //Convert from m/s to km/h
                       pos += count;
                   } else if(tokenId===DMRConst.LRRP_TOKEN_STATUS_CODE || tokenId===DMRConst.LRRP_TOKEN_STATUS_OK) { //TODO: https://github.com/pboyd04/Moto.Net/blob/master/Moto.Net/Mototrbo/LRRP/ImmediateLocationResponsePacket.cs parse extended codes
                       lrrp.locationData.status = tokenId;

                       if (tokenId === DMRConst.LRRP_TOKEN_STATUS_CODE) {
                           let [status, count] = LRRP.parseLRRPInt(buffer, pos);
                           lrrp.locationData.status_code = status;
                           pos += count;
                       }
                   } else if(tokenId===DMRConst.LRRP_TOKEN_DIRECTION) {
                       lrrp.locationData.direction = buffer.readUInt8(pos) * 2;
                       pos += 1;
                   } else {
                       throw new Error("Invalid token "+tokenId+" for "+buffer.toString('hex'));
                   }
               }

         }

        return lrrp;
    }

    getBuffer() {
        let dataArray = [];

        let idBuffer = Buffer.alloc(6);
        idBuffer.writeUInt8(DMRConst.LRRP_TOKEN_ID, 0);
        idBuffer.writeUInt8(4, 1); //ID size
        idBuffer.writeUInt32BE(this.id, 2);

        dataArray.push(idBuffer);

        if(this.type===DMRConst.LRRP_TriggeredLocationStartRequest) {
            let byteArray = [];

            if(this.locationRequestParams.precision && this.locationRequestParams.time)
                byteArray.push(DMRConst.LRRP_REQUEST_PRECISION_TIME);
            else if(this.locationRequestParams.precision)
                byteArray.push(DMRConst.LRRP_REQUEST_PRECISION);
            else if(this.locationRequestParams.time)
                byteArray.push(DMRConst.LRRP_REQUEST_TIME);

            if(this.locationRequestParams.altitude)
                byteArray.push(DMRConst.LRRP_REQUEST_ALTITUDE);

            if(this.locationRequestParams.speed_horizontal)
                byteArray.push(DMRConst.LRRP_REQUEST_SPEED_HORIZONTAL);

            if(this.locationRequestParams.timeInterval!==null) {
                byteArray.push(DMRConst.LRRP_REQUEST_PERIODIC_TRIGGER);
                byteArray.push(DMRConst.LRRP_REQUEST_TRIGGER_INTERVAL);

                byteArray = byteArray.concat(LRRP.toLRRPInt(this.locationRequestParams.timeInterval));
            } else if(this.locationRequestParams.distanceInterval!==null) {
                byteArray.push(DMRConst.LRRP_REQUEST_PERIODIC_TRIGGER);

                byteArray.push(DMRConst.LRRP_REQUEST_TRIGGER_INTERVAL);
                byteArray = byteArray.concat(LRRP.toLRRPInt(this.locationRequestParams.distanceMinTime));

                byteArray.push(DMRConst.LRRP_REQUEST_TRIGGER_DISTANCE);
                byteArray = byteArray.concat(LRRP.toLRRPInt(this.locationRequestParams.distanceInterval));
            }


            dataArray.push(Buffer.from(byteArray));
        }

        let sum = 0;

        for(let item of dataArray)
            sum += item.length;

        let buffer = Buffer.alloc(2 + sum); //Type + len + data

        buffer.writeUInt8(this.type, 0);
        buffer.writeUInt8(buffer.length-2, 1);


        let offset = 2;
        for(let item of dataArray) {
            buffer.write(item.toString('hex'), offset, 'hex');
            offset += item.length;
        }

        return buffer;
    }

    static toLRRPInt(intVal) {
        let byteArray = [];

        while(true) {
            byteArray.push(intVal & 0x7F);

            intVal >>= 7;

            if(byteArray.length > 1)
                byteArray[byteArray.length-1] |= 0x80;

            if(intVal<=0)
                break;
        }

        return byteArray.reverse();
    }

    static parseLRRPInt(buffer, pos) {
        let intVal = 0;
        let count = 0;

        while(true) {
            let b = buffer.readUInt8(pos + count);
            count++;

            intVal |= b & 0x7F;

            if(b>0x7f)
                intVal <<= 7;
            else
                break;

        }

        return [intVal, count];
    }
    static parseLRRPFloat(buffer, pos) {
        let floatVal = 0;
        let count = 0;

        while(true) {
            let b = buffer.readUInt8(pos + count);
            count++;

            floatVal |= b & 0x7F;

            if(b>0x7f)
                floatVal <<= 7;
            else
                break;

        }

        //TODO: /128 or *0.01
        floatVal += buffer.readUInt8(pos+count)/128; //TODO: it can be greater than 0x80, so need to do something...
        count++;

        return [floatVal, count];
    }

    static readFloat(buffer, pos) {
        let b0 = buffer.readUInt8(pos);
        let b1 = buffer.readUInt8(pos+1);

        return b0 + (b1 / 128);
    }
}

module.exports = LRRP;