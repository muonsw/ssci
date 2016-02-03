/**
 * Exponential smoothing
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.ES = function(dataArray, factor){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var resids = [];
    var retVar = {};
    var i;
    
    //Check that factor is in range and of the right type
    if(typeof factor !== 'number'){
        console.log('Factor appears to not be a number - changed to 0.3');
        factor=0.3;
    }
    if(factor>1 || factor<0){
        console.log('Factor >1 or <0 - changed to 0.3');
        factor=0.3;
    }
    
    for(i=1;i<(numPoints+1);i++){
        if(i<2){
            output.push([dataArray[i][0], dataArray[i-1][1]]);
        } else if(i===numPoints){
            //Should I check for a date in the x-axis?
            output.push([+dataArray[i-1][0]+(+dataArray[i-1][0]-dataArray[i-2][0]), dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
        } else {
            output.push([dataArray[i][0], dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
        }
    }
    
    //Calculate residuals
    var sumsq=0;
    for(i=1;i<numPoints;i++){
        resids.push(dataArray[i][1]-output[i-1][1]);
        sumsq += Math.pow(dataArray[i][1]-output[i-1][1],2);
    }
    
    retVar.output = output;
    retVar.residuals = resids;
    retVar.factor = factor;
    retVar.sumSquares = sumsq;
    
    return retVar;
};