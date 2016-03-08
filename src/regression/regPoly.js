/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression
 * @param {array} dataArray - an array of points
 * @param {number} order - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
 * @returns {array} an array of points, 'x' coordinate in the first element of the point
 */
ssci.reg.poly = function(){
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var detms;
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var order = 2;
    
    function rp(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
        //Change order if it is greater than the number of points
        if(order>(dataArray.length-1)){
            order=dataArray.length-1;
            console.log('Order changed to ' + (dataArray.length-1));
        }
        
        //Initialise variables
        for(i=0;i<(order+1);i++){
            var temp2=[];
            var temp3=[];
            for(k=0;k<(order+1);k++){
                temp2.push(0);
                temp3.push(0);
            }
            ms.push(temp2);
            msdash.push(temp3);
            ns.push(0);
        }
        
        //Set up matrices
        for(i = 0;i<(order+1);i++){
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<dataArray.length;k++){
                    ms[i][j] += Math.pow(dataArray[k][0], (i+j));
                }
            }
        }
        
        for(j = 0;j<(order+1);j++){
            for(k = 0;k<dataArray.length;k++){
                ns[j] += Math.pow(dataArray[k][0], j) * dataArray[k][1];
            }
        }
        
        detms = ssci.reg.determinant(ms);
        
        for(i = 0;i<(order+1);i++){
            //'Set up M'
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<(order+1);k++){
                    if(k === i){
                        msdash[j][k] = ns[j];
                    } else {
                        msdash[j][k] = ms[j][k];
                    }
                }
            }
            con.push(ssci.reg.determinant(msdash) / detms);
        }
        
        for(k = 0;k<dataArray.length;k++){
            var temp=0;
            for(j = 0;j<(order+1);j++){
                temp+=Math.pow(dataArray[k][0], j)*con[j];
            }
            output.push([dataArray[k][0], temp]);
        }
    }
    
    rp.order = function(value){
        if(!arguments.length){ return order; }
        
        //Check that order is a number
        if(typeof value!== 'number'){
            order = 2;
        }
        if(value <= 0){
            order = 2;
        }
        order = value;
        
        return rp;
    };
    
    rp.output = function(){
        return output;
    };
    
    rp.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return rp;
    };
    
    rp.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return rp;
    };
    
    rp.data = function(value){
        data = value;
        return rp;
    };
    
    return rp;
};
