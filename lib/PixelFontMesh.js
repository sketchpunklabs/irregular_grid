import * as THREE        from '../thirdparty/three.module.min.js';

class PixelFontMesh extends THREE.Mesh{
    _cmds   = [];  // Commands Existing in Vec3 format, but saving into a float buffer
    _size   = 0;
    _dirty  = false;
    
    constructor(){
        super( 
            quadGeo( -0.5, 0.5, 0.5, -0.5 ),
            PixelFontMaterial(), // new THREE.MeshBasicMaterial( { color: 0xffffff } )
        );

        this.onBeforeRender = ()=>{ 
            if( this._dirty ){
                this._dirty = false;

                this.material.uniforms[ 'cmds' ].value      = new Float32Array( this._cmds );
                this.material.uniforms[ 'cmd_cnt' ].value   = this._size;
            }
        }
    }

    setRes( cols, rows ){
        const res = this.material.uniforms[ 'resolution' ].value;
        res[ 0 ] = cols * 8;
        res[ 1 ] = rows * 12;
        return this;
    }

    setPos( x, y ){
        this._cmds.push( 0, x, y );
        this._size++;
        this._dirty = true;
        return this;
    }

    add( s, mode=0 ){
        //s = s.trim();
        for( let i=0; i < s.length; i++ ){
            this._cmds.push( 1, s.charCodeAt( i ) - 32, mode );
        }
        this._size += s.length;
        this._dirty = true;
        return this;
    }

    reset(){
        this._size        = 0;
        this._cmds.length = 0;
        this._dirty       = true;
        return this;
    }
}

//#region SUPPORT 
function quadGeo( x0, y0, x1, y1 ){
    const vert = [
        x0, y0, 0.0,
        x0, y1, 0.0,
        x1, y1, 0.0,
        x1, y0, 0.0
    ];

    const geo = new THREE.BufferGeometry();
    geo.setIndex( new THREE.BufferAttribute( new Uint16Array([ 0,1,2, 2,3,0 ]), 1 ) );
    geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( vert ), 3 ) );
    geo.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array([ 0.0,0.0,   0.0,1.0,   1.0,1.0,   1.0,0.0 ]), 2 ) );

    return geo;
}  

function glColor( hex, out = null ){
    const NORMALIZE_RGB = 1 / 255;
    out = out || [0,0,0];

    out[0] = ( hex >> 16 & 255 ) * NORMALIZE_RGB;
    out[1] = ( hex >> 8 & 255 )  * NORMALIZE_RGB;
    out[2] = ( hex & 255 )       * NORMALIZE_RGB;

    return out;
}
//#endregion

//#region SHADER

// ORIGINAL SOURCE FROM - https://www.shadertoy.com/view/Mt2GWD

