import { vec3_lerp } from '../../lib/Maths.js';

export default function op_AddSubdividedTri( top, a, b, c, div=2 ){
    const seg_a = [0,0,0];                      // Lerping
    const seg_b = [0,0,0];
    const seg_c = [0,0,0];

    let row0    = [ top.addVertex( a ) ];
    let row1;

    let j, t, row;
    
    // Subdivide Triangle as many times requested
    for( let i=1; i <= div; i++ ){
        t = i / div;                             // Get Lerp T
        vec3_lerp( seg_b, a, b, t );             // Get Position of two sides of the triangle.
        vec3_lerp( seg_c, a, c, t );

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Generate points between the two triangle edges
        row1 = [ top.addVertex( seg_b ) ];        // Add First Point in the Row

        for( j=1; j < i; j++ ){                  // Loop the Remaining Points of the row
            t = j / i;
            vec3_lerp( seg_a, seg_b, seg_c, t );
            row1.push( top.addVertex( seg_a ) );
        }

        row1.push( top.addVertex( seg_c ) );      // Add Last row point

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Generate Triangles for this row, create 1 quat at a time
        // but the last one will aways be a single triangle
        for( j=0; j < row0.length; j++ ){
            top.addTriangle( row1[ j ], row1[ j+1 ], row0[ j ] );
            if( j+1 < row0.length ){
                top.addTriangle( row0[ j ], row1[ j+1 ], row0[ j+1 ] );
            }
        }

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        row0 = row1;    // save row for next loop
    }
}