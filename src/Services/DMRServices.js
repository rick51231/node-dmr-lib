const DMRIPGateway = require("./DMRIPGateway");
const Protocols = require("../Protocols");
const IP4Packet = require("../IP/IP4Packet");
const Network = require("../Motorola/Network");
const { getTime, delay } = require('./Utils');
const EventEmitter = require("events");

const RETRY_DELAY = 60000; //60 seconds = 60000 ms

class DMRServices extends EventEmitter  {
    static ARS_STATUS_UNREGISTERED = 0;
    static ARS_STATUS_REGISTERED = 1;

    static BMS_STATUS_NONE = 0;
    static BMS_STATUS_UNREGISTERED = 1;
    static BMS_STATUS_DISCOVERY_SENT = 2;
    static BMS_STATUS_REGISTERED = 3;

    static LRRP_STATUS_NONE = 0;
    static LRRP_STATUS_SENT = 1;
    static LRRP_STATUS_CONFIRMED = 2;
    static LRRP_STATUS_RECEIVED = 3;

    static EVENT_BATTERY = 'battery';
    static EVENT_LOCATION = 'location';
    static EVENT_REGISTER = 'register';

    ipGateway;
    serviceId;
    options;
    status = {};
    identificationCounter = Math.floor(Math.random() * 65000); //Start from random

    constructor(ipGateway, serviceID, options) {
        super();

        this.ipGateway = ipGateway;
        this.serviceId = serviceID;
        this.options = {
            ignoreUnregistered: options.ignoreUnregistered ?? false,
            CSBKCount: options.CSBKCount ?? 2,
            LRRPEnabled: options.LRRPEnabled ?? false,
            LRRPRequests: options.LRRPRequests ?? [],
            LRRPRetryCount: options.LRRPRetryCount ?? 4,
            BMSEnabled: options.BMSEnabled ?? false,
            BMSQueryInterval: options.BMSQueryInterval ?? 0,
            BMSRetryCount: options.BMSRetryCount ?? 3,
        }

        this.ipGateway.on(DMRIPGateway.EVENT_DATA, (ipPacket, slot) => {
            this.onIPPacket(ipPacket, slot);
        })

        setTimeout(() => {
            this.serviceWorker();
        }, 100);

        setInterval(() => {
            console.log('[DMRServices] Status: '+JSON.stringify(this.status));
        }, 10000);
    }

    onIPPacket(ipPacket, slot) {

        if(ipPacket.getDMRDst()!==this.serviceId)
            return;

        if(ipPacket.protocol!==IP4Packet.PROTOCOL_UDP)
            return;

        if(this.status[ipPacket.getDMRSrc()]===undefined)
            this.generateStatus(ipPacket.getDMRSrc());

        this.status[ipPacket.getDMRSrc()].slot = slot;

        if(ipPacket.dst_port===Network.PORT_ARS) {
            this.onARSPacket(ipPacket);
            return;
        }

        if(this.options.ignoreUnregistered && !this.isRegistered(ipPacket.getDMRSrc()))
            return;

        switch(ipPacket.dst_port) {
            case Network.PORT_LRRP:
                this.onLRRPPacket(ipPacket);
                break;
            case Network.PORT_BMS:
                this.onBMSPacket(ipPacket);
                break;
        }
    }

    async onARSPacket(ipPacket) {
        let ars = Protocols.ARS.from(ipPacket.payload);
        if(ars===null)
            return;

        if(ars.type === Protocols.ARS.DEVICE_REGISTRATION) {
            let replyARS = new Protocols.ARS();

            replyARS.type = Protocols.ARS.REGISTRATION_ACKNOWLEDGEMENT;
            replyARS.extended = false;
            replyARS.priority = true;
            replyARS.controlUser = true;


            this.sendIPPacket(replyARS.getBuffer(), ipPacket.src_addr, ipPacket.dst_port, ipPacket.src_port);
            await delay(1000);
            this.setARSStatus(ipPacket.getDMRSrc(), DMRServices.ARS_STATUS_REGISTERED);

            this.emit(DMRServices.EVENT_REGISTER, ipPacket.getDMRSrc());
        } else if(ars.type === Protocols.ARS.DEVICE_DEREGISTRATION) {
            this.setARSStatus(ipPacket.getDMRSrc(), DMRServices.ARS_STATUS_UNREGISTERED);
        }
    }