function PixelFontMaterial(){
    return new THREE.RawShaderMaterial({
    depthTest       : true,
    transparent 	: true, 
    uniforms        : { 
        cmds       : { value : new Float32Array([0,0,0]) },
        cmd_cnt    : { value : 0 },
        resolution : { value : new Float32Array([72,72]) },
    },

    vertexShader    : `#version 300 es
    in	vec3	position;
    in	vec2	uv;
    
    uniform 	mat4	modelViewMatrix;
    uniform 	mat4	projectionMatrix;

    out vec2    frag_uv;

    void main(){
        vec4 wPos 	        = modelViewMatrix * vec4( position.xyz, 1.0 );
        frag_uv             = uv;
        gl_Position			= projectionMatrix * wPos;
    }`,

    fragmentShader  : `#version 300 es
    precision mediump float;

    const int CMD_MAX = 50;

    out  vec4   out_color;
    in   vec2   frag_uv;
    
    uniform vec3[ CMD_MAX ] cmds;
    uniform int             cmd_cnt;
    uniform vec2            resolution;

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /*
    --------
    -###----
    ##-##---
    ##-##---
    -###----
    #####-#-
    ##-####-
    ##--##--
    ##-###--
    -###-##-
    --------
    --------
    
    00000000
    01110000
    11011000
    11011000
    01110000
    11111010
    11011110
    11001100
    11011100
    01110110
    00000000
    00000000
    
    //Broken up into 4 8x3 (24 bit) chunks for each component of the vec4.
    //Hexadecimal is being used to reduce clutter in the code but decimal still works.
    
    00000000
    01110000 -> 00000000 01110000 11011000 -> 0x0070D8
    11011000
    
    11011000
    01110000 -> 11011000 01110000 11111010 -> 0xD870FA
    11111010
    
    11011110
    11001100 -> 11011110 11001100 11011100 -> 0xDECCDC
    11011100
    
    01110110
    00000000 -> 01110110 00000000 00000000 -> 0x760000
    00000000
    
    vec4(0x0070D8,0xD870FA,0xDECCDC,0x760000)
    */
    
    // Original Source : https://www.shadertoy.com/view/Mt2GWD
    
    
    // Automatically generated from the 8x12 font sheet here:
    // http://www.massmind.org/techref/datafile/charset/extractor/charset_extractor.htm
    
    vec4 chars[] = vec4[](
        vec4(0x000000,0x000000,0x000000,0x000000),  // Space 32
        vec4(0x003078,0x787830,0x300030,0x300000),  // Exclamation mark 33
        vec4(0x006666,0x662400,0x000000,0x000000),  // Double quotes 34
        vec4(0x006C6C,0xFE6C6C,0x6CFE6C,0x6C0000),  // HashTag 35
        vec4(0x30307C,0xC0C078,0x0C0CF8,0x303000),  // Dollar 36
        vec4(0x000000,0xC4CC18,0x3060CC,0x8C0000),  // Percent 37
        vec4(0x0070D8,0xD870FA,0xDECCDC,0x760000),  // Ampersand 38
        vec4(0x003030,0x306000,0x000000,0x000000),  // Single quote 39
        vec4(0x000C18,0x306060,0x603018,0x0C0000),  // Open parenthesis 40
        vec4(0x006030,0x180C0C,0x0C1830,0x600000),  // Closing parenthesis 41
        vec4(0x000000,0x663CFF,0x3C6600,0x000000),  // Asterisk 42
        vec4(0x000000,0x18187E,0x181800,0x000000),  // Plus 43
        vec4(0x000000,0x000000,0x000038,0x386000),  // Comma 44
        vec4(0x000000,0x0000FE,0x000000,0x000000),  // Hyphen 45
        vec4(0x000000,0x000000,0x000038,0x380000),  // Period 46
        vec4(0x000002,0x060C18,0x3060C0,0x800000),  // Forward Slash 47
        vec4(0x007CC6,0xD6D6D6,0xD6D6C6,0x7C0000),  // 0 48
        vec4(0x001030,0xF03030,0x303030,0xFC0000),  // 1 49
        vec4(0x0078CC,0xCC0C18,0x3060CC,0xFC0000),  // 2 50
        vec4(0x0078CC,0x0C0C38,0x0C0CCC,0x780000),  // 3 51
        vec4(0x000C1C,0x3C6CCC,0xFE0C0C,0x1E0000),  // 4 52
        vec4(0x00FCC0,0xC0C0F8,0x0C0CCC,0x780000),  // 5 53
        vec4(0x003860,0xC0C0F8,0xCCCCCC,0x780000),  // 6 54
        vec4(0x00FEC6,0xC6060C,0x183030,0x300000),  // 7 55
        vec4(0x0078CC,0xCCEC78,0xDCCCCC,0x780000),  // 8 56
        vec4(0x0078CC,0xCCCC7C,0x181830,0x700000),  // 9 57
        vec4(0x000000,0x383800,0x003838,0x000000),  // Colon 58
        vec4(0x000000,0x383800,0x003838,0x183000),  // Semicolon 59
        vec4(0x000C18,0x3060C0,0x603018,0x0C0000),  // Less than 60
        vec4(0x000000,0x007E00,0x7E0000,0x000000),  // Equals 61
        vec4(0x006030,0x180C06,0x0C1830,0x600000),  // Greater then 62
        vec4(0x0078CC,0x0C1830,0x300030,0x300000),  // Question mark 63
        vec4(0x007CC6,0xC6DEDE,0xDEC0C0,0x7C0000),  // At 64
        vec4(0x003078,0xCCCCCC,0xFCCCCC,0xCC0000),  // A 65
        vec4(0x00FC66,0x66667C,0x666666,0xFC0000),  // B
        vec4(0x003C66,0xC6C0C0,0xC0C666,0x3C0000),  // C
        vec4(0x00F86C,0x666666,0x66666C,0xF80000),  // D
        vec4(0x00FE62,0x60647C,0x646062,0xFE0000),  // E
        vec4(0x00FE66,0x62647C,0x646060,0xF00000),  // F
        vec4(0x003C66,0xC6C0C0,0xCEC666,0x3E0000),  // G
        vec4(0x00CCCC,0xCCCCFC,0xCCCCCC,0xCC0000),  // H
        vec4(0x007830,0x303030,0x303030,0x780000),  // I
        vec4(0x001E0C,0x0C0C0C,0xCCCCCC,0x780000),  // J
        vec4(0x00E666,0x6C6C78,0x6C6C66,0xE60000),  // K
        vec4(0x00F060,0x606060,0x626666,0xFE0000),  // L
        vec4(0x00C6EE,0xFEFED6,0xC6C6C6,0xC60000),  // M
        vec4(0x00C6C6,0xE6F6FE,0xDECEC6,0xC60000),  // N
        vec4(0x00386C,0xC6C6C6,0xC6C66C,0x380000),  // O
        vec4(0x00FC66,0x66667C,0x606060,0xF00000),  // P
        vec4(0x00386C,0xC6C6C6,0xCEDE7C,0x0C1E00),  // Q
        vec4(0x00FC66,0x66667C,0x6C6666,0xE60000),  // R
        vec4(0x0078CC,0xCCC070,0x18CCCC,0x780000),  // S
        vec4(0x00FCB4,0x303030,0x303030,0x780000),  // T
        vec4(0x00CCCC,0xCCCCCC,0xCCCCCC,0x780000),  // U
        vec4(0x00CCCC,0xCCCCCC,0xCCCC78,0x300000),  // V
        vec4(0x00C6C6,0xC6C6D6,0xD66C6C,0x6C0000),  // W
        vec4(0x00CCCC,0xCC7830,0x78CCCC,0xCC0000),  // X
        vec4(0x00CCCC,0xCCCC78,0x303030,0x780000),  // Y
        vec4(0x00FECE,0x981830,0x6062C6,0xFE0000),  // Z 90
        vec4(0x003C30,0x303030,0x303030,0x3C0000),  // Left Bracket 91
        vec4(0x000080,0xC06030,0x180C06,0x020000),  // Back Slash 92
        vec4(0x003C0C,0x0C0C0C,0x0C0C0C,0x3C0000),  // Closing Bracket 93
        vec4(0x10386C,0xC60000,0x000000,0x000000),  // Caret 94
        vec4(0x000000,0x000000,0x000000,0x00FF00),  // Underscore 95
        vec4(0x000000,0x10386C,0xC6C6FE,0x000000),  // Lar ??
        vec4(0x000000,0x00780C,0x7CCCCC,0x760000),  // a 97
        vec4(0x00E060,0x607C66,0x666666,0xDC0000),  // b
        vec4(0x000000,0x0078CC,0xC0C0CC,0x780000),  // c
        vec4(0x001C0C,0x0C7CCC,0xCCCCCC,0x760000),  // d
        vec4(0x000000,0x0078CC,0xFCC0CC,0x780000),  // e
        vec4(0x00386C,0x6060F8,0x606060,0xF00000),  // f
        vec4(0x000000,0x0076CC,0xCCCC7C,0x0CCC78),  // g
        vec4(0x00E060,0x606C76,0x666666,0xE60000),  // h
        vec4(0x001818,0x007818,0x181818,0x7E0000),  // i
        vec4(0x000C0C,0x003C0C,0x0C0C0C,0xCCCC78),  // j
        vec4(0x00E060,0x60666C,0x786C66,0xE60000),  // k
        vec4(0x007818,0x181818,0x181818,0x7E0000),  // l
        vec4(0x000000,0x00FCD6,0xD6D6D6,0xC60000),  // m
        vec4(0x000000,0x00F8CC,0xCCCCCC,0xCC0000),  // n
        vec4(0x000000,0x0078CC,0xCCCCCC,0x780000),  // o
        vec4(0x000000,0x00DC66,0x666666,0x7C60F0),  // p
        vec4(0x000000,0x0076CC,0xCCCCCC,0x7C0C1E),  // q
        vec4(0x000000,0x00EC6E,0x766060,0xF00000),  // r
        vec4(0x000000,0x0078CC,0x6018CC,0x780000),  // s
        vec4(0x000020,0x60FC60,0x60606C,0x380000),  // t
        vec4(0x000000,0x00CCCC,0xCCCCCC,0x760000),  // u
        vec4(0x000000,0x00CCCC,0xCCCC78,0x300000),  // v
        vec4(0x000000,0x00C6C6,0xD6D66C,0x6C0000),  // w
        vec4(0x000000,0x00C66C,0x38386C,0xC60000),  // x
        vec4(0x000000,0x006666,0x66663C,0x0C18F0),  // y
        vec4(0x000000,0x00FC8C,0x1860C4,0xFC0000),  // z 122
        vec4(0x001C30,0x3060C0,0x603030,0x1C0000),  // Opening brace 123
        vec4(0x001818,0x181800,0x181818,0x180000),  // Vertical bar 124
        vec4(0x00E030,0x30180C,0x183030,0xE00000),  // Closing brace 125
        vec4(0x0073DA,0xCE0000,0x000000,0x000000)   // Tilde 126
    );
    
    #define CHAR_SIZE vec2( 8, 12 )
    #define CHR_W( c ) ( c * CHAR_SIZE.x )
    #define CHR_H( c ) ( c * CHAR_SIZE.y )
    
    const int NORMAL    = 0;
    const int INVERT    = 1;
    const int UNDERLINE = 2;
    
    struct CharPrint{
        vec2 res;
        vec2 pos;
        int  mode;
    } CP;
    
    void set_char_pos( float x, float y ){ CP.pos = floor( vec2( x * CHAR_SIZE.x, y * CHAR_SIZE.y ) ); }
    void set_char_top(){ CP.pos = vec2( 0.0, CP.res.y - CHAR_SIZE.y ); }
    
    // Extracts bit b from the given number. Shifts bits right (num / 2^bit) then ANDs the result with 1 (mod(result,2.0)).
    float extract_bit( float n, float b ){
        b = clamp( b, -1.0, 24.0 );
        return floor( mod( floor( n / pow( 2.0, floor(b) ) ), 2.0 ) );   
    }
    
    //Returns the pixel at uv in the given bit-packed sprite.
    float sprite(vec4 spr, vec2 uv){
        uv = floor( uv );
        
        // Calculate the bit to extract ( x + y * width ) ( flipped on x-axis )
        float bit = ( CHAR_SIZE.x - uv.x - 1.0 ) + uv.y * CHAR_SIZE.x;
        
        // Clipping bound to remove garbage outside the sprite's boundaries.
        bool bounds = all( greaterThanEqual( uv, vec2(0) ) ) && all( lessThan( uv, CHAR_SIZE ) );
        
        return bounds ? 
            extract_bit( spr.x, bit - 72.0 ) +
            extract_bit( spr.y, bit - 48.0 ) +
            extract_bit( spr.z, bit - 24.0 ) +
            extract_bit( spr.w, bit - 00.0 ) : 0.0;
    }
    
    // Prints a character and moves the print position forward by 1 character width.
    float char( vec4 ch, vec2 uv ){
        // Inverts all of the bits in the character.
        if( CP.mode == INVERT )    ch = pow( 2.0, 24.0 ) - 1.0 - ch;
    
        // Makes the bottom 8 bits all 1.
        // Shifts the bottom chunk right 8 bits to drop the lowest 8 bits,
        // then shifts it left 8 bits and adds 255 (binary 11111111).
        if( CP.mode == UNDERLINE ) ch.w = floor( ch.w / 256.0 ) * 256.0 + 255.0;  
    
        float px = sprite( ch, uv - CP.pos );
        CP.pos.x += CHAR_SIZE.x;
        return px;
    }
    
    float process_cmds( vec3 cmd[ CMD_MAX ], vec2 uv ){
        float px = 0.0;
        int   c;
    
        for( int i=0; i < cmd_cnt; i++ ){
            c = int( cmd[i].x ); 
            
            if( c == 0 ) set_char_pos( cmd[i].y, cmd[i].z );        // Set Position
            else if( c == 1){                                       // Write Char
                CP.mode = int( cmd[i].z );
                px      += char( chars[ int( cmd[i].y ) ], uv );
            }
        }
    
        return clamp( px, 0.0, 1.0 );
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    /* TESTING 
    const int CMD_MAX = 4;
    const int cmd_cnt = 4;
    
    // CMD 0 - Set Position ( 0, x, y )
    // CMD 1 - Write Char   ( 1, chr_idx, mode )
    vec3 cmds[] = vec3[ CMD_MAX ](
        vec3( 0.0, 1.0, 1.0 ),
        vec3( 1.0, 1.0, 0.0 ),
        vec3( 1.0, 1.0, 1.0 ),
        vec3( 1.0, 1.0, 2.0 )
    );
    */

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    void main(){
        // ------------------------------------
        // SETUP
        //CP.res      = vec2( 12.0 * 4.0 );                 // Make resolution divisible by 12 height for easy use
        CP.res      = resolution; 
        vec2 uv_yi  = vec2( frag_uv.x, 1.0 - frag_uv.y );   // UV with Inverted Y
        vec2 uv_px  = floor( uv_yi * CP.res );              // Get Pixel Coord from UV * Resolution
        
        // ------------------------------------
        float mask  = process_cmds( cmds, uv_px );
        out_color   = vec4( vec3(1.0,1.0,1.0) * mask, 1.0 );
    }`});
}
//#endregion

export default PixelFontMesh;