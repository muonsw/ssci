var data = [[0,0], [1,1], [2,1], [3,2], [4,1]];
var dataObj = [{x: 0, y: 0},
               {x: 1, y: 1},
               {x: 2, y: 1},
               {x: 3, y: 2},
               {x: 4, y: 1}];

QUnit.test( "ForeES", function( assert ) {
    var result1 = ssci.fore.expon().data(data).factor(0.3);
	var result2 = ssci.fore.expon().data(data).factor("0.9");
    var result3 = ssci.fore.expon()
                            .data(dataObj)
                            .x(function(d){ return d.x; })
                            .y(function(d){ return d.y; });
    result1();
    result2();
    result3();
	var correct_output = [[1,0], [2,0.3], [3,0.51], [4,0.957], [5,0.9699]];
	var correct_resids = [1, 0.7, 1.49, 0.043];
	var correct_ss     = 3.711949;
    
	assert.deepEqual( result1.factor(), result2.factor(), "Test of passing string to factor passed!" );
	assert.deepEqual( result1.output(), correct_output, "Output correct");
	//assert.deepEqual( result1.residuals, correct_resids, "Residuals correct");
	assert.deepEqual( result1.factor(), 0.3, "Factor correct");
	//assert.deepEqual( result1.sumSquares, correct_ss, "Sum of squares correct");
    assert.deepEqual( result3.output(), correct_output, "Accessor functions ok");
	
});
