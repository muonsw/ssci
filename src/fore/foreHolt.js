/**
 * Holt's Exponential Smoothing
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @param {number} trend - factor for the trend smoothing
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.holt = function(){
    var data = [];
    var dataArray = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq  = 0;
    var factor = 0.3;
    var trend  = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var l=[];
    var t=[];
    
    function retVar(){
        var i;
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Push first value to dataArray
        output.push(dataArray[0]);
        
        //Generate starting value for l - first value of dataArray
        if(l.length===0){
            l.push(dataArray[0][1]);
        }
        
        //Generate starting value for t - initial average difference between first three pairs of points
        if(t.length===0){
            t.push((1/3)*(dataArray[1][1]-dataArray[0][1])+(dataArray[2][1]-dataArray[1][1])+(dataArray[3][1]-dataArray[2][1]));
            
            //Alternative 1 - calculate trend for entire series and multiply by average distance between points
            //t.push(ssci.reg.polyBig(dataArray,1).constants[1] * ((dataArray[numPoints-1][0]-dataArray[0][0])/(numPoints-1)));
        
            //Alternative 2 - trend for first to second point
            //t.push(dataArray[1][1]-dataArray[0][1]);
            
            //Alternative 3 - trend between first and last point
            //t.push((dataArray[numPoints-1][1]-dataArray[0][1])/(numPoints-1));
        }
        
        //Calculate new values for level, trend and forecast
        for(i=1;i<(numPoints);i++){
            l.push(factor*dataArray[i][1]+(1-factor)*(l[i-1]+t[i-1]));
            t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
            //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
            output.push([dataArray[i][0], l[i-1]+t[i-1]]);
        }
        
        //Calculate residuals
        sumsq=0;
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i][1],2);
        }
        
    }
    
    retVar.initialLevel = function(value){
        if(!arguments.length){ return l[0]; }
        l = [];
        
        l.push(value);
        
        return retVar;
    };
    
    retVar.initialTrend = function(value){
        if(!arguments.length){ return t[0]; }
        t = [];
        
        t.push(value);
        
        return retVar;
    };
    
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
    
    retVar.trend = function(value){
        if(!arguments.length){ return trend; }
        
        //Check that trend factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Trend factor appears to not be a number - changed to 0.3');
            trend=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Trend >1 or <0 - changed to 0.3');
            trend=0.3;
            return retVar;
        }
    
        trend = value;
    
        return retVar;
    };
    
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
