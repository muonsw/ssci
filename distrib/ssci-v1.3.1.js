/*! ssci v1.3.1 
 *  JavaScript smoothing, seasonal and regression functions 
 *  2019-04-13 
 *  License: MIT 
 *  Copyright (C) 2018 Simon West
 */



var ssci = (function(){
  'use strict';
  
//This library requires big.js - https://github.com/MikeMcl/big.js/ - used in regPolyBig, determinantBig and smoothQuadraticBig

var ssci = ssci || {};
ssci.smooth = {};
ssci.season = {};
ssci.reg    = {};
ssci.fore   = {};
ssci.ts     = {};

/**
 * Exponential smoothing - smooth a series of points
 * Points passed in via the .data() function
 * Calculates the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.expon = function(){
    var data = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq=0;
    var factor = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function retVar(){
        var i;
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Calculate forecasts
        for(i=1;i<(numPoints+1);i++){
            if(i<2){
                output.push([dataArray[i][0], dataArray[i-1][1]]);
            } else if(i===numPoints){
                //Should I check for a date in the x-axis?
                //x value is one period on from the last period
                output.push([+dataArray[i-1][0]+(+dataArray[i-1][0]-dataArray[i-2][0]), dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            } else {
                output.push([dataArray[i][0], dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            }
        }
        
        //Calculate residuals
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i-1][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i-1][1],2);
        }
    }
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing function
     */
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    retVar.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        
        factor = value;
        
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){
        return output;
    };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){
        return resids;
    };
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    return retVar;
};

/**
 * Holt's Exponential Smoothing
 * @returns {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.holt = function(){
    var data = [];
    var dataArray = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq  = 0;
    var factor = 0.3;
    var trend  = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var l=[];
    var t=[];
    var funcs_T = {
        '1': t1,
        '2': t2,
        '3': t3,
        '4': t4
    };
    var funcT = '1';    //Function to use to calculate the starting value of 

    /**
     * Initial average difference between first three pairs of points
     */
    function t1(){
        return (1/3)*(dataArray[1][1]-dataArray[0][1])+(dataArray[2][1]-dataArray[1][1])+(dataArray[3][1]-dataArray[2][1]);
    }
    /**
     * Calculate trend for entire series and multiply by average distance between points
     */
    function t2(){
        return ssci.reg.polyBig(dataArray,1).constants[1] * ((dataArray[numPoints-1][0]-dataArray[0][0])/(numPoints-1));
    }
    /**
     * Trend for first to second point
     */
    function t3(){
        return dataArray[1][1]-dataArray[0][1];
    }
    /**
     * Trend between first and last point
     */
    function t4(){
        return (dataArray[numPoints-1][1]-dataArray[0][1])/(numPoints-1);
    }
    
    function retVar(){
        var i;
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Push first value to dataArray
        output.push(dataArray[0]);
        
        //Generate starting value for l - first value of dataArray
        if(l.length===0){
            l.push(dataArray[0][1]);
        }
        
        //Generate starting value for t - initial average difference between first three pairs of points
        if(t.length===0){
            t.push(funcs_T[funcT]);
        }
        
        //Calculate new values for level, trend and forecast
        for(i=1;i<(numPoints);i++){
            l.push(factor*dataArray[i][1]+(1-factor)*(l[i-1]+t[i-1]));
            t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
            //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
            output.push([dataArray[i][0], l[i-1]+t[i-1]]);
        }
        
        //Calculate residuals
        sumsq=0;
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i][1],2);
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
        
        l.push(value);
        
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
        
        t.push(value);
        
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
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    retVar.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        
        factor = value;
        
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){
        return output;
    };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){
        return resids;
    };

    /**
     * Returns the sum of squares of the residuals
     * @returns The sum of squares of the residuals
     */
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    /**
     * Provide or get the trend factor
     * @param {number} [value] - The trend factor
     * @returns If no parameter is passed in then the current trend value. Otherwise it will return the enclosing object.
     */
    retVar.trend = function(value){
        if(!arguments.length){ return trend; }
        
        //Check that trend factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Trend factor appears to not be a number - changed to 0.3');
            trend=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Trend >1 or <0 - changed to 0.3');
            trend=0.3;
            return retVar;
        }
    
        trend = value;
    
        return retVar;
    };
    
    /**
     * Provide a forecast of the function
     * @param {number} [d] - The number of time units to forecast ahead. If the data is monthly then 2 is 2 months.
     * @returns The forecast
     */
    retVar.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        //d=1 means one unit of time ahead. If the data is monthly, then d is in months
        var temp = l[l.length-1]+d*t[t.length-1];
        return temp;
    };

    /**
     * Specify the function to calculate the initial trend value
     * @param {'1' | '2' | '3' | '4'} [value='1'] - The function to calculate the initial value for the trend. The default is the average difference between the first 3 points
     * @returns If no parameter is provided then the function type is provided otherwise the enclosing object is returned.
     */
    retVar.initialTrendCalculation = function(value){
        if(!arguments.length){ return funcT; }
        //Check that the function is valid
        if(typeof funcs_T[value] !== 'function'){
            throw new Error('Invalid function');
        }
        
        funcT = value;
        
        return retVar;
    };
    
    return retVar;
};

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

