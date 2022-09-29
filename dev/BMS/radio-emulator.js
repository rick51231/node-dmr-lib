const udp = require('dgram');
const client = udp.createSocket('udp4');

const port = 4012;

client.bind({
    address: '0.0.0.0',
    port: port,
    exclusive: true
});

let i = 0;



client.on('message',function(msg,info){
    console.log('Recv: ' + msg.toString('hex') + ' (%d) from %s:%d',msg.length, info.address, info.port);


    if(msg.readUInt8(0) === 0x04) {
        sendBatteryInfo(msg.readUInt16LE(1), msg.readUInt8(4)===0x02);
    }
});

function snd() {
    data.writeUInt8((i>>16)&0xff, 11);
    data.writeUInt16BE(i & 0xFFFF, 12);

    i++;
    sendData(data);

}



let str2 = '02 f9d1e119db858795c2d6 02 8fb2ca 79348e010050';
let data2 = Buffer.from(str2.replace(/ /g, ''), 'hex');
sendData(data2);

function sendData(data) {
    client.send(data,port,'192.168.132.5',function(error){
        console.log('Send: '+data.toString('hex') + ' (%d)', data.length);
        if(error){
            client.close();
            console.error("Error: "+error);
            process.exit(1);
        }
    });

}

function sendBatteryInfo(reqID, extended) {                                                       // ec 0b cc a9 0b0182c00d21
    let str = '05 1153 00 79348e010050350'+(extended ? '03 504d4e4e3434383941000000 5c3929293c4053c7' : '')+'c932f0e010dee11176464646464646464646425a00f0001dc04800003b01be7001300140032000f000c000200040011002f002d001700040005000a001100390014000b001c000dbe797e14081f064f';

    let data = Buffer.from(str.replace(/ /g, ''), 'hex');

    data.writeUInt16LE(reqID, 1);

    sendData(data);
}