/**
 * TestRepoController
 *
 * @description :: Server-side logic for managing testrepoes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	
  /**
   * `TestRepoController.ui()`
   */
  ui: function (req, res) {
    return res.json(PHATAdapterService.testRepoUI());
  },


  /**
   * `TestRepoController.nbi()`
   */
  nbi: function (req, res) {    
      return res.json(PHATAdapterService.testRepoNBI());    
  }
};

