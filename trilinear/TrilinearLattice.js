import { vec3_copy, vec3_buf_set } from '../lib/Maths.js';

export default class TrilinearLattice{
    // #region MAIN
    // Back      Front
    // 2 -- 3    6 -- 7 
    // |    |    |    |
    // 0 -- 1    4 -- 5
    minBound = [0,0,0];
    maxBound = [0,0,0];
    cube     = [
        0,0,0,  0,0,0,  0,0,0,  0,0,0, // Back Face
        0,0,0,  0,0,0,  0,0,0,  0,0,0, // Front Face
    ];

    constructor( min=null, max=null ){
        if( min && max ) this.setBounds( min, max );
    }
    // #endregion

    // #region SETTERS
    setBounds( min, max ){
        vec3_copy( this.minBound, min );
        vec3_copy( this.maxBound, max );
        this._updateCubeFromBound();
        return this;
    }

    addOffset( idx, offset ){
        const i = idx * 3;
        this.cube[ i+0 ] += offset[ 0 ];
        this.cube[ i+1 ] += offset[ 1 ];
        this.cube[ i+2 ] += offset[ 2 ];
        return this;
    }

    setPos( idx, pos ){
        const i = idx * 3;
        this.cube[ i+0 ] = pos[ 0 ];
        this.cube[ i+1 ] = pos[ 1 ];
        this.cube[ i+2 ] = pos[ 2 ];
        return this;
    }

    setFootPrint( a, b, c, d, yOffset=0 ){
        const cc = this.cube;
        // Bottom Plane - Clockwise from top left corner
        vec3_buf_set( cc, 0*3, a[0], a[1], a[2] ); 
        vec3_buf_set( cc, 1*3, b[0], b[1], b[2] );
        vec3_buf_set( cc, 5*3, c[0], c[1], c[2] );
        vec3_buf_set( cc, 4*3, d[0], d[1], d[2] ); 

        // Top Plane - Clockwise from top left corner
        vec3_buf_set( cc, 2*3, a[0], a[1]+yOffset, a[2] );
        vec3_buf_set( cc, 3*3, b[0], b[1]+yOffset, b[2] );
        vec3_buf_set( cc, 7*3, c[0], c[1]+yOffset, c[2] );
        vec3_buf_set( cc, 6*3, d[0], d[1]+yOffset, d[2] );
    }

    fromMarchingCube( mc ){
        const cc = this.cube;
        // Bottom Plane - Clockwise from top left corner
        vec3_buf_set( cc, 0*3, mc[0][0], mc[0][1], mc[0][2] ); 
        vec3_buf_set( cc, 1*3, mc[1][0], mc[1][1], mc[1][2] );
        vec3_buf_set( cc, 5*3, mc[2][0], mc[2][1], mc[2][2] );
        vec3_buf_set( cc, 4*3, mc[3][0], mc[3][1], mc[3][2] ); 

        // Top Plane - Clockwise from top left corner
        vec3_buf_set( cc, 2*3, mc[4][0], mc[4][1], mc[4][2] );
        vec3_buf_set( cc, 3*3, mc[5][0], mc[5][1], mc[5][2] );
        vec3_buf_set( cc, 7*3, mc[6][0], mc[6][1], mc[6][2] );
        vec3_buf_set( cc, 6*3, mc[7][0], mc[7][1], mc[7][2] );
    }
    // #endregion

    // #region CUBE
    _updateCubeFromBound(){
        const [ x0, y0, z0 ] = this.minBound;
        const [ x1, y1, z1 ] = this.maxBound;
        const c              = this.cube;
        vec3_buf_set( c, 0*3, x0, y0, z0 ); // Back Plane
        vec3_buf_set( c, 1*3, x1, y0, z0 );
        vec3_buf_set( c, 2*3, x0, y1, z0 );
        vec3_buf_set( c, 3*3, x1, y1, z0 );
        vec3_buf_set( c, 4*3, x0, y0, z1 ); // Front Plane
        vec3_buf_set( c, 5*3, x1, y0, z1 );
        vec3_buf_set( c, 6*3, x0, y1, z1 );
        vec3_buf_set( c, 7*3, x1, y1, z1 );
    }
    // #endregion

    // #region ITERATORS
    iterPoints(){
        let   i      = 0;
        const result = { value:[0,0,0], done:false };
        const next   = ()=>{
            if( i >= this.cube.length ) result.done = true;
            else{
                result.value[ 0 ] = this.cube[ i+0 ];
                result.value[ 1 ] = this.cube[ i+1 ];
                result.value[ 2 ] = this.cube[ i+2 ];
            }
            i += 3;
            return result;
        };

        return { [Symbol.iterator](){ return { next }; } };
    }
    // #endregion
}
