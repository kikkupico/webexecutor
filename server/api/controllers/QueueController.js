/**
 * QueueController
 *
 * @description :: Server-side logic for managing Queues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	


  /**
   * `QueueController.getStatus()`
   */
  getStatus: function (req, res) {
    return res.json(PHATAdapterService.getQueueStatus());
  }
};

