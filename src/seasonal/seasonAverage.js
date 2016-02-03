/**
 * Deseasonalise data based on the average for the period (specified by label range).
 * @param {array} dataArray - an array of points
 * @param {array} labels - an array holding the labels that specify the period e.g. Jan, Feb, Mar etc.
 * @returns {array} - an array with the new points 
 */
ssci.season.Average = function(dataArray, labels){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var numPoints = dataArray.length;
    var output = [];
    var i;
                
    //Check labels - is it an array and is it the right size
    if (typeof labels === 'object' && Array.isArray(labels)){
        //Does the length of the scale array match the number of points fed to the function
        if(labels.length !== dataArray.length){
            console.log(labels);
            throw new Error('Invalid label parameter');
        }
    } else {
        //What else can it be?
        console.log(labels);
        throw new Error('Invalid label parameter');
    }
    
    //Deseasonalise data
    //Calculate averages
    var labelSum = {};
    var labelCnt = {};
    var labelAvg = {};
    var totalSum=0;
    var totalCount=0;
    for(i=0;i<labels.length;i++){
        if(labels[i] in labelSum){
            labelSum[labels[i]] = labelSum[labels[i]] + dataArray[i][1];
        } else {
            labelSum[labels[i]] = dataArray[i][1];
        }
        
        if(labels[i] in labelCnt){
            labelCnt[labels[i]] = labelCnt[labels[i]] + 1;
        } else {
            labelCnt[labels[i]] = 1;
        }
        
        if(!(labels[i] in labelAvg)){
            labelAvg[labels[i]] = 0;
        }
        totalSum += dataArray[i][1];
        totalCount++;
    }
    var tempKeys = Object.keys(labelAvg);
    for(var wk=0;wk<tempKeys.length;wk++){
        labelAvg[tempKeys[wk]] = (labelSum[tempKeys[wk]]*totalCount)/(labelCnt[tempKeys[wk]]*totalSum);
    }
    
    for(i=0;i<numPoints;i++){
        output.push([dataArray[i][0], dataArray[i][1]/labelAvg[labels[i]]]);
    }
    
    return output;
};