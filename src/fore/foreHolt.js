/**
 * Holt's Exponential Smoothing
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @param {number} trend - factor for the trend smoothing
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.Holt = function(dataArray, factor, trend){
    if(arguments.length!==3){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var resids = [];
    var retVar = {};
    
    //Check that factor is in range and of the right type
    if(typeof factor !== 'number'){
        console.log('Factor appears to not be a number - changed to 0.3');
        factor=0.3;
    }
    if(factor>1 || factor<0){
        console.log('Factor >1 or <0 - changed to 0.3');
        factor=0.3;
    }
    
    //Check that trend factor is in range and of the right type
    if(typeof trend !== 'number'){
        console.log('Trend factor appears to not be a number - changed to 0.3');
        trend=0.3;
    }
    if(trend>1 || trend<0){
        console.log('Trend >1 or <0 - changed to 0.3');
        trend=0.3;
    }
    
    output.push(dataArray[0]);
    
    var l=[];
    var t=[];
    //Generate starting value for l - first point
    l.push(dataArray[0][1]);
    //Generate starting value for t - calculate trend and mulitply by average distance between points
    t.push(ssci.regPolyBig(dataArray,1).constants[1] * ((dataArray[numPoints-1][0]-dataArray[0][0])/(numPoints-1)));

    for(var i=1;i<(numPoints);i++){
        l.push(factor*dataArray[i][1]+(1-factor)*(l[i-1]+t[i-1]));
        t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
        //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
        output.push([dataArray[i][0], l[i-1]+t[i-1]]);
    }
    
    //Calculate residuals
    var sumsq=0;
    for(i=1;i<numPoints;i++){
        resids.push(dataArray[i][1]-output[i][1]);
        sumsq += Math.pow(dataArray[i][1]-output[i][1],2);
    }
    
    retVar.output = output;
    retVar.residuals = resids;
    retVar.factor = [factor, trend];
    retVar.sumSquares = sumsq;
    retVar.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        //d=1 means one unit of time ahead. If the data is monthly, then d is in months
        var temp = l[l.length-1]+d*t[t.length-1];
        return temp;
    };
    
    return retVar;
};