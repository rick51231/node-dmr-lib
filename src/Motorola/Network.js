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
    static PORTID_TELEMETRY = 0x05;

    static PORTID_NEW_CONSTANT = 94; //New radios (aka DP4000) uses "DMR Standart" compression with this portId offset

    static PORT_LRRP      = 4001; // Location
    static PORT_ARS       = 4005; // Registration
    static PORT_TMS       = 4007; // Text messages
    static PORT_TLM       = 4008; // Telemetry
    static PORT_BMS       = 4012; // Battery management
    static PORT_JMS       = 4013; // Job tickets ?
    static PORT_LIP       = 5017; // Indoor location ?
    static PORT_XNL       = 8002; // XNL/XCMP TCP connection


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
            case Network.PORTID_TELEMETRY:
                return Network.PORT_TELEMETRY;
        }

        return null;
    }

    static Port2PortID(port, isNewFormat) {
        let portId = 0;
        switch (port) {
            case Network.PORT_LRRP:
                portId = Network.PORTID_LRRP;
                break;
            case Network.PORTID_ARS:
                portId = Network.PORTID_ARS;
                break;
            case Network.PORTID_TMS:
                portId = Network.PORTID_TMS;
                break;
            case Network.PORTID_TELEMETRY:
                portId = Network.PORTID_TELEMETRY;
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