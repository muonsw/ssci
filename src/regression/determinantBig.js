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
