/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data around the central point
 * @param {array} dataArray - an array of points
 * @param {number} filter - an array containing the filter to apply. The filter is a series of weights to apply to the data points. Should be odd and sum to one for the filtered series to sum to the original series.
 * @param {string} removeEnds - if true then removes data that can't be filtered at the start and end of the series. If false applies the filter assymmetrically.
 * @returns {array} - an array with the new points
 */
ssci.smooth.filterOld = function(){
    
    var numPoints = 0;
    var output = [];
    var l_width=0;
    var b=0;
    var i,j;        //Iterators
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var filter = [];
    var removeEnds = true;
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        l_width = Math.floor(filter.length/2);
    
        //Take care of the start where filtering can't take place
        if(!removeEnds){
            for(i=0;i<l_width;i++){
                b=0;
                for(j=0;j<2*l_width+1;j++){
                    if((i+j-l_width)>=0){
                        b+=dataArray[i+j-l_width][1]*filter[j];
                    } else {
                        b+=dataArray[i][1]*filter[j];
                    }
                }
                output.push([dataArray[i][0], b]);
            }
        }
        
        //Filter the data
        for(i=l_width;i<numPoints-l_width;i++){
            b=0;
            for(j=0;j<2*l_width+1;j++){
                b+=dataArray[i+j-l_width][1]*filter[j];
            }
            
            output.push([dataArray[i][0], b]);
        }
        
        //Take care of the end where filtering can't take place
        if(!removeEnds){
            for(i=numPoints-l_width;i<numPoints;i++){
                b=0;
                for(j=0;j<2*l_width+1;j++){
                    if((i+j-l_width)<numPoints){
                        b+=dataArray[i+j-l_width][1]*filter[j];
                    } else {
                        b+=dataArray[i][1]*filter[j];
                    }
                }
                output.push([dataArray[i][0], b]);
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
    
    sm.filter = function(value){
        if(!arguments.length){ return filter; }
        
        //Check that the filter is an array and size is odd
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Filter must be an array');
        }
        if(value.length % 2 === 0){
            throw new Error('Filter must be of an odd size');
        }
        if(value.length < 3){
            throw new Error('Filter size must be greater than 2');
        }
        
        filter = value;
        
        return sm;
    };
    
    sm.end = function(value){
        if(!arguments.length){ return removeEnds; }
        
        //Check removeEnds
        if(typeof removeEnds !== 'boolean'){
            removeEnds = true;
        }
        
        removeEnds = value;
        
        return sm;
    };
    
    sm.gain = function(d){
        //Create gain function
        
        var temp = 0;
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i-l_width) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i-l_width) * 2 * Math.PI / d);
        }
        
        temp = Math.sqrt(g1*g1 + g2*g2);
        
        return temp;
    };
    
    sm.phaseShift = function(d){
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i-l_width) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i-l_width) * 2 * Math.PI / d);
        }
        
        return pf(g1, g2);
    };

    function pf(c, s){
        
        if( c > 0 ){
            return Math.atan(s / c);
        } else if (c < 0 && s >= 0){
            return Math.atan(s / c) + Math.PI;
        } else if (c < 0 && s < 0){
            return Math.atan(s / c) - Math.PI;
        } else if (c === 0 && s > 0) {
            return Math.PI / 2;
        } else if (c === 0 && s < 0) {
            return -Math.PI / 2;
        } else if (c === 0 && s === 0) {
            return 0;
        } else {
            return Number.NaN;
        }
        
    }

    return sm;
    
};
