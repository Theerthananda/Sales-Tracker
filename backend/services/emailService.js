const { Resend } = require('resend');
const dotenv = require('dotenv');
dotenv.config();
// Initialize Resend client
const initializeResend = () => {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ Resend API key not configured.');
    throw new Error('Resend API key not configured. Please set RESEND_API_KEY.');
  }

  console.log(`📧 Initializing Resend email service`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  return new Resend(process.env.RESEND_API_KEY);
};

// EMAIL SENDER - Uses custom domain from .env or falls back to default
const EMAIL_FROM = process.env.EMAIL_SENDER
  ? `Swansorter <${process.env.EMAIL_SENDER}>`
  : "Swansorter <onboarding@resend.dev>";

// ===============================
// SEND ASSIGNMENT EMAIL
// ===============================
const sendAssignmentEmail = async (salespersonEmail, salespersonName, assignmentDetails) => {
  try {
    console.log(`📧 Sending assignment email to: ${salespersonEmail}`);

    const resend = initializeResend();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Swansorter Sales Tracker</h1>
          <p style="color: white; margin: 5px 0;">New Assignment Notification</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Hello ${salespersonName},</h2>
          <p style="color: #6b7280;">You have been assigned a new task:</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #10b981;">
            <p><strong>Date:</strong> ${new Date(assignmentDetails.date).toLocaleDateString()}</p>
            <p><strong>Number of Locations:</strong> ${assignmentDetails.locationCount}</p>
            <p><strong>Assignment ID:</strong> ${assignmentDetails.assignmentId}</p>
          </div>

          <h3 style="color: #374151;">Locations:</h3>
          <ul>
            ${assignmentDetails.places.map(place => `
              <li>
                <strong>${place.name}</strong><br/>
                <small>${place.address || 'No address provided'}</small>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [salespersonEmail],
      subject: "New Assignment Created - Swansorter Sales Tracker",
      html: htmlContent
    });

    console.log("✅ Assignment email sent:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending assignment email:", error);
    return { success: false, error };
  }
};

// ===============================
// SEND EXPENSE STATUS EMAIL
// ===============================
const sendExpenseStatusEmail = async (salespersonEmail, salespersonName, expenseDetails) => {
  try {
    const resend = initializeResend();
    const isApproved = expenseDetails.status === "approved";

    const htmlContent = `
      <div style="font-family: Arial;">
        <h2>Hello ${salespersonName},</h2>
        <p>Your expense has been <strong>${expenseDetails.status.toUpperCase()}</strong>.</p>
        <p><strong>Amount:</strong> ₹${expenseDetails.amount}</p>
        <p><strong>Category:</strong> ${expenseDetails.category}</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [salespersonEmail],
      subject: `Expense ${isApproved ? 'Approved' : 'Rejected'} - Swansorter`,
      html: htmlContent
    });

    console.log("✅ Expense email sent:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending expense email:", error);
    return { success: false, error };
  }
};

// ===============================
// SEND VISIT COMPLETION EMAIL
// ===============================
const sendVisitCompletionEmail = async (adminEmail, visitDetails) => {
  try {
    const resend = initializeResend();

    const htmlContent = `
      <div style="font-family: Arial;">
        <h2>Visit Completed</h2>
        <p><strong>Salesperson:</strong> ${visitDetails.salespersonName}</p>
        <p><strong>Location:</strong> ${visitDetails.placeName}</p>
      </div>
    `;

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [adminEmail],
      subject: `Visit Completed - ${visitDetails.salespersonName}`,
      html: htmlContent
    });

    console.log("✅ Visit completion email sent:", response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending visit completion email:", error);
    return { success: false, error };
  }
};

// ===============================
// SEND VISIT STATUS EMAIL (APPROVED/REJECTED)
// ===============================
const sendVisitStatusEmail = async (salespersonEmail, salespersonName, visitDetails) => {
  try {
    const resend = initializeResend();
    const isApproved = visitDetails.status === "Approved";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${isApproved ? '#10b981 0%, #059669 100%' : '#ef4444 0%, #b91c1c 100%'}); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Swansorter Sales Tracker</h1>
          <p style="color: white; margin: 5px 0;">Visit Report Update</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Hello ${salespersonName},</h2>
          <p style="color: #6b7280;">Your visit report for <strong>${visitDetails.millCompanyName}</strong> has been <strong>${visitDetails.status.toUpperCase()}</strong>.</p>
          
          ${visitDetails.remark ? `
          <div style="background: white; padding: 15px; border-left: 4px solid ${isApproved ? '#10b981' : '#ef4444'}; margin: 20px 0;">
            <p style="margin: 0;"><strong>Admin Remark:</strong> ${visitDetails.remark}</p>
          </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 0.9em;">Visit Date: ${new Date(visitDetails.visitDate).toLocaleDateString()}</p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [salespersonEmail],
      subject: `Visit Report ${visitDetails.status} - ${visitDetails.millCompanyName}`,
      html: htmlContent
    });

    if (response.error) {
      console.error("❌ Resend API Error:", response.error);
      return { success: false, error: response.error };
    }

    console.log(`✅ Visit status email sent (${visitDetails.status}):`, response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending visit status email:", error);
    return { success: false, error };
  }
};

// ===============================
// SEND EXPENSE SUBMISSION EMAIL (TO ADMIN)
// ===============================
const sendExpenseSubmissionEmail = async (adminEmail, expenseDetails) => {
  try {
    const resend = initializeResend();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Swansorter Sales Tracker</h1>
          <p style="color: white; margin: 5px 0;">New Expense Submission</p>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #374151;">Hello Admin,</h2>
          <p style="color: #6b7280;"><strong>${expenseDetails.salespersonName}</strong> has submitted a new expense claim.</p>
          
          <div style="background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${expenseDetails.amount}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${expenseDetails.category}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(expenseDetails.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Description:</strong> ${expenseDetails.description}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em;">Please login to the dashboard to review and approve/reject this request.</p>
        </div>
      </div>
    `;

    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to: [adminEmail],
      subject: `New Expense Claim: ₹${expenseDetails.amount} - ${expenseDetails.salespersonName}`,
      html: htmlContent
    });

    if (response.error) {
      console.error("❌ Resend API Error:", response.error);
      return { success: false, error: response.error };
    }

    console.log(`✅ Expense submission email sent to admin:`, response);
    return { success: true, response };
  } catch (error) {
    console.error("❌ Error sending expense submission email:", error);
    return { success: false, error };
  }
};

module.exports = {
  sendAssignmentEmail,
  sendExpenseStatusEmail,
  sendVisitCompletionEmail,
  sendVisitStatusEmail,
  sendExpenseSubmissionEmail
};
