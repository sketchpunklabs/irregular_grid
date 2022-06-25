export default function op_FaceVertices( top, fIdx ){
    const f   = top.faces[ fIdx ];
    const rtn = [];

    for( let ihe of f.halfEdges ){
        rtn.push( top.vertices[ top.halfEdges[ ihe ].vertex ] );
    }

    return rtn;
}