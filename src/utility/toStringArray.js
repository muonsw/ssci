/**
 * Creates a string representation of an array of points
 * @param {array} e - array of points
 * @returns {string} String with commas between x and y coordinates and newlines between each set of points 
 */
ssci.toStringArray = function(e){
    var f = e.map(function(d){
        return d[0] + ", " + d[1];
    });
    return f.join("\n");
};