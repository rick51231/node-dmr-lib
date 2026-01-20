"use strict";

module.exports = Object.freeze({
    _REPEATER_ID          : 200000202,
    _SMS_CSBK_COUNT       : 2,


    FORMAT_IPSC     : 'ipsc',
    FORMAT_HOMEBREW : 'homebrew',



    LRRP_ImmediateLocationRequest : 0x05,
    LRRP_ImmediateLocationResponse : 0x07,
    LRRP_TriggeredLocationStartRequest : 0x09,
    LRRP_TriggeredLocationStartResponse : 0x0B,
    LRRP_TriggeredLocationData : 0x0D,
    LRRP_TriggeredLocationStopRequest : 0x0F,
    LRRP_TriggeredLocationStopResponse : 0x11,
    LRRP_ProtocolVersionRequest : 0x14,
    LRRP_ProtocolVersionResponse : 0x15,

    //42 82 2c 66 62 3431
    // https://git.safemobile.org/laurentiu.constantin/SafeNet/src/branch/master/SafeNetLib/Definitions.cs
    LRRP_REQUEST_PRECISION_TIME     : 0x51, //https://github.com/pboyd04/Moto.Net/blob/master/Moto.Net/Mototrbo/LRRP/ImmediateLocationRequestPacket.cs
    LRRP_REQUEST_PRECISION          : 0x50,
    LRRP_REQUEST_TIME               : 0x52,
    LRRP_REQUEST_SPEED_HORIZONTAL   : 0x62,
    LRRP_REQUEST_ALTITUDE           : 0x54, //66 ?
    LRRP_REQUEST_DIRECTION_HORIZONTAL  : 0x57, //69 ?

    LRRP_REQUEST_ONESHOT_TRIGGER    : 0x33,
    LRRP_REQUEST_PERIODIC_TRIGGER   : 0x34,
    LRRP_REQUEST_TRIGGER_INTERVAL   : 0x31,
    LRRP_REQUEST_TRIGGER_DISTANCE   : 0x78,
    LRRP_REQUEST_TRIGGER_CONDITION  : 0x4A,

    LRRP_REQUEST_TRIGGER_CONDITION_EMERGENCY   : 0x02,
    LRRP_REQUEST_TRIGGER_CONDITION_PIN_STATUS_CHANGE  : 0x42,
    LRRP_REQUEST_TRIGGER_CONDITION_PTT  : 0x50,
    LRRP_REQUEST_TRIGGER_CONDITION_PTT_EMERGENCY  : 0x51,







    LRRP_TOKEN_ID         : 0x22,
    LRRP_TOKEN_INTERVAL   : 0x51,
    LRRP_TOKEN_TIME       : 0x34,
    LRRP_TOKEN_LOCATION   : 0x66,
    LRRP_TOKEN_LOCATION_ALT    : 0x69, //No radius
    LRRP_TOKEN_LOCATION_3D     : 0x51,
    LRRP_TOKEN_LOCATION_3D_ALT : 0x55,
    LRRP_TOKEN_DIRECTION  : 0x56, //Aka heading
    LRRP_TOKEN_SPEED      : 0x6C,
    LRRP_TOKEN_SPEED_VRT  : 0x70,
    LRRP_TOKEN_STATUS_CODE: 0x37,
    LRRP_TOKEN_STATUS_OK  : 0x38,



});

