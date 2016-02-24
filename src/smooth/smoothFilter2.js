/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data around the central point
 */
ssci.smooth.filter = function(){
    
    var numPoints = 0;
    var output    = [];
    var l_width   = 1;
    var b         = 0;
    var i,j;        //Iterators
    var x_conv    = function(d){ return d[0]; };
    var y_conv    = function(d){ return d[1]; };
    var data      = [];
    var filter    = [1/3, 1/3, 1/3];
    var removeEnds = true;
    var m1        = -1;
    var m2        = 1;
    var limitSet  = false;
    
    function sm(){
        var dataArray = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        l_width = Math.floor(filter.length/2);
        
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
                throw new Error("Filter length is different to limits");
            }
        }
        
        //Filter the data
        for(i=0;i<numPoints;i++){
            b=0;
            for(j=0;j<filter.length;j++){
                //Check that i+j+m1>-1 && i+j+m1<numPoints 
                //If not then then use first point and roll up filter if removeEnds=false
                if(i+j+m1>-1 && i+j+m1<numPoints){
                    b+=dataArray[i+j+m1][1]*filter[j];
                } else {
                    if(!removeEnds){
                        b+=dataArray[i][1]*filter[j];
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
        if(!arguments.length){ return filter; }
        
        //Check that the filter is an array and size is odd
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Filter must be an array');
        }
        
        filter = value;
        
        return sm;
    };
    
    sm.limits = function(value){
        if(!arguments.length){ return [m1,m2]; }
        
        m1 = value[0];
        m2 = value[1];
        limitSet = true;
        
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
