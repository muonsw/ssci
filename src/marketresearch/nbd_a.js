/**
 * Calculates the 'a' parameter of the NBD function
 * @param {number} b - Proportion of sample who have bought said item - range is 0 to 1
 * @param {number} m - Purchase rate of the total sample i.e. occasions/sample size
 * @returns {number} the 'a' parameter
 */
ssci.mr.nbd_a = function(b, m){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    if(typeof m !== 'number'){
        throw new Error('m is not a number');
    }
    if(typeof b !== 'number'){
        throw new Error('b is not a number');
    }
    if(b>1 || b<0){
        throw new Error('b must be between 0 and 1');
    }
    
    //Calculate frequency of purchase for buyers
    var w = m/b;
    //Calculate preliminary values
    var x = -(b * w / Math.log(1 - b));
    var y = x * Math.log(x) + x - 1;
    var z = y - (x * Math.log(1 + y) - y) / (x / (y + 1) - 1);
    var iterations=100;
    var convergence=1e-15;
    var n = 0;
    
    do {
        n++;
        y = z;
        z = y - (x * Math.log(1 + y) - y) / (x / (y + 1) - 1);
    } while (n<iterations && Math.abs(y-z)>convergence);
    
    return y;
};