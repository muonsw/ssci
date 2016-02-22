# ssci
## JavaScript smoothing, seasonal and regression functions

This library was originally written to help with modifying data prior to charting it via the D3 JavaScript library.

Most of the functions no longer require the data in the form of arrays of points (i.e. x and y coordinates) but access the data via functions passed to the function. So data is generally passed via a:
``` .data(data) ```
function. And x and y coordinates are specified by passing a function via:
``` .x(function(d){ return d.year }) ```
In this example the x data is in the year variable within the data object.

## Download
Use the **ssci.js** or **ssci.min.js** files from the distrib folder. 

## Dependencies
This library relies on [big.js](https://github.com/MikeMcl/big.js/). This is used as overflow errors occur otherwise when fitting polynomials. The functions that are definitely affected are **smooth.quadraticBig**, **reg.polyBig** and **reg.determinantBig**.

I've also changed the DP variable within this library to 120 as 20 decimal places is not enough to stop odd results being generated via the quadratic smoothing algorithm.  

## Usage
Add the following tags to your HTML:
```html
<script src="your-folder/big.js"></script>
<script src="your-folder/ssci.js"></script>
```

## Documentation
See [ssci](http://www.surveyscience.co.uk/html/ssci/ssci_js.html) for more details and a more detailed description of the functions.

## Functions

### Smoothing Functions
- Kernel smoothing
- Quadratic smoothing
- Filter smoothing
- Exponentially weighted moving average

### Seasonality Functions
- Deseasonalise by average for the period
- Deseasonalise by seasonal difference
- Deseasonalise by moving average

### Regression Functions
- Polynomial least squares regression

### Forecasting functions
- Exponential smoothing
- Holt exponential smoothing
- Holt Winters exponential smoothing

### Market Research Functions
- Negative binomial distribution
- Cumulative NBD
- NBD a parameter

### Time Series Functions
- Auto correlation
- Partial auto correlation
- Difference

### Utility Functions
- Change array of objects to array of points
- Change array of points to array of objects
- Create layer for stack layout
- Create layers for stack layout
- Produce cubic interpolation string
- Calculate determinant
- Gamma function
 
## To do

- Tests
- Some of the JSDoc comments need updating to reflect the changes in 1.2
