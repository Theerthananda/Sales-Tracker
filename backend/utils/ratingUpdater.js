const Salesperson = require('../models/Salesperson');
const Assignment = require('../models/Assignment');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

/**
 * Update salesperson rating based on their performance
 * @param {String} salespersonId - The ID of the salesperson
 */
const updateSalespersonRating = async (salespersonId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(salespersonId)) {
      throw new Error('Invalid salesperson ID');
    }

    const salesperson = await Salesperson.findById(salespersonId);
    if (!salesperson) {
      throw new Error('Salesperson not found');
    }

    // Calculate performance stats from assignments
    const assignments = await Assignment.find({ salespersonId });
    let totalVisits = 0;
    let approvedVisits = 0;
    let rejectedVisits = 0;

    assignments.forEach(assignment => {
      assignment.places.forEach(place => {
        if (place.visited) {
          totalVisits++;
          if (place.verified) {
            approvedVisits++;
          } else {
            rejectedVisits++;
          }
        }
      });
    });

    // Calculate expense stats
    const expenseStats = await Expense.aggregate([
      { $match: { salesperson: new mongoose.Types.ObjectId(salespersonId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalExpenses = 0;
    let approvedExpenses = 0;

    expenseStats.forEach(stat => {
      totalExpenses += stat.count;
      if (stat._id === 'approved') {
        approvedExpenses = stat.count;
      }
    });

    // Update performance stats
    salesperson.performanceStats = {
      totalVisits,
      approvedVisits,
      rejectedVisits,
      totalExpenses,
      approvedExpenses
    };

    // Calculate and update rating
    const newRating = salesperson.calculateRating();
    await salesperson.save();

    console.log(`Updated rating for ${salesperson.name}: ${newRating} stars`);
    return newRating;
  } catch (error) {
    console.error('Error updating salesperson rating:', error);
    throw error;
  }
};

/**
 * Update ratings for all salespersons
 */
const updateAllSalespersonRatings = async () => {
  try {
    const salespersons = await Salesperson.find({ role: 'salesperson' });
    
    for (const salesperson of salespersons) {
      await updateSalespersonRating(salesperson._id);
    }

    console.log(`Updated ratings for ${salespersons.length} salespersons`);
  } catch (error) {
    console.error('Error updating all salesperson ratings:', error);
    throw error;
  }
};

module.exports = {
  updateSalespersonRating,
  updateAllSalespersonRatings
};
