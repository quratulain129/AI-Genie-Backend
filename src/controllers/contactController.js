const { sendContactEmail } = require('../services/emailService');

const submitContact = async (req, res) => {
  try {
    const { firstName, lastName, company, email, country, phoneNumber, message } = req.body;

    await sendContactEmail({
      firstName,
      lastName,
      company,
      email,
      country,
      phoneNumber,
      message,
    });

    res.json({
      success: true,
      message: 'Message Sent Successfully',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message. Please try again later.',
      code: 'CONTACT_SEND_ERROR',
    });
  }
};

module.exports = { submitContact };
