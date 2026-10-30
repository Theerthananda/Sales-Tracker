const mongoose = require('mongoose');
const Salesperson = require('../models/Salesperson');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for update');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateExistingSalespersons = async () => {
  try {
    console.log('Updating existing salespersons with new fields...');

    // Find all salespersons
    const salespersons = await Salesperson.find({});
    console.log(`Found ${salespersons.length} salespersons to update`);

    for (const salesperson of salespersons) {
      let updated = false;
      const updateData = {};

      // Add missing fields
      if (salesperson.rating === undefined || salesperson.rating === null) {
        updateData.rating = 0;
        updated = true;
      }

      if (!salesperson.performanceStats) {
        updateData.performanceStats = {
          totalVisits: 0,
          approvedVisits: 0,
          rejectedVisits: 0,
          totalExpenses: 0,
          approvedExpenses: 0
        };
        updated = true;
      }

      if (salesperson.isActive === undefined || salesperson.isActive === null) {
        updateData.isActive = true;
        updated = true;
      }

      if (!salesperson.dateJoined) {
        updateData.dateJoined = new Date();
        updated = true;
      }

      if (!salesperson.phone) {
        updateData.phone = '';
        updated = true;
      }

      if (!salesperson.address) {
        updateData.address = '';
        updated = true;
      }

      if (updated) {
        await Salesperson.findByIdAndUpdate(salesperson._id, updateData);
        console.log(`✅ Updated ${salesperson.name} (${salesperson.email})`);
      } else {
        console.log(`✅ ${salesperson.name} already up to date`);
      }
    }

    console.log('\n🎉 Update completed successfully!');
    
    // Display final state
    const updatedSalespersons = await Salesperson.find({});
    console.log('\n📋 Current salespersons:');
    updatedSalespersons.forEach(sp => {
      console.log(`- ${sp.name} (${sp.email}) - ${sp.role} - Rating: ${sp.rating} - Active: ${sp.isActive}`);
    });

  } catch (error) {
    console.error('Update error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run update
const runUpdate = async () => {
  await connectDB();
  await updateExistingSalespersons();
};

// Execute if run directly
if (require.main === module) {
  runUpdate();
}

module.exports = { updateExistingSalespersons };
