/**
 * Exponentially smooth a data series - data series should be evenly spaced in the x-coordinate
 * This is the exponentially weighted moving average rather than what is more generally known as exponential smoothing.
 * Only good for non-trended, non-seasonal data
 * @returns {function} - the function to create the points
 */
ssci.smooth.EWMA = function(){
    
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var factor = 0.3;
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var i=0;i<numPoints;i++){
            if(i===0){
                output.push(dataArray[i]);
            } else {
                output.push([dataArray[i][0], dataArray[i][1]*factor + output[i-1][1]*(1-factor)]);
            }
        }
    }
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sm.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sm.data = function(value){
        data = value;
        return sm;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    sm.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return sm;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return sm;
        }
        
        factor = value;
        
        return sm;
    };
    
    return sm;
};
