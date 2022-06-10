export function rndLcg( seed ) {
    //https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    //https://en.wikipedia.org/wiki/Lehmer_random_number_generator
    function lcg( a ){ return a * 48271 % 2147483647; }

    seed = seed ? lcg( seed ) : lcg( Math.random() );
    return function(){ return (seed = lcg( seed )) / 2147483648; }
}

export function vec3_yp( o, v ){ // -zyx rot y+90
    const x = v[0], 
          y = v[1], 
          z = v[2]; 
    o[0] = -z; 
    o[1] = y; 
    o[2] = x; 
    return o;
}

export function vec3_yn( o, v ){ // zy-x rot y-90
    const x = v[0], 
          y = v[1], 
          z = v[2];
    o[0] = z; 
    o[1] = y; 
    o[2] = -x; 
    return o;
}

export function vec3_reset( out ){
    out[ 0 ] = 0;
    out[ 1 ] = 0;
    out[ 2 ] = 0;
    return out;
}

export function vec3_add( out, a, b ){
    out[ 0 ] = a[0] + b[0];
    out[ 1 ] = a[1] + b[1];
    out[ 2 ] = a[2] + b[2];
    return out;
}

export function vec3_sub( out, a, b ){
    out[ 0 ] = a[0] - b[0];
    out[ 1 ] = a[1] - b[1];
    out[ 2 ] = a[2] - b[2];
    return out;
}

export function vec3_mul( out, a, b ){
    out[ 0 ] = a[0] * b[0];
    out[ 1 ] = a[1] * b[1];
    out[ 2 ] = a[2] * b[2];
    return out;
}

export function vec3_scale( out, a, s ){
    out[ 0 ] = a[0] * s;
    out[ 1 ] = a[1] * s;
    out[ 2 ] = a[2] * s;
    return out;
}

export function vec3_divScale( out, a, s ){
    out[ 0 ] = a[0] / s;
    out[ 1 ] = a[1] / s;
    out[ 2 ] = a[2] / s;
    return out;
}

export function vec3_distance( a, b ){
    return Math.sqrt(
        ( a[0] - b[0] )**2 +
        ( a[1] - b[1] )**2 +
        ( a[2] - b[2] )**2
    );
}

export function vec3_distance_sq( a, b ){
    return ( a[0] - b[0] )**2 + ( a[1] - b[1] )**2 + ( a[2] - b[2] )**2 ;
}


export function vec3_lerp( out, a, b, t ){
    const ti = 1-t;
    out[ 0 ] = a[ 0 ] * ti + b[ 0 ] * t;
    out[ 1 ] = a[ 1 ] * ti + b[ 1 ] * t;
    out[ 2 ] = a[ 2 ] * ti + b[ 2 ] * t;
    return out;
}

export function vec3_norm( out, v ){
    const len = Math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 );
    out[0] = v[0] / len;
    out[1] = v[1] / len;
    out[2] = v[2] / len;
    return v;
}

export function vec3_norm_scale( out, v, s ){
    const len = Math.sqrt( v[0]**2 + v[1]**2 + v[2]**2 );
    out[0] = ( v[0] / len ) * s;
    out[1] = ( v[1] / len ) * s;
    out[2] = ( v[2] / len ) * s;
    return out;
}

export function vec3_copy( out, a){
    out[ 0 ] = a[0];
    out[ 1 ] = a[1];
    out[ 2 ] = a[2];
    return out;
}

export function quat_axisAngle( out, axis, rad ){ 
    const half = rad * .5,
            s    = Math.sin( half );
    out[ 0 ] = axis[ 0 ] * s;
    out[ 1 ] = axis[ 1 ] * s;
    out[ 2 ] = axis[ 2 ] * s;
    out[ 3 ] = Math.cos( half );
    return out;
}

export function quat_transformVec3( out, q, v ){
    const   qx = q[0], qy = q[1], qz = q[2], qw = q[3],
            vx = v[0], vy = v[1], vz = v[2],
            x1 = qy * vz - qz * vy,
            y1 = qz * vx - qx * vz,
            z1 = qx * vy - qy * vx,
            x2 = qw * x1 + qy * z1 - qz * y1,
            y2 = qw * y1 + qz * x1 - qx * z1,
            z2 = qw * z1 + qx * y1 - qy * x1;
    out[ 0 ] = vx + 2 * x2;
    out[ 1 ] = vy + 2 * y2;
    out[ 2 ] = vz + 2 * z2;
    return out;
}
