## BMS
Here goes my research about IMPRESS Battery Management protocol.

- Folder [dumps](dumps) contains Wireshark pcap-files with communication between "Motorola IMPRES Battery Fleet Management" and Motorola DP4801e radio with the different batteries.
- Folder [images](images) contains screenshot of the battery information and corresponding packet in the filename. 
- File [print.md](print.md) contains tabulated data, which can be easily printed for further research.

## Protocol basics
Basic communication looks like
1. PC sends a DISCOVERY (0x01) packet to the radio network.
2. Radio responds with the REGISTRATION (0x02) packet, which contains some basic battery info.
3. PC confirms registration with the REGISTRATION_ACK (0x03) packet with unknown info.
4. PC sends a QUERY_REQUEST packet (0x04).
5. Radio responds with thef QUERY_RESPONSE (0x05) packet, which contains all(?) battery info.


## Packets

### BMS_DISCOVERY
Requests radio to register battery.

    0x01 0x00
 
 
### BMS_REGISTRATION
Radio registration request. Can be triggered manually with the BMS_DISCOVERY or automatically when `Over-the-air battery management` flag is enabled on current channel via CPS of RM. Registration ID is random for every new registration.

    IMPRESS: 0x02 0xF9 0xD1 0xE1 0x19 0xDB 0x85 0x87 0x95 0xC2 0xD6 0x02 <3 bytes registration id> <6 bytes battery serial>
    NON-IMPRESS: 0x02 0xF9 0xD1 0xE1 0x19 0xDB 0x85 0x87 0x95 0xC2 0xD6 0x01 <3 bytes registration id>

### BMS_REGISTRATION_ACK
PC confirms battery registration. Hash calculated from BMS_REGISTRATION id bytes with BMS.getRegisterHash() function.

    0x03 0x02 <3 bytes registration hash>
    
### BMS_QUERY_REQUEST
PC requests battery info.

    Normal: 0x04 <2 bytes request ID, random> 0x01 0x01 0x02
    Extended: 0x04 <2 bytes request ID, random> 0x01 0x02 0x01 0x02
    
### BMS_QUERY_REPLY
Radio responds with the battery information. The most interesting and weird packet. As is see, health value is calculated from the battery capacity. Many parameters depends on first byte of the serial number (see Research->Fleet app).

#### Main packet
|Offset|Length|Example value|Comment|
|---|---|---|---|
|0|1|0x05|Packet type|
|1|2|0x12FB|Request ID from the BMS_QUERY_REQUEST packet|
|3|1|0x00|Response code, see BMS_QUERY_STATUS_* const|
|4|6|0x737A84020050|Battery serial in the reverse format, example result: 500002847A37|
|10|2|0xEA07|Unknown, maybe some batch no|
|12|1|0x5C|Current charge?|
|13|1|0xA9|Potential capacity?|
|14|6|0x0501B0271724|Unknown|
|20|10|0x64...|Unknown, filled with the 0x64|
|30|2|0x6093|Unknown|
|32|2|0x2100|UInt16LE (33), Days since last removal from IMPRES charger|
|34|2|0x2807|Total reconditioning cycles, unknown format (see below)|
|36|1|0x04|LED indicator, see BMS_LED_* const|
|37|1|0x80|Battery state, see BMS_BATTERY_* const|
|38|2|0x2703|UInt16LE, Battery voltage. Formula=(value+14)/100|
|40|1|0x08|Temperature low byte (see below)|
|41|1|0x1a|Temperature high byte. Formula=high + (low/255)|
|42|2|0x6901|UInt16LE (361), Total IMPRES charge cycles|
|44|18|0x02000300...|9 UInt16LE values of the "Charge Added histogram". Tenth (first) value calculated by formula=(Total IMPRES charge cycles) - (sum of all 9 values)
|62|20|0x02000300...|10 UInt16LE values of the "Charge Remaining histogram".|
|82|3|0x30278c|Unknown|
|86|1|0x2F|Current charge low bits, unknown formula|
|87|4|0x71051e04|Unknown, belong to days values|
|91|1|0x64|UInt8 (100) current charge in percent|


