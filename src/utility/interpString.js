/**
 * Creates a string for the d attribute of the SVG <path> element given a type of path to create and a set of points
 * @param {string} interpolation - the type of path to create - linear or cubic
 * @param {array} points - a set of points
 * @returns {string} A string for use in the d attribute of the SVG <path> element
 */
ssci.interpString = function(interpolation, points){
    var outputString = "";
    if(interpolation==='linear'){
        outputString = points.join("L");
    } else if(interpolation==='cubic') {
        var sParam = splineInterpolation(points);
        
        outputString += points[0][0] + "," + points[0][1];
        for(var i=1;i<points.length;i++){
            var controlPoints = splineToBezier(points[i-1],points[i],sParam[i-1]);
            
            outputString += "C" + controlPoints[0][0] + "," + controlPoints[0][1] + "," + controlPoints[1][0] + "," + controlPoints[1][1] + "," + points[i][0] + "," + points[i][1];
        }
    } else {
        throw new Error('Interpolation not defined = ' + interpolation);
    }
    
    return outputString;
};