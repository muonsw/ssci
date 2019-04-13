/**
 * Deseasonalise the data by differencing the data and adding the moving average
 * @returns {function} - the function to create the points
 */
ssci.season.difference = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=[];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    
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
        
        //Calculate moving average
        for(i=frequency;i<numPoints;i++){
            ma[i]=0;
            for(var j=0;j<frequency;j++){
                ma[i]+=dataArray[i-j][1];
            }
            ma[i]/=frequency;
        }
        
        //Difference data
        for(i=frequency;i<numPoints;i++){
            output.push([dataArray[i][0], dataArray[i][1]-dataArray[i-frequency][1]+ma[i]]);
        }
    }
    
    /**
     * Returns the deseasonalised data
     * @returns The deseasonalised data
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
     * Define the frequency of the data series
     * @param {number} frequency - the number of points to difference over
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
