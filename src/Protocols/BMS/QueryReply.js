const Packet = require('./Packet');
const BatteryData = require("./BatteryData");

class QueryReply extends Packet {
    static STATUS_OK                 = 0x00;
    static STATUS_FAILTURE           = 0x01;
    static STATUS_IN_CHARGER         = 0x02;
    static STATUS_BATTERY_NOT_FOUND  = 0x03; // Or pending registration ?
    static STATUS_PENDING_ENABLED_PERSONALITY   = 0x04;
    static STATUS_TARGET_NOT_REGISTERED     = 0x05;
    static STATUS_SOURCE_NOT_REGISTERED     = 0x06;
    static STATUS_NON_IMPRES                = 0x07;
    static STATUS_INVALID_REQUEST_SYNTAX    = 0x08;
    static STATUS_INDEX_OUT_OF_RANGE        = 0x09;
    static STATUS_RESPONSE_TIMEOUT          = 0x0A;
    static STATUS_BATTERY_DATA_ERROR        = 0x0B;
    static STATUS_BATTERY_NOT_MATCH         = 0x0C;


    id = 0;
    reqType = BatteryData.OTA_DATATYPE_STATICDYNAMIC;
    status = 0;
    batteryData = new BatteryData();

    constructor() {
        super(Packet.TYPE_QUERY_REPLY);
    }

    static from(buffer) {
        if(buffer.length<3)
            return null;

        let pkt = new QueryReply();

        pkt.id = buffer.readUInt16LE(0);
        pkt.status = buffer.readUInt8(2);
        
        if(pkt.status===QueryReply.STATUS_OK) {
            pkt.reqType = pkt.batteryData.processOTAData(Buffer.concat([Buffer.from([Packet.TYPE_QUERY_REPLY]), buffer]));
        }

        return pkt;
    }

    getBuffer() {
        throw new Error('Unknown method');
    }
}

module.exports = QueryReply;