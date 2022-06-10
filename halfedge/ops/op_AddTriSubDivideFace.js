import{ vec3_add, vec3_sub, vec3_divScale, vec3_lerp } 
                        from '../../lib/Maths.js';
import op_AddQuadFace   from './op_AddQuadFace.js';

export default function op_AddTriSubDivideFace( top, a, b, c ){
    const ab = vec3_lerp( [0,0,0], a, b, 0.5 );
    const bc = vec3_lerp( [0,0,0], b, c, 0.5 );
    const ca = vec3_lerp( [0,0,0], c, a, 0.5 );
    const cp = vec3_add( [0,0,0], a, b );
    vec3_add( cp, cp, c );
    vec3_divScale( cp, cp, 3 );

    op_AddQuadFace( top, cp, ca, a, ab );
    op_AddQuadFace( top, cp, ab, b, bc );
    op_AddQuadFace( top, cp, bc, c, ca );
}