/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression but return object and use Big objects
 * @param {array} dataArray - an array of points
 * @param {number} order - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
 * @returns {object} object containing an array of points ('x' coordinate in the first element of the point), array of constants for the polynomial and array of residuals
 */
ssci.reg.polyBig = function(dataArray, order){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    if(order>(dataArray.length-1)){
        order=dataArray.length-1;
        console.log('Order changed to ' + (dataArray.length-1));
    }
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var resids=[];
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var con2=[];
    var detms;
    var retVar={};
    var newDA=[];    //Array of Bigs to hold data from dataArray
    var i,j,k;
    
    //Check that order is a number
    if(typeof order!== 'number'){
        order = 2;
    }
    if(order <= 0){
        order = 2;
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
                //ms[i][j] = ms[i][j] + Math.pow(dataArray[k][0], (i+j));
                ms[i][j] = ms[i][j].plus(newDA[k][0].pow(i+j));
            }
        }
    }
    
    for(j = 0;j<(order+1);j++){
        for(k = 0;k<dataArray.length;k++){
            //ns[j] += Math.pow(dataArray[k][0], j) * dataArray[k][1];
            ns[j] = ns[j].plus(newDA[k][0].pow(j).times(newDA[k][1]));
        }
    }
    
    detms = this.determinantBig(ms);
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
        con.push(this.determinantBig(msdash).div(detms));    //Using Big.div - had to change DP in Big object
        con2.push(parseFloat(con[i].valueOf()));
    }
    
    for(k = 0;k<dataArray.length;k++){
        var tempb=new Big(0);
        for(j = 0;j<(order+1);j++){
            //temp+=Math.pow(dataArray[k][0], j)*con[j];
            tempb = tempb.plus(newDA[k][0].pow(j).times(con[j]));
        }
        output.push([dataArray[k][0], tempb.valueOf()]);
        resids.push(dataArray[k][1]-parseFloat(tempb.toString()));
    }
    
    retVar.output = output;
    retVar.residuals = resids;
    retVar.constants = con2;
    retVar.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        
        var temp=new Big(0);
        for(var j = 0;j<(order+1);j++){
            //temp+=Math.pow((+dataArray[dataArray.length-1][0]+d), j)*con[j];
            temp = temp.plus(newDA[newDA.length-1][0].plus(d).pow(j).times(con[j]));
        }
        return temp;
    };
    //Also add r squared value?
    
    return retVar;
};