/**
 * Calculate the determinant of a matrix using Bigs
 * @param {array} p - an array of arrays denoting a matrix
 * @returns {number} the determinant of the matrix
 */
ssci.reg.determinantBig = function(p){
    //Calculate the determinant of an array
    var j, t, u;     //integer
    var upperLim;    //integer
    var temp;        //Big
    var tempp = [];  //array of Bigs
    
    upperLim = p.length;
    j = upperLim - 2;
    temp = new Big(0);
    
    //Initialise temp array - must be a better way
    for(var i=0;i<=j;i++){
        var temp2=[];
        for(var k=0;k<=j;k++){
            temp2.push(new Big(0));
        }
        tempp.push(temp2);
    }
    
    for(i = 0;i<upperLim;i++){
        //Construct array for determinant if j>1
        t = 0;
        u = 0;
        for(var x=0;x<upperLim;x++){
            for(var y=0;y<upperLim;y++){
                if(y !== i && x !== j){
                    //Do i need to worry about references?
                    //tempp[t][u] = p[y][x];
                    tempp[t][u] = new Big(p[y][x].valueOf());
                }
                if(y !== i){
                    t++;
                }
            }
            t = 0;
            if(x !== j){
                u++;
            }
        }
        if (j > 0){
            temp = temp.plus(p[i][j].times(Math.pow((-1),(i + j))).times(ssci.reg.determinantBig(tempp)));
        } else {
            temp = temp.plus(p[i][j].times(Math.pow((-1),(i + j))).times(tempp[0][0]));
        }
        
    }

    return temp;

};

/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression but return object and use Big objects
 * @returns {object} object containing an array of points ('x' coordinate in the first element of the point), array of constants for the polynomial and array of residuals
 */
