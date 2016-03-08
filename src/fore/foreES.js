/**
 * Exponential smoothing
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.expon = function(){
    var data = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq=0;
    var factor = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function retVar(){
        var i;
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Calculate forecasts
        for(i=1;i<(numPoints+1);i++){
            if(i<2){
                output.push([dataArray[i][0], dataArray[i-1][1]]);
            } else if(i===numPoints){
                //Should I check for a date in the x-axis?
                //x value is one period on from the last period
                output.push([+dataArray[i-1][0]+(+dataArray[i-1][0]-dataArray[i-2][0]), dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            } else {
                output.push([dataArray[i][0], dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            }
        }
        
        //Calculate residuals
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i-1][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i-1][1],2);
        }
    }
    
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    retVar.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        
        factor = value;
        
        return retVar;
    };
    
    retVar.output = function(){
        return output;
    };
    retVar.residuals = function(){
        return resids;
    };
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    return retVar;
};
