/**
 * Difference the y values of a data series
 * @param {array} dataArray - an array of points
 * @returns {array} an array of points with [x, diff(y)]
 */
ssci.ts.diff = function(dataArray){
    var output=[];
    
    for (var index = 0; index < (dataArray.length-1); index++) {
        output.push([dataArray[index][0], dataArray[index+1][1]-dataArray[index][1]]);
    }
    
    return output;
};