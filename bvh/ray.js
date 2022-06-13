import {
    vec3_sub, vec3_mul,
    vec3_copy, vec3_norm, vec3_distance_sq,
    mat4_mul, mat4_invert, mat4_transformVec4, 
} from '../lib/Maths.js';

export function nearPoint( ray, p, distLimit=0.1 ){
    /* closest_point_to_line3D
    let dx	= bx - ax,
        dy	= by - ay,
        dz	= bz - az,
        t	= ( (px-ax)*dx + (py-ay)*dy + (pz-az)*dz ) / ( dx*dx + dy*dy + dz*dz ) ; */
    const v = vec3_sub( [0,0,0], p, ray.posStart );
    vec3_mul( v, v, ray.vecLength );

    const t = ( v[0] + v[1] + v[2] ) / vec3_distance_sq( ray.vecLength );

    if( t < 0 || t > 1 ) return null;                         // Over / Under shoots the Ray Segment
    const lenSqr = vec3_distance_sq( ray.posAt( t, v ), p );  // Distance from point to nearest point on ray.

    return ( lenSqr <= (distLimit*distLimit) )? t : null;
}

export function from3JSScreenProjection( ray, xMouse, yMouse, App ){
    const size      = { x:0, y:0, set:function(x,y){ this.x=x; this.y=y; } }; // Hack to avoid importing THREE.Vector2
    const proj      = App.camera.projectionMatrix.toArray();    // Need Projection Matrix
    const camWorld  = App.camera.matrixWorld.toArray();         // World Space Transform of Camera
    App.renderer.getSize( size );                               // Need Size of Canvas

    // Setup Ray
    ray.fromScreenProjection( xMouse, yMouse, size.x, size.y, proj, camWorld );
    return ray;
}


export class Ray{
    posStart     = [0,0,0];  // Origin
    posEnd       = [0,0,0];
    direction    = [0,0,0];  // Direction from Start to End
    invDirection = [0,0,0];
    vecLength    = [0,0,0];  // Vector Length between start to end

    // #region GETTERS / SETTERS
    /** Get position of the ray from T Scale of VecLen */
    posAt( t, out ) {
        // RayVecLen * t + RayOrigin
        // also works lerp( RayOrigin, RayEnd, t )

        out      = out || [0,0,0];
        out[ 0 ] = this.vecLength[ 0 ] * t + this.posStart[ 0 ];
        out[ 1 ] = this.vecLength[ 1 ] * t + this.posStart[ 1 ];
        out[ 2 ] = this.vecLength[ 2 ] * t + this.posStart[ 2 ];
        return out;
    }

    /** Get position of the ray from distance from origin */
    directionAt( len, out ) {
        out      = out || [0,0,0];
        out[ 0 ] = this.direction[ 0 ] * len + this.posStart[ 0 ];
        out[ 1 ] = this.direction[ 1 ] * len + this.posStart[ 1 ];
        out[ 2 ] = this.direction[ 2 ] * len + this.posStart[ 2 ];        
        return out;
    }

    forAABB(){
        this.invDirection[ 0 ] = 1 / this.direction[ 0 ];
        this.invDirection[ 1 ] = 1 / this.direction[ 1 ];
        this.invDirection[ 2 ] = 1 / this.direction[ 2 ];
        return this;
    }

    fromScreenProjection( x, y, w, h, projMatrix, camMatrix ){
        // http://antongerdelan.net/opengl/raycasting.html
		// Normalize Device Coordinate
        const nx  = x / w * 2 - 1;
        const ny  = 1 - y / h * 2;

        // inverseWorldMatrix = invert( ProjectionMatrix * ViewMatrix ) OR
		// inverseWorldMatrix = localMatrix * invert( ProjectionMatrix ) 
        const invMatrix = mat4_invert( new Array(16), projMatrix );
        mat4_mul( invMatrix, camMatrix, invMatrix );
        
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // https://stackoverflow.com/questions/20140711/picking-in-3d-with-ray-tracing-using-ninevehgl-or-opengl-i-phone/20143963#20143963
        // Clip Cords would be [nx,ny,-1,1];
        const clipNear   = [ nx, ny, -1, 1 ];
        const clipFar    = [ nx, ny, 1, 1 ];

        // using 4d Homogeneous Clip Coordinates
        mat4_transformVec4( clipNear, invMatrix, clipNear );
        mat4_transformVec4( clipFar, invMatrix, clipFar );

        // Normalize by using W component
        for( let i=0; i < 3; i++){
            clipNear[ i ]	/= clipNear[ 3 ];
            clipFar [ i ] 	/= clipFar [ 3 ];
        }

        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        vec3_copy( this.posStart, clipNear );           // Starting Point of the Ray
        vec3_copy( this.posEnd, clipFar );              // The absolute end of the ray
        vec3_sub( this.vecLength, clipFar, clipNear );  // Vector Length
        vec3_norm( this.direction, this.vecLength );    // Normalized Vector Length
        return this;
    }

    // fromEndPoints( a, b ){
    //     vec3.copy( a, this.posStart );                  // Starting Point of the Ray
    //     vec3.copy( b, this.posEnd );                    // The absolute end of the ray
    //     vec3.sub( b, a, this.vecLength );               // Vector Length
    //     vec3.norm( this.vecLength, this.direction );    // Normalized Vector Length
    //     return this;
    // }
    // #endregion
}