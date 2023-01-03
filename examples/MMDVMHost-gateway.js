const HBDMRGateway = require('../src/Services/HBDMRGateway');
const DMRIPGateway = require("../src/Services/DMRIPGateway");
const DMRServices = require("../src/Services/DMRServices");
const LRRP = require("../src/Protocols/LRRP");
const TMS = require("../src/Protocols/TMS");
const IP = require("../src/IP");

let serviceID = 10099;
let host = '127.0.0.1';
let port = 50000;

let gateway = new HBDMRGateway({
    host: host,
    port: port,
    repeaterId: 1000
});

let ipGateway = new DMRIPGateway(gateway, [serviceID]);

let lrrpRequest = new LRRP();
lrrpRequest.type = LRRP.TYPE_TriggeredLocationStartRequest;
lrrpRequest.locationRequestParams.timeInterval = 30;

let lrrpRequest2 = new LRRP();
lrrpRequest2.type = LRRP.TYPE_TriggeredLocationStartRequest;
lrrpRequest2.locationRequestParams.distanceInterval = 30;
lrrpRequest2.locationRequestParams.distanceMinTime = 30;

let dmrServices = new DMRServices(ipGateway, serviceID, {
    ignoreUnregistered: false,
    LRRPEnabled: true,
    LRRPRequests: [lrrpRequest, lrrpRequest2],
    LRRPRetryCount: 5,
    BMSEnabled: true,
    BMSRetryCount: 5,
    BMSQueryInterval: 55,
    CSBKCount: 0
});


gateway.on(HBDMRGateway.EVENT_DATA, (data) => {
    // console.log('event data '+JSON.stringify(data));
})

gateway.on(HBDMRGateway.EVENT_DMRDATA, (data) => {
    console.log('event dmrdata' + JSON.stringify(data));

})

gateway.on(HBDMRGateway.EVENT_CONNECTED, (data) => {
    console.log('event connected' + JSON.stringify(data));

})

ipGateway.on(DMRIPGateway.EVENT_DATA, (ipPacket) => {
    console.log(ipPacket);
});

setTimeout(() => {
    sendSms();
}, 12000);

async function sendSms() {
    let src = 10070;
    let dst = 10058;
    let slot = 1;
    let dstIsGroup = false;
    let src_addr = (12 << 24) | src;
    let dst_addr = ((dstIsGroup ? 225 : 12) << 24) | dst;

    let tms = new TMS();

    tms.msgId = 145;
    tms.text = 'Hello';

    let ip = new IP.IP4Packet();

    ip.protocol = IP.IP4Packet.PROTOCOL_UDP;
    ip.identification = 124;
    ip.src_addr = src_addr;
    ip.dst_addr = dst_addr;
    ip.src_port = 4007;
    ip.dst_port = 4007;
    ip.payload = tms.getBuffer();

    ipGateway.sendIPPacket(ip, slot);
}