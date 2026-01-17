class Network {
    static ADDRESSID_RADIO     = 0x00;
    static ADDRESSID_SERVER    = 0x01;
    static ADDRESSID_GROUP     = 0x02;
    static ADDRESSID_BLUETOOTH = 0x03; //Idk about this

    static NETWORK_RADIO  = 12;  // 0x0C
    static NETWORK_SERVER = 13;  // 0x0D
    static NETWORK_GROUP  = 225; // 0xE1

    static PORTID_LRRP      = 0x01;
    static PORTID_ARS       = 0x03;
    static PORTID_TMS       = 0x04;
    static PORTID_TLM       = 0x05;

    static PORTID_NEW_CONSTANT = 94; //New radios (aka DP4000) uses "DMR Standart" compression with this portId offset


    //CPS help str: It is not recommended to use the port numbers reserved for internal applications (4001, 4004, 4005, 4007, 4008, 4061, 4062, 4063, 4066, 4067, 4068, 4069).
    static PORT_DDMS      = 3000; // Presence Notifier (PN) service TCP
    static PORT_LRRP      = 4001; // Location
    static PORT_UNK0      = 4004; // XCMP server ?
    static PORT_ARS       = 4005; // Registration
    static PORT_TMS       = 4007; // Text messages
    static PORT_TLM       = 4008; // Telemetry
    static PORT_OTA       = 4009; // Over the air programming
    static PORT_UNK1      = 4010; // Extended TMS ? / Possible some commands after OTA
    static PORT_UNK2      = 4011; // ?
    static PORT_BMS       = 4012; // Battery management
    static PORT_JMS       = 4013; // Job tickets
    static PORT_SRR       = 4015; // Sensor Request Response
    static PORT_ATT       = 4064; // AirTracer
    static PORT_LIP       = 5017; // Indoor location
    static PORT_XNL       = 8002; // XNL/XCMP TCP connection
    static PORT_XNLS      = 8003; // XNL/XCMP secure TCP connection


    static AddressID2Network(addressId) {
        switch(addressId) {
            case Network.ADDRESSID_RADIO:
                return Network.NETWORK_RADIO;
            case Network.ADDRESSID_SERVER:
                return Network.NETWORK_SERVER;
            case Network.ADDRESSID_GROUP:
                return Network.NETWORK_GROUP;
        }

        return null;
    }

    static Network2AddressID(network) {
        switch(network) {
            case Network.NETWORK_RADIO:
                return Network.ADDRESSID_RADIO;
            case Network.NETWORK_SERVER:
                return Network.ADDRESSID_SERVER;
            case Network.NETWORK_GROUP:
                return Network.ADDRESSID_GROUP;
        }

        return null;
    }

    static PortID2Port(portId, isNewFormat) {
        if(isNewFormat)
            portId -= Network.PORTID_NEW_CONSTANT;

        switch (portId) {
            case Network.PORTID_LRRP:
                return Network.PORT_LRRP;
            case Network.PORTID_ARS:
                return Network.PORT_ARS;
            case Network.PORTID_TMS:
                return Network.PORT_TMS;
            case Network.PORTID_TLM:
                return Network.PORT_TLM;
        }

        return null;
    }

    static Port2PortID(port, isNewFormat) {
        let portId = 0;
        switch (port) {
            case Network.PORT_LRRP:
                portId = Network.PORTID_LRRP;
                break;
            case Network.PORT_ARS:
                portId = Network.PORTID_ARS;
                break;
            case Network.PORT_TMS:
                portId = Network.PORTID_TMS;
                break;
            case Network.PORT_TLM:
                portId = Network.PORTID_TLM;
                break;
            default:
                return null;
        }

        if(isNewFormat)
            portId += Network.PORTID_NEW_CONSTANT;

        return portId;
    }
}

module.exports = Network;