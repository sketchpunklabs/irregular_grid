import { Face, Triangle } from '../Structs.js';

export default function op_AddQuadFace( top, a, b, c, d ){
    // Create & Get Vertex Index
    const ai = top.addVertex( a );
    const bi = top.addVertex( b );
    const ci = top.addVertex( c );
    const di = top.addVertex( d );

    // Create Edges
    const ha0 = top.addEdge( ai, bi );
    const ha1 = top.addEdge( bi, ci );
    const ha2 = top.addEdge( ci, ai );

    const hb0 = top.addEdge( ci, di );
    const hb1 = top.addEdge( di, ai );
    const hb2 = top.addEdge( ai, ci ); // Half Edge Twin to ha2

    // Create Triangles
    const triA = top.addTriFromHalfEdges( [ ha0, ha1, ha2 ] );
    const triB = top.addTriFromHalfEdges( [ hb0, hb1, hb2 ] );

    // const triA = new Triangle( top.triangles.length );
    // triA.halfEdges.push( ha0.idx, ha1.idx, ha2.idx );
    // top.triangles.push( triA );

    // const triB = new Triangle( top.triangles.length );
    // triB.halfEdges.push( hb0.idx, hb1.idx, hb2.idx );
    // top.triangles.push( triB );

    // Create face 
    // const face = new Face( top.faces.length );
    // top.faces.push( face );
    // face.halfEdges.push( ha0.idx, ha1.idx, hb0.idx, hb1.idx );

    const face = top.addFaceFromHalfEdges( [ ha0, ha1, hb0, hb1 ] );

    // Link everything up
    triA.face = face.idx;
    triB.face = face.idx;

    // ha0.face = face.idx;
    // ha1.face = face.idx;
    ha2.face = face.idx;    // Cross Edges of the quad are part of the face
    hb2.face = face.idx;    // ... its just hidden in the triangles
    // ha0.tri  = triA.idx;
    // ha1.tri  = triA.idx;
    // ha2.tri  = triA.idx;

    // hb0.face = face.idx;
    // hb1.face = face.idx;
    
    // hb0.tri  = triB.idx;
    // hb1.tri  = triB.idx;
    // hb2.tri  = triB.idx;   
}