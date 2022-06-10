import { Face } from '../Structs.js';

export default function op_TriToFace( top, tIdx ){
    const tri = top.triangles[ tIdx ];
    if( tri.face !== -1 ) return -1;
    
    // Create face
    const face = new Face( top.faces.length );
    top.faces.push( face );
    
    // Mark triangle as a face
    tri.face = face.idx;
    
    // Copy Half edges over & mark them part of a face
    let he;
    for( let i of tri.halfEdges ){
        he      = top.halfEdges[ i ];
        he.face = face.idx;
        face.halfEdges.push( i );

        he.facePrev = he.triPrev;
        he.faceNext = he.triNext;
    }

    return face.idx;
}