/**
 * Exponential smoothing - smooth a series of points
 * Points passed in via the .data() function
 * Calculates the forecast points, the residuals, the sum of squares of the residuals and the factor
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
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing function
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
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    return retVar;
};
