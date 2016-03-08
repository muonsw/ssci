/**
 * Deseasonalise data based on the average for the period (specified by label range).
 * @param {array} dataArray - an array of points
 * @param {array} labels - an array holding the labels that specify the period e.g. Jan, Feb, Mar etc.
 * @returns {array} - an array with the new points 
 */
ssci.season.average = function(){

    var numPoints = 0;
    var output = [];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var labels = [];
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check labels - is it an array and is it the right size
        if (typeof labels === 'object' && Array.isArray(labels)){
            //Does the length of the scale array match the number of points fed to the function
            if(labels.length !== dataArray.length){
                console.log(labels);
                throw new Error('Labels array is not the same length as the data array');
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
    }
    
    sa.labels = function(value){
        labels = value;
        
        return sa;
    };
    
    sa.output = function(){
        return output;
    };
    
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    return sa;
};
