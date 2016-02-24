/**
 * Create henderson filters of term 'term'
 * Returns an array with the terms
 * Formula taken from http://www.ons.gov.uk/ons/rel/elmr/economic-trends--discontinued-/no--633--august-2006/fitting-trends-to-time-series-data.pdf
 */ 

ssci.smooth.henderson = function(term){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term % 2 === 0){
        throw new Error('Term must be odd');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    var m = (term-1)/2;
    var j;
    var h = [];
    
    for(j=-m;j<(m+1);j++){
        
        h.push( (315*((m+1)*(m+1)-j*j)*((m+2)*(m+2)-j*j)*((m+3)*(m+3)-j*j)*(3*(m+2)*(m+2)-11*j*j-16))/ (8*(m+2)*((m+2)*(m+2)-1)*(4*(m+2)*(m+2)-1)*(4*(m+2)*(m+2)-9)*(4*(m+2)*(m+2)-25)) );
        
    }
    
    return h;
};
