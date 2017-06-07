/**
 * ReportServerController
 *
 * @description :: For serving reports
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var fs = require('fs');
var path = require('path');

const BUNDLE_LOCATION = sails.config.BUNDLE_LOCATION ? sails.config.BUNDLE_LOCATION : 'C:/p_2/ph-automation/phat/phat_package/phat_bundle/';
const NBI_CI_PLAT_LOCATION = path.join(BUNDLE_LOCATION, 'ci-plat-soap-ui/');

module.exports = {
	//routes.js -> 'GET /reports/:path': 'ReportServerController.serve' reaches here
	serve: function(req, res) {
	var target = req.url.replace('/reports/','/opt/CTATReports/');
    fs.exists(target, function (exists) {
      if (!exists) {
        return res.notFound('The requested file does not exist.');
      }

      fs.lstat(target, (err, stats) => {

    if(err)
        return res.notFound('The requested file does not exist.');
    	if(stats.isFile()) fs.createReadStream(target).pipe(res);
    	else return res.notFound('The requested file does not exist.');	    
	});      
    });
  },
  serveNBIReports: function(req, res) {
  var target = req.url.replace('/nbi_reports/',path.join(NBI_CI_PLAT_LOCATION+'/testReports/','PH-Regression-product-soapui-project/'));
    fs.exists(target, function (exists) {
      if (!exists) {
        return res.notFound('The requested file does not exist.');
      }

      fs.lstat(target, (err, stats) => {

    if(err)
        return res.notFound('The requested file does not exist.');
      if(stats.isFile()) fs.createReadStream(target).pipe(res);
      else return res.notFound('The requested file does not exist.');     
  });      
    });
  }
};
