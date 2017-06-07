/**
 * TestInTestRun.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
  	path: 'string',
  	status: {
  		type: 'string',	    
	    defaultsTo: 'waiting'
  	},
  	belongsTo : {
  		model: 'testrun'
  	}
  }
};

