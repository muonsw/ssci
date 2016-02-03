/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression
 * @param {array} dataArray - an array of points
 * @param {number} order - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
 * @returns {array} an array of points, 'x' coordinate in the first element of the point
 */
ssci.reg.poly = function(dataArray, order){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    //Change order if it is greater than the number of points
    if(order>(dataArray.length-1)){
        order=dataArray.length-1;
        console.log('Order changed to ' + (dataArray.length-1));
    }
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var detms;
    var i,j,k;
    
    //Check that order is a number
    if(typeof order!== 'number'){
        order = 2;
    }
    if(order <= 0){
        order = 2;
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
    
    detms = ssci.determinant(ms);
    
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
        con.push(ssci.determinant(msdash) / detms);
    }
    
    for(k = 0;k<dataArray.length;k++){
        var temp=0;
        for(j = 0;j<(order+1);j++){
            temp+=Math.pow(dataArray[k][0], j)*con[j];
        }
        output.push([dataArray[k][0], temp]);
    }
    
    return output;
};