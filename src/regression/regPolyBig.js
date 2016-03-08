/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression but return object and use Big objects
 * @param {array} dataArray - an array of points
 * @param {number} order - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
 * @returns {object} object containing an array of points ('x' coordinate in the first element of the point), array of constants for the polynomial and array of residuals
 */
ssci.reg.polyBig = function(){
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var resids=[];
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var con2=[];
    var detms;
    var newDA=[];    //Array of Bigs to hold data from dataArray
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
        
        //Initialise newDA
        for(i=0; i<dataArray.length; i++){
            var temp=[];
            temp.push(new Big(+dataArray[i][0]));
            temp.push(new Big(+dataArray[i][1]));
            newDA.push(temp);
        }
        
        //Initialise variables
        for(i=0;i<(order+1);i++){
            var temp2=[];
            var temp3=[];
            for(k=0;k<(order+1);k++){
                temp2.push(new Big(0));
                temp3.push(new Big(0));
            }
            ms.push(temp2);
            msdash.push(temp3);
            ns.push(new Big(0));
        }
        
        //Set up matrices
        for(i = 0;i<(order+1);i++){
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<dataArray.length;k++){
                    ms[i][j] = ms[i][j].plus(newDA[k][0].pow(i+j));
                }
            }
        }
        
        for(j = 0;j<(order+1);j++){
            for(k = 0;k<dataArray.length;k++){
                ns[j] = ns[j].plus(newDA[k][0].pow(j).times(newDA[k][1]));
            }
        }
        
        detms = ssci.reg.determinantBig(ms);
        if(detms.valueOf() === '0'){
            throw new Error('Determinant is zero. Fitted line is not calculable.');
        }
        
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
            con.push(ssci.reg.determinantBig(msdash).div(detms));    //Using Big.div - had to change DP in Big object
            con2.push(parseFloat(con[i].valueOf()));
        }
        
        for(k = 0;k<dataArray.length;k++){
            var tempb=new Big(0);
            for(j = 0;j<(order+1);j++){
                tempb = tempb.plus(newDA[k][0].pow(j).times(con[j]));
            }
            output.push([dataArray[k][0], tempb.valueOf()]);
            resids.push(dataArray[k][1]-parseFloat(tempb.toString()));
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
    
    rp.residuals = function(){
        return resids;
    };
    
    rp.constants = function(){
        return con2;
    };
    
    //Predict a new figure given an x value
    rp.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        
        var temp=new Big(0);
        for(var j = 0;j<(order+1);j++){
            temp = temp.plus(newDA[newDA.length-1][0].plus(d).pow(j).times(con[j]));
        }
        return temp;
    };
    //Also add r squared value?
    
    return rp;
};
