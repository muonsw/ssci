/**
 * Creates the array of control points for a bezier curve given the ends points of a cubic spline
 * @param {array} p0 - first point of the bezier and spline curves i.e. [x1, y1]
 * @param {array} p2 - end point of the bezier and spline curves i.e. [x2, y2]
 * @param {array} splineParam - the four parameters of the cubic polynomial spline
 * @returns {array} - an array of the 2 middle control points for the cubic bezier curve
 */
function splineToBezier(p0, p2, splineParam){
    var t = [1/3, 2/3];
    var x = [(p2[0]-p0[0])*t[0]+p0[0],(p2[0]-p0[0])*t[1]+p0[0]];
    var s = [splineParam[0] + splineParam[1]*(x[0]-p0[0]) + splineParam[2]*Math.pow((x[0]-p0[0]),2) + splineParam[3]*Math.pow((x[0]-p0[0]),3), splineParam[0] + splineParam[1]*(x[1]-p0[0]) + splineParam[2]*Math.pow((x[1]-p0[0]),2) + splineParam[3]*Math.pow((x[1]-p0[0]),3)];
    var b = [(s[0]-Math.pow((1-t[0]),3)*p0[1]-Math.pow(t[0],3)*p2[1])/(3*(1-t[0])*t[0]), (s[1]-Math.pow((1-t[1]),3)*p0[1]-Math.pow(t[1],3)*p2[1])/(3*(1-t[1])*t[1])];
    
    var p = [];
    p[0] = (b[1]-(t[1]*b[0]/t[0]))*(1/(1-(t[1]/t[0])));
    p[1] = (b[0] - (1-t[0])*p[0])/t[0];
    
    return [[x[0], p[0]], [x[1], p[1]]];
}