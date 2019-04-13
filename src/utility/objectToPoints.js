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
