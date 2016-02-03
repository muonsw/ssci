/**
 * Exponentially smooth a data series - data series should be evenly spaced in the x-coordinate
 * This is the exponentially weighted moving average rather than what is more generally known as exponential smoothing.
 * Only good for non-trended, non-seasonal data
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @returns {array} - an array with the new points
 */
ssci.smooth.EWMA = function(dataArray, factor){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    
    //Check that factor is in range and of the right type
    if(typeof factor !== 'number'){
        console.log('Factor appears to not be a number - changed to 0.3');
        factor=0.3;
    }
    if(factor>1 || factor<0){
        console.log('Factor >1 or <0 - changed to 0.3');
        factor=0.3;
    }
    
    for(var i=0;i<numPoints;i++){
        if(i===0){
            output.push(dataArray[i]);
        } else {
            output.push([dataArray[i][0], dataArray[i][1]*factor + output[i-1][1]*(1-factor)]);
        }
    }
    
    return output;
};