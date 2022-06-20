import { quat_axisAngle, quat_mul } from '../lib/Maths.js';


class Tile{
    constructor( name, bits, geo, id=-1 ){
        this.id       = id;
        this.name     = name;
        this.geo      = geo;
        this.bits     = bits;
        this.bitValue = TileDictionary.computeBitValue( bits );
        this.subTiles = [];
    }

    genSubTile( hRot=0, vRot=0 ){
        const st = new SubTile( this.id );
        let bits = ( vRot )? TileDictionary.bitRotateFlip( this.bits ) : this.bits;

        switch( hRot ){
            case 0:
                 st.setBits( bits );
                 st.rotation = ( vRot )? TileDictionary.urot : TileDictionary.rot;
                 break;
            case 1:
                st.setBits( TileDictionary.bitRotateRight( bits, 1 ) );
                st.rotation = ( vRot )? TileDictionary.urot90 : TileDictionary.rot90;
                break;
            case 2:
                st.setBits( TileDictionary.bitRotateRight( bits, 2 ) );
                st.rotation = ( vRot )? TileDictionary.urot180 : TileDictionary.rot180;
                break;
            case 3:
                st.setBits( TileDictionary.bitRotateRight( bits, 3 ) );
                st.rotation = ( vRot )? TileDictionary.urot270 : TileDictionary.rot270;
                break;                
        }

        this.subTiles.push( st );
        return st;
    }
}

class SubTile{
    constructor( tId  ){
        this.tileId   = tId;
        this.rotation = TileDictionary.rot;
        this.bits     = null;
        this.bitValue = 0
    }

    setBits( bits ){
        this.bits     = bits;
        this.bitValue = TileDictionary.computeBitValue( bits );
    }
}

export default class TileDictionary{
    // #region MAIN
    tiles       = new Array( 255 ).fill( null );
    uniqueTiles = new Array();
    constructor(){}
    // #endregion

    // #region METHODS
    addUniqueTile( name, bits, geo ){
        const t = new Tile( name, bits, geo, this.uniqueTiles.length );
        this.uniqueTiles.push( t );

        const onlyFlip     = TileDictionary.isOnlyFlip( t.bitValue );
        const noFlip       = TileDictionary.isNoFlip( t.bitValue );
        const isOnlyRot180 = TileDictionary.isOnlyRot180( t.bitValue );
        const isOnlyRot90  = TileDictionary.isOnlyRot90( t.bitValue );

        this.addTile( t.genSubTile( 0 ) );
                
        if( onlyFlip ){
            this.addTile( t.genSubTile( 0, 1 ) );   // Flip to top only
        }else{
            if( isOnlyRot90 ){
                this.addTile( t.genSubTile( 1 ) ); 
            }else{
                this.addTile( t.genSubTile( 2 ) );      
                if( !isOnlyRot180 ){
                    this.addTile( t.genSubTile( 1 ) ); 
                    this.addTile( t.genSubTile( 3 ) );
                }
            }

            if( !noFlip ){
                this.addTile( t.genSubTile( 0, 1 ) );
                this.addTile( t.genSubTile( 3, 1 ) );
                
                if( !isOnlyRot180 && !isOnlyRot90 ){
                    this.addTile( t.genSubTile( 1, 1 ) );
                    this.addTile( t.genSubTile( 2, 1 ) );
                }
            }
        }

        return this;
    }

    addTile( t ){
        let ary = this.tiles[ t.bitValue ];
        if( !ary ) this.tiles[ t.bitValue ] = ary = new Array();

        ary.push( t );
        return this;
    }
    // #endregion

    // #region BITS FUNCTIONS
    static cornerOffsets = [
        [-1, -1, -1],
        [ 1, -1, -1],
        [ 1, -1,  1],
        [-1, -1,  1],
        [-1,  1, -1],
        [ 1,  1, -1],
        [ 1,  1,  1],
        [-1,  1,  1],
    ];

    static rot     = [0,0,0,1];
    static rot90   = quat_axisAngle( [0,0,0,1], [0,1,0], -Math.PI * 0.5 );
    static rot180  = quat_axisAngle( [0,0,0,1], [0,1,0], Math.PI );
    static rot270  = quat_axisAngle( [0,0,0,1], [0,1,0], -Math.PI * 1.5 );

    static urot    = quat_axisAngle( [0,0,0,1], [1,0,0], Math.PI );
    static urot90  = quat_mul( [0,0,0,0], this.rot90,  this.urot );
    static urot180 = quat_mul( [0,0,0,0], this.rot180, this.urot ) ;
    static urot270 = quat_mul( [0,0,0,0], this.rot270, this.urot );

    static cornerBits = [ 1, 2, 4, 8, 16, 32, 64, 128 ];
    static computeBitValue( bits ){
        let rtn = 0;
        for( let i=0; i < 8; i++ ){
            if( bits[ i ] === 1 ) rtn += this.cornerBits[ i ];
        }
        return rtn;
    }

    static bitRotateRight( bits, steps ){
        const rtn = new Array( 8 );
        let ii;
        for( let i=0; i < 4; i++ ){
            ii            = ( i + steps ) % 4; // Loop Around
            rtn[ ii ]     = bits[ i ];         // Bottom
            rtn[ ii + 4 ] = bits[ i + 4 ];     // Top
        }
        return rtn;
    }

    static bitRotateFlip( bits ){
        return [
            bits[ 7 ],
            bits[ 6 ],
            bits[ 5 ],
            bits[ 4 ],
            bits[ 3 ],
            bits[ 2 ],
            bits[ 1 ],
            bits[ 0 ],
        ];
    }

    static onlyFlipBits   = [ 15, 240 ];
    static noFlipBits     = [ 17, 34, 51, 68, 102, 119, 136, 153, 187, 204, 221, 238 ];
    static onlyRot180Bits = [ 95, 175 ];
    static onlyRot90Bits  = [ 5, 10, 80, 160 ];
    static isOnlyFlip( bitVal ){ return ( this.onlyFlipBits.indexOf( bitVal ) !== -1 ) }
    static isNoFlip( bitVal ){ return ( this.noFlipBits.indexOf( bitVal ) !== -1 ); }
    static isOnlyRot180( bitVal ){ return ( this.onlyRot180Bits.indexOf( bitVal ) !== -1 ); }
    static isOnlyRot90( bitVal ){ return ( this.onlyRot90Bits.indexOf( bitVal ) !== -1 ); }

    static regBits   = /([01]{4})\-([01]{4})/;
    static parseBits( str ){
        const results = this.regBits.exec( str );
        if( !results ) return null;
        return [
            parseInt( results[1][0] ),
            parseInt( results[1][1] ),
            parseInt( results[1][2] ),
            parseInt( results[1][3] ),
            parseInt( results[2][0] ),
            parseInt( results[2][1] ),
            parseInt( results[2][2] ),
            parseInt( results[2][3] ),
        ];
    }
    // #endregion
}
