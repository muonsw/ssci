/**
 * Deseasonalise data based on taking the moving average
 * @param {array} dataArray - an array of points
 * @param {number} frequency - the number of points to average over
 * @param {boolean} lastN - true if calculating an average over the last n points, false for a central average 
 * @returns {array} - an array with the new points
 */
ssci.season.MovingAverage = function(dataArray, frequency, lastN){
    if(arguments.length>3 || arguments.length<2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var ma=0;
    var counter=1;
    var weights = [];
    var i;
    
    //Check that frequency is in range and of the right type
    if(typeof frequency !== 'number'){
        frequency=12;
    }
    if(frequency>numPoints){
        throw new Error('Not enough data for this frequency');
    }
    
    //Check that lastN is a boolean
    if(typeof lastN !== 'boolean'){
        lastN = true;
    }
    
    //Create moving averages
    //Calculate weights to adjust for even frequency when used with a central average
    var width = Math.floor(frequency / 2);
    for(i=0;i<frequency;i++){
        weights[i] = 1;
    }
    
    for(i = frequency-1;i<numPoints;i++){
        counter = 0;
        ma=0;
        for(var j = i - (frequency-1);j<=i;j++){
            ma = ma + dataArray[j][1] * weights[counter];
            counter++;
        }
        
        if(lastN){
            output.push([dataArray[i][0], ma / frequency]);
        } else {
            output.push([dataArray[i-width+1][0], ma / frequency]);
        }
        
    }
    
    return output;
};