#### Extended info (21 bytes, inserted at 10 offset)
 |Offset|Length|Example value|Comment|
 |---|---|---|---|
 |0|1|0x03|Extended packet marker?|
 |1|12|0x41504c493434393343|Battery KIT number in ASCII with trailing 0x00|
 |13|1|0x7C|UInt8, Rated capacity mAh. Formula=value*25|
 |14|7|0x348A06481053C7|Unknown, maybe Date of First use|
 
 
 
 ## Research
 
 ### Extended info examples with the battery dates and rated capacity:
 - 05 3b55 00 23b7e4010050 0341504c493434393343000000 7c 3b ca 4c d8 07 53 c7   4/23/2020 3100
 - 05 3c57 00 2343e3010050 0341504c493434393343000000 7c 3b ca 4c e0 07 53 c7   4/24/2020 3100
 - 05 6565 00 031ac3010050 0341504c493434393343000000 7c 3b ca 4c e0 07 53 c7   4/24/2020 3100
 - 05 4e48 00 031ac3010050 0341504c493434393343000000 7c 34 ca 4c e0 07 53 c7   4/24/2020 3100
 - 05 4fbb 00 737a84020050 03504d4e4e3435343441000000 5c 34 8a 06 48 10 53 c7   8/26/2020 2300
 - 05 4088 00 737a84020050 03504d4e4e3435343441000000 5c 34 8a 06 48 10 53 c7   8/26/2020 2300
 - 05 7919 00 dc130e020050 03504d4e4e3434383941000000 72 34 4a 48 0f 00 53 c7   3/28/2018 2850
 - 05 7c34 00 eecd09020050 03504d4e4e3434383941000000 72 39 29 29 3c 40 53 c7   3/30/2018 2850
 - 05 15f9 00 79348e010050 034e4e544e3835363041000000 5c 3b 1b 32 02 1a 53 c7   9/10/2016 2300
 
 ### Total reconditioning cycles
 As i know for now, it's stored in 2 bytes at 34 offset, but value should be transformed. Example: from 0x3780 to 0x0378.
 After transformation given result should interpreted as UInt16 and calculated.
 
 For 737a84020050 battery formula:
 
 `Input data: 0x0DD0 => 0x00DD => 221 - 216 = 5`
 
 As i see, value 216 is not constant and different for all batteries. Stored in BMS_REGISTRATION or extended BMS_QUERY_REPLY packets ???
 
 
 ### Fleet app
 I've tried to modify some bytes and replay it with the [nemesis](https://github.com/libnet/nemesis). Each section corresponding for it's offset, below goes value(hex)=>result. All below test are made with info from battery 737a84020050.
 
 Next try were with the [radio-emulator.js](radio-emulator.js) script: it communicates with the fleet app installed on the windows VM via local network.

 Glossary:
 - D1 = Days since last reconditioning
 - D2 = Days since last removal from IMPRES charger
 - D3 = Estimated days until next calibration
 - C  = Present charge mAh
 - Cp = Potential capacity mAh
 - C3 = Total reconditioning cycles
 
 
 #### Potential capacity table
  |Serial first byte|Byte 10|Byte 11|Byte 13|Cp|
  |---|---|---|---|---|
  |0x03|0xEA|0x07|0xA9|2241|
  |0x03|0xBA|0x07|0xA9|2295|
  |0x03|0xBB|0x03|0xAA|6391|
  |0x03|0xBB|0x03|0xB9|4857|
  |0x03|0xBC|0x03|0xB9|4852|
  |0x03|0xCB|0x03|0xB9|4777|
  |0x03|0xBB|0x03|0xA9|4754|
  |0x03|0xBB|0x04|0xA9|3749|
  |0x03|0xBB|0x05|0xA9|3095|
  |0x03|0xBB|0x06|0xA9|2635|
  |0x03|0xBB|0x07|0xA9|2294|
  |0x03|0xBB|0x08|0xA9|2203|
  |0x03|0xBB|0x09|0xA9|1822|
  |0x03|0xBB|0x17|0xA9|747|
  |0x03|0xBB|0xF7|0xA9|-2145|
  |0x03|0xBB|0x77|0xA9|148|
  |0x03|0xBB|0x87|0xA9|-147|
  |**0x04**|0xBC|0x03|0xB9|9959|
  |**0x14**|0xBC|0x03|0xB9|9959|
 
 #### Offset 90
 - 0x01 => D2=2
 - 0x02 => D2=1100
 - 0x03 => D2=844
 - 0x04 => D2=588
 
 #### Offset 89
  - 0x36 => D2=2
  - 0x37 => D2=1
 
 #### Offset 88
 - 0x01 => C=2825 D1=21 D2=2
 - 0x02 => C=2197 D1=216 D2=197
 - 0x03 => C=1570 D1=410 D2=391
 
 #### Offset 87
 - 0x9B => C=2827 D1=21 D2=2
 - 0x9C => C=2825 D1=21 D2=2
 - 0x9D => C=2822 D1=22 D2=3
 - 0x8C => C=2863 D1=9  D2=1357
 - 0xAC => C=2786 D1=24 D2=15
 
 #### Offset 84
 - 0xB1 => D1=0  D2=2
 - 0xB2 => D1=0  D2=2
 - 0xA0 => D1=22 D2=2
 - 0xC0 => D1=20 D2=2
 
 #### Offset 83
 - 0x1E => D1=37   D2=2
 - 0x1D => D1=53   D2=2
 - 0x1F => D1=21   D2=2
 - 0x2F => D1=1119 D2=2
 - 0x0F => D1=277  D2=2

 #### Offset 35 (when byte 34=0x0D)
 - 0xD2 => C3=8197
 - 0xD1 => C3=4101
 - 0xD0 => C3=5
 - 0xE0 => C3=6
 - 0x60 => C3=65534
 - 0xDC => C3=49157
 - 0xDC => C3=48965 (when byte 34=0x01)
 - 0xDC => C3=3077 (when byte 34=0xCD)
 - 0xFF => C3=65319 (when byte 34=0xFF)
 - 0x00 => C3=65320 (when byte 34=0x00)

 #### Offset 16
 - 0x20 => C=2825
 - 0x21 => C=2863
 - 0x22 => C=2863
 - 0x2F => C=2863
 - 0x10 => C=1995
 - 0x30 => C=2863
 - 0x31 => C=2863
 - 0xFF => C=2863
 
 #### Offset 14
 - 0x0B => C=2863 Cp=623
 - 0x0C => C=2855 Cp=623
 - 0x0A => C=3117 Cp=623
 
  #### Offset 13
  - 0x20 => Cp=671
  - 0x29 => Cp=2975
  - 0x2A => Cp=3231
  - 0x2B => Cp=3487
  - 0x10 => Cp=655
  - 0x30 => Cp=687
  - 0x00 => Cp=639
  - 0xFF => Cp=623
