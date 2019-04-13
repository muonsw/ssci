/**
 * Holt's Exponential Smoothing
 * @returns {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
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
    var funcs_T = {
        '1': t1,
        '2': t2,
        '3': t3,
        '4': t4
    };
    var funcT = '1';    //Function to use to calculate the starting value of 

    /**
     * Initial average difference between first three pairs of points
     */
    function t1(){
        return (1/3)*(dataArray[1][1]-dataArray[0][1])+(dataArray[2][1]-dataArray[1][1])+(dataArray[3][1]-dataArray[2][1]);
    }
    /**
     * Calculate trend for entire series and multiply by average distance between points
     */
    function t2(){
        return ssci.reg.polyBig(dataArray,1).constants[1] * ((dataArray[numPoints-1][0]-dataArray[0][0])/(numPoints-1));
    }
    /**
     * Trend for first to second point
     */
    function t3(){
        return dataArray[1][1]-dataArray[0][1];
    }
    /**
     * Trend between first and last point
     */
    function t4(){
        return (dataArray[numPoints-1][1]-dataArray[0][1])/(numPoints-1);
    }
    
    function retVar(){
        var i;
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
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
            t.push(funcs_T[funcT]);
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
    
    /**
     * Get or set the initial value for the level
     * @param {number} [value] - The value for the level
     * @returns Either the value for the level or the enclosing object
     */
    retVar.initialLevel = function(value){
        if(!arguments.length){ return l[0]; }
        l = [];
        
        l.push(value);
        
        return retVar;
    };
    
    /**
     * Get or set the initial value for the trend
     * @param {number} [value] - The value for the trend
     * @returns Either the value for the trend or the enclosing object
     */
    retVar.initialTrend = function(value){
        if(!arguments.length){ return t[0]; }
        t = [];
        
        t.push(value);
        
        return retVar;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
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
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){
        return output;
    };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){
        return resids;
    };

    /**
     * Returns the sum of squares of the residuals
     * @returns The sum of squares of the residuals
     */
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    /**
     * Provide or get the trend factor
     * @param {number} [value] - The trend factor
     * @returns If no parameter is passed in then the current trend value. Otherwise it will return the enclosing object.
     */
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
    
    /**
     * Provide a forecast of the function
     * @param {number} [d] - The number of time units to forecast ahead. If the data is monthly then 2 is 2 months.
     * @returns The forecast
     */
    retVar.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        //d=1 means one unit of time ahead. If the data is monthly, then d is in months
        var temp = l[l.length-1]+d*t[t.length-1];
        return temp;
    };

    /**
     * Specify the function to calculate the initial trend value
     * @param {'1' | '2' | '3' | '4'} [value='1'] - The function to calculate the initial value for the trend. The default is the average difference between the first 3 points
     * @returns If no parameter is provided then the function type is provided otherwise the enclosing object is returned.
     */
    retVar.initialTrendCalculation = function(value){
        if(!arguments.length){ return funcT; }
        //Check that the function is valid
        if(typeof funcs_T[value] !== 'function'){
            throw new Error('Invalid function');
        }
        
        funcT = value;
        
        return retVar;
    };
    
    return retVar;
};