    onLRRPPacket(ipPacket) {
        if(!this.options.LRRPEnabled)
            return;

        let lrrp = Protocols.LRRP.from(ipPacket.payload);

        if(lrrp===null)
            return;

        let LRRPId = lrrp.id-1;

        if(this.options.LRRPRequests[LRRPId]===undefined)
            return; //TODO: send cancel?

        if(lrrp.type===Protocols.LRRP.TYPE_TriggeredLocationStartResponse)
            this.setLRRPStatus(ipPacket.getDMRSrc(), LRRPId, DMRServices.LRRP_STATUS_CONFIRMED);
        else if(lrrp.type===Protocols.LRRP.TYPE_TriggeredLocationData) {
            this.setLRRPStatus(ipPacket.getDMRSrc(), LRRPId, DMRServices.LRRP_STATUS_RECEIVED);
            this.emit(DMRServices.EVENT_LOCATION, ipPacket.getDMRSrc(), lrrp.locationData);
        }
    }

    async onBMSPacket(ipPacket) {
        if(!this.options.BMSEnabled)
            return;

        let bms = Protocols.BMS.from(ipPacket.payload);

        if(bms===null)
            return;

        if(bms.type===Protocols.BMS.TYPE_REGISTRATION) {
            this.status[ipPacket.getDMRSrc()].BMS.serial = bms.serial;

            let replyBMS = new Protocols.BMS();

            replyBMS.type = Protocols.BMS.TYPE_REGISTRATION_ACK;
            replyBMS.registerHash = Protocols.BMS.getRegisterHash(bms.registerHash);
            await delay(1000); //Wait for the confirmation
            this.sendIPPacket(replyBMS.getBuffer(), ipPacket.src_addr, ipPacket.dst_port, ipPacket.src_port);
            await delay(1000);
            this.setBMSStatus(ipPacket.getDMRSrc(), DMRServices.BMS_STATUS_REGISTERED);
        } else if(bms.type===Protocols.BMS.TYPE_QUERY_REPLY) {
            if(bms.code===0) {//TODO: use constant
                this.status[ipPacket.getDMRSrc()].BMS.serial = bms.serial;
                this.status[ipPacket.getDMRSrc()].BMS.charge = bms.charge;

                this.emit(DMRServices.EVENT_BATTERY, ipPacket.getDMRSrc(), bms);
            }
            //TODO: reregister in case of BMS_QUERY_STATUS_TARGET_NOT_REGISTERED || BMS_QUERY_STATUS_SOURCE_NOT_REGISTERED
        }
    }

    isRegistered(dmrID) {
        if(this.status[dmrID]===undefined)
            return false;

        return this.status[dmrID].ARS.status === DMRServices.ARS_STATUS_REGISTERED;
    }

    sendIPPacket(payload, dst_addr, src_port, dst_port) {
        let ip = new IP4Packet();

        ip.src_port = src_port;
        ip.dst_port = dst_port;

        ip.src_addr = (Network.NETWORK_SERVER<<24) | this.serviceId;
        ip.dst_addr = dst_addr;

        if(this.identificationCounter>=65000)
            this.identificationCounter = 0;
        else
            this.identificationCounter++;

        ip.protocol = IP4Packet.PROTOCOL_UDP;
        ip.identification = this.identificationCounter;
        ip.payload = payload;

        let slot = this.status[dst_addr&0xFFFFFF].slot;

        this.ipGateway.sendIPPacket(ip, slot, this.options.CSBKCount);
    }

    setARSStatus(dmrID, status) {
        console.log('[DMRServices] ARS: ID:'+dmrID+' S:'+status);
        this.status[dmrID].ARS.status = status;
        this.status[dmrID].ARS.updated = getTime();

        if(status===DMRServices.ARS_STATUS_REGISTERED) {
            setTimeout(() => {
                this.setBMSStatus(dmrID, DMRServices.BMS_STATUS_UNREGISTERED);
                this.status[dmrID].BMS.retryCount = 0;
            }, 100);


            for(let [id] of this.status[dmrID].LRRP.entries()) {
                this.status[dmrID].LRRP[id].retryCount = 0;
                this.setLRRPStatus(dmrID, id, DMRServices.LRRP_STATUS_NONE);
            }
        }
    }

    setBMSStatus(dmrID, status) {
        console.log('[DMRServices] BMS: ID:'+dmrID+' S:'+status);
        this.status[dmrID].BMS.status = status;
        this.status[dmrID].BMS.updated = getTime();
    }

    setLRRPStatus(dmrID, LRRPId, status) {
        console.log('[DMRServices] LRRP-'+LRRPId+': ID:'+dmrID+' S:'+status);
        this.status[dmrID].LRRP[LRRPId].status = status;
        this.status[dmrID].LRRP[LRRPId].updated = getTime();
    }

