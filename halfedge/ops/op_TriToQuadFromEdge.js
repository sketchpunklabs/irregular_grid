import { Face } from '../Structs.js';

export default function op_TriToQuadFromEdge( top, eIdx ){
    // Edge must have 2 triangles that share it
    const crossEdge = top.edges[ eIdx ];
    const tris      = crossEdge.getTriangles( top );
    if( tris == null || tris.length != 2 ) return -1;

    // Both triangles must not be part of an existing face
    const aTri = top.triangles[ tris[ 0 ] ];
    const bTri = top.triangles[ tris[ 1 ] ];
    if( aTri.face !== -1 || bTri.face !== -1 ) return -1;

    // Find all the Half edges that will form a quad
    const aHE0 = aTri.findHalfEdge( top, crossEdge.idx );
    const aHE1 = top.halfEdges[ aTri.nextHalfEdge( aHE0.idx ) ];
    const aHE2 = top.halfEdges[ aTri.nextHalfEdge( aHE1.idx ) ];

    const bHE0 = bTri.findHalfEdge( top, crossEdge.idx );
    const bHE1 = top.halfEdges[ bTri.nextHalfEdge( bHE0.idx ) ];
    const bHE2 = top.halfEdges[ bTri.nextHalfEdge( bHE1.idx ) ];

    // Build face made up of half edges
    const face = top.addFaceFromHalfEdges( [ aHE1, aHE2, bHE1, bHE2 ] );

    // const face = new Face( top.faces.length );
    // top.faces.push( face );
    // face.halfEdges.push( aHE1.idx, aHE2.idx, bHE1.idx, bHE2.idx );
    
    // Mark triangles as being part of a face
    aTri.face = face.idx;
    bTri.face = face.idx;

    // Mark edges to being part of a face
    aHE0.face = face.idx; // Cross Edge is hidden
    // aHE1.face = face.idx;
    // aHE2.face = face.idx;
    
    bHE0.face = face.idx;
    // bHE1.face = face.idx;
    // bHE2.face = face.idx;

    return face.idx;
}