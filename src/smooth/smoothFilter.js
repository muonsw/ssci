/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data
 */
ssci.smooth.filter = function(){
    
    var numPoints  = 0;
    var output     = [];
    var b          = 0;
    var i,j;        //Iterators
    var x_conv     = function(d){ return d[0]; };
    var y_conv     = function(d){ return d[1]; };
    var data       = [];
    var filter     = [1/3, 1/3, 1/3];
    var removeEnds = true;
    var m1         = -1;
    var m2         = 1;
    var limitSet   = false;
    var l_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5).reverse(); };
    var r_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5); };
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(!limitSet){
            if(filter.length % 2 === 0){
                m1 = -(Math.floor(filter.length/2))+1;
                m2 = Math.floor(filter.length/2);
            } else {
                m1 = -(Math.floor(filter.length/2));
                m2 = Math.floor(filter.length/2);
            }
        } else {
            //Check that the limits cover the filter length
            if(-m1+m2+1!==filter.length){
                throw new Error("Filter length is different to length specified by limits");
            }
        }
        
        //Filter the data
        for(i=0;i<numPoints;i++){
            b=0;
            
            //Calculate adjusted filter
            var afilter = [];
            if(!removeEnds && m1+i<0){
                afilter = l_filt(filter, filter.length+i+m1);
            } else if(!removeEnds && i+m2>(numPoints-1)){
                afilter = r_filt(filter, numPoints-i+m2);
            } else {
                afilter = filter.slice();
            }
            
            //Why am I not using afilter.length in the for statement below?
            for(j=0;j<filter.length;j++){
                //Check that i+j+m1>-1 && i+j+m1<numPoints 
                if(removeEnds){
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        b+=dataArray[i+j+m1][1]*afilter[j];
                    } else {
                        //Do nothing
                    }
                } else {
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        if(m1+i<0){
                            b+=dataArray[i+j+m1][1]*afilter[j+i+m1];
                            //console.log("l",i,j,dataArray[i+j+m1][1],afilter[j+i+m1],m1,m2);
                        } else if(i+m2>(numPoints-1)){
                            b+=dataArray[i+j+m1][1]*afilter[j+i-numPoints+1-m1];
                            //console.log("r",i,j,dataArray[i+j+m1][1],afilter[j+i-numPoints+1-m1],m1,m2);
                        } else {
                            b+=dataArray[i+j+m1][1]*afilter[j];
                            //console.log("c",i,j,dataArray[i+j+m1][1],afilter[j],m1,m2);
                        }
                    } else {
                        //Do nothing
                    }
                }
            }
            
            if(removeEnds && i+m1>-1 && i+m2<numPoints){
                output.push([dataArray[i][0], b]);
            }
            if(!removeEnds){
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
        //Set the filter
        if(!arguments.length){ return filter; }
        
        //Check that the filter is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Filter must be an array');
        }
        
        filter = value;
        
        return sm;
    };
    
    sm.limits = function(value){
        //Set limits of filter i.e. where to apply it
        if(!arguments.length){ return [m1,m2]; }
        
        //Check that the 'limits' is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Limits must be an array');
        }
        //Check input array length
        if(value.length !== 2){ throw new Error("Limits must be an array of length 2"); }
        //Check that the inputs are numbers
        if(typeof value[0]!=='number' && typeof value[1]!=='number'){ throw new Error('Input must be a number'); }
        
        m1 = value[0];
        m2 = value[1];
        limitSet = true;
        
        return sm;
    };
    
    /**
     * Set whether values are calculated for the end of a series - false to calculate them
     */
    sm.end = function(value){
        if(!arguments.length){ return removeEnds; }
        
        //Check removeEnds
        if(typeof removeEnds !== 'boolean'){
            removeEnds = true;
        } else {
            removeEnds = value;
        }
        
        return sm;
    };
    
    /**
     * Calculate gain
     * @param {number} d The period to calculate the gain for
     */
    sm.gain = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var temp = 0;
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        temp = Math.sqrt(g1*g1 + g2*g2);
        
        return temp;
    };
    
    /**
     * Calculate the phase shift caused by the filter
     * @param {number} d The period to calculate the phase shift for
     */
    sm.phaseShift = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        return pf(g1, g2)/(2 * Math.PI / d);
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

    /**
     * Set or get the function to calculate the weights for the start of the data series if 'end' is false
     * @param {function} 
     */
    sm.left = function(value){
        if(!arguments.length){ return l_filt; }
        l_filt = value;
        return sm;
    };
    
    /**
     * Set or get the function to calculate the weights for the end of the data series if 'end' is false
     */
    sm.right = function(value){
        if(!arguments.length){ return r_filt; }
        r_filt = value;
        return sm;
    };

    return sm;
    
};
