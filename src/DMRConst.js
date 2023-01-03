"use strict";

module.exports = Object.freeze({
    _REPEATER_ID          : 200000202,
    _SMS_CSBK_COUNT       : 2,


    FORMAT_IPSC     : 'ipsc',
    FORMAT_HOMEBREW : 'homebrew',



    BMS_DISCOVERY            : 0x01,
    BMS_REGISTRATION         : 0x02,
    BMS_REGISTRATION_ACK     : 0x03,
    BMS_QUERY_REQUEST        : 0x04,
    BMS_QUERY_REPLY          : 0x05,

    BMS_QUERY_TYPE_SHORT    : 0x1,
    BMS_QUERY_TYPE_NORMAL   : 0x2,
    BMS_QUERY_TYPE_EXTENDED : 0x3,

    BMS_QUERY_TYPE_SHORT_HEX    : '010101',
    BMS_QUERY_TYPE_NORMAL_HEX   : '010102',
    BMS_QUERY_TYPE_EXTENDED_HEX : '01020102',

    BMS_QUERY_STATUS_OK                 : 0x00,
    BMS_QUERY_STATUS_FAILTURE           : 0x01,
    BMS_QUERY_STATUS_IN_CHARGER         : 0x02,
    BMS_QUERY_STATUS_BATTERY_NOT_FOUND  : 0x03, // Or pending registration ?
    BMS_QUERY_STATUS_PENDING_ENABLED_PERSONALITY  : 0x04,
    BMS_QUERY_STATUS_TARGET_NOT_REGISTERED     : 0x05,
    BMS_QUERY_STATUS_SOURCE_NOT_REGISTERED     : 0x06,
    BMS_QUERY_STATUS_NON_IMPRES         : 0x07,
    BMS_QUERY_STATUS_INVALID_REQUEST_SYNTAX         : 0x08,
    //Is it real codes ?
    BMS_QUERY_STATUS_INDEX_OUT_OF_RANGE         : 0x09,
    BMS_QUERY_STATUS_RESPONSE_TIMEOUT         : 0x0A,
    BMS_QUERY_STATUS_BATTERY_DATA_ERROR        : 0x0B,
    BMS_QUERY_STATUS_BATTERY_NOT_MATCH       : 0x0C,



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

    LRRP_REQUEST_PERIODIC_TRIGGER   : 0x34,
    LRRP_REQUEST_TRIGGER_INTERVAL   : 0x31,
    LRRP_REQUEST_TRIGGER_DISTANCE   : 0x78,





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

