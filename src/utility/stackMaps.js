/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {array} y1 - an array of strings holding an object's name within 'data' to use as the y-coordinates
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMaps = function(data, x1, y1){
    
    var temp_layer = [];
    
    for(var i=0;i<y1.length;i++){
        temp_layer.push(this.stackMap(data, x1, y1[i]));
    }
    
    return temp_layer;
    
};