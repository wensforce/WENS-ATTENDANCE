import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

console.log('Gmail config:', {
  user: process.env.GMAIL_USER ? '✓ Set' : '✗ Missing',
  password: process.env.GMAIL_APP_PASSWORD ? '✓ Set' : '✗ Missing',
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.log('Mail configuration error:', error);
  } else {
    console.log('✅ Mail server connected successfully');
  }
});

export default transporter;