ssci.reg.polyBig = function(){
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var resids=[];
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var con2=[];
    var detms;
    var newDA=[];    //Array of Bigs to hold data from dataArray
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var order = 2;
    
    function rp(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
        //Change order if it is greater than the number of points
        if(order>(dataArray.length-1)){
            order=dataArray.length-1;
            console.log('Order changed to ' + (dataArray.length-1));
        }
        
        //Initialise newDA
        for(i=0; i<dataArray.length; i++){
            var temp=[];
            temp.push(new Big(+dataArray[i][0]));
            temp.push(new Big(+dataArray[i][1]));
            newDA.push(temp);
        }
        
        //Initialise variables
        for(i=0;i<(order+1);i++){
            var temp2=[];
            var temp3=[];
            for(k=0;k<(order+1);k++){
                temp2.push(new Big(0));
                temp3.push(new Big(0));
            }
            ms.push(temp2);
            msdash.push(temp3);
            ns.push(new Big(0));
        }
        
        //Set up matrices
        for(i = 0;i<(order+1);i++){
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<dataArray.length;k++){
                    ms[i][j] = ms[i][j].plus(newDA[k][0].pow(i+j));
                }
            }
        }
        
        for(j = 0;j<(order+1);j++){
            for(k = 0;k<dataArray.length;k++){
                ns[j] = ns[j].plus(newDA[k][0].pow(j).times(newDA[k][1]));
            }
        }
        
        detms = ssci.reg.determinantBig(ms);
        if(detms.valueOf() === '0'){
            throw new Error('Determinant is zero. Fitted line is not calculable.');
        }
        
        for(i = 0;i<(order+1);i++){
            //'Set up M'
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<(order+1);k++){
                    if(k === i){
                        msdash[j][k] = ns[j];
                    } else {
                        msdash[j][k] = ms[j][k];
                    }
                }
            }
            con.push(ssci.reg.determinantBig(msdash).div(detms));    //Using Big.div - had to change DP in Big object
            con2.push(parseFloat(con[i].valueOf()));
        }
        
        for(k = 0;k<dataArray.length;k++){
            var tempb=new Big(0);
            for(j = 0;j<(order+1);j++){
                tempb = tempb.plus(newDA[k][0].pow(j).times(con[j]));
            }
            output.push([dataArray[k][0], tempb.valueOf()]);
            resids.push(dataArray[k][1]-parseFloat(tempb.toString()));
        }
    }
    
    /**
     * Get or set the order of the polynomial
     * @param {number} [value] - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
     * @returns If no parameter is passed in then return the order, otherwise return the enclosing object
     */
    rp.order = function(value){
        if(!arguments.length){ return order; }
        
        //Check that order is a number
        if(typeof value!== 'number'){
            order = 2;
        }
        if(value <= 0){
            order = 2;
        }
        order = value;
        
        return rp;
    };
    
    /**
     * Get an array of the input x values with the fitted y values
     * @returns An array of fitted values
     */
    rp.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points.
     * @param {function} [value] - A function to convert the x data for use in the function.
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    rp.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return rp;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    rp.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return rp;
    };
    
    /**
     * Function to set the data used
     * @param {array} value - an array of points
     * @returns The enclosing object
     */
    rp.data = function(value){
        data = value;
        return rp;
    };
    
    /**
     * Returns the residuals after the fitted polynomial has been created
     * @returns The residuals
     */
    rp.residuals = function(){
        return resids;
    };
    
    /**
     * Returns the constants of the fitted polynomial
     * @returns An array of constants
     */
    rp.constants = function(){
        return con2;
    };
    
    /**
     * Predict a new figure given an x value
     * @param {number} d - The x value to return a y value for
     * @returns The fitted number
     */
    rp.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        
        var temp=new Big(0);
        for(var j = 0;j<(order+1);j++){
            temp = temp.plus(newDA[newDA.length-1][0].plus(d).pow(j).times(con[j]));
        }
        return temp;
    };
    //Also add r squared value?
    
    return rp;
};

/**
 * Deseasonalise data based on the average for the period (specified by label range).
 * @returns {function} - the function to average the data
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
    
    /**
     * Pass in an array of data labels that define the period
     * @param {array} value - an array holding the labels that specify the period e.g. Jan, Feb, Mar etc.
     */
    sa.labels = function(value){
        labels = value;
        
        return sa;
    };
    
    /**
     * Returns the averaged data
     * @returns The averaged data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * A function to set the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    return sa;
};

/**
 * Deseasonalise the data by differencing the data and adding the moving average
 * @returns {function} - the function to create the points
 */
ssci.season.difference = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=[];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check that there are enough points in the data series
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
    }
    
    /**
     * Returns the deseasonalised data
     * @returns The deseasonalised data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    /**
     * Define the frequency of the data series
     * @param {number} frequency - the number of points to difference over
     */
    sa.frequency = function(value){
        if(!arguments.length){ return frequency; }
        
        //Check that frequency is in range and of the right type
        if(typeof value !== 'number'){
            console.log('frequency appears to not be a number - changed to 12');
            frequency=12;
        }
        
        frequency = value;
        
        return sa;
    };
    
    return sa;
};

/**
 * Deseasonalise data based on taking the moving average
 * @param {number} frequency - the number of points to average over
 * @returns {function} - the function to create the points
 */
