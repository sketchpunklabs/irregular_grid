import MarchingCubes from './MarchingCubes.js';

export default class MarchingCubesMesher{
    // #region MAIN
    mapVerts = new Map();
    vertices = [];
    indices  = [];
    vertCnt  = 0;
    constructor(){}
    dispose(){
        this.mapVerts.clear();
        this.vertices.length = 0;
        this.indices.length  = 0;
    }
    // #endregion

    // #region METHODS
    addVert( pos ){
        const x = Math.floor( pos[ 0 ] * 100000 );
        const y = Math.floor( pos[ 1 ] * 100000 );
        const z = Math.floor( pos[ 2 ] * 100000 );
        const k = x + '_' + y + '_' + z;

        if( this.mapVerts.has( k ) ) return this.mapVerts.get( k );
        
        const idx = this.vertCnt++;
        this.vertices.push( ...pos );
        this.mapVerts.set( k, idx );
        return idx;
    }

    build( mc ){
        let bits, verts;
        let i, ai, bi, ci;
        for( let cell of mc.cells ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // With all corners on or off, that denotes an empty
            // space voxel. We can skip this as there is no triangles to generate.
            bits = cell.getBitValue();
            if( bits === 0 || bits === 255 ) continue;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Get all the vertices to create for this cell
            verts = MarchingCubes.buildCell( bits, cell.corners );
            if( verts === null ) continue;
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Loop every 3 verts which will result in a triangle
            for( i=0; i < verts.length; i+=3 ){
                ai = this.addVert( verts[ i+0 ] );
                bi = this.addVert( verts[ i+1 ] );
                ci = this.addVert( verts[ i+2 ] );
                this.indices.push( ai, bi, ci );
            }
        }
    }
    // #endregion
}
