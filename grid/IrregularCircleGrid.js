import icohedron                from './icohedron.js';

import { Topology }             from '../halfedge/index.js';
import op_AddSubdividedTri      from '../halfedge/ops/op_AddSubdividedTri.js';
import op_TriToQuadFromEdge     from '../halfedge/ops/op_TriToQuadFromEdge.js';
import op_TriToFace             from '../halfedge/ops/op_TriToFace.js';
import op_AddQuadFace           from '../halfedge/ops/op_AddQuadFace.js';
import op_AddQuadSubDivide      from '../halfedge/ops/op_AddQuadSubDivide.js';
import op_AddTriSubDivideFace   from '../halfedge/ops/op_AddTriSubDivideFace.js';

import { rndLcg, vec3_reset,
        vec3_scale, vec3_norm_scale, vec3_divScale, 
        vec3_add, vec3_sub, vec3_mul, vec3_norm
}                               from '../lib/Maths.js'

// -zyx rot y+90
function vec3_yp( o, v ){
    const x = v[0], 
          y = v[1], 
          z = v[2]; 
    o[0] = -z; 
    o[1] = y; 
    o[2] = x; 
    return o;
}

// zy-x rot y-90
function vec3_yn( o, v ){
    const x = v[0], 
          y = v[1], 
          z = v[2];
    o[0] = z; 
    o[1] = y; 
    o[2] = -x; 
    return o;
}

const vec3_yrot = vec3_yp;

export default class IrregularCircleGrid{
    static build( radius=3, steps=3, iter=50, relaxScl=0.1, seed=100, useAlt=false ){
        const shape     = new Topology();                               // Half Edge data structure for building the mesh
        const arcRows   = this._buildCornerArcGrid( radius, steps );
        this._buildCircle( shape, arcRows, useAlt );
        this._randomQuadMerge( shape, seed );                           // Then we randomly picked edges & merge the triangles that share it
        
        const final = new Topology();                                   // Going to rebuild mesh by...
        this._faceSubdivide( shape, final );                            // Subdividing all the faces into quads        
        this._prepEdgeVerts( final, radius );                           // Want to keep the outer edges from moving
        this._relaxFaces( final, iter, relaxScl );                      // Make the quads more squareish

        shape.dispose();
        final.clearMaps();
        return final;
    }


    static _buildCornerArcGrid( radius=3, steps=3 ){
        const inc  = radius / steps;
        const rows = [];
        let row;
        let i, y, x, xx, rad;
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Build arc from bottom up
        for( i=steps; i > 0; i-- ){
            y   = inc * i - radius
            rad = Math.asin( y / radius );
            x   = radius * Math.cos( rad );
            
            // First Point
            row = [ [0,0,y] ];
    
            // Middle Points
            for( let j=1; j < steps; j++ ){
                xx = j * inc;
                if( xx >= x || Math.abs( xx - x ) < 0.00001 ) break;
                row.push( [xx,0,y] );
            }
    
            // Final Point
            row.push( [x,0,y] );
            rows.push( row );
        }
    
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Final Row which is the top of the arc
        let rng = Math.floor( steps / 3 ) + 1;
        
        row = [ [0,0,-radius] ];
        for( i=1; i <= rng; i++ ){
            x   = inc * i;
            rad = Math.acos( x / radius );
            y   = -radius * Math.sin( rad );
            row.push( [x,0,y] );
        }
        rows.push( row );

        return rows;
    }

