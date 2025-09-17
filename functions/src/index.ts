import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

interface AdminMessage {
  id?: string;
  userId: string;
  userEmail: string;
  content: string;
  imageUrl?: string;
  referencePostId?: string;
  referencePostTitle?: string;
  createdAt: FirebaseFirestore.Timestamp;
  isRead: boolean;
}

// Configure nodemailer with your SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Replace with your SMTP host
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER, // Set these in Firebase Config
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper function to get admin emails
async function getAdminEmails(): Promise<string[]> {
  const usersRef = admin.firestore().collection('users');
  const adminUsers = await usersRef.where('role', '==', 'admin').get();
  return adminUsers.docs.map(doc => doc.data().email).filter(email => email);
}

// Helper function to get saree details
async function getSareeDetails(sareeId: string) {
  const sareeDoc = await admin.firestore().collection('sarees').doc(sareeId).get();
  return sareeDoc.exists ? sareeDoc.data() : null;
}

export const onNewMessage = functions.firestore
  .document('adminMessages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data() as AdminMessage;
    const messageId = context.params.messageId;

    try {
      // Get admin emails
      const adminEmails = await getAdminEmails();
      if (adminEmails.length === 0) {
        console.log('No admin emails found');
        return;
      }

      // Get referenced saree details if any
      let sareeDetails = null;
      if (message.referencePostId) {
        sareeDetails = await getSareeDetails(message.referencePostId);
      }

      // Prepare email content
      const mailOptions = {
        from: '"Zarigaas Admin" <noreply@zarigaas.com>', // Replace with your sender
        to: adminEmails.join(','),
        subject: `New Message from ${message.userEmail}`,
        html: `
          <h2>New Message Received</h2>
          <p><strong>From:</strong> ${message.userEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${message.content}</p>
          ${message.imageUrl ? `
            <p><strong>Attached Image:</strong></p>
            <img src="${message.imageUrl}" alt="Attached image" style="max-width: 300px;" />
          ` : ''}
          ${sareeDetails ? `
            <p><strong>Referenced Product:</strong></p>
            <div style="margin-top: 10px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
              <p><strong>${sareeDetails.name}</strong></p>
              <img src="${sareeDetails.image_url}" alt="${sareeDetails.name}" style="max-width: 200px;" />
            </div>
          ` : ''}
          <p style="margin-top: 20px;">
            <a href="${process.env.WEBSITE_URL}/admin?tab=adminMessages&message=${messageId}" 
               style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View Message
            </a>
          </p>
        `
      };

      // Send email
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');

    } catch (error) {
      console.error('Error sending email:', error);
    }
  });

// Optional: Mark message as read
export const markMessageAsRead = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to mark messages as read');
  }

  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to mark messages as read');
  }

  const { messageId } = data;
  if (!messageId) {
    throw new functions.https.HttpsError('invalid-argument', 'Message ID is required');
  }

  try {
    await admin.firestore()
      .collection('adminMessages')
      .doc(messageId)
      .update({
        isRead: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return { success: true };
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw new functions.https.HttpsError('internal', 'Error marking message as read');
  }
});