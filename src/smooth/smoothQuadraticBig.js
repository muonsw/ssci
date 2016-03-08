/** 
 * Take an array of points and returns a set of smoothed points by fitting a quadratic to the data around the central point using Big objects
 * @param {array} dataArray - an array of points
 * @param {number} width - the width of the quadratic to fit in points
 * @returns {array} - an array with the new points
 */
ssci.smooth.quadraticBig = function(){
    
    var width = 5;
    var l_width = 2;
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    
    function qb() {
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var m=0;m<numPoints;m++){
            var tempArray=[];
            for(var i=m-l_width;i<=m+l_width;i++){
                if(i<0){
                    tempArray.push(dataArray[0]);
                } else if(i>numPoints-1){
                    tempArray.push(dataArray[numPoints-1]);
                } else {
                    tempArray.push(dataArray[i]);
                }
            }
            
            var temp_func = ssci.reg.polyBig()
                                    .data(tempArray)
                                    .order(2);
            temp_func();
            var temp = temp_func.constants();
            output.push([dataArray[m][0], (temp[0]) + dataArray[m][0] * (temp[1]) + dataArray[m][0] * dataArray[m][0] * (temp[2])]);
        }
    }
    
    qb.width = function(value){
        if(!arguments.length){ return width; }
        
        if(typeof value!== 'number'){
            console.log('width appears to not be a number - changed to 5');
            return qb;
        }
        if(value % 2 === 0){
            value--;
        }
        if(value < 3){
            value = 5;
        }
        
        width = value;
        l_width = Math.floor(value/2);
        
        return qb;
    };
    
    qb.data = function(value){
        data = value;
		
		return qb;
    };
    
    qb.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return qb;
    };
    
    qb.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return qb;
    };
    
    qb.output = function(){
        return output;
    };
    
    return qb;
};