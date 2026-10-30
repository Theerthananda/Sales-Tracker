const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Salesperson = require('../models/Salesperson');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for migration');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration data based on your existing salespersons
const existingSalespersons = [
  {
    name: 'Vishal',
    email: 'vishal@example.com',
    phone: '6363163519',
    role: 'salesperson',
    isActive: true
  },
  {
    name: 'Admin',
    email: 'admin@example.com',
    phone: '',
    role: 'admin',
    isActive: true
  },
  {
    name: 'Mounesh',
    email: 'mounesh@example.com',
    phone: '',
    role: 'salesperson',
    isActive: true
  },
  {
    name: 'Vikas',
    email: 'vikas@example.com',
    phone: '',
    role: 'salesperson',
    isActive: true
  }
];

const migrateExistingData = async () => {
  try {
    console.log('Starting data migration...');

    for (const userData of existingSalespersons) {
      // Check if user already exists
      const existingUser = await Salesperson.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.name} already exists, updating with new fields...`);
        
        // Update existing user with new fields if they don't exist
        const updateData = {};
        
        if (!existingUser.phone && userData.phone) {
          updateData.phone = userData.phone;
        }
        
        if (!existingUser.rating) {
          updateData.rating = 0;
        }
        
        if (!existingUser.performanceStats) {
          updateData.performanceStats = {
            totalVisits: 0,
            approvedVisits: 0,
            rejectedVisits: 0,
            totalExpenses: 0,
            approvedExpenses: 0
          };
        }
        
        if (!existingUser.isActive) {
          updateData.isActive = true;
        }
        
        if (!existingUser.dateJoined) {
          updateData.dateJoined = new Date();
        }
        
        if (Object.keys(updateData).length > 0) {
          await Salesperson.findByIdAndUpdate(existingUser._id, updateData);
          console.log(`✅ Updated ${userData.name} with new fields`);
        } else {
          console.log(`✅ ${userData.name} already up to date`);
        }
      } else {
        console.log(`Creating new user: ${userData.name}...`);
        
        // Create new user with default password
        const defaultPassword = 'password123'; // You should change this
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const newUser = new Salesperson({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone || '',
          address: '',
          role: userData.role,
          isActive: userData.isActive,
          dateJoined: new Date(),
          rating: 0,
          performanceStats: {
            totalVisits: 0,
            approvedVisits: 0,
            rejectedVisits: 0,
            totalExpenses: 0,
            approvedExpenses: 0
          }
        });
        
        await newUser.save();
        console.log(`✅ Created new user: ${userData.name}`);
        console.log(`   Default password: ${defaultPassword} (Please change this!)`);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    
    const allUsers = await Salesperson.find({});
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role} - Rating: ${user.rating} - Active: ${user.isActive}`);
    });
    
    console.log('\n⚠️  Important: All new users have default password "password123". Please update them!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateExistingData();
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateExistingData };
