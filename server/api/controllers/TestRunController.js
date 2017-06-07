/**
 * TestRunController
 *
 * @description :: Server-side logic for managing Testruns
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	//routes.js -> 'POST /testrun/:id/start': 'TestRunController.start' reaches here
	start: function (req, res) {
		var rid = req.param('id');
		var type = req.param('type');
		var threads = req.param('threads');
		//PHATAdapterService.mockRun(rid);
		PHATAdapterService.run(rid, threads, type);
		return res.json({id:rid});
	},

	//routes.js -> 'POST /testrun/:id/stop': 'TestRunController.stop' reaches here
	stop: function (req, res) {
		var rid = req.param('id');		
		PHATAdapterService.stop(rid);
		return res.json("Stop initiated");
	},

	//routes.js -> 'DELETE /testrun/:id/subscription': 'TestRunController.unsubscribe' reaches here
	unsubscribe: function (req, res) {
		var rid = req.param('id');
		TestRun.findOne({id: rid}).exec(function(err, foundRun) {
			//sails.log('REQ: unsubscribe')
		  if (err) return res.serverError(err);
		  if (req.isSocket) {
		    TestRun.unsubscribe( req, foundRun );
		  }
		  return res.ok();
		});
	}
};