ssci.season.movingAverage = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=0;
    var counter=1;
    var weights = [];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    var lastN = true;
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check that there are enough points in the data series
        if(frequency>numPoints){
            throw new Error('Not enough data for this frequency');
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
    }
    
    /**
     * Get or set a boolean value to state whether the average is calculated over the last n points or as a central average.
     * @param {boolean} value - true if calculating an average over the last n points, false for a central average.
     * @returns If no parameter is passed in then the value is returned, otherwise returns the enclosing object
     */
    sa.end = function(value){
        if(!arguments.length){ return lastN; }
        
        //Check that lastN is a boolean
        if(typeof value !== 'boolean'){
            lastN = true;
        }
        
        lastN = value;
        
        return sa;
    };
    
    /**
     * Returns the averaged data
     * @returns The averaged data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    /**
     * Get or set the frequency of the data series
     * @param {number} [value] - The frequency of the data series i.e. if monthly then frequency is 12.
     * @returns The frequency if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.frequency = function(value){
        if(!arguments.length){ return frequency; }
        
        //Check that frequency is in range and of the right type
        if(typeof value !== 'number'){
            console.log('frequency appears to not be a number - changed to 12');
            frequency=12;
        }
        
        frequency = value;
        
        return sa;
    };
    
    return sa;
};

/**
 * Calculate asymmetric henderson weights
 * Formula taken from Doherty, M (2001); THE SURROGATE HENDERSON FILTERS IN X-11; Aust. N. Z. J. Stat. 43(4), 2001, 901–999
 * which I found here - http://www.stats.govt.nz/~/media/Statistics/surveys-and-methods/methods/data-analysis/x-12-arima-doherty.pdf
 * @param {array} filter - the filter to be adjusted to be asymmetric - i.e. the Henderson filter 
 * @param {number} term  - the length of the assymetric Henderson filter to be returned - needs to be less than filter.length
 * @param {number} IC    - Quoting from the PDF above - Here, for an additive adjustment, I is the average of absolute month to month change in the estimated irregular, and C is the average of the absolute month to month changes in an estimate of the trend. For a multiplicative adjustment, the I/C ratio is also used. However,the numerator is the average of the absolute monthly percentage changes in an estimated irregular; the denominator is the average of the absolute monthly percentage changes in an estimated trend. It can take a value from 0 to roughly 4.5.
 * @returns - an array containing the filter
 */

ssci.smooth.ahenderson = function(filter, term, IC){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    //Filter must be array
    if(!(typeof filter === 'object' && Array.isArray(filter))){
        throw new Error('Filter must be an array');
    }
    
    //IC greater than zero
    if(IC < 0){
        throw new Error('I/C must be >0');
    }
    
    var output=[];
    var bs = (4/Math.PI)/Math.pow(IC,2);
    var i,j;
    
    //fill output with zeroes
    for(i=0; i<filter.length; i++){
        output.push(0);
    }
    
    for(i=0; i<term; i++){
        var totW=0;
        for(j = term; j<filter.length; j++){
            totW+=filter[j];
        }
        
        var totW2=0;
        for(j = term; j<filter.length; j++){
            totW2+=((j+1)-(term+1)/2)*filter[j];
        }
        
        output[filter.length-term+i] = filter[i] + (1/term)*totW + (((i+1-(term+1)/2)*bs)/(1+((term*(term-1)*(term+1))/12)*bs)*totW2);
    }
    
    return output;
};

/**
 * Create henderson filters of term 'term'
 * Formula taken from http://www.ons.gov.uk/ons/rel/elmr/economic-trends--discontinued-/no--633--august-2006/fitting-trends-to-time-series-data.pdf
 * @param {number} term - The number of terms in this Henderson filter
 * @returns an array with the terms
 */ 
ssci.smooth.henderson = function(term){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term % 2 === 0){
        throw new Error('Term must be odd');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    var m = (term-1)/2;
    var j;
    var h = [];
    
    for(j=-m;j<(m+1);j++){
        
        h.push( (315*((m+1)*(m+1)-j*j)*((m+2)*(m+2)-j*j)*((m+3)*(m+3)-j*j)*(3*(m+2)*(m+2)-11*j*j-16))/ (8*(m+2)*((m+2)*(m+2)-1)*(4*(m+2)*(m+2)-1)*(4*(m+2)*(m+2)-9)*(4*(m+2)*(m+2)-25)) );
        
    }
    
    return h;
};



