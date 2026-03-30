import Mailgen from 'mailgen';
import transporter from '../config/mailConfig.js';

// Configure Mailgen
const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'WENS Attendance Management System',
    link: 'https://yourapp.com',
    logo: 'https://your-logo-url.com/logo.png', // Optional
  },
});

// Welcome Email Template
const generateWelcomeEmail = (userName, mobileNumber, pin) => {
  const email = {
    body: {
      name: userName,
      intro: [
        `Welcome aboard! We're thrilled to have you as part of the WENS Attendance Management System.`,
        `Your account has been successfully created by the administrator.`,
      ],
      table: {
        data: [
          { "": "📱 Mobile Number", " ": mobileNumber },
          { "": "🔑 PIN",           " ": pin },
        ],
      },
      action: {
        instructions: "Use these credentials to log in to your account:",
        button: {
          color: "#4F46E5",
          text: "Login to WENS",
          link: process.env.FRONTEND_URL || 'https://yourapp.com/login',
        },
      },
      outro: [
        "If you have any questions, contact your administrator.",
      ],
    },
  };

  return mailGenerator.generate(email);
};

// Password Reset Email Template
const generatePinResetEmail = (userName, newPin) => {
  const email = {
    body: {
      name: userName,
      intro: [
        "Your PIN has been reset by your administrator.",
        "Use the details below to log back in to the WENS Attendance Management System.",
      ],
      table: {
        data: [
          { "": "🔑 New PIN", " ": newPin },
        ],
      },
      action: {
        instructions: "Click below to log in with your new PIN:",
        button: {
          color: "#4F46E5",
          text: "Login to WENS",
          link: process.env.FRONTEND_URL || 'https://yourapp.com/login',
        },
      },
      outro: [
        "If you did not expect this reset, contact your administrator immediately.",
      ],
    },
  };

  return mailGenerator.generate(email);
};

// Order Confirmation Email Template
const generateOrderConfirmationEmail = (userName, orderData) => {
  const email = {
    body: {
      name: userName,
      intro: 'Your order has been confirmed!',
      table: {
        data: orderData.items.map(item => ({
          item: item.name,
          description: item.description,
          price: `$${item.price}`,
          quantity: item.quantity
        })),
        columns: {
          customWidth: {
            item: '20%',
            description: '40%',
            price: '20%',
            quantity: '20%'
          },
          customAlignment: {
            price: 'right',
            quantity: 'center'
          }
        }
      },
      action: {
        instructions: 'Track your order:',
        button: {
          color: '#3869D4',
          text: 'Track Order',
          link: `https://yourapp.com/orders/${orderData.orderId}`
        }
      },
      outro: 'Thank you for your purchase!'
    }
  };

  return mailGenerator.generate(email);
};

// Generic send email function
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

export {
  generateWelcomeEmail,
  generatePinResetEmail,
    generateOrderConfirmationEmail,
    sendEmail
};