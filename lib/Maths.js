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
    if( b === undefined ) return  a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2;
    return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2;
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

export function vec3_min( out, a, b ){
    out[ 0 ] = Math.min( a[0], b[0] );
    out[ 1 ] = Math.min( a[1], b[1] );
    out[ 2 ] = Math.min( a[2], b[2] );
    return out;
}

export function vec3_max( out, a, b ){
    out[ 0 ] = Math.max( a[0], b[0] );
    out[ 1 ] = Math.max( a[1], b[1] );
    out[ 2 ] = Math.max( a[2], b[2] );
    return out;
}

export function vec3_abs( out, a){
    out[ 0 ] = Math.abs( a[0] );
    out[ 1 ] = Math.abs( a[1] );
    out[ 2 ] = Math.abs( a[2] );
    return out;
}

// export function vec3_sqrLen( a, b ){ 
//     if( b === undefined ) return  a[ 0 ]**2 + a[ 1 ]**2 + a[ 2 ]** 2;
//     return (a[ 0 ]-b[ 0 ]) ** 2 + (a[ 1 ]-b[ 1 ]) ** 2 + (a[ 2 ]-b[ 2 ]) ** 2;
// }

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


export function mat4_mul( out, a, b ){ 
    const   a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3],
            a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7],
            a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11],
            a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0     = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0      = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8]  = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9]  = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0      = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;	
}

export function mat4_invert( out, mat ){
    const a00 = mat[0],  a01 = mat[1],  a02 = mat[2],  a03 = mat[3],
            a10 = mat[4],  a11 = mat[5],  a12 = mat[6],  a13 = mat[7],
            a20 = mat[8],  a21 = mat[9],  a22 = mat[10], a23 = mat[11],
            a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15],

            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; // Calculate the determinant

    if( !det ) return out;
    det = 1.0 / det;

    out[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1]  = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3]  = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4]  = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6]  = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9]  = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

export function mat4_transformVec4(  out, m, v ){
    const x = v[0], y = v[1], z = v[2], w = v[3];
    out[0] = m[0] * x + m[4] * y + m[8]  * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9]  * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
}