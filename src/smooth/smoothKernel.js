/** 
 * Take an array of points and returns a set of smoothed points by applying a filter (specified by the kernel function) to the data
 * @param {string} kernel - the smoothing kernel to use
 * @param {array} dataArray - an array of points
 * @param {number|array} scale - an array or number containing the scaling parameters of the kernel
 * @returns {array} - an array with the new points
 */
ssci.smooth.kernel = function(kernel, dataArray, scale){
    if(arguments.length!==3){
        throw new Error('Incorrect number of arguments passed');
    }
    var output=[];
    var kernels = {
        'Uniform': k_U,
        'Triangle': k_T,
        'Epanechnikov': k_E,
        'Quartic': k_Q,
        'Triweight': k_TW,
        'Logistic': k_L,
        'Cosine': k_Co,
        'Gaussian': k_G,
        'Tricube': k_TC,
        'Silverman': k_S
    };
    var i;      //Iterator
    
    //Deal with scale
    var scales = [];
    
    if(typeof scale === 'number'){
        //Create an array of length dataArray and populate with scale parameter
        for(i=0;i<dataArray.length;i++){
            scales.push(scale);
        }
    } else if (typeof scale === 'object' && Array.isArray(scale)){
        //Does the length of the scale array match the number of points fed to the function
        if(scale.length === dataArray.length){
            scales = scale.slice();
        } else {
            //Put in for completeness but will almost never be what is intended
            var counter=0;
            for(i=0;i<dataArray.length;i++){
                scales.push(scale[counter]);
                if(i<scale.length){
                    counter++;
                } else {
                    counter=0;
                }
            }
        }
    } else {
        //What else can it be?
        console.log(scale);
        throw new Error('Invalid scale parameter');
    }
    
    //Check that the kernel is valid
    if(typeof kernels[kernel] !== 'function'){
        throw new Error('Invalid kernel');
    }
    
    //Calculate smoothed values
    for(i=0;i<dataArray.length;i++){
        var tot_ker1 = 0;
        var tot_ker2 = 0;
        
        for(var j=0;j<dataArray.length;j++){
            var temp_ker=0;
            
            temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
            
            tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
            tot_ker2 = tot_ker2 + temp_ker;
        }
        
        output.push([dataArray[i][0],(tot_ker1 / tot_ker2)]);
    }
    
    return output;
};
