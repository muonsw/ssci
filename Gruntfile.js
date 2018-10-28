module.exports = function(grunt) {

  var bannerContent = '/*! <%= pkg.name %> v<%= pkg.version %> \n' +
                    ' *  <%= pkg.description %> \n' +
                    ' *  <%= grunt.template.today("yyyy-mm-dd") %> \n' +
                    ' *  License: <%= pkg.license %> \n' +
					' *  Copyright (C) 2018 Simon West\n */\n\n';
  var name = '<%= pkg.name %>-v<%= pkg.version%>';
  var footerContent = '';
  
  /* define filenames */
  var latest = '<%= pkg.name %>';

  var devRelease = 'distrib/'+name+'.js';
  var minRelease = 'distrib/'+name+'.min.js';
  var sourceMapMin = 'distrib/source-map-'+name+'.min.js';

  var lDevRelease = 'distrib/'+latest+'.js';
  var lMinRelease = 'distrib/'+latest+'.min.js';
  var lSourceMapMin = 'distrib/source-map-'+latest+'.min.js';
  
  var bDevRelease = 'distrib/'+latest+'-big.js';
  var bMinRelease = 'distrib/'+latest+'-big.min.js';
  var bSourceMapMin = 'distrib/source-map-'+latest+'-big.min.js';
  
  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),
    
	// Test configuration
	qunit:{
	  target: {
		src: ['test/**/*.html']
	  }
	},
    // copy configuration
    copy: {
      development: { // copy non-minified release file
        src: devRelease,
        dest: lDevRelease
      },
      minified: { // copy minified release file
        src: minRelease,
        dest: lMinRelease
      },
      smMinified: { // source map of minified release file
        src: sourceMapMin,
        dest: lSourceMapMin
      }
    },
    // uglify configuration
    uglify: {
      options: {
        sourceMapRoot: '../',
        sourceMap: 'distrib/'+name+'.min.js.map',
        sourceMapUrl: name+'.min.js.map'
      },
      target : {
        src : 'distrib/' + name + '.js',
        dest : 'distrib/' + name + '.min.js'
      },
	  extras : {
        src : 'distrib/' + latest + '-big.js',
        dest : 'distrib/' + latest + '-big.min.js'
      }
    },
    // concat configuration
    concat: {
      options: {
        banner: bannerContent,
        footer: footerContent
      },
      target : {
        src : ['src/banner.txt', 'src/*.js', 'src/*/*.js', 'src/footer.txt'],
        dest : 'distrib/' + name + '.js'
      },
	  extras: {
        src: ['node_modules/big.js/big.js', 'distrib/' + name + '.js'],
        dest: 'distrib/' + latest + '-big.js'
      }
    },
    //jshint configuration
    jshint: {
      options: {
        trailing: true,
        eqeqeq: true
      },
      target: {
        src : ['src/**/*.js', 'test/**/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'copy', 'qunit']);
};
