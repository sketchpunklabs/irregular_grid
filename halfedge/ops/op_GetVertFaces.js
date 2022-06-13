export default function op_GetVertFaces( top, vertIdx, rtnObj=false, loopSafey=10 ){
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
    // Reverse traversing by half edges
    const facePrevTwin = ( he )=>{
        const prev = top.halfEdges[ he.facePrev ];
        return( prev.twin !== -1 )? top.halfEdges[ prev.twin ] : null;
    };
    
    let he      = heStart;
    let rtn     = [];
    let i;
    let revComplete = true;
    for( i=0; i < loopSafey; i++ ){
        if( rtn.indexOf( he.face ) === -1 ) rtn.push( he.face );

        he = facePrevTwin( he );
        if( he == null ){ revComplete = false; break; }
        if( he.idx == heStart.idx ) break;
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Forward traversing by half edges
    if( !revComplete ){
        const faceTwinNext = ( he )=>{
            if( he.twin == -1 ) return null;
            const twin = top.halfEdges[ he.twin ];
            return top.halfEdges[ twin.faceNext ];
        };

        he = heStart;
        for( i=0; i < 10; i++ ){
            if( rtn.indexOf( he.face ) === -1 ) rtn.push( he.face );

            he = faceTwinNext( he );
            if( he == null || he.idx == heStart.idx ) break;
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if( rtnObj ){
        for( let i=0; i < rtn.length; i++ ){
            rtn[ i ] = top.faces[ rtn[ i ] ];
        }
    }

    return rtn;
}