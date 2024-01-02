const Packet = require('./Packet');
const BatteryData = require("./BatteryData");

class Query extends Packet {
    static REQ_TYPE_STATIC    = '010101';
    static REQ_TYPE_DYNAMIC   = '010102';
    static REQ_TYPE_STATICDYNAMIC = '01020102';

    id = Math.round(Math.random()*32768);
    reqType = BatteryData.OTA_DATATYPE_STATICDYNAMIC;

    constructor() {
        super(Packet.TYPE_QUERY_REQUEST);
    }

    static from(buffer) {
        if(buffer.length<5)
            return null;

        let pkt = new Query();

        pkt.id = buffer.readUInt16LE(0);

        let rest = buffer.subarray(2).toString('hex');

        if(rest===this.REQ_TYPE_STATIC)
            pkt.reqType = BatteryData.OTA_DATATYPE_STATIC;
        else if(rest===this.REQ_TYPE_DYNAMIC)
            pkt.reqType = BatteryData.OTA_DATATYPE_DYNAMIC;
        else if(rest===this.REQ_TYPE_STATICDYNAMIC)
            pkt.reqType = BatteryData.OTA_DATATYPE_STATICDYNAMIC;
        else
            return null;

        return pkt;
    }

    getBuffer() {
        let reqB = Buffer.alloc(2);
        reqB.writeUInt16LE(this.id, 0);

        let hexType = '';

        if(this.reqType===BatteryData.OTA_DATATYPE_STATIC)
            hexType = Query.REQ_TYPE_STATIC;
        else if(this.reqType===BatteryData.OTA_DATATYPE_DYNAMIC)
            hexType = Query.REQ_TYPE_DYNAMIC;
        else if(this.reqType===BatteryData.OTA_DATATYPE_STATICDYNAMIC)
            hexType = Query.REQ_TYPE_STATICDYNAMIC;

        let b = Buffer.concat([
            reqB,
            Buffer.from(hexType, 'hex')
        ]);

        return super.getBuffer(b);
    }
}

module.exports = Query;