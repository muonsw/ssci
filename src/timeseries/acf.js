/**
 * Calculates the auto-correlation
 * @returns {function} - the function to create the points
 */
ssci.ts.acf = function(){

    var output=[];
    var numPoints=0;
    var lags=[];
    var x=[];
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var maxlag = 20;
    var diffed = 0;
    
    function run(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(maxlag>(dataArray.length-diffed)){
            maxlag = dataArray.length-diffed;
            console.log('Not enough points for the number of lags requested. Max lag changed to ' + maxlag);
        }
        
        //Create lags array
        for(i=0;i<(maxlag+1);i++){
            lags.push(i);
        }
        
        //Create data array - i.e. differenced if necessary
        if(diffed>0){
            for(i=0;i<(numPoints-1);i++){
                x.push(dataArray[i][1]-dataArray[i+1][1]);
            }
        } else {
            for(i=0;i<numPoints;i++){
                x.push(dataArray[i][1]);
            }
        }
        
        if(diffed>1){
            for(j=0;j<(diffed-1);j++){
                for(i=0;i<(numPoints-1-j);i++){
                    x[i]=x[i]-x[i+1];
                }
                x.pop();
            }
        }
        
        //Calculate acf - assuming stationarity i.e. mean and variance constant (sort of)
        for(i=0;i<=maxlag;i++){
            var sx = 0;
            var s1 = 0;
            var s2 = 0;
            
            //Calculate mean
            for(k = 0;k<(numPoints-diffed);k++){
                sx = x[k] + sx;
            }
            sx = sx / (numPoints-diffed);
            
            //Calculate correlation
            for(k = 0;k<(numPoints - diffed);k++){
                if(k<(numPoints - lags[i] - diffed)){
                    s1 = s1 + (x[k] - sx) * (x[k + lags[i]] - sx);
                }
                s2 = s2 + Math.pow(x[k] - sx,2);
            }

            output.push([i, s1 / s2]);
        }
    }
    
    /**
     * Returns the correlation array
     * @returns The correlation array
     */
    run.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    run.data = function(value){
        data = value;
        return run;
    };
    
    /**
     * Get or set the maximum value of the lag to calculate the acf for
     * @param {number} [value] - The maximum lag
     * @returns The maximmum lag or the enclosing object
     */
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    /**
     * Get or set the number of times to difference the data
     * @param {number} [value] - The number of times to difference the data
     * @returns The number of times to difference the data or the enclosing object.
     */
    run.diff = function(value){
        if(!arguments.length){ return diffed; }
        
        if(typeof diffed !== 'number'){
            throw new Error('diffed is not a number');
        }
        
        diffed = value;
        
        return run;
    };
    
    return run;
};