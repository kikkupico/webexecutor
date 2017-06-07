/**
 * TestPropController
 *
 * @description :: Server-side logic for managing testrepoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
  /**
   * `TestPropController.get()`
   */
  get: function (req, res) {
    return res.json(PHATAdapterService.getPropCont());
  },


  /**
   * `TestPropController.set()`
   */
  set: function (req, res) {
    return res.json({
      todo: 'NOt implemented yet!'
    });
  }
};