/**
 * Gaussian kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_G(x1 , x2 , b ) {
    return (1/Math.sqrt(2*Math.PI))*Math.exp(-(Math.pow((x1 - x2),2) / (2*Math.pow(b,2))));
}

/**
 * Epanechnikov kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_E(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (3 / 4) * (1 - Math.pow(((x1 - x2) / b), 2));
    }
}

/**
 * Logistic kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_L(x1 , x2 , b ) {
    return 1 / (Math.exp((x1 - x2) / b) + Math.exp(-(x1 - x2) / b));
}

/**
 * Uniform kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_U(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return 1 / 2;
    }
}

/**
 * Triangular kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_T(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (1 - Math.abs((x1 - x2) / b));
    }
}

/**
 * Quartic kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_Q(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (15 / 16) * Math.pow((1 - Math.pow(((x1 - x2) / b), 2)), 2);
    }
}

/**
 * Triweight kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_TW(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (35 / 32) * Math.pow((1 - Math.pow(((x1 - x2) / b), 2)), 3);
    }
}

/**
 * Cosine kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_Co(x1 , x2 , b) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (Math.PI / 4) * Math.cos((Math.PI / 2) * ((x1 - x2) / b));
    }
}

/**
 * Tricube kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_TC(x1 , x2 , b) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (70 / 81) * Math.pow((1 - Math.pow(Math.abs((x1 - x2) / b), 3)), 3);
    }
}

/**
 * Silverman kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_S(x1, x2, b){
    var u = Math.abs((x2-x1)/b);
    
    return 0.5 * Math.exp(-u/Math.SQRT2) * Math.sin(u/Math.SQRT2 + Math.PI/4);
}

/**
 * Exponentially smooth a data series - data series should be evenly spaced in the x-coordinate
 * This is the exponentially weighted moving average rather than what is more generally known as exponential smoothing.
 * Only good for non-trended, non-seasonal data
 * @returns {function} - the function to create the points
 */
ssci.smooth.EWMA = function(){
    
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var factor = 0.3;
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var i=0;i<numPoints;i++){
            if(i===0){
                output.push(dataArray[i]);
            } else {
                output.push([dataArray[i][0], dataArray[i][1]*factor + output[i-1][1]*(1-factor)]);
            }
        }
    }
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sm.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sm.data = function(value){
        data = value;
        return sm;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    sm.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return sm;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return sm;
        }
        
        factor = value;
        
        return sm;
    };
    
    return sm;
};

/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data
 * @returns {function} - the function to create the points
 */
