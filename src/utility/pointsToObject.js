/**
 * Convert an array of points (i.e. x and y coordinates) to an array of objects with 'x' and 'y' attributes
 * @param {object} data - array holding the data - 'x' data is assumed to be in the first element of the point array, 'y' data in the second 
 * @returns {array} an array of objects in the D3 style
 */
ssci.pointsToObject = function(data){
    return data.map(function(e){
        var temp = {};
        temp.x = e[0];
        temp.y = e[1];
        return temp;
    });
};