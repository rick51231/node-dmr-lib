class Base {
    isEncrypted = false;
    hasFix = false;

    lat_direction_north = false; // False = South
    lat_deg = 0;
    lat_min = 0;
    lat_min_dec = 0;

    lon_direction_east = false; // False = West
    lon_deg = 0;
    lon_min = 0;
    lon_min_dec = 0;

    speed = 0; // knots, km/h = (speed_knots / 2) * 1.852

    static from(d, nmea) {
        if(d.length<10)
            return null;

        nmea.isEncrypted = (d[0] & 0b10000000) > 0;
        nmea.lat_direction_north = (d[0] & 0b01000000) > 0;
        nmea.lon_direction_east = (d[0] & 0b00100000) > 0;
        nmea.hasFix = (d[0] & 0b00010000) > 0;


        nmea.speed = ((d[0] & 0xF) << 3) | ((d[1] & 0xE0) >> 5);


        nmea.lat_deg = ((d[1] & 0x1F) << 2) | ((d[2] & 0xC0) >> 6);
        nmea.lon_deg = ((d[4] & 0x3) << 6) | ((d[5] & 0xFC) >> 2);
        nmea.lat_min = d[2] & 0x3F;
        nmea.lon_min = ((d[5] & 0x3) << 4) | ((d[6] & 0xF0) >> 4);
        nmea.lat_min_dec = ((d[3] << 6) | ((d[4] & 0xFC) >> 2));
        nmea.lon_min_dec = ((d[6] & 0xF) << 10) | (d[7] << 2) | ((d[8] & 0xC0) >> 6);

        return nmea;
    }

    getBuffer() {
        let d = Array(10);

        if(this.isEncrypted)
            d[0] |= 0b10000000;
        if(this.lat_direction_north)
            d[0] |= 0b01000000;
        if(this.lon_direction_east)
            d[0] |= 0b00100000;
        if(this.hasFix)
            d[0] |= 0b00010000;

        d[0] |= (this.speed >> 3) & 0xF;
        d[1] |= (this.speed << 5) & 0xE0;

        d[1] |= (this.lat_deg >> 2) & 0x1F;
        d[2] |= (this.lat_deg << 6) & 0xC0;
        d[2] |= this.lat_min & 0x3F;
        d[3] |= (this.lat_min_dec >> 6) & 0xFF;
        d[4] |= (this.lat_min_dec << 2) & 0xFC;
        d[4] |= (this.lon_deg >> 6) & 0x3;
        d[5] |= (this.lon_deg << 2) & 0xFC;
        d[5] |= (this.lon_min >> 4) & 0x3;
        d[6] |= (this.lon_min << 4) & 0xF0;
        d[6] |= (this.lon_min_dec >> 10) & 0xF;
        d[7] |= (this.lon_min_dec >> 2) & 0xFF;
        d[8] |= (this.lon_min_dec << 6) & 0xC0;

        return d;
    }

    getLat() {
        return (this.lat_deg + parseFloat('' + this.lat_min + '.' + ('' + this.lat_min_dec).padStart(4, '0')) / 60) * (this.lat_direction_north ? 1 : -1)
    }
    getLon() {
        return (this.lon_deg + parseFloat('' + this.lon_min + '.' + ('' + this.lon_min_dec).padStart(4, '0')) / 60) * (this.lon_direction_east ? 1 : -1)
    }
}

module.exports = Base;