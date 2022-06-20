import MarchingCubes from './MarchingCubes.js';

// #region STRUCTS
class Point{
    pos      = [0,0,0];
    enabled  = false;
    userData = null;
    constructor( x,y,z ){
        this.pos[ 0 ] = x;
        this.pos[ 1 ] = y;
        this.pos[ 2 ] = z;
    }
}

class Cell{
    idx      = -1;
    enabled  = true;
    userData = null;
    corners  = null;
    coord    = [-1,-1,-1];
    constructor( idx, corners ){
        this.idx     = idx;
        this.corners = corners;
    }

    setCoord( x, y, z ){
        this.coord[ 0 ] = x;
        this.coord[ 1 ] = y;
        this.coord[ 2 ] = z;
        return this;
    }

    getMidPos( pos ){
        const min = this.corners[ 0 ].pos;
        const max = this.corners[ 6 ].pos;
        pos[ 0 ]  = min[ 0 ] * 0.5 + max[ 0 ] * 0.5;
        pos[ 1 ]  = min[ 1 ] * 0.5 + max[ 1 ] * 0.5;
        pos[ 2 ]  = min[ 2 ] * 0.5 + max[ 2 ] * 0.5;
        return pos;
    }

    getBitValue(){
        let i   = 0;
        let rtn = 0;
        for( let p of this.corners ){
            if( p.enabled ) rtn += MarchingCubes.cornerBit[ i ];
            i++;
        }
        return rtn;
    }
}
// #endregion

export default class MarchingCubesGrid{
    // #region MAIN
    cellSize = 0;           // Size of Voxel
    cells    = null;        // Array of voxel cells
    points   = null;        // Array of points that make up voxel cells
    gridSize = [0,0,0];     // How many cells to have at each axis
    offset   = [0,0,0];     // How much to offset the point positions
    minBound = null;        // Grid Bounding Box
    maxBound = null;
    
    constructor( gridSize=[2,2,2], cellSize=1, useCenter=false ){
        this.cellSize      = cellSize;
        this.gridSize[ 0 ] = gridSize[ 0 ];
        this.gridSize[ 1 ] = gridSize[ 1 ];
        this.gridSize[ 2 ] = gridSize[ 2 ];

        if( useCenter ){
            this.offset[ 0 ] = gridSize[ 0 ] * cellSize * -0.5;
            //this.offset[ 1 ] = gridSize[ 1 ] * cellSize * -0.5;
            this.offset[ 2 ] = gridSize[ 2 ] * cellSize * -0.5;
        }
        
        this._genGrid();
    }

    _genGrid(){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Generate Points
        const xCnt  = this.gridSize[ 0 ] + 1;
        const yCnt  = this.gridSize[ 1 ] + 1;
        const zCnt  = this.gridSize[ 2 ] + 1;
        let i = 0;
        let x, y, z;
        let xx, yy, zz;

        this.points = new Array( xCnt * yCnt * zCnt );
        for( y=0; y < yCnt; y++ ){
            yy = y * this.cellSize + this.offset[ 1 ];
            for( z=0; z < zCnt; z++ ){
                zz = z * this.cellSize + this.offset[ 2 ];
                for( x=0; x < zCnt; x++ ){
                    xx = x * this.cellSize + this.offset[ 0 ];
                    this.points[ i++ ] = new Point( xx, yy, zz );
                }
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Generate Cells
        let p0, p1, p2, p3;
        const xzCnt = xCnt * zCnt;
        this.cells  = new Array( this.gridSize[ 0 ] * this.gridSize[ 1 ] * this.gridSize[ 2 ] );

        i=0;
        for( y=0; y < this.gridSize[ 1 ]; y++ ){
            for( z=0; z < this.gridSize[ 2 ]; z++ ){
                for( x=0; x < this.gridSize[ 0 ]; x++ ){
                    // ------------------------------
                    // Compute bottom 4 points, Top left Corner, then work Clock Wise around the square.
                    p0 = x + z * xCnt + y * xzCnt;  // Top Left
                    p1 = p0 + 1;                    // Top Right
                    p3 = p0 + xCnt;                 // Bottom Left
                    p2 = p3 + 1;                    // Bottom Right

                    //------------------------------
                    // Create cell with its 8 corner points, bottom to top
                    this.cells[ i ] = new Cell( i, [
                        this.points[ p0 ],          // Bottom Face
                        this.points[ p1 ],
                        this.points[ p2 ],
                        this.points[ p3 ],
                        this.points[ p0 + xzCnt ],  // Top Face
                        this.points[ p1 + xzCnt ],
                        this.points[ p2 + xzCnt ],
                        this.points[ p3 + xzCnt ],
                    ]).setCoord( x, y, z );                    
                    i++;
                }
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // First & Last points are the bounds of the cube
        this.minBound = this.points[ 0 ];
        this.maxBound = this.points[ this.points.length - 1 ];
    }
    // #endregion

    // #region SETTERS
    setPointByIdx( idx, state ){
        this.points[ idx ].enabled = state;
        return this;
    }

    togglePointByIdx( idx ){
        this.points[ idx ].enabled = !this.points[ idx ].enabled;
        return this;
    }
    // #endregion
}