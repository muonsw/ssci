

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
