/** 
 * Take an array of n points and returns the parameters of n-1 cubic splines
 * i.e. spline interpolation - algorithm from Numerical Analysis 7th Edition, Burden & Faires
 * @param {array} dataArray - an array of n points
 * @returns {array} - an array with the n-1 parameter objects
 */
function splineInterpolation(dataArray){
    var h = [];
    var alpha = [];
    var l = [];
    var mu = [];
    var z = [];
    var c = [];
    var d = [];
    var b = [];
    var a = [];
    var output = [];
    var i;
    
    //Natural spline interpolation only
    //Create x differences array
    for(i=0;i<(dataArray.length-1);i++){
        h[i] = dataArray[i+1][0] - dataArray[i][0];
    }

    for(i=1;i<(dataArray.length-1);i++){
        alpha[i] = (3 / h[i]) * (dataArray[i+1][1] - dataArray[i][1]) - (3 / h[i-1]) * (dataArray[i][1] - dataArray[i-1][1]);
    }

    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;
    
    for(i=1;i<(dataArray.length-1);i++){
        l[i] = 2*(dataArray[i+1][0]-dataArray[i-1][0])-h[i-1]*mu[i-1];
        mu[i] = h[i]/l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    l[dataArray.length-1] = 1;
    z[dataArray.length-1] = 0;
    c[dataArray.length-1] = 0;
    
    //Create parameters of cubic spline
    for(var j=(dataArray.length-2);j>=0;j--){
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (dataArray[j+1][1] - dataArray[j][1]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
        a[j] = dataArray[j][1];
        //Equation = a + bx + cx^2 + dx^3
        output[j] = [a[j], b[j], c[j], d[j]];
    }
    
    return output;
}