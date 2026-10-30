const { sendAssignmentEmail, sendExpenseStatusEmail, sendVisitCompletionEmail } = require('../services/emailService');

// Test email functionality
const testEmailService = async () => {
  console.log('🧪 Testing Email Service...\n');

  // Test 1: Assignment Email
  console.log('📧 Testing Assignment Email...');
  try {
    const result = await sendAssignmentEmail(
      'test@example.com', // Replace with actual test email
      'Test User',
      {
        assignmentId: 'TEST123',
        date: new Date(),
        locationCount: 2,
        places: [
          { name: 'Test Location 1', address: 'Test Address 1' },
          { name: 'Test Location 2', address: 'Test Address 2' }
        ]
      }
    );
    
    if (result.success) {
      console.log('✅ Assignment email sent successfully:', result.messageId);
    } else {
      console.log('❌ Assignment email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Assignment email error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Expense Status Email
  console.log('📧 Testing Expense Status Email...');
  try {
    const result = await sendExpenseStatusEmail(
      'test@example.com', // Replace with actual test email
      'Test User',
      {
        amount: 1000,
        category: 'Travel',
        date: new Date(),
        status: 'approved',
        adminNotes: 'Test approval'
      }
    );
    
    if (result.success) {
      console.log('✅ Expense status email sent successfully:', result.messageId);
    } else {
      console.log('❌ Expense status email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Expense status email error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Visit Completion Email
  console.log('📧 Testing Visit Completion Email...');
  try {
    const result = await sendVisitCompletionEmail(
      'admin@example.com', // Replace with actual admin email
      {
        salespersonName: 'Test Salesperson',
        placeName: 'Test Location',
        isSuspicious: false,
        visitReportId: 'TEST456'
      }
    );
    
    if (result.success) {
      console.log('✅ Visit completion email sent successfully:', result.messageId);
    } else {
      console.log('❌ Visit completion email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Visit completion email error:', error.message);
  }

  console.log('\n🏁 Email testing completed!');
};

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailService().catch(console.error);
}

module.exports = { testEmailService };
