/**
 * Function to give the cumulative proportion of the panel who are purchasing on r occasions
 * given m and b, according to the NBD theory of purchasing
 * @param {number} r - Number of occasions that sample buy an item - 0,1,2,3 etc i.e. real integer
 * @param {number} m - Purchase rate of the total sample i.e. occasions/sample size
 * @param {number} b - Proportion of sample who have bought said item - range is 0 to 1
 * @returns {number} cumulative proportion of the sample
 */
ssci.mr.cnegbin = function(r, m, b){
    if(arguments.length!==3){
        throw new Error('Incorrect number of arguments passed');
    }
    if(typeof r !== 'number'){
        throw new Error('r is not a number');
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
    r = Math.round(r);
    var cnb=0;
    
    if (r < 1){
        cnb = this.negbin(0, m, b);
    } else {
        cnb = this.negbin(r, m, b) + this.cnegbin(r-1, m, b);
    }
    
    return cnb;
    
};