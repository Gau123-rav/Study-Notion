const nodemailer = require('nodemailer');
require('dotenv').config();

const mailSender = async(email, title, body) => {
    try{
        console.log("user-->", process.env.MAIL_USER);
        console.log("pass-->", process.env.MAIL_PASS);
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        })

        let info = await transporter.sendMail({
            from: 'StudyNotion || Gaurav Gupta',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`
        })
        console.log("info--> ", info);
        return info;
    }

    catch(error){
        console.log("error--> ", error.message);
    }
};

module.exports = mailSender;