/**
 * Gamma function - Taken from http://stackoverflow.com/questions/15454183/how-to-make-a-function-that-computes-the-factorial-for-numbers-with-decimals
 *  which in turn is taken from the wikipedia page
 * @param {number} z - real number to calculate the gamma function for
 * @returns {number} the result of the calculation
 */
ssci.gamma = function(z) {
    var g = 7;
    var C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

    if (z < 0.5){
        return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    } else {
        z -= 1;

        var x = C[0];
        for (var i = 1; i < g + 2; i++)
        x += C[i] / (z + i);

        var t = z + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, (z + 0.5)) * Math.exp(-t) * x;
    }
};