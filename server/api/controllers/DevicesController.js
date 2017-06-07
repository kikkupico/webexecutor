/**
 * DevicesController
 *
 * @description :: Server-side logic for managing Devices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	


  /**
   * `DevicesController.getDeviceList()`
   */
  getDeviceList: function (req, res) {
    return res.json(PHATAdapterService.listDevices());
  }
};

