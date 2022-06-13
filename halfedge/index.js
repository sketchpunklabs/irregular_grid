import { Vertex, Edge, HalfEdge, Triangle, Face }
                from './Structs.js';
import Topology from './Topology.js';

export { Topology, Face, Triangle, HalfEdge, Edge, Vertex };

// INFO & OPERATIONS
// https://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm
// https://eriksvjansson.net/papers/stima.pdf
// https://www.redblobgames.com/x/1722-b-rep-triangle-meshes/
// https://jerryyin.info/geometry-processing-algorithms/half-edge/
// https://martindevans.me/game-development/2016/03/30/Procedural-Generation-For-Dummies-Half-Edge-Geometry/
// http://sandervanrossen.blogspot.com/2017/09/half-edge-data-structure-considered.html

// https://observablehq.com/@esperanc/half-edge-data-structure
// https://gist.github.com/mpearson/8bef18403044eb59951800006d0a3c63