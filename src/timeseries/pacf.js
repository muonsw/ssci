/**
 * Calculates the partial auto-correlation
 * Formula taken from https://www.empiwifo.uni-freiburg.de/lehre-teaching-1/winter-term/dateien-financial-data-analysis/handout-pacf.pdf
 * @param {array} dataArray - an array of points
 * @param {number} maxlag - maximum lag to calculate auto correlation for
 * @param {number} diffed - how many times the data has been differenced
 * @returns {array} an array of points with [lag, pacf]
 */
ssci.ts.pacf = function(){
    
    var output=[];
    var numPoints=0;
    var lags=[];
    var x=[];
    var p=[];
    var t=[];
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var maxlag = 20;
    var diffed = 0;
    
    function run(){
        var dataArray = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(maxlag>(dataArray.length-diffed)){
            maxlag = dataArray.length-diffed;
            console.log('Not enough points for the number of lags requested. Max lag changed to ' + maxlag);
        }
        
        //Create lags array
        for(i=0;i<(maxlag+1);i++){
            lags.push(i);
        }
        
        //Create data array - i.e. differenced if necessary
        if(diffed>0){
            for(i=0;i<(numPoints-1);i++){
                x.push(dataArray[i][1]-dataArray[i+1][1]);
            }
        } else {
            for(i=0;i<numPoints;i++){
                x.push(dataArray[i][1]);
            }
        }
        
        if(diffed>1){
            for(j=0;j<(diffed-1);j++){
                for(i=0;i<(numPoints-1-j);i++){
                    x[i]=x[i]-x[i+1];
                }
                x.pop();
            }
        }
        
        //Calculate acf - assuming stationarity i.e. mean and variance constant
        for(i=0;i<=maxlag;i++){
            var sx = 0;
            var s1 = 0;
            var s2 = 0;
            
            //Calculate mean
            for(k = 0;k<(numPoints-diffed);k++){
                sx = x[k] + sx;
            }
            sx = sx / (numPoints-diffed);
            
            //Calculate correlation
            for(k = 0;k<(numPoints - diffed);k++){
                if(k<(numPoints - lags[i] - diffed)){
                    s1 = s1 + (x[k] - sx) * (x[k + lags[i]] - sx);
                }
                s2 = s2 + Math.pow(x[k] - sx,2);
            }

            p.push(s1 / s2);
        }
        
        //Calculate pacf
        //Set all t[] to NaN
        for(k=0;k<=maxlag;k++){
            var temp2=[];
            for(j=0;j<=maxlag;j++){
                temp2.push(NaN);
            }
            t.push(temp2);
        }

        t[0][0] = 1;
        t[1][1] = p[1];
        for(k = 2;k<=maxlag;k++){
            //Calculate factors to take away from p[i]
            var totalt = 0;
            for(j = 1;j<k;j++){
                if (k-1 !== j && k-2 > 0){
                    t[k - 1][j] = t[k - 2][j] - t[k - 1][k - 1] * t[k - 2][k - 1 - j];
                }
                totalt += t[k - 1][j] * p[k - j];
            }
            t[k][k] = (p[k] - totalt) / (1 - totalt);
        }
        
        for(k=0;k<=maxlag;k++){
            output.push([lags[k], t[lags[k]][lags[k]]]);
        }
    }
    
    run.output = function(){
        return output;
    };
    
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    run.data = function(value){
        data = value;
        return run;
    };
    
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    run.diff = function(value){
        if(!arguments.length){ return diffed; }
        
        if(typeof diffed !== 'number'){
            throw new Error('diffed is not a number');
        }
        
        diffed = value;
        
        return run;
    };
    
    return run;
};