ssci.smooth.filter = function(){
    
    var numPoints  = 0;
    var output     = [];
    var b          = 0;
    var i,j;        //Iterators
    var x_conv     = function(d){ return d[0]; };
    var y_conv     = function(d){ return d[1]; };
    var data       = [];
    var filter     = [1/3, 1/3, 1/3];
    var removeEnds = true;
    var m1         = -1;
    var m2         = 1;
    var limitSet   = false;
    var l_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5).reverse(); };
    var r_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5); };
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(!limitSet){
            if(filter.length % 2 === 0){
                m1 = -(Math.floor(filter.length/2))+1;
                m2 = Math.floor(filter.length/2);
            } else {
                m1 = -(Math.floor(filter.length/2));
                m2 = Math.floor(filter.length/2);
            }
        } else {
            //Check that the limits cover the filter length
            if(-m1+m2+1!==filter.length){
                throw new Error("Filter length is different to length specified by limits");
            }
        }
        
        //Filter the data
        for(i=0;i<numPoints;i++){
            b=0;
            
            //Calculate adjusted filter
            var afilter = [];
            if(!removeEnds && m1+i<0){
                afilter = l_filt(filter, filter.length+i+m1);
            } else if(!removeEnds && i+m2>(numPoints-1)){
                afilter = r_filt(filter, numPoints-i+m2);
            } else {
                afilter = filter.slice();
            }
            
            //Why am I not using afilter.length in the for statement below?
            for(j=0;j<filter.length;j++){
                //Check that i+j+m1>-1 && i+j+m1<numPoints 
                if(removeEnds){
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        b+=dataArray[i+j+m1][1]*afilter[j];
                    } else {
                        //Do nothing
                    }
                } else {
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        if(m1+i<0){
                            b+=dataArray[i+j+m1][1]*afilter[j+i+m1];
                            //console.log("l",i,j,dataArray[i+j+m1][1],afilter[j+i+m1],m1,m2);
                        } else if(i+m2>(numPoints-1)){
                            b+=dataArray[i+j+m1][1]*afilter[j+i-numPoints+1-m1];
                            //console.log("r",i,j,dataArray[i+j+m1][1],afilter[j+i-numPoints+1-m1],m1,m2);
                        } else {
                            b+=dataArray[i+j+m1][1]*afilter[j];
                            //console.log("c",i,j,dataArray[i+j+m1][1],afilter[j],m1,m2);
                        }
                    } else {
                        //Do nothing
                    }
                }
            }
            
            if(removeEnds && i+m1>-1 && i+m2<numPoints){
                output.push([dataArray[i][0], b]);
            }
            if(!removeEnds){
                output.push([dataArray[i][0], b]);
            }
        }
        
    }
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sm.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sm.data = function(value){
        data = value;
        return sm;
    };
    
    /**
     * Set or get the filter to apply to the data
     * @param {array} [value] - An array containing the numbers to apply as a filter
     * @returns Either the filter or the enclosing object
     */
    sm.filter = function(value){
        //Set the filter
        if(!arguments.length){ return filter; }
        
        //Check that the filter is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Filter must be an array');
        }
        
        filter = value;
        
        return sm;
    };
    
    /**
     * Set where to apply the filter
     * @param {array} [value] - An array containing the two x-values between which the fillter will be applied.
     * @returns Either the limits array or the enclosing object
     */
    sm.limits = function(value){
        //Set limits of filter i.e. where to apply it
        if(!arguments.length){ return [m1,m2]; }
        
        //Check that the 'limits' is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Limits must be an array');
        }
        //Check input array length
        if(value.length !== 2){ throw new Error("Limits must be an array of length 2"); }
        //Check that the inputs are numbers
        if(typeof value[0]!=='number' && typeof value[1]!=='number'){ throw new Error('Input must be a number'); }
        
        m1 = value[0];
        m2 = value[1];
        limitSet = true;
        
        return sm;
    };
    
    /**
     * Set whether values are calculated for the end of a series - false to calculate them
     * @param {boolean} [value] - Should the ends be removed?
     * @returns Either the value or the enclosing object
     */
    sm.end = function(value){
        if(!arguments.length){ return removeEnds; }
        
        //Check removeEnds
        if(typeof removeEnds !== 'boolean'){
            removeEnds = true;
        } else {
            removeEnds = value;
        }
        
        return sm;
    };
    
    /**
     * Calculate gain
     * @param {number} d The period to calculate the gain for
     * @returns The gain
     */
    sm.gain = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var temp = 0;
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        temp = Math.sqrt(g1*g1 + g2*g2);
        
        return temp;
    };
    
    /**
     * Calculate the phase shift caused by the filter
     * @param {number} d The period to calculate the phase shift for
     * @returns The phase shift
     */
    sm.phaseShift = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        return pf(g1, g2)/(2 * Math.PI / d);
    };

    function pf(c, s){
        
        if( c > 0 ){
            return Math.atan(s / c);
        } else if (c < 0 && s >= 0){
            return Math.atan(s / c) + Math.PI;
        } else if (c < 0 && s < 0){
            return Math.atan(s / c) - Math.PI;
        } else if (c === 0 && s > 0) {
            return Math.PI / 2;
        } else if (c === 0 && s < 0) {
            return -Math.PI / 2;
        } else if (c === 0 && s === 0) {
            return 0;
        } else {
            return Number.NaN;
        }
        
    }

    /**
     * Set or get the function to calculate the weights for the start of the data series if 'end' is false
     * @param {function} value - The function to use to calculate the weights to use - default is an asymmetric Henderson filter
     * @returns Either the value or the enclosing object
     */
    sm.left = function(value){
        if(!arguments.length){ return l_filt; }
        l_filt = value;
        return sm;
    };
    
    /**
     * Set or get the function to calculate the weights for the end of the data series if 'end' is false
     * @param {function} value - The function to use to calculate the weights to use - default is an asymmetric Henderson filter
     * @returns Either the value or the enclosing object
     */
    sm.right = function(value){
        if(!arguments.length){ return r_filt; }
        r_filt = value;
        return sm;
    };

    return sm;
    
};

/** 
 * Take an array of points and returns a set of smoothed points by applying a filter (specified by the kernel function) to the data
 * @returns {function} - the function to create the points
 */
