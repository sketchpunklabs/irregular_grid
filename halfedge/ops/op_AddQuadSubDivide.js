import{ vec3_add, vec3_sub, vec3_divScale, vec3_lerp } 
                        from '../../lib/Maths.js';
import op_AddQuadFace   from './op_AddQuadFace.js';

export default function op_AddQuadSubDivide( top, a, b, c, d ){
    const ab = vec3_lerp( [0,0,0], a, b, 0.5 );
    const bc = vec3_lerp( [0,0,0], b, c, 0.5 );
    const cd = vec3_lerp( [0,0,0], c, d, 0.5 );
    const da = vec3_lerp( [0,0,0], d, a, 0.5 );
    const cp = vec3_add( [0,0,0], a, b );
    vec3_add( cp, cp, c );
    vec3_add( cp, cp, d );
    vec3_divScale( cp, cp, 4 );

    op_AddQuadFace( top, a, ab, cp, da );
    op_AddQuadFace( top, ab, b, bc, cp );
    op_AddQuadFace( top, bc, c, cd, cp );
    op_AddQuadFace( top, cd, d, da, cp );
}
