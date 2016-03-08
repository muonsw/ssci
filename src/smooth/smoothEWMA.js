/**
 * Exponentially smooth a data series - data series should be evenly spaced in the x-coordinate
 * This is the exponentially weighted moving average rather than what is more generally known as exponential smoothing.
 * Only good for non-trended, non-seasonal data
 * @param {array} dataArray - an array of points
 * @param {number} factor - factor to smooth by
 * @returns {array} - an array with the new points
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
    
    sm.output = function(){
        return output;
    };
    
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    sm.data = function(value){
        data = value;
        return sm;
    };
    
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
