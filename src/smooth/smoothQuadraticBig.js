/** 
 * Take an array of points and returns a set of smoothed points by fitting a quadratic to the data around the central point using Big objects
 * @param {array} dataArray - an array of points
 * @param {number} width - the width of the quadratic to fit in points
 * @returns {array} - an array with the new points
 */
ssci.smooth.QuadraticBig = function(dataArray, width){
    if(arguments.length!==2){
        throw new Error('Incorrect number of arguments passed');
    }
    
    var l_width;
    var numPoints = dataArray.length;
    var output = [];
    
    if(typeof width!== 'number'){
        console.log('width appears to not be a number - changed to 5');
        width = 5;
    }
    if(width % 2 === 0){
        width--;
    }
    if(width < 3){
        width = 5;
    }
    
    l_width = Math.floor(width/2);
    
    for(var m=0;m<numPoints;m++){
        var tempArray=[];
        for(var i=m-l_width;i<=m+l_width;i++){
            if(i<0){
                tempArray.push(dataArray[0]);
            } else if(i>numPoints-1){
                tempArray.push(dataArray[numPoints-1]);
            } else {
                tempArray.push(dataArray[i]);
            }
        }
        
        var temp = this.regPolyBig(tempArray,2).constants;
        output.push([dataArray[m][0], (temp[0]) + dataArray[m][0] * (temp[1]) + dataArray[m][0] * dataArray[m][0] * (temp[2])]);
    }
    
    return output;
};