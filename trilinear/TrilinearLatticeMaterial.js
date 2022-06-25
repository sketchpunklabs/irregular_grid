import * as THREE from '../thirdparty/three.module.min.js';

export default function TrilinearLatticeMaterial(){
    const mat = new THREE.MeshPhongMaterial( { color: 0x707070, wireframe: false, flatShading:true } );
    
    mat.userData.minBound = null;
    mat.userData.maxBound = null;
    mat.userData.cube     = null;
    mat.userData.quat     = [0,0,0,1];
    mat.userData.shader   = null;

    mat.onBeforeCompile   = (sh)=>{
        mat.userData.shader  = sh;
        sh.uniforms.minBound = { value: mat.userData.minBound };
        sh.uniforms.maxBound = { value: mat.userData.maxBound };
        sh.uniforms.cube     = { value: mat.userData.cube };
        sh.uniforms.quat     = { value: mat.userData.quat };

        sh.vertexShader      = `
            uniform vec3 cube[8]; uniform vec3 minBound; uniform vec3 maxBound; uniform vec4 quat; \n
            vec3 q_mul_vec( vec4 q, vec3 v ){ return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v ); } 
            ` + sh.vertexShader;
        sh.vertexShader      = sh.vertexShader.replace( '#include <begin_vertex>',
        `#include <begin_vertex>
        
        // https://en.wikipedia.org/wiki/Trilinear_interpolation
        vec3 pos = q_mul_vec( quat, position ); // Apply Tile Rotation before Lerping so the tile is in the correct orientation
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

    mat.userData.setQuat = ( q )=>{
        const o = ( mat.userData.shader )? 
            mat.userData.shader.uniforms.quat.value : 
            mat.userData.quat;

        o[ 0 ] = q[ 0 ];
        o[ 1 ] = q[ 1 ];
        o[ 2 ] = q[ 2 ];
        o[ 3 ] = q[ 3 ];
    }

    mat.userData.setCube = ( v )=>{
        if( mat.userData.shader ) mat.userData.shader.uniforms.cube.value = v;
        else                      mat.userData.cube = v;
    }

    return mat;
}