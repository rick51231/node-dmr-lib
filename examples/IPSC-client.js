const IPSCPeer = require('../src/Services/IPSCPeer');
const DMRIPGateway = require('../src/Services/DMRIPGateway');
const DMRServices = require('../src/Services/DMRServices');
const {PeerMode, PeerFlags, PeerProtocol} = require("../src/Protocols/IPSC/types");
const IP = require('../src/IP');
const LRRP = require('../src/Protocols/LRRP');
const TMS = require('../src/Protocols/TMS');

let serviceID = 10099;
let host = '192.168.1.20';
let port = 50000;

let defaultMode = new PeerMode();
defaultMode.status = PeerMode.STATUS_ENABLED;
defaultMode.signaling = PeerMode.SIGNALING_DIGITAL;
defaultMode.slot1 = PeerMode.SLOT_IPSC;
defaultMode.slot2 = PeerMode.SLOT_IPSC;

let defaultFlags = new PeerFlags();
defaultFlags.is3rdPartyApp = true;
defaultFlags.isCSBK = true;
defaultFlags.isRPTMon = true;
defaultFlags.isDataCall = true;
defaultFlags.isVoiceCall = true;

let defaultProtocol = new PeerProtocol();
defaultProtocol.mainProtocolType = PeerProtocol.PROTOCOL_IPSC;
defaultProtocol.mainProtocolVersion = 0x02;
defaultProtocol.oldProtocolType = PeerProtocol.PROTOCOL_IPSC;
defaultProtocol.oldProtocolVersion = 0x00;

let IPSCClient = new IPSCPeer({
    host: host,
    port: port,
    peerId: 18,
    peerMode: defaultMode,
    peerFlags: defaultFlags,
    peerProtocol: defaultProtocol,
    sendDataWhenActive: true
});

let ipGateway = new DMRIPGateway(IPSCClient, [serviceID]);

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

dmrServices.on(DMRServices.EVENT_BATTERY, (dmrID, battery) => {
    console.log('Battery: '+dmrID+' '+battery);
});
dmrServices.on(DMRServices.EVENT_LOCATION, (dmrID, location) => {
    console.log('Location: '+dmrID+' '+location);
});
dmrServices.on(DMRServices.EVENT_REGISTER, (dmrID) => {
    console.log('Register: '+dmrID);
});

ipGateway.on(DMRIPGateway.EVENT_DATA, (ipPacket) => {
    console.log(ipPacket);
});

IPSCClient.on(IPSCPeer.EVENT_CLOSED, () => {
    console.log('event closed');
})

IPSCClient.on(IPSCPeer.EVENT_CONNECTED, () => {
    console.log('event connected');

    sendSms();
})


IPSCClient.on(IPSCPeer.EVENT_DMRDATA, (data) => {
   // console.log(data)
});
IPSCClient.on(IPSCPeer.EVENT_DATA, (packet) => {

});

IPSCClient.connect();


async function sendSms() {
    let src = 10070;
    let dst = 10032;
    let slot = 1;
    let dstIsGroup = false;
    let src_addr = (12 << 24) | src;
    let dst_addr = ((dstIsGroup ? 225 : 12) << 24) | dst;

    let tms = new TMS();

    tms.msgId = 145;
    tms.text = 'Hello';

    let ip = new IP.IPUDPPacket();

    ip.identification = 124;
    ip.src_addr = src_addr;
    ip.dst_addr = dst_addr;
    ip.src_port = 4007;
    ip.dst_port = 4007;
    ip.payload = tms.getBuffer();

    ipGateway.sendIPPacket(ip, slot);
}
