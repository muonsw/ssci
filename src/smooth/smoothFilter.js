/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data around the central point
 * @param {array} dataArray - an array of points
 * @param {number} filter - an array containing the filter to apply. The filter is a series of weights to apply to the data points. Should be odd and sum to one for the filtered series to sum to the original series.
 * @param {string} removeEnds - if true then removes data that can't be filtered at the start and end of the series. If false applies the filter assymmetrically.
 * @returns {array} - an array with the new points
 */
ssci.smooth.Filter = function(dataArray, filter, removeEnds){
    if(arguments.length!==3){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var l_width=0;
    var b=0;
    var i,j;        //Iterators
    
    //Check that the filter is an array and size is odd
    if(!(typeof filter === 'object' && Array.isArray(filter))){
        throw new Error('Filter must be an array');
    }
    if(filter.length % 2 === 0){
        throw new Error('Filter must be of an odd size');
    }
    if(filter.length < 3){
        throw new Error('Filter size must be greater than 2');
    }
    
    //Check removeEnds
    if(typeof removeEnds !== 'boolean'){
        removeEnds = true;
    }
    
    l_width = Math.floor(filter.length/2);
    
    //Take care of the start where filtering can't take place
    if(!removeEnds){
        for(i=0;i<l_width;i++){
            b=0;
            for(j=0;j<2*l_width+1;j++){
                if((i+j-l_width)>=0){
                    b+=dataArray[i+j-l_width][1]*filter[j];
                } else {
                    b+=dataArray[i][1]*filter[j];
                }
            }
            output.push([dataArray[i][0], b]);
        }
    }
    
    //Filter the data
    for(i=l_width;i<numPoints-l_width;i++){
        b=0;
        for(j=0;j<2*l_width+1;j++){
            b+=dataArray[i+j-l_width][1]*filter[j];
        }
        
        output.push([dataArray[i][0], b]);
    }
    
    //Take care of the end where filtering can't take place
    if(!removeEnds){
        for(i=numPoints-l_width;i<numPoints;i++){
            b=0;
            for(j=0;j<2*l_width+1;j++){
                if((i+j-l_width)<numPoints){
                    b+=dataArray[i+j-l_width][1]*filter[j];
                } else {
                    b+=dataArray[i][1]*filter[j];
                }
            }
            output.push([dataArray[i][0], b]);
        }
    }
    
    return output;
    
};