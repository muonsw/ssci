# ssci
## JavaScript smoothing, seasonal and regression functions

This library was originally written to help with modifying data prior to charting it via the D3 JavaScript library.

Most of the functions require the data in the form of arrays of points (i.e. x and y coordinates). So:
```[ [x1, y1], [x2, y2], [x3, y3] ]```

## Dependencies
This library relies on [big.js](https://github.com/MikeMcl/big.js/). This is used as overflow errors occur otherwise when fitting the polynomials.

## Usage
Add the following tags to your HTML:
```html
<script src="your-folder/big.js"></script>
<script src="your-folder/ssci.js"></script>
```

## Website
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
- Gamma function
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
 