    generateStatus(dmrID) {
        this.status[dmrID] = {
            ARS: {
                status: DMRServices.ARS_STATUS_UNREGISTERED,
                updated: getTime()
            },
            LRRP: [],
            BMS: {
                status: DMRServices.BMS_STATUS_NONE,
                updated: getTime(),
                retryCount: 0,
                serial: '',
                charge: 0,
                lastQuery: 0
            },
            slot: 0
        };

        for(let [id] of this.options.LRRPRequests.entries()) {
            this.status[dmrID].LRRP[id] = {
                status: DMRServices.LRRP_STATUS_NONE,
                updated: getTime(),
                retryCount: 0
            };
        }
    }

    discoveryBMS(dmrID) {
        this.setBMSStatus(dmrID, DMRServices.BMS_STATUS_DISCOVERY_SENT);
        this.status[dmrID].BMS.retryCount++;

        let bms = new Protocols.BMS();

        bms.type = Protocols.BMS.TYPE_DISCOVERY;

        let dstAddr = (Network.NETWORK_RADIO<<24) | dmrID;

        this.sendIPPacket(bms.getBuffer(), dstAddr, Network.PORT_BMS, Network.PORT_BMS);
    }

    queryBMS(dmrID) {
        this.status[dmrID].BMS.lastQuery = getTime();
        let bms = new Protocols.BMS();

        bms.type = Protocols.BMS.TYPE_QUERY_REQUEST;
        bms.reqId = Math.round(Math.random()*32768);
        bms.queryType = Protocols.BMS.QUERY_TYPE_NORMAL;

        let dstAddr = (Network.NETWORK_RADIO<<24) | dmrID;

        this.sendIPPacket(bms.getBuffer(), dstAddr, Network.PORT_BMS, Network.PORT_BMS);
    }

    sendLRRP(dmrID, LRRPId) {
        this.setLRRPStatus(dmrID, LRRPId, DMRServices.LRRP_STATUS_SENT);
        this.status[dmrID].LRRP[LRRPId].retryCount++;

        let lrrp = this.options.LRRPRequests[LRRPId];

        lrrp.id = LRRPId+1;

        let dstAddr = (Network.NETWORK_RADIO<<24) | dmrID;

        this.sendIPPacket(lrrp.getBuffer(), dstAddr, Network.PORT_LRRP, Network.PORT_LRRP);
    }

    async serviceWorker() {
        for(let dmrID of Object.keys(this.status)) {
            if(!this.isRegistered(dmrID))
                continue;

            if(this.options.LRRPEnabled) {
                for(let [id] of this.options.LRRPRequests.entries()) {
                    if(this.status[dmrID].LRRP[id].status===DMRServices.LRRP_STATUS_NONE) {
                        this.sendLRRP(dmrID, id);
                        await delay(1000);
                    } else if(this.status[dmrID].LRRP[id].status===DMRServices.LRRP_STATUS_SENT && this.status[dmrID].LRRP[id].retryCount < this.options.LRRPRetryCount && this.status[dmrID].LRRP[id].updated + RETRY_DELAY < getTime()) {
                        this.setLRRPStatus(dmrID, id, DMRServices.LRRP_STATUS_NONE);
                    }
                }
            } // if(this.options.LRRPEnabled) {

            if(this.options.BMSEnabled) {
                if(this.status[dmrID].BMS.status===DMRServices.BMS_STATUS_UNREGISTERED) {
                    this.discoveryBMS(dmrID);
                    await delay(1000);
                } else if(this.status[dmrID].BMS.status===DMRServices.BMS_STATUS_DISCOVERY_SENT && this.status[dmrID].BMS.retryCount < this.options.BMSRetryCount && this.status[dmrID].BMS.updated + RETRY_DELAY < getTime()) {
                    this.setBMSStatus(dmrID, DMRServices.BMS_STATUS_UNREGISTERED);
                } else if(this.status[dmrID].BMS.status===DMRServices.BMS_STATUS_REGISTERED) {
                    if(this.options.BMSQueryInterval > 0 && this.status[dmrID].BMS.lastQuery + (this.options.BMSQueryInterval * 1000) < getTime()) {
                        this.queryBMS(dmrID);
                        await delay(1000);
                    }
                }
            } // if(this.options.BMSEnabled)
        }

        setTimeout(() => {
            this.serviceWorker();
        }, 50);
    }

}

module.exports = DMRServices;
