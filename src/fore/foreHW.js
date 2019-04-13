/**
 * Holt Winters exponential smoothing
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals etc.
 */
ssci.fore.holtWinter = function(){
    var data = [];
    var dataArray = [];
    var factor = 0.3;
    var trend = 0.3;
    var season = 0.3;
    var period = 12;
    var sumsq=0;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    var numPoints = 0;
    var output = [];
    var resids = [];
    var l=[];
    var t=[];
    var s=[];
    
    function retVar(){
        var i;
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Generate starting value for l - average of first season
        if(l.length===0){
            startL();
        }
        
        //Generate starting value for t - initial average difference between first two seasons
        if(t.length===0){
            startT();
        }
        
        //Generate starting values for s1,s2,s3,sn - not convinced that this is the best method
        if(s.length===0){
            startS();
        }
        
        //Calculate forecasts
        for(i=+period;i<numPoints;i++){
            l.push(factor*dataArray[i][1]/s[i-period]+(1-factor)*(l[i-1]+t[i-1]));
            t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
            s.push(season*dataArray[i][1]/l[i]+(1-season)*s[i-period]);
            
            //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
            output.push([dataArray[i][0], (l[i-1]+t[i-1])*s[i-period]]);
        }
        
        //Calculate residuals
        for(i=+period;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i-period][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i-period][1],2);
        }
    }
    
    function startL(){
        var i;
        //Generate starting value for l - average of first season
        var l1=0;
        for(i=0;i<period;i++){
            l1+=dataArray[i][1];
        }
        for(i=0;i<period;i++){
            l.push(l1/period);
        } 
    }
    
    function startT(){
        var i;
        //Generate starting value for t - initial average difference between first two seasons
        var t1=0;
        for(i=0;i<period;i++){
            t1+=(dataArray[i+period][1]-dataArray[i][1])/period;
        }
        for(i=0;i<period;i++){
            t.push(t1*(1/period));
        }
    }
    
    function startS(){
        //Generate starting values for s1,s2,s3,sn - not convinced that this is the best method
        var i,j;
        //First compute average for each full season
        var numFullSeasons = Math.floor(numPoints/period);
        var avgPerSeason=[];
        for(i=0;i<numFullSeasons;i++){
            var temp1=0;
            for(j=0;j<period;j++){
                temp1+=dataArray[j+i*period][1];
            }
            temp1=temp1/period;
            avgPerSeason.push(temp1);
        }
        for(j=0;j<period;j++){
            var temp2=0;
            for(i=0;i<numFullSeasons;i++){
                temp2+=dataArray[j+i*period][1]/avgPerSeason[i];
            }
            s.push(temp2/numFullSeasons);
        }
    }
    
    /**
     * Get or set the initial value for the level
     * @param {number} [value] - The value for the level
     * @returns Either the value for the level or the enclosing object
     */
    retVar.initialLevel = function(value){
        if(!arguments.length){ return l[0]; }
        l = [];
        for(var i=0;i<period;i++){
            l.push(value);
        }
        return retVar;
    };
    
    /**
     * Get or set the initial value for the trend
     * @param {number} [value] - The value for the trend
     * @returns Either the value for the trend or the enclosing object
     */
    retVar.initialTrend = function(value){
        if(!arguments.length){ return t[0]; }
        t = [];
        for(var i=0;i<period;i++){
            t.push(value);
        }
        return retVar;
    };
    
    /**
     * Get or set the initial value for the seasonality
     * @param {number} [value] - The value for the seasonality
     * @returns Either the value for the seasonality or the enclosing object
     */
    retVar.initialSeason = function(value){
        if(!arguments.length){ return s.slice(0,period); }
        //Is value an array and of the same length/size as period
        if(!Array.isArray(value)){ return s.slice(0,period); }
        if(value.length!==period){ return NaN; }
        
        s = [];
        s = value;
        
        return retVar;
    };
    
    /**
     * Get or set the periodicity of the data set
     * @param {number} [value] - The periodicity
     * @returns Either the periodicity or the enclosing object
     */
    retVar.period = function(value){
        if(!arguments.length){
            return period;
        } else {
            //Check that factor is in range and of the right type
            if(typeof period !== 'number'){
                console.log('Period appears to not be a number - changed to 12');
                period=12;
            }
            period = value;
            return retVar;
        }
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    retVar.data = function(value){
        data = value;
        numPoints = data.length;
        
        //Is there enough data - i.e. at least one season's worth
        if(period>=(numPoints/2)){
            throw new Error('Not enough data to estimate forecasts - need 2*period of data');
        }
        
        return retVar;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){ return output; };

    /**
     * Returns the smoothed y points
     * @returns The smoothed y points
     */
    retVar.outputY = function(){ return output.map(function(e){ return e[1]; }); };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){ return resids; };
    
    /**
     * Returns the sum of squares of the residuals
     * @returns The sum of squares of the residuals
     */
    retVar.sumSquares = function(){ return sumsq; };
    
    /**
     * Provide or get the level factor
     * @param {number} [value] - The level factor
     * @returns If no parameter is passed in then the current level value. Otherwise it will return the enclosing object.
     */
    retVar.level = function(value){
        if(arguments.length===0){
            return factor;
        } else {
            //Check that factor is in range and of the right type
            if(typeof factor !== 'number'){
                console.log('Factor appears to not be a number - changed to 0.3');
                factor=0.3;
            }
            if(factor>1 || factor<0){
                console.log('Factor >1 or <0 - changed to 0.3');
                factor=0.3;
            } else {
                factor = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide or get the trend factor
     * @param {number} [value] - The trend factor
     * @returns If no parameter is passed in then the current trend value. Otherwise it will return the enclosing object.
     */
    retVar.trend = function(value){
        if(arguments.length===0){
            return trend;
        } else {
            //Check that trend factor is in range and of the right type
            if(typeof trend !== 'number'){
                console.log('Trend factor appears to not be a number - changed to 0.3');
                trend=0.3;
            }
            if(trend>1 || trend<0){
                console.log('Trend >1 or <0 - changed to 0.3');
                trend = 0.3;
            } else {
                trend = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide or get the seasonal factor
     * @param {number} [value] - The seasonal factor
     * @returns If no parameter is passed in then the current seasonal value. Otherwise it will return the enclosing object.
     */
    retVar.season = function(value){
        if(arguments.length===0){
            return season;
        } else {
            //Check that seasonal factor is in range and of the right type
            if(typeof season !== 'number'){
                console.log('Seasonal factor appears to not be a number - changed to 0.3');
                season=0.3;
            }
            if(season>1 || season<0){
                console.log('Season >1 or <0 - changed to 0.3');
                season=0.3;
            } else {
                season = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide a forecast of the function
     * @param {number} [d] - The number of time units to forecast ahead. If the data is monthly then 2 is 2 months.
     * @returns The forecast
     */
    retVar.forecast = function(d){
        //d is the number of periods forward to forecast the number
        var tempForecast = [];
        var distance = dataArray[1][0] - dataArray[0][0];
        
        for(var i=0; i<d; i++){
            var m=(i % period)+1;
            tempForecast.push([+dataArray[numPoints-1][0]+distance*(i+1), (l[numPoints-1]+(i+1)*t[numPoints-1])*s[numPoints-1-period+m]]);
        }

        return tempForecast;
    };
    
    return retVar;
};