ssci.smooth.kernel = function(){

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
    var kernel="Gaussian";
    var data = [];
    var scale = [];
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
            
            for(var j=0;j<dataArray.length;j++){
                var temp_ker=0;
                
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            output.push([dataArray[i][0],(tot_ker1 / tot_ker2)]);
        }
    }
    
    /**
     * Define the scale for the kernel. This can take a number or an array of numbers. Generally the array will have the same number of values as the data array.
     * @param {number|array} [value] - an array or number containing the scaling parameters of the kernel.
     * @returns If no parameter is passed in then the scale is returned, otherwise returns the enclosing object.
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
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sk.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sk;
    };
    
    /**
     * Define a function to convert the y data passed in to the kernel function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
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
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sk.data = function(value){
		data = value;
		
		return sk;
	};
    
    return sk;
};

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

/** 
 * Take an array of points and returns a set of smoothed points by fitting a quadratic to the data around the central point using Big objects
 * @returns {function} - the function to create the points
 */
ssci.smooth.quadraticBig = function(){
    
    var width = 5;
    var l_width = 2;
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    
    function qb() {
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
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
            
            var temp_func = ssci.reg.polyBig()
                                    .data(tempArray)
                                    .order(2);
            temp_func();
            var temp = temp_func.constants();
            output.push([dataArray[m][0], (temp[0]) + dataArray[m][0] * (temp[1]) + dataArray[m][0] * dataArray[m][0] * (temp[2])]);
        }
    }
    
    /**
     * Get or set the width of the polynomial to fit to the data
     * @param {number} value - the width of the quadratic to fit in points
     * @returns Either the width if no parameter is passed in or the enclosing object
     */
    qb.width = function(value){
        if(!arguments.length){ return width; }
        
        if(typeof value!== 'number'){
            console.log('width appears to not be a number - changed to 5');
            return qb;
        }
        if(value % 2 === 0){
            value--;
        }
        if(value < 3){
            value = 5;
        }
        
        width = value;
        l_width = Math.floor(value/2);
        
        return qb;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    qb.data = function(value){
        data = value;
		
		return qb;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    qb.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return qb;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    qb.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return qb;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    qb.output = function(){
        return output;
    };
    
    return qb;
};
/**
 * Calculates the auto-correlation
 * @returns {function} - the function to create the points
 */
ssci.ts.acf = function(){

    var output=[];
    var numPoints=0;
    var lags=[];
    var x=[];
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var maxlag = 20;
    var diffed = 0;
    
    function run(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
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
        
        //Calculate acf - assuming stationarity i.e. mean and variance constant (sort of)
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

            output.push([i, s1 / s2]);
        }
    }
    
    /**
     * Returns the correlation array
     * @returns The correlation array
     */
    run.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    run.data = function(value){
        data = value;
        return run;
    };
    
    /**
     * Get or set the maximum value of the lag to calculate the acf for
     * @param {number} [value] - The maximum lag
     * @returns The maximmum lag or the enclosing object
     */
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    /**
     * Get or set the number of times to difference the data
     * @param {number} [value] - The number of times to difference the data
     * @returns The number of times to difference the data or the enclosing object.
     */
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
/**
 * Difference the y values of a data series
 * @param {array} dataArray - an array of points
 * @returns {array} an array of points with [x, diff(y)]
 */
ssci.ts.diff = function(dataArray){
    var output=[];
    
    for (var index = 0; index < (dataArray.length-1); index++) {
        output.push([dataArray[index][0], dataArray[index+1][1]-dataArray[index][1]]);
    }
    
    return output;
};
/**
 * Calculates the partial auto-correlation
 * Formula taken from https://www.empiwifo.uni-freiburg.de/lehre-teaching-1/winter-term/dateien-financial-data-analysis/handout-pacf.pdf
 * @returns {function} - the function to create the points
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
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
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
    
    /**
     * Returns the correlation array
     * @returns The correlation array
     */
    run.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    run.data = function(value){
        data = value;
        return run;
    };
    
    /**
     * Get or set the maximum value of the lag to calculate the partial acf for
     * @param {number} [value] - The maximum lag
     * @returns The maximmum lag or the enclosing object
     */
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    /**
     * Get or set the number of times to difference the data
     * @param {number} [value] - The number of times to difference the data
     * @returns The number of times to difference the data or the enclosing object.
     */
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
/**
 * Creates a string for the d attribute of the SVG <path> element given a type of path to create and a set of points
 * @param {string} interpolation - the type of path to create - linear or cubic
 * @param {array} points - a set of points
 * @returns {string} A string for use in the d attribute of the SVG <path> element
 */
ssci.interpString = function(interpolation, points){
    var outputString = "";
    if(interpolation==='linear'){
        outputString = points.join("L");
    } else if(interpolation==='cubic') {
        var sParam = splineInterpolation(points);
        
        outputString += points[0][0] + "," + points[0][1];
        for(var i=1;i<points.length;i++){
            var controlPoints = splineToBezier(points[i-1],points[i],sParam[i-1]);
            
            outputString += "C" + controlPoints[0][0] + "," + controlPoints[0][1] + "," + controlPoints[1][0] + "," + controlPoints[1][1] + "," + points[i][0] + "," + points[i][1];
        }
    } else {
        throw new Error('Interpolation not defined = ' + interpolation);
    }
    
    return outputString;
};

/**
 * Convert an object to an array of points (i.e. x and y coordinates)
 * @param {object} data - object holding the data - generally an array of objects in the D3 style
 * @param {string} x - the name of the attribute holding the x coordinate
 * @param {string} y - the name of the attribute holding the y coordinate
 * @returns {array} an array of points, 'x' coordinate in the first element of the point
 */
ssci.objectToPoints = function(data, x, y){
	return data.map(function(e){
		var temp = [];
		temp.push(e[x]);
		temp.push(e[y]);
		return temp;
	});
};

/**
 * Convert an array of points (i.e. x and y coordinates) to an array of objects with 'x' and 'y' attributes
 * @param {object} data - array holding the data - 'x' data is assumed to be in the first element of the point array, 'y' data in the second 
 * @returns {array} an array of objects in the D3 style
 */
ssci.pointsToObject = function(data){
    return data.map(function(e){
        var temp = {};
        temp.x = e[0];
        temp.y = e[1];
        return temp;
    });
};
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
/**
 * Creates the array of control points for a bezier curve given the ends points of a cubic spline
 * @param {array} p0 - first point of the bezier and spline curves i.e. [x1, y1]
 * @param {array} p2 - end point of the bezier and spline curves i.e. [x2, y2]
 * @param {array} splineParam - the four parameters of the cubic polynomial spline
 * @returns {array} - an array of the 2 middle control points for the cubic bezier curve
 */
function splineToBezier(p0, p2, splineParam){
    var t = [1/3, 2/3];
    var x = [(p2[0]-p0[0])*t[0]+p0[0],(p2[0]-p0[0])*t[1]+p0[0]];
    var s = [splineParam[0] + splineParam[1]*(x[0]-p0[0]) + splineParam[2]*Math.pow((x[0]-p0[0]),2) + splineParam[3]*Math.pow((x[0]-p0[0]),3), splineParam[0] + splineParam[1]*(x[1]-p0[0]) + splineParam[2]*Math.pow((x[1]-p0[0]),2) + splineParam[3]*Math.pow((x[1]-p0[0]),3)];
    var b = [(s[0]-Math.pow((1-t[0]),3)*p0[1]-Math.pow(t[0],3)*p2[1])/(3*(1-t[0])*t[0]), (s[1]-Math.pow((1-t[1]),3)*p0[1]-Math.pow(t[1],3)*p2[1])/(3*(1-t[1])*t[1])];
    
    var p = [];
    p[0] = (b[1]-(t[1]*b[0]/t[0]))*(1/(1-(t[1]/t[0])));
    p[1] = (b[0] - (1-t[0])*p[0])/t[0];
    
    return [[x[0], p[0]], [x[1], p[1]]];
}
/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {string} y1 - a string holding an object's name within 'data' to use as the y-coordinate
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMap = function(data, x1, y1){
    return data.map(function(e){
        var temp = {};
        temp.x = e[x1];
        temp.y = e[y1];
        return temp;
    });
};
/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {array} y1 - an array of strings holding an object's name within 'data' to use as the y-coordinates
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMaps = function(data, x1, y1){
    
    var temp_layer = [];
    
    for(var i=0;i<y1.length;i++){
        temp_layer.push(this.stackMap(data, x1, y1[i]));
    }
    
    return temp_layer;
    
};
/**
 * Creates a string representation of an array of points
 * @param {array} e - array of points
 * @returns {string} String with commas between x and y coordinates and newlines between each set of points 
 */
ssci.toStringArray = function(e){
    var f = e.map(function(d){
        return d[0] + ", " + d[1];
    });
    return f.join("\n");
};

return ssci;

}( this ));