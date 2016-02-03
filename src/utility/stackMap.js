/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {string} y1 - a string holding an object's name within 'data' to use as the y-coordinate
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMap = function(data, x1, y1){
    return data.map(function(e){
        var temp = {};
        temp.x = e[x1];
        temp.y = e[y1];
        return temp;
    });
};