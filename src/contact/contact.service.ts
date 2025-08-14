import { Injectable } from '@nestjs/common';

@Injectable()
export class ContactService {}



// const express = require('express');
// const nodemailer = require('nodemailer');
// const bodyParser = require('body-parser');
// const cors = require('cors'); // For frontend-backend communication

// const app = express();
// app.use(bodyParser.json());
// app.use(cors());

// // Configure transporter (using Gmail with App Password)
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'your.site.email@gmail.com', // Your site's email
//     pass: 'your-app-password' // App Password for Gmail
//   }
// });

// // Contact form endpoint
// app.post('/api/contact', async (req, res) => {
//   try {
//     const { name, email, message } = req.body;

//     // Validate input
//     if (!name || !email || !message) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     // Email options
//     const mailOptions = {
//       from: 'your.site.email@gmail.com',
//       to: 'your.site.email@gmail.com', // Where you want to receive messages
//       subject: `New message from ${name} (${email})`,
//       text: message,
//       html: `
//         <h3>New Contact Form Submission</h3>
//         <p><strong>Name:</strong> ${name}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Message:</strong></p>
//         <p>${message}</p>
//       `
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);
//     res.status(200).json({ message: 'Message sent successfully!' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


// }
