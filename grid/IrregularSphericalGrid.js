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
        vec3_add, vec3_sub, vec3_norm,
        quat_axisAngle, quat_transformVec3,
}                               from '../lib/Maths.js'


// https://github.com/samuelbigos/globescaper/
export default class IrregularSphericalGrid{
    static build( radius=2, subDiv=2, iter=50, relaxScl=0.1, seed=100 ){
        const shape = new Topology();                 // Half Edge data structure for building the mesh
        this._subDivideIcoSphere( shape, subDiv );    // Start with a Icosphere
        this._randomQuadMerge( shape, seed );         // Then we randomly picked edges & merge the triangles that share it
        
        const final = new Topology();                 // Going to rebuild mesh by...
        this._faceSubdivide( shape, final );         // Subdividing all the faces into quads
        this._relaxFaces( final, radius, iter, relaxScl );

        shape.dispose();
        final.clearMaps();
        return final;
    }

    // Build an Icosphere by subdividing an icohedron
    static _subDivideIcoSphere( top, subDiv ){
        const a   = [0,0,0];
        const b   = [0,0,0];
        const c   = [0,0,0];
        let ai, bi, ci;

        for( let i=0; i < icohedron.indices.length; i+=3 ){
            // Get indices that make up 1 triangle
            ai     = icohedron.indices[ i+0 ] * 3;
            bi     = icohedron.indices[ i+1 ] * 3;
            ci     = icohedron.indices[ i+2 ] * 3;

            // First point of triangle
            a[ 0 ] = icohedron.vertices[ ai+0 ];
            a[ 1 ] = icohedron.vertices[ ai+1 ];
            a[ 2 ] = icohedron.vertices[ ai+2 ];

            // 2nd point of triangle
            b[ 0 ] = icohedron.vertices[ bi+0 ];
            b[ 1 ] = icohedron.vertices[ bi+1 ];
            b[ 2 ] = icohedron.vertices[ bi+2 ];

            // 3rd point of triangle
            c[ 0 ] = icohedron.vertices[ ci+0 ];
            c[ 1 ] = icohedron.vertices[ ci+1 ];
            c[ 2 ] = icohedron.vertices[ ci+2 ];

            // Pass triangle points to operator to sub divide
            // before inserting into topology
            op_AddSubdividedTri( top, a, b, c, subDiv );
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
    static _relaxFaces( top, radius=2, iter=50, relaxScl=0.1 ){
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const PH       = Math.PI * -0.5;
        const centroid = [0,0,0];
        const axis     = [0,0,0];
        const force    = [0,0,0];
        const v        = [0,0,0];
        const rot      = [0,0,0,1];
        
        let i, f;
        let a, b, c, d;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        const forces   = new Array( top.vertices.length )
        for( i=0; i < forces.length; i++ ) forces[ i ] = [0,0,0];

        for( let loop=0; loop < iter; loop++ ){

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Accumulate rotation forces for each vert of each face
            for( f of top.faces ){
                // ----------------------------------
                // Face centroid
                a = top.getHalfEdgeVertex( f.halfEdges[ 0 ] );
                b = top.getHalfEdgeVertex( f.halfEdges[ 1 ] );
                c = top.getHalfEdgeVertex( f.halfEdges[ 2 ] );
                d = top.getHalfEdgeVertex( f.halfEdges[ 3 ] );

                vec3_add( centroid, a.pos, b.pos );
                vec3_add( centroid, centroid, c.pos );
                vec3_add( centroid, centroid, d.pos );
                vec3_divScale( centroid, centroid, 4 );
                
                // ----------------------------------
                // Create 90 degreee rotation around the face centroid
                vec3_norm( axis, centroid );
                quat_axisAngle( rot, axis, PH );

                // ----------------------------------
                // Oskar uses rotating forces to relax a quad, its kinda 
                // like spinning something around kind of like a salad spinner
                // helps moves things to be more circular in nature
                // for(i< 4)
                //   force += verts[i] - center
                //   force = (force .y,-force .x) // 2D 90 Degree rotation
                vec3_sub( v, a.pos, centroid );
                vec3_add( force, force, v );
                quat_transformVec3( force, rot, force );

                vec3_sub( v, b.pos, centroid );
                vec3_add( force, force, v );
                quat_transformVec3( force, rot, force );

                vec3_sub( v, c.pos, centroid );
                vec3_add( force, force, v );
                quat_transformVec3( force, rot, force );
                
                vec3_sub( v, d.pos, centroid );
                vec3_add( force, force, v );
                quat_transformVec3( force, rot, force );
                
                // Averge out the force for the face which has 4 points
                vec3_divScale( force, force, 4 );

                // ----------------------------------
                // Accumulate the force for each vertex. Since vertices
                // are shared with other faces, we'll be applying the combined
                // forces of this face & neighboring faces
                // for(i < 4)
                //   forces[ i ] += center + force - verts[i]
                //   force       = (force.y,-force .x)}
                vec3_add( v, centroid, force );
                vec3_sub( v, v, a.pos );
                vec3_add( forces[ a.idx ], forces[ a.idx ], v );
                quat_transformVec3( force, rot, force );

                vec3_add( v, centroid, force );
                vec3_sub( v, v, b.pos );
                vec3_add( forces[ b.idx ], forces[ b.idx ], v );
                quat_transformVec3( force, rot, force );

                vec3_add( v, centroid, force );
                vec3_sub( v, v, c.pos );
                vec3_add( forces[ c.idx ], forces[ c.idx ], v );
                quat_transformVec3( force, rot, force );

                vec3_add( v, centroid, force );
                vec3_sub( v, v, d.pos );
                vec3_add( forces[ d.idx ], forces[ d.idx ], v );
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // Apply the force to all the vertices
            for( i=0; i < forces.length; i++ ){
                vec3_scale( v, forces[ i ], relaxScl );
                vec3_add( v, top.vertices[ i ].pos, v );
                
                // We normalize + scale to keep it spherical, this is extra compaired to irregular hex grid
                vec3_norm_scale( top.vertices[ i ].pos, v, radius ); 
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