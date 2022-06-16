import {
    vec3_add, vec3_sub, vec3_copy, vec3_scale,
    vec3_abs, vec3_min, vec3_max, vec3_lerp, 
} from '../lib/Maths.js';


export class Node{
    idx         = -1;       // Node's Index in the binary tree array
    minBound    = [0,0,0];  // Min Point
    maxBound    = [0,0,0];  // Max Point
    sliceIndex  = -1;       // Starting index to the partitioned data
    sliceLength = 0;        // Length of the partitioned data
    isLeaf      = false;    // True if the node hasn't been subdivided
    constructor( idx ){ this.idx = idx; }
}


// parentIdx * 2 - 1       = leftChild
// (leftChild - 1) / * 0.5 = parentIdx
// https://jacco.ompf2.com/2022/04/13/how-to-build-a-bvh-part-1-basics/

export class Bvh{
    // #region MAIN
    maxItemsPerNode = 5;    // How many items allowed per node
    nodes           = [];   // Nodes stored in a binary tree
    data            = null; // Reference to data
    partitioned     = null; // Partitioned indices of the data
    getItemPosition = null; // ( data, idx ): vec3
    boxScale        = 1.3;  // Make the boundary larger then they are
    boundLmt        = 0.05; // Dont want flat boundaries, if found set a min axis size
    constructor(){}
    // #endregion

    // #region SETTERS
    setData( data ){
        this.data        = data;
        this.partitioned = new Array( data.length );
        for( let i=0; i < data.length; i++ ) this.partitioned[ i ] = i;

        const n = new Node( 0 );
        n.sliceIndex = 0;
        n.sliceLength  = data.length;

        this.nodes.push( n );

        this.updateNodeBounds( 0, false );
        this.subDivide( 0 );
        this.refit();
    }
    // #endregion