    static _buildCircle( top, rows, useAlt=false ){
        const rowEnd = rows.length - 1;
        let ra, rb;
        let i, r, cAbs;
        
        let alt    = 0;
        let aCnt   = 0;
        let bCnt   = 0;
        let ai;
        let bi;
        let colEnd;

        const a    = [0,0,0];
        const b    = [0,0,0];
        const c    = [0,0,0];
        const d    = [0,0,0];
        const vInv = [-1,1,1];

        for( r=-rowEnd; r < rowEnd; r++ ){
            ra   = rows[ Math.abs( r ) ];
            rb   = rows[ Math.abs( r+1 ) ];

            vInv[2] = -Math.sign( r+1 ) || 1;

            aCnt   = ra.length-1;
            bCnt   = rb.length-1;
            colEnd = Math.max( aCnt, bCnt ) * 2;
            ai     = -aCnt;
            bi     = -bCnt;

            alt    = r % 2;

            // -----------------------------------------
            // if row sizes dont match, then the first 
            // thing to make triangles
            if( aCnt != bCnt ){
                vInv[ 0 ] = -1;

                for( i=0; i < Math.abs(bCnt-aCnt); i++ ){
                    if( aCnt < bCnt ){
                        vec3_mul( a, ra[ Math.abs( ai ) ], vInv );
                        vec3_mul( b, rb[ Math.abs( bi ) ], vInv );
                        vec3_mul( c, rb[ Math.abs( bi + 1 ) ], vInv );
                        bi++;
                    }else{
                        vec3_mul( a, ra[ Math.abs( ai + 1 ) ], vInv );
                        vec3_mul( b, ra[ Math.abs( ai ) ], vInv );
                        vec3_mul( c, rb[ Math.abs( bi ) ], vInv );
                        ai++;
                    }

                    top.addTriangleVerts( a, b, c );
                    colEnd -= 2;
                }
            }

            // -----------------------------------------
            // Build Quads
            for( i=0; i < colEnd; i++ ){
                vInv[ 0 ] = Math.sign( ai ) || 1;
                vec3_mul( a, ra[ Math.abs( ai ) ], vInv );
                vec3_mul( b, rb[ Math.abs( bi ) ], vInv );

                vInv[ 0 ] = Math.sign( ai+1 ) || 1;
                vec3_mul( c, rb[ Math.abs( bi+1 ) ], vInv );
                vec3_mul( d, ra[ Math.abs( ai+1 ) ], vInv );

                if( !useAlt || ((i+alt) & 1) == 1 ){
                    top.addTriangleVerts( a, b, c );
                    top.addTriangleVerts( c, d, a );
                    console.log( "A" );
                }else{
                    top.addTriangleVerts( a, b, d );
                    top.addTriangleVerts( d, b, c );
                    console.log( "B" );
                }

                ai++;
                bi++;
            }

            // -----------------------------------------
            // if row sizes dont match, then the last 
            // thing to make is a triangles
            if( aCnt != bCnt ){
                vInv[ 0 ] = 1;
                for( i=0; i < Math.abs(bCnt-aCnt); i++ ){
                    if( aCnt < bCnt ){
                        vec3_mul( a, ra[ aCnt ], vInv );
                        vec3_mul( b, rb[ bCnt-1 - i ], vInv );
                        vec3_mul( c, rb[ bCnt - i ], vInv );
                    }else{
                        vec3_mul( a, ra[ aCnt ], vInv );
                        vec3_mul( b, ra[ aCnt-1 ], vInv );
                        vec3_mul( c, rb[ bCnt ], vInv );
                    }
                    top.addTriangleVerts( a, b, c );
                }
            }
        }
    }

    static _prepEdgeVerts( top, radius ){
        let edg, a, b;
        for( let he of top.halfEdges ){
            if( he.twin !== -1 ) continue;
            edg = top.edges[ he.edge ];
            a   = top.vertices[ edg.aIdx ];
            b   = top.vertices[ edg.bIdx ];

            // Just make it as an edge, relax function
            // will check for this.
            a.userData = true;
            b.userData = true;

            // Subdivison makes the new points not rounded
            // so lets make sure every edge point 
            // is positioned at the right radius
            vec3_norm_scale( a.pos, a.pos, radius );
            vec3_norm_scale( b.pos, b.pos, radius );
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
    static _relaxFaces( top, iter=50, relaxScl=0.1 ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const centroid = [0,0,0];
        const axis     = [0,0,0];
        const force    = [0,0,0];
        const v        = [0,0,0];
        
        let i, f, p;
        let a, b, c, d;
        let pnts = [null,null,null,null]
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const forces   = new Array( top.vertices.length )
        for( i=0; i < forces.length; i++ ) forces[ i ] = [0,0,0];

        for( let loop=0; loop < iter; loop++ ){

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Accumulate rotation forces for each vert of each face
            for( f of top.faces ){
                // ----------------------------------
                // Face centroid
                pnts[0] = top.getHalfEdgeVertex( f.halfEdges[ 0 ] );
                pnts[1] = top.getHalfEdgeVertex( f.halfEdges[ 1 ] );
                pnts[2] = top.getHalfEdgeVertex( f.halfEdges[ 2 ] );
                pnts[3] = top.getHalfEdgeVertex( f.halfEdges[ 3 ] );

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
}