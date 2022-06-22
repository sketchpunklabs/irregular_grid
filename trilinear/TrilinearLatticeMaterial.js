import * as THREE from '../thirdparty/three.module.min.js';

export default function TrilinearLatticeMaterial(){
    const mat = new THREE.MeshLambertMaterial( { color: 0x707070, wireframe: false } );
    
    mat.userData.minBound = null;
    mat.userData.maxBound = null;
    mat.userData.cube     = null;

    mat.onBeforeCompile   = (sh)=>{
        sh.uniforms.minBound = { value: mat.userData.minBound };
        sh.uniforms.maxBound = { value: mat.userData.maxBound };
        sh.uniforms.cube     = { value: mat.userData.cube };

        sh.vertexShader      = `uniform vec3 cube[8]; uniform vec3 minBound; uniform vec3 maxBound;\n` + sh.vertexShader;
        sh.vertexShader      = sh.vertexShader.replace( '#include <begin_vertex>',
        `#include <begin_vertex>
        
        // https://en.wikipedia.org/wiki/Trilinear_interpolation
        vec3 pos = position;
        float xd = ( pos.x - minBound.x ) / ( maxBound.x - minBound.x );
        float yd = ( pos.y - minBound.y ) / ( maxBound.y - minBound.y );
        float zd = ( pos.z - minBound.z ) / ( maxBound.z - minBound.z );
        
        vec3 c00 = cube[0] * ( 1.0 - xd ) + cube[1] * xd;   // Back Plane
        vec3 c01 = cube[2] * ( 1.0 - xd ) + cube[3] * xd;
        vec3 c10 = cube[4] * ( 1.0 - xd ) + cube[5] * xd;   // Forward Plane
        vec3 c11 = cube[6] * ( 1.0 - xd ) + cube[7] * xd;

        vec3 c0  = c00 * ( 1.0 - zd ) + c10 * zd;
        vec3 c1  = c01 * ( 1.0 - zd ) + c11 * zd;

        transformed = c0 * ( 1.0 - yd ) + c1 * yd;
        `);
    };

    return mat;
}