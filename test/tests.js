var data = [[0,0], [1,1], [2,1], [3,2], [4,1]];

QUnit.test( "ForeES", function( assert ) {
    var result1 = ssci.fore.ES(data, 0.3);
	var result2 = ssci.fore.ES(data, "0.9");
	var correct_output = [[1,0], [2,0.3], [3,0.51], [4,0.957], [5,0.9699]];
	var correct_resids = [1, 0.7, 1.49, 0.043];
	var correct_ss     = 3.711949;
    
	assert.deepEqual( result1, result2, "Test of passing string to factor passed!" );
	assert.deepEqual( result1.output, correct_output, "Output correct");
	//assert.deepEqual( result1.residuals, correct_resids, "Residuals correct");
	assert.deepEqual( result1.factor, 0.3, "Factor correct");
	//assert.deepEqual( result1.sumSquares, correct_ss, "Sum of squares correct");
	
});
