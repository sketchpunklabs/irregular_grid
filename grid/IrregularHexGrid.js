import icohedron                from './icohedron.js';

import { Topology }             from '../halfedge/index.js';
import op_AddSubdividedTri      from '../halfedge/ops/op_AddSubdividedTri.js';
import op_TriToQuadFromEdge     from '../halfedge/ops/op_TriToQuadFromEdge.js';
import op_TriToFace             from '../halfedge/ops/op_TriToFace.js';
import op_AddQuadFace           from '../halfedge/ops/op_AddQuadFace.js';
import op_AddQuadSubDivide      from '../halfedge/ops/op_AddQuadSubDivide.js';
import op_AddTriSubDivideFace   from '../halfedge/ops/op_AddTriSubDivideFace.js';
import op_GetVertNeighbors      from '../halfedge/ops/op_GetVertNeighbors.js';

import { rndLcg, vec3_reset, vec3_lerp, vec3_copy,
        vec3_scale, vec3_norm_scale, vec3_divScale, vec3_distance,
        vec3_add, vec3_sub, vec3_mul, vec3_norm,
        vec3_yp, vec3_yn, vec3_distance_sq,
}                               from '../lib/Maths.js'

const vec3_yrot = vec3_yp; // vec3_yn

export default class IrregularHexGrid{
    static build( radius=3, div=3, iter=50, relaxScl=0.1, seed=100, relax=0 ){
        const shape     = new Topology();               // Half Edge data structure for building the mesh
        this._buildPoints( shape, radius, div );
        this._buildTriangles( shape, radius, div );
        this._randomQuadMerge( shape, seed );           // Then we randomly picked edges & merge the triangles that share it
        
        const final = new Topology();                   // Going to rebuild mesh by...
        this._faceSubdivide( shape, final );            // Subdividing all the faces into quads        
        this._prepEdgeVerts( final, radius );           // Want to keep the outer edges from moving
        
        switch( relax ){
            case 1  : tthis._relax_Centroid( final, iter ); break;
            case 2  : tthis._relax_Weighted( final, iter ); break;
            case 3  : tthis._relax_AvgDistance( final, iter ); break;
            default : this._relax_Forces( final, iter, relaxScl ); break;
        }

        shape.dispose();
        final.clearMaps();
        return final;
    }

    static _buildPoints( top, radius, div ){
        const rad     = -30 * Math.PI / 180;
        const pCorner = [ radius * Math.cos( rad ), 0, radius * Math.sin( rad ) ];
        const pTop    = [ 0, 0, -radius ];
    
        let min  = div - 1;     // Min points to make per col
        let max  = div * 2 - 1; // Max points to make per col
        let iAbs, pntCnt;
        let aPnt, bPnt, xPnt;
        
        // Loop creates a pattern like -2,-1,0,1,2
        for( let i=-min; i <= min; i++ ){
            iAbs   = Math.abs(i);
            pntCnt = max + -iAbs - 1;
    
            aPnt     = vec3_lerp( [0,0,0], pCorner, pTop,  1 - ( iAbs / min ) );
            aPnt[0] *= Math.sign( i ) || 1;
            bPnt     = vec3_copy( [0,0,0], aPnt );
            bPnt[2]  = -bPnt[2];
    
            top.addVertex( aPnt );
            for( let j=1; j < pntCnt; j++ ){
                xPnt = vec3_lerp( [0,0,0], aPnt, bPnt, j/pntCnt );
                top.addVertex( xPnt );
            }
            top.addVertex( bPnt );
        }
    }

