const udp = require('dgram');

// Use with md380-emulator server https://github.com/rick51231/ambe-server-docker

// Convert to wav:
// ffmpeg -f s16le -ar 8000 -ac 1 -i decoded.pcm -af "volume=5" out.wav
// sox -r 8000 -e signed-integer -L -b 16 -c 1 -v 5 decoded.pcm out.wav
class AMBEClient {
    socket;
    ip;
    port;
    timeout; //ms
    isBusy = false;
    currentPromise = null;
    currentTimeout = null;

    constructor(ip, port, timeout = 500) {
        this.ip = ip;
        this.port = port;
        this.timeout = timeout;

        this.socket = udp.createSocket('udp4');

        this.socket.on('message', (msg) => {
            this.ready(msg);
        });
    }

    decode(buffer) {
        return new Promise( resolve => {
            if(buffer.length!==7)
                return resolve(null);

            this.run(buffer, resolve);
        });
    }

    encode(buffer) {
        return new Promise( resolve => {
            if(buffer.length!==320)
                return resolve(null);

            this.run(buffer, resolve);
        });
    }

    run(buffer, resolve) {
        if(this.isBusy)
            return setTimeout(() => {
                this.run(buffer, resolve);
            }, 1);

        this.isBusy = true;
        this.currentPromise = resolve;

        this.currentTimeout = setTimeout(() => {
            this.ready(null);
        }, this.timeout);

        this.socket.send(buffer, this.port, this.ip);
    }

    ready(result) {
        if(this.currentPromise===null)
            return;

        this.currentPromise(result);
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
        this.currentPromise = null;
        this.isBusy = false;
    }
}

module.exports = AMBEClient;