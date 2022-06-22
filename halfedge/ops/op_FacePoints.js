export default function op_FacePoints( top, fIdx ){
    const f   = top.faces[ fIdx ];
    const rtn = [];

    for( let ihe of f.halfEdges ){
        rtn.push( top.vertices[ top.halfEdges[ ihe ].vertex ].pos );
    }

    return rtn;
}