/** 
 * Take an array of points and returns a set of smoothed points by fitting a quadratic to the data around the central point
 * @param {array} dataArray - an array of points
 * @param {number} width - the width of the quadratic to fit in points
 * @returns {array} - an array with the new points
 */
ssci.smooth.quadratic = function(){
    
    var width = 5;
    var l_width = 2;
    var numPoints = 0;

    var n = 0;
    var x = 0;
    var x2 = 0;
    var x3 = 0;
    var x4 = 0;
    var y = 0;
    var xy = 0;
    var x2y = 0;
    var d;
    var b1;
    var b2;
    var b3;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    
    function qb() {
        var dataArray = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var m=0;m<numPoints;m++){
            for(var i=m-l_width;i<=m+l_width;i++){
                var j;
                j=i;
                if(j<0){j=0;}
                if(j>numPoints-1){j=numPoints-1;}
                
                n++;
                x = x + dataArray[j][0];
                x2 = x2 + Math.pow(dataArray[j][0],2);
                x3 = x3 + Math.pow(dataArray[j][0],3);
                x4 = x4 + Math.pow(dataArray[j][0],4);
                y = y + dataArray[j][1];
                xy = xy + dataArray[j][0] * dataArray[j][1];
                x2y = x2y + Math.pow(dataArray[j][0],2) * dataArray[j][1];
            }
            
            d = (n * (x2 * x4 - x3 * x3)) - (x * (x * x4 - x3 * x2)) + (x2 * (x * x3 - x2 * x2));
            
            b1 = (x2 * x4 - x3 * x3) * y - (x * x4 - x3 * x2) * xy + (x * x3 - x2 * x2) * x2y;
            b2 = -(x * x4 - x2 * x3) * y + (n * x4 - x2 * x2) * xy - (n * x3 - x * x2) * x2y;
            b3 = (x * x3 - x2 * x2) * y - (n * x3 - x * x2) * xy + (n * x2 - x * x) * x2y;
            
            output.push([dataArray[m][0], (b1/d) + dataArray[m][0] * (b2/d) + dataArray[m][0] * dataArray[m][0] * (b3/d)]);    
            
            //Reset x and y values
            n = 0;
            x = 0;
            x2 = 0;
            x3 = 0;
            x4 = 0;
            y = 0;
            xy = 0;
            x2y = 0;
        }
    }
    
    qb.width = function(value){
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
