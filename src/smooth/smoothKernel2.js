/** 
 * Take an array of points and returns a set of smoothed points by applying a filter (specified by the kernel function) to the data
 * This function cuts off the kernel calculations after the kernel decreases beyond a certain level
 * @returns {function} - the function to create the points
 */
ssci.smooth.kernel2 = function(){

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
    var max_diff = 0.001;   //Maximum difference to calculate kernel - equivalent to 0.1%
    var scale = [];
    var data = [];
    var kernel = "Gaussian";
    var i, j;               //Iterators
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function sk() {
        var dataArray = [];
		
		//Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
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
        
        //Calculate smoothed values
        for(i=0;i<dataArray.length;i++){
            var tot_ker1 = 0;
            var tot_ker2 = 0;
            var temp_ker = 0;
            
            //Kernel for point=i
            var self_ker = kernels[kernel](dataArray[i][0], dataArray[i][0], scales[i]);
            tot_ker1 = tot_ker1 + self_ker * dataArray[i][1];
            tot_ker2 = tot_ker2 + self_ker;
            
            //Kernel for lower points
            for(j=i-1; j>-1; j--){
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                if(temp_ker/self_ker<max_diff){
                    break;
                }
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            //Kernel for higher points
            for(j=i+1; j<dataArray.length; j++){
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                if(temp_ker/self_ker<max_diff){
                    break;
                }
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            output.push([dataArray[i][0],(tot_ker1 / tot_ker2)]);
        }
    }
    
    /**
     * Define the scale for the kernel. This can take a number or an array of numbers. Generally the array will have the same number of values as the data array.
     * @param {number|array} [value] - an array or number containing the scaling parameters of the kernel
     * @returns If no parameter is passed in then the scale is returned
     */
    sk.scale = function(value){
        if(!arguments.length){ return scale; }
        scale = value;
        
        return sk;
    };
    
    /**
     * Define the kernel function to use in the smoothing function. The default is 'Gaussian'
     * @param {'Uniform' | 'Triangle' | 'Epanechnikov' | 'Quartic' | Triweight | 'Logistic' | 'Cosine' | 'Gaussian' | 'Tricube' | 'Silverman'} [value='Gaussian'] - the smoothing kernel to use
     * @returns The kernel if no parameter is passed in
     */
    sk.kernel = function(value){
        if(!arguments.length){ return kernel; }
        //Check that the kernel is valid
        if(typeof kernels[value] !== 'function'){
            throw new Error('Invalid kernel');
        }
        
        kernel = value;
        
        return sk;
    };
    
    /**
     * Define a function to convert the x data passed in to the kernel function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    sk.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sk;
    };
    
    /**
     * Define a function to convert the y data passed in to the kernel function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    sk.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sk;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sk.output = function(){
        return output;
    };
    
    /**
     * Define or return the stopping parameter. The calculation will stop once the proportional value calculated is less than this value.
     * @param {number} [value=0.001] - The number to stop the calculation at. The dafault number stops the calculation once the adjusted points add less then 0.1% to the total adjusted figure.
     * @returns Either the value or the enclosing object
     */
    sk.diff = function(value){
        if(!arguments.length){ return max_diff; }
        max_diff = value;
        
        return sk;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param {array} dataArray - an array of points
     * @returns The enclosing function
     */
    sk.data = function(value){
		data = value;
		
		return sk;
	};
    
    return sk;
};
