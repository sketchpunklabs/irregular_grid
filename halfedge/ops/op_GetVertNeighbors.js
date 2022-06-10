/*
[[ TESTING ]]
const idx = 0;
Debug.pnt.add( grid.vertices[ idx ].pos, 0x00ffff, 4 );

const list = op_GetVertNeighbors( grid, idx );
let x = 0;
for( let i of list ){
    Debug.pnt.add( grid.vertices[ i ].pos, 0xff0000 + (x++) * 93337, 4 );
}

console.log( list );
*/

export default function op_GetVertNeighbors( top, vertIdx, rtnObj=false, loopSafey=10 ){
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Collect our starting objects
    const vert  = top.vertices[ vertIdx ];
    let heStart = top.halfEdges[ vert.halfEdge ];
    const edge  = top.edges[ heStart.edge ];

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Vertex does not start the the halfedge, but its ending
    // We need the halfedge thats started by the requested vertex
    // The next halfEdge should be the right one as long as the data isn't bad
    if( heStart.vertex !== vertIdx ){
        heStart = top.halfEdges[ heStart.faceNext ];
    }
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let he      = heStart;
    let vIdx    = he.getOppositeVertex( top, vertIdx );
    let rtn     = [ vIdx ];
    let i;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Reverse traversing by half edges
    for( i=0; i < loopSafey; i++ ){
        if( he.facePrev == heStart.twin ) break;
        he = top.halfEdges[ he.facePrev ];

        vIdx = he.getOppositeVertex( top, vertIdx );
        if( rtn.indexOf( vIdx ) === -1 ) rtn.push( vIdx );

        if( he.twin === -1 || he.twin === heStart.idx ) break;
        he = top.halfEdges[ he.twin ];
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Forward traversing by half edges
    he = heStart;
    for( let i=0; i < 10; i++ ){
        if( he.twin === -1 ) break;
        he = top.halfEdges[ he.twin ];
        he = top.halfEdges[ he.faceNext ];
        if( he.idx === heStart.idx ) break;

        vIdx = he.getOppositeVertex( top, vertIdx );
        if( rtn.indexOf( vIdx ) === -1 ) rtn.push( vIdx );
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( rtnObj ){
        for( let i=0; i < rtn.length; i++ ){
            rtn[ i ] = top.vertices[ rtn[ i ] ];
        }
    }

    return rtn;
}