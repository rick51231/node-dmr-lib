const DMRLib = require('../src');

console.log('ARS: register from 10058:');
console.log(DMRLib.Protocols.ARS.from(Buffer.from('000af0200531303035380000', 'hex')));

console.log('LRRP: start periodic tracking:');
console.log(DMRLib.Protocols.LRRP.from(Buffer.from('0b082204000000013716', 'hex')));

console.log('LRRP: location data (no satellites):');
console.log(DMRLib.Protocols.LRRP.from(Buffer.from('0d082204000000013710', 'hex')));

console.log('LRRP: location data (location + altitude + time):');
console.log(DMRLib.Protocols.LRRP.from(Buffer.from('0d18220400000001341f9c46d758691ab13ef423a44b2c815e4f', 'hex')));

console.log('TMS: text=Hi:');
console.log(DMRLib.Protocols.TMS.from(Buffer.from('000ca0008e040d000a0048006900', 'hex')));

console.log('BMS: registration:');
console.log(DMRLib.Protocols.BMS.from(Buffer.from('02f9d1e119db858795c2d602a45371737a84020050', 'hex')));

console.log('BMS: battery data:');
console.log(DMRLib.Protocols.BMS.from(Buffer.from('05826200737a8402005003504d4e4e34353434410000005c348a06481053c7ea0757a90501f82a0c166464646464646464646460932100400704802303701575014a0022001d0012000600050016000d001600200028000e0009001800190024002f004b002c00582a1f7ef905870462', 'hex')));

console.log('HomeBrew: data from 10058 to 10099');
console.log(DMRLib.Protocols.HomeBrew.Packet.from(Buffer.from('444d52440500274a00277311e1a365e7cf64a9a16cbf40af13e5d68b6893026585ed5d7f77fd7570944b6779062d1ea037105232c10047', 'hex')));

console.log('NMEA: legacy');
console.log(DMRLib.Protocols.NMEA.Legacy.from(Buffer.from('700a362f141a42d3a2dfb4db', 'hex')));

console.log('IPSC: private data from 10056 to 10099');
console.log(DMRLib.Protocols.IPSC.Packet.from(Buffer.from('840000000a1a002748002773010000666a20805db31d0589b6db0000000007c0000a800a0060b90f015f5f0d18220400000000170007', 'hex')));
