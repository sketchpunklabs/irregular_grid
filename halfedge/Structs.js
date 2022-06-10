export class Vertex{
    constructor( x, y, z, idx=null ){
        this.idx        = ( idx != null )? idx : -1;
        this.halfEdge   = -1;
        this.pos        = [ x, y, z ];
        this.userData   = null;
    }
}

export class Edge{
    constructor( a, b, idx=null, he=null ){
        this.idx      = ( idx != null )? idx : -1;
        this.halfEdge = ( he != null )?  he  : -1;
        this.aIdx     = a;
        this.bIdx     = b;
    }

    getTriangles( top ){
        // No half edge
        if( this.halfEdge === -1 ) return null;
        
        // No triangle
        const a = top.halfEdges[ this.halfEdge ];
        if( a.tri === -1 )  return null;
        
        // If twin exists, check if there is a second triangle
        if( a.twin !== -1 ){
            const b = top.halfEdges[ a.twin ];
            if( b.tri !== -1 ) return [ a.tri, b.tri ];
        }

        // Only one triangle
        return [ a.tri ];
    }
}

export class HalfEdge{
    constructor( idx=null, twin=null ){
        this.idx        = ( idx != null )?  idx  : -1;
        this.twin       = ( twin != null )? twin : -1;   // It's reverse side

        this.vertex     = -1; // Vertex that starts the half edge
        this.edge       = -1; // Edge it belongs too
        this.tri        = -1; // Triangle it belongs to
        this.face       = -1; // Face it belongs too

        this.triPrev    = -1;
        this.triNext    = -1;
        this.facePrev   = -1;
        this.faceNext   = -1; 
    }

    getOppositeVertex( top, vIdx ){
        const edg = top.edges[ this.edge ];
        return ( edg.aIdx !== vIdx )? edg.aIdx : edg.bIdx;
    }
}

export class Triangle{
    constructor( idx=null ){
        this.idx       = ( idx != null )? idx : -1;
        this.halfEdges = [];
        this.face      = -1;
    }

    findHalfEdge( top, edgeId ){
        let he;
        for( let i of this.halfEdges ){
            he = top.halfEdges[ i ];
            if( he.edge == edgeId ) return he;
        }
        return null;
    }

    nextHalfEdge( hIdx ){
        const i = this.halfEdges.indexOf( hIdx );
        return this.halfEdges[ (i+1) % 3 ];
    }
}

export class Face{
    constructor( idx=null ){
        this.idx       = ( idx != null) ? idx : -1;
        this.halfEdges = [];
    }

    getVertices( top, out=null ){
        out = out || new Array( this.halfEdges.length );
        for( let i=0; i < this.halfEdges.length; i++ ){
            out[ i ] = top.vertices[ top.halfEdges[ this.halfEdges[ i ] ].vertex ];
        }
        return out;
    }
}
