/**
 * Deseasonalise the data by differencing the data and adding the moving average
 * @param {array} dataArray - an array of points
 * @param {number} frequency - the number of points to difference over
 * @returns {array} - an array with the new points
 */
ssci.season.Difference = function(dataArray, frequency){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var ma=[];
    var i;
    
    //Check that frequency is in range and of the right type
    if(typeof frequency !== 'number'){
        console.log('frequency appears to not be a number - changed to 12');
        frequency=12;
    }
    if(frequency>numPoints){
        throw new Error('Not enough data for this frequency');
    }
    
    //Calculate moving average
    for(i=frequency;i<numPoints;i++){
        ma[i]=0;
        for(var j=0;j<frequency;j++){
            ma[i]+=dataArray[i-j][1];
        }
        ma[i]/=frequency;
    }
    
    //Difference data
    for(i=frequency;i<numPoints;i++){
        output.push([dataArray[i][0], dataArray[i][1]-dataArray[i-frequency][1]+ma[i]]);
    }
    
    return output;
};