    static _buildTriangles( top, radius, div ){    
        let min  = div - 1;     // Min points to make per col
        let max  = div * 2 - 1; // Max points to make per col

        let aAbs, bAbs;
        let aCnt, bCnt, minCnt;
        let aIdx = 0;
        let bIdx = 0;
        let j;

        let a, b, c, d

        // Loop creates a pattern like -2,-1,0,1,2
        for( let i=-min; i < min; i++ ){
            aAbs   = Math.abs( i );
            bAbs   = Math.abs( i+1 );
            aCnt   = max + -aAbs;       // How many point sin the column
            bCnt   = max + -bAbs;
            bIdx   = aIdx + aCnt;       // Starting index for second column
            minCnt = Math.min( aCnt, bCnt ) - 1;

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Create each column as quads
            for( j=0; j < minCnt; j++ ){
                a = aIdx + j
                b = a + 1;
                d = bIdx + j;
                c = d + 1;

                if( i < 0 ){
                    top.addTriangle( a, b, c );
                    top.addTriangle( c, d, a );
                }else{
                    top.addTriangle( a, b, d );
                    top.addTriangle( b, c, d );
                }
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Every column has an ending triangle
            if( i < 0 ){
                a = aIdx + aCnt - 1;
                b = a + bCnt;
                c = b - 1;
            }else{
                b = aIdx + aCnt - 1;
                a = b - 1;
                c = b + bCnt
            }

            top.addTriangle( a, b, c );

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            aIdx += aCnt; // Set starting index for next iteration
        }
    }

    static _prepEdgeVerts( top, radius ){
        let edg, a, b;
        for( let he of top.halfEdges ){
            if( he.twin !== -1 ) continue;
            edg = top.edges[ he.edge ];

            // Just make it as an edge, relax function
            // will check for this.
            a   = top.vertices[ edg.aIdx ].userData = true;
            b   = top.vertices[ edg.bIdx ].userData = true;
        }
    }

    // Create quads by merging neighboring triangles
    // the easiest way is to randomly pick an edge then
    // use halfedge to quickly determine if there are 
    // two triangles that share it. When all possible
    // quads have been made into faces, any remaining unused
    // triangles will be turned into faces too.
    static _randomQuadMerge( top, seed=100 ){
        // Create a list of edges
        const edges = new Array( top.edges.length ).fill( 0 );
        
        // Fill the array with it's index numbers
        edges.forEach( (e,i,ary)=>{ ary[i] = i; } );

        // Randomly sort the edges
        //edges.sort( ()=>Math.random() - 0.5 );
        const rnd = rndLcg( seed );
        edges.sort( ()=>rnd() - 0.5 );

        // Pop an edge from the random queue, if the edge
        // shared two triangles, merge into a quad
        let idx;
        while( (idx = edges.pop()) != undefined ){
            op_TriToQuadFromEdge( top, idx );
        }

        // Any halfEdges not part a face, turn its triangle
        // into a face, this should cleanup the left overs
        for( let he of top.halfEdges ){
            if( he.face === -1 ){
                op_TriToFace( top, he.tri );
            }
        }
    }

    // Subdivide all the Quad & Triangle faces of a topology
    // into a new topology that will only consist of quads
    static _faceSubdivide( top, out ){
        let a, b, c, d;
        for( let f of top.faces ){
            switch( f.halfEdges.length ){
                // QUAD FACE
                case 4:
                    a = top.getVertPos( top.halfEdges[ f.halfEdges[0] ].vertex );
                    b = top.getVertPos( top.halfEdges[ f.halfEdges[1] ].vertex );
                    c = top.getVertPos( top.halfEdges[ f.halfEdges[2] ].vertex );
                    d = top.getVertPos( top.halfEdges[ f.halfEdges[3] ].vertex );
                    op_AddQuadSubDivide( out, a, b, c, d );
                    break;
                
                // TRIANGLE FACE
                case 3:
                    a = top.getVertPos( top.halfEdges[ f.halfEdges[0] ].vertex );
                    b = top.getVertPos( top.halfEdges[ f.halfEdges[1] ].vertex );
                    c = top.getVertPos( top.halfEdges[ f.halfEdges[2] ].vertex );
                    op_AddTriSubDivideFace( out, a, b, c );
                    break;
                
                // ERROR !!!
                default:
                    console.error( 'FACE found with a halfedge count that isnt 3 or 4' );
                    break;
            }
        }
    }

    // https://twitter.com/OskSta/status/1169940644669861888?s=20
    // The concept of relaxing comes from Oskar. The idea is that you
    // get the centroid of a face the you circle around the face getting
    // the vector of each point from the center. You would them sum up
    // this vector of all the points as a force BUT after every point you 
    // rotate the existing force by 90 degrees. Because of this all the
    // face windings should be CCW or relaxing will not work correctly.
    // Once the force is collected and averged, you then add it to a 
    // Total force for each point while also rotating it again in the
    // same fashion. Once the total force of all points have been computed
    // then you apply the force movement to each point at a small scale.
    // From there you just need to iterate it a few times as it takes
    // a few attempts to shift all the quads to be more square shaped.
    static _relax_Forces( top, iter=50, relaxScl=0.1 ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const centroid = [0,0,0];
        const axis     = [0,0,0];
        const force    = [0,0,0];
        const v        = [0,0,0];
        
        let i, f, p;
        let a, b, c, d;
        let pnts = [ null, null, null, null ];
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const forces = new Array( top.vertices.length )
        for( i=0; i < forces.length; i++ ) forces[ i ] = [0,0,0];

        for( let loop=0; loop < iter; loop++ ){

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Accumulate rotation forces for each vert of each face
            for( f of top.faces ){
                // ----------------------------------
                // Face centroid
                f.getVertices( top, pnts );
                vec3_add( centroid, pnts[0].pos, pnts[1].pos );
                vec3_add( centroid, centroid, pnts[2].pos );
                vec3_add( centroid, centroid, pnts[3].pos );
                vec3_divScale( centroid, centroid, 4 );

                // ----------------------------------
                // Oskar uses rotating forces to relax a quad, its kinda 
                // like spinning something around kind of like a salad spinner
                // helps moves things to be more circular in nature
                // for(i< 4)
                //   force += verts[i] - center
                //   force = (force .y,-force .x) // 2D 90 Degree rotation
                for( p of pnts ){
                    if( p.userData === null ){
                        vec3_sub( v, p.pos, centroid );
                        vec3_add( force, force, v );
                        vec3_yrot( force, force );
                    }
                }                
                
                // Averge out the force for the face which has 4 points
                vec3_divScale( force, force, 4 );

                // ----------------------------------
                // Accumulate the force for each vertex. Since vertices
                // are shared with other faces, we'll be applying the combined
                // forces of this face & neighboring faces
                // for(i < 4)
                //   forces[ i ] += center + force - verts[i]
                //   force       = (force.y,-force .x)}
                for( p of pnts ){
                    if( p.userData === null ){
                        vec3_add( v, centroid, force );
                        vec3_sub( v, v, p.pos );
                        vec3_add( forces[ p.idx ], forces[ p.idx ], v );
                        vec3_yrot( force, force );
                    }
                }    
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Apply the force to all the vertices
            for( i=0; i < forces.length; i++ ){
                if( top.vertices[ i ].userData === null ){
                    vec3_scale( v, forces[ i ], relaxScl );
                    vec3_add( top.vertices[ i ].pos, top.vertices[ i ].pos, v );
                }
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Reset things for the next iteration
            if( loop != iter-1 ){
                vec3_reset( force );
                for( i=0; i < forces.length; i++ ){
                    forces[i][0] = 0;
                    forces[i][1] = 0;
                    forces[i][2] = 0;
                }
            }
        }
    }

    // Each neighbor of a vertex, compute distance which will be treated
    // as weight which is used to sum up a total along with scaling the distance
    // from vertex. All the scaled distance vectors will be summed up to compute
    // a centroid by dividing the sum of positions by total weight. This weighted
    // position will replace the vertex's position
    static _relax_Weighted( top, iter=50 ){
        const neighbors = mkVertexNeighborMap( top );
        const vLen      = top.vertices.length;
        const pos       = [0,0,0];
        const centroid  = [0,0,0];

        let i, vert, n, w, weight;

        for( let loop=0; loop < iter; loop++ ){
            for( i=0; i < vLen; i++ ){
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vert = top.vertices[ i ];
                if( vert.userData === true ) continue; // Ignore verts on outer edges

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                weight = 0;
                vec3_reset( centroid );
                for( n of neighbors[ i ] ){
                    w       = vec3_distance( n.pos, vert.pos );
                    weight += w;
                    
                    vec3_scale( pos, n.pos, w );
                    vec3_add( centroid, centroid, pos );
                }

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vec3_divScale( vert.pos, centroid, weight );
            }
        }
    } 

    // For each vertex, compute the centroid from all its neighbors and
    // replace the vertex position with that centroid
    static _relax_Centroid( top, iter=50 ){
        const neighbors = mkVertexNeighborMap( top );
        const vLen      = top.vertices.length;
        const centroid  = [0,0,0];

        let i, vert, n;

        for( let loop=0; loop < iter; loop++ ){
            for( i=0; i < vLen; i++ ){
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vert = top.vertices[ i ];
                if( vert.userData === true ) continue; // Ignore verts on outer edges

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vec3_reset( centroid );

                for( n of neighbors[ i ] ) vec3_add( centroid, centroid, n.pos );

                vec3_divScale( vert.pos, centroid, neighbors[ i ].length );
            }
        }
    }

    static _relax_AvgDistance( top, iter=50 ){
        const neighbors = mkVertexNeighborMap( top );
        const vLen      = top.vertices.length;
        const pos       = [0,0,0];
        const centroid  = [0,0,0];

        let i, vert, n, w, weight;

        for( let loop=0; loop < iter; loop++ ){
            for( i=0; i < vLen; i++ ){
                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vert = top.vertices[ i ];
                if( vert.userData === true ) continue; // Ignore verts on outer edges

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                weight = 0;
                vec3_reset( centroid );

                // Average length of all the neighbors
                for( n of neighbors[ i ] ) weight += vec3_distance_sq( n.pos, vert.pos );
                weight = Math.sqrt( weight / neighbors[ i ].length );

                // Compute the Centroid based from the neighbors being constrained
                // by the average distance
                for( n of neighbors[ i ] ){
                    vec3_sub( pos, n.pos, vert.pos );
                    vec3_norm_scale( pos, pos, weight );
                    vec3_add( pos, pos, vert.pos );
                    vec3_add( centroid, centroid, pos );
                }

                // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                vec3_divScale( vert.pos, centroid, neighbors[ i ].length );
            }
        }
    } 
}

function mkVertexNeighborMap( top ){
    const vLen  = top.vertices.length;
    const verts = new Array( vLen );

    let list;
    for( let i=0; i < vLen; i++ ){
        verts[ i ] = op_GetVertNeighbors( top, i, true );
    }

    return verts;
}


// Basicly, all it does is get all the neighbors of a point
// then use those positions to compute the centroid, then use
// that is the replacement position of the point in question.
function apply_relax_neighborCenter(){
	let i, ii, n, pnt, p = new Vec2();

	for( i in $pnts ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Ignore Edge Points
		pnt = $pnts[ i ];
		if( pnt.is_edge ) continue;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Use neighboring points to compute their centroid
		n = $neighbors[ i ];
		p.set( 0, 0 );

		for( ii of n ) p.add( $pnts[ ii ].pos );
		p.div_scale( n.length );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		pnt.pos.copy( p ); // Replace pnt with centroid position.
	}
}

function apply_relax_weighted(){
	let i, ii, w, n, pnt, weight,
		p = new Vec2(),
		v = new Vec2();

	for( i in $pnts ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Ignore Edge Points
		pnt = $pnts[ i ];
		if( pnt.is_edge ) continue;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Use neighboring points to compute their centroid
		weight	= 0;
		n		= $neighbors[ i ];
		p.set( 0, 0 );
		
		for( ii of n ){
			// Use Distance between point and its neightbor
			// as a scalar.
			w = Vec2.len( pnt.pos, $pnts[ ii ].pos );
			v.from_scale( $pnts[ ii ].pos, w );
			
			weight += w;
			p.add( v );
		}
		p.div_scale( weight );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		pnt.pos.copy( p ); // Replace pnt with centroid position.
	}
}

function apply_relax_other(){
	let i, ii, n, pnt, p = new Vec2();
	let len;
	let x, w;
	for( i in $pnts ){
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Ignore Edge Points
		pnt = $pnts[ i ];
		if( pnt.is_edge ) continue;
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		//
		n = $neighbors[ i ];
		p.set( 0, 0 );
		w = 0;

		// Get an Average Length of all the neighbors
		for( ii of n ) w = Vec2.len_sqr( $pnts[ ii ].pos, pnt.pos );
		len = Math.sqrt( w / 4 );

		// Compute the Centroid based on the neighbors being constrained
		// by the average
		for( ii of n ){
			let v = Vec2.sub( $pnts[ ii ].pos, pnt.pos ).norm().scale( len ).add( pnt.pos );
			p.add( v );
		}
		p.div_scale( n.length );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		pnt.pos.copy( p ); // Replace pnt with centroid position.
	}
}

//https://twitter.com/OskSta/status/1169940644669861888?s=20
function apply_relax_forces(){
	let f = new Vec2();	// FORCE
	let v = new Vec2(); // Temp Vector
	let sq, i, t, p, center;

	// Create Velocity Data for all the Points.
	let vel = new Array( $pnts.length );
	for( let i=0; i < $pnts.length; i++ ) vel[ i ] = new Vec2();

	
	for( sq of $sub_quads ){
		center = sq.centroid;
		//$.circle_vec( center, 2 );

		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Build up Forces for the quad
		f.set( 0, 0 );	
		for( i=0; i < 4; i++ ){
			p = $pnts[ sq[i] ];
			if( p.is_edge ) continue;

			v.from_sub( p.pos, center );
			f.add( v );
			
			//Rotate Force 90 Degrees
			t	= f.x;	
			f.x	= f.y;
			f.y	= -t;
		}
		f.div_scale( 4 );
		
		//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Create Velocity for Each Point, built up 
		// from all Quads
		for( i=0; i < 4; i++ ){
			p = $pnts[ sq[i] ];
			if( p.is_edge ) continue;

			//Rotate Force 90 Degrees
			t	= f.x;	
			f.x	= f.y;
			f.y	= -t;

			v.from_add( center, f ).sub( p.pos );
			vel[ sq[i] ].add( v );
		}
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	// Apply Velocity to all points
	for( i in $pnts ){
		if( $pnts[ i ].is_edge ) continue;
		v.from_scale( vel[ i ], 0.2 );
		$pnts[ i ].pos.add( v );
	}
}
