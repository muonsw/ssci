/**
 * Deseasonalise data based on taking the moving average
 * @param {number} frequency - the number of points to average over
 * @returns {function} - the function to create the points
 */
ssci.season.movingAverage = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=0;
    var counter=1;
    var weights = [];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    var lastN = true;
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check that there are enough points in the data series
        if(frequency>numPoints){
            throw new Error('Not enough data for this frequency');
        }
        
        //Create moving averages
        //Calculate weights to adjust for even frequency when used with a central average
        var width = Math.floor(frequency / 2);
        for(i=0;i<frequency;i++){
            weights[i] = 1;
        }
        
        for(i = frequency-1;i<numPoints;i++){
            counter = 0;
            ma=0;
            for(var j = i - (frequency-1);j<=i;j++){
                ma = ma + dataArray[j][1] * weights[counter];
                counter++;
            }
            
            if(lastN){
                output.push([dataArray[i][0], ma / frequency]);
            } else {
                output.push([dataArray[i-width+1][0], ma / frequency]);
            }
            
        }
    }
    
    /**
     * Get or set a boolean value to state whether the average is calculated over the last n points or as a central average.
     * @param {boolean} value - true if calculating an average over the last n points, false for a central average.
     * @returns If no parameter is passed in then the value is returned, otherwise returns the enclosing object
     */
    sa.end = function(value){
        if(!arguments.length){ return lastN; }
        
        //Check that lastN is a boolean
        if(typeof value !== 'boolean'){
            lastN = true;
        }
        
        lastN = value;
        
        return sa;
    };
    
    /**
     * Returns the averaged data
     * @returns The averaged data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    /**
     * Get or set the frequency of the data series
     * @param {number} [value] - The frequency of the data series i.e. if monthly then frequency is 12.
     * @returns The frequency if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.frequency = function(value){
        if(!arguments.length){ return frequency; }
        
        //Check that frequency is in range and of the right type
        if(typeof value !== 'number'){
            console.log('frequency appears to not be a number - changed to 12');
            frequency=12;
        }
        
        frequency = value;
        
        return sa;
    };
    
    return sa;
};