    // #region SUB DIVIDING BOUNDARY
    // Split up the boundary one node at a time till no 
    // nodes have more then the max allows item count
    subDivide( nIdx ){
        const stack   = [ nIdx ];
        const boxSize = [0,0,0];
        const par     = this.partitioned;

        let axis;
        let pos;
        let splitAt;
        let tmp;
        let n;

        while( stack.length > 0 ){
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            n = this.nodes[ stack.pop() ];
            if( n.sliceLength <= this.maxItemsPerNode ) continue;

            axis = this.evaluateSplitAxis( n.idx );            

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Do a quick sort, check every item and if its less
            // then the split plane, keep it on the left side and
            // increment forward. If its over, swap places with the
            // end of the slice and decrement the end of the slice.
            // The idea is to have the slice split based on the axis.
            // as this will create sub slices for splitting the
            // node into two bounding boxes.
            vec3_sub( boxSize, n.maxBound, n.minBound );
            splitAt = n.minBound[ axis ] + boxSize[ axis ] * 0.5;
            let i   = n.sliceIndex;
            let j   = i + n.sliceLength - 1;

            while( i <= j ){
                pos = this.getItemPosition( this.data, par[ i ] );
                if( pos[ axis ] < splitAt ){
                    i++;  // Move left side to the right
                }else{
                    tmp      = par[ j ];
                    par[ j ] = par[ i ];
                    par[ i ] = tmp;
                    j--;  // Move right side to the left
                }
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Exit early if either side is empty, can not do a split here.
            const cntLeft = i - n.sliceIndex;
            if( cntLeft == 0 || cntLeft == n.sliceLength ) return;
            
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            this.makeNodesAvailable( n.idx );

            const nLeft        = this.nodes[ n.idx * 2 + 1 ];
            nLeft.sliceIndex   = n.sliceIndex;
            nLeft.sliceLength  = cntLeft;
            this.updateNodeBounds( nLeft.idx, false );

            if( nLeft.sliceLength > this.maxItemsPerNode ) stack.push( nLeft.idx )
            else                                           nLeft.isLeaf = true;
        
            const nRight       = this.nodes[ n.idx * 2 + 2 ];
            nRight.sliceIndex  = i;
            nRight.sliceLength = n.sliceLength - cntLeft;
            this.updateNodeBounds( nRight.idx, false );

            if( nRight.sliceLength > this.maxItemsPerNode ) stack.push( nRight.idx )
            else                                            nRight.isLeaf = true;

            //console.log( boxSize, 'axis', axis, i, j );
        }
    }

    // Figure out which axis is best to try to split the data 
    // items as evenly as possible
    evaluateSplitAxis( nIdx ){
        const n         = this.nodes[ nIdx ];
        const iEnd      = n.sliceIndex + n.sliceLength;
        const centroid  = vec3_lerp( [0,0,0], n.minBound, n.maxBound, 0.5 );
        const cntLeft  = [0,0,0];
        const cntRight = [0,0,0];

        let pos;
        for( let i=n.sliceIndex; i < iEnd; i++ ){
            pos = this.getItemPosition( this.data, this.partitioned[i] );

            if( pos[0] < centroid[0] ) cntLeft[0]++;
            else                       cntRight[0]++;

            if( pos[1] < centroid[1] ) cntLeft[1]++;
            else                       cntRight[1]++;

            if( pos[2] < centroid[2] ) cntLeft[2]++;
            else                       cntRight[2]++;
        }

        const cnts = vec3_sub( [0,0,0], cntLeft, cntRight );
        vec3_abs( cnts, cnts );
        
        let axis = 0;
        if( cnts[1] < cnts[0] )    axis = 1;
        if( cnts[2] < cnts[axis] ) axis = 2;

        return axis;
    }
    // #endregion

    // #region BOUNDARY
    // Resize the boundary of each node from the leaf to the root.
    // Will use box scaling to increase the size of the volumes
    refit(){
        let n, aChild, bChild;
        for( let i=this.nodes.length-1; i >= 0; i-- ){
            n = this.nodes[ i ];
            if( n.sliceIndex == -1 ) continue; // Node has no sliced data & is not used

            if( n.isLeaf ){
                this.updateNodeBounds( n.idx, true );
            }else{
                aChild = this.nodes[ n.idx * 2 + 1 ];
                bChild = this.nodes[ n.idx * 2 + 2 ];
                vec3_min( n.minBound, aChild.minBound, bChild.minBound );
                vec3_max( n.maxBound, aChild.maxBound, bChild.maxBound );
            }
        }
    }

    // Compute the min/bmax bound for a node
    updateNodeBounds( nIdx, useScale=true ){
        const n = this.nodes[ nIdx ];
        vec3_copy( n.minBound, [ Infinity,  Infinity,  Infinity] );
        vec3_copy( n.maxBound, [-Infinity, -Infinity, -Infinity] );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Compute the bounds of all the data
        let pos;
        const iEnd = n.sliceIndex + n.sliceLength;
        
        for( let i=n.sliceIndex; i < iEnd; i++ ){
            pos = this.getItemPosition( this.data, this.partitioned[ i ] );
            vec3_min( n.minBound, n.minBound, pos );
            vec3_max( n.maxBound, n.maxBound, pos );
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Check if any boundary is flat like a plane, resize it a bit
        // so its an actual box
        let diff = vec3_sub( [0,0,0], n.maxBound, n.minBound );
        if( diff[ 0 ] == 0 ){
            n.minBound[ 0 ] -= this.boundLmt;
            n.maxBound[ 0 ] += this.boundLmt;
        }

        if( diff[ 1 ] == 0 ){
            n.minBound[ 1 ] -= this.boundLmt;
            n.maxBound[ 1 ] += this.boundLmt;
        }

        if( diff[ 2 ] == 0 ){
            n.minBound[ 2 ] -= this.boundLmt;
            n.maxBound[ 2 ] += this.boundLmt;
        }
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Scale boundary if scale isn't 1
        if( useScale && this.boxScale !== 1 ){
            const center = vec3_lerp( [0,0,0], n.minBound, n.maxBound, 0.5 );
            let p        = [0,0,0];

            vec3_sub( p, n.minBound, center );
            vec3_scale( p, p, this.boxScale );
            vec3_add( n.minBound, p, center );

            vec3_sub( p, n.maxBound, center );
            vec3_scale( p, p, this.boxScale );
            vec3_add( n.maxBound, p, center );
        }

        
    }
    // #endregion

    // #region RAY INTERSECTION
    rayIntersect( ray, onIntersect ){
        let n = this.nodes[ 0 ];
        if( this.intersectAABB( ray, n.minBound, n.maxBound ) == Infinity ){
            return false;
        }

        const stack = [ n ];
        let aChild, bChild;
        let aDist, bDist;
        let slice;

        while( stack.length > 0 ){
            n = stack.pop();

            if( n.isLeaf ){
                slice = this.getSlice( n.sliceIndex, n.sliceLength );
                if( onIntersect( ray, slice ) ) return true;
                continue;
            }

            aChild  = this.nodes[ n.idx * 2 + 1 ];  // Left Child
            bChild  = this.nodes[ n.idx * 2 + 2 ];  // Right Child
            aDist   = this.intersectAABB( ray, aChild.minBound, aChild.maxBound );
            bDist   = this.intersectAABB( ray, bChild.minBound, bChild.maxBound );

            // Make sure A is the one with the sortest distance to the ray
            if( aDist > bDist ){
                [ aChild, bChild ] = [ bChild, aChild ];
                [ aDist, bDist ]   = [ bDist, aDist ];
            }

            if( bDist !== Infinity ) stack.push( bChild );  // Furthest goes on the stack
            if( aDist !== Infinity ) stack.push( aChild );  // Closest to ray goes to the top of the stack for next loop
        }

        return false;
    }

    intersectAABB( ray, bmin, bmax ){
        // https://tavianator.com/2011/ray_box.html
        // Modified to use invDirection to remove any divisions
        const tx1  = ( bmin[0] - ray.posStart[0] ) * ray.invDirection[0];
        const tx2  = ( bmax[0] - ray.posStart[0] ) * ray.invDirection[0];
        let   tmin = Math.min( tx1, tx2 );
        let   tmax = Math.max( tx1, tx2 );
        
        const ty1  = ( bmin[1] - ray.posStart[1] ) * ray.invDirection[1];
        const ty2  = ( bmax[1] - ray.posStart[1] ) * ray.invDirection[1];
        
        tmin       = Math.max( tmin, Math.min( ty1, ty2 ) ), 
        tmax       = Math.min( tmax, Math.max( ty1, ty2 ) );
        
        const tz1  = ( bmin[2] - ray.posStart[2] ) * ray.invDirection[2];
        const tz2  = ( bmax[2] - ray.posStart[2] ) * ray.invDirection[2];

        tmin       = Math.max( tmin, Math.min( tz1, tz2 ) ), 
        tmax       = Math.min( tmax, Math.max( tz1, tz2 ) );
        
        return (tmax >= tmin && tmax > 0)? tmin : Infinity;
    }
    // #endregion

    // #region MISC
    // Get an array of data indices from the section of the partitioned data indices
    getSlice( idx, len ){
        const ary  = new Array( len );
        const iEnd = idx + len;
        let j=0;
        for( let i=idx; i < iEnd; i++ ){
            ary[ j++ ] = this.partitioned[ i ];
        }
        return ary;
    }

    // Add new nodes to binary tree in relation to a parent index
    makeNodesAvailable( nIdx ){
        const idxRight = nIdx * 2 + 2;
        if( this.nodes.length < idxRight ){
            for( let i=this.nodes.length; i <= idxRight; i++ ){
                this.nodes.push( new Node( i ) );
            }
        }
    }
    // #endregion
}