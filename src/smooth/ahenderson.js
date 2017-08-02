/**
 * Calculate asymmetric henderson weights
 * Formula taken from Doherty, M (2001); THE SURROGATE HENDERSON FILTERS IN X-11; Aust. N. Z. J. Stat. 43(4), 2001, 901–999
 * which I found here - http://www.stats.govt.nz/~/media/Statistics/surveys-and-methods/methods/data-analysis/x-12-arima-doherty.pdf
 * @param {array} filter - the filter to be adjusted to be asymmetric - i.e. the Henderson filter 
 * @param {number} term  - the length of the assymetric Henderson filter to be returned - needs to be less than filter.length
 * @param {number} IC    - Quoting from the PDF above - Here, for an additive adjustment, I is the average of absolute month to month change in the estimated irregular, and C is the average of the absolute month to month changes in an estimate of the trend. For a multiplicative adjustment, the I/C ratio is also used. However,the numerator is the average of the absolute monthly percentage changes in an estimated irregular; the denominator is the average of the absolute monthly percentage changes in an estimated trend. It can take a value from 0 to roughly 4.5.
 * @returns - an array containing the filter
 */

ssci.smooth.ahenderson = function(filter, term, IC){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    //Filter must be array
    if(!(typeof filter === 'object' && Array.isArray(filter))){
        throw new Error('Filter must be an array');
    }
    
    //IC greater than zero
    if(IC < 0){
        throw new Error('I/C must be >0');
    }
    
    var output=[];
    var bs = (4/Math.PI)/Math.pow(IC,2);
    var i,j;
    
    //fill output with zeroes
    for(i=0; i<filter.length; i++){
        output.push(0);
    }
    
    for(i=0; i<term; i++){
        var totW=0;
        for(j = term; j<filter.length; j++){
            totW+=filter[j];
        }
        
        var totW2=0;
        for(j = term; j<filter.length; j++){
            totW2+=((j+1)-(term+1)/2)*filter[j];
        }
        
        output[filter.length-term+i] = filter[i] + (1/term)*totW + (((i+1-(term+1)/2)*bs)/(1+((term*(term-1)*(term+1))/12)*bs)*totW2);
    }
    
    return output;
};
