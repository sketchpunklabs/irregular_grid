import{ vec3_add, vec3_scale } from '../../lib/Maths.js';

export default function op_FaceCentroid( top, fIdx, out ){
    const f = top.faces[ fIdx ];
    out     = out || [0,0,0];

    for( let ihe of f.halfEdges ){
        vec3_add( out, out, top.vertices[ top.halfEdges[ ihe ].vertex ].pos );
    }

    vec3_scale( out, out, 1/f.halfEdges.length );
    return out;
}