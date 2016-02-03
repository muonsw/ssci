/**
 * Function to give the proportion of a population who are purchasing on r occasions
 * given m and b, according to the NBD theory of purchasing (Repeat Buying, Ehrenberg - http://www.empgens.com/ArticlesHome/Volume5/RepeatBuying.html)
 * @param {number} r - Number of occasions that sample buy an item - 0,1,2,3 etc i.e. real integer
 * @param {number} m - Purchase rate of the total sample i.e. occasions/sample size
 * @param {number} b - Proportion of sample who have bought said item - range is 0 to 1
 * @returns {number} proportion of the sample
 */
ssci.mr.negbin = function(r, m, b){
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
    
    //Calculate a
    var a = this.nbd_a(b,m);
    
    //Calculate k
    var k = m/a;
    
    //NBD only exists if m>=-ln(p0)
    if(m>=-Math.log(1-b)){
        //Calculate p and return
        return (this.gamma(k+r)/(this.gamma(r+1)*this.gamma(k)))*(Math.pow(a+1,-k))*(Math.pow(a/(a+1),r));
    } else {
        return NaN;
    }
    
};