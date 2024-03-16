const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

// Reset password token
exports.resetPasswordToken = async(req, res) => {
    try{
        // Get email from req body
        const email = req.body.email;

        // Check user for this email, email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success: false,
                message: 'Your enail is not registered with us'
            });
        }

        // Generate token
        const token = crypto.randomUUID();

        // Update user by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 5*60*1000
            },
            {new: true}
        )

        // Create url
        const url = `http://localhost:3000/update-password/${token}`;

        // Send mail containing the url
        await mailSender(email, "Password Reset Link", `Password Reset Link: ${url}`);

        // Return response
        return res.json({
            success: true,
            message: 'Email sent successfully, please check email and change password'
        })
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while sending the reset password mail'
        })
    }
};

// Reset Password
exports.resetPassword = async(req, res) => {
    try{
        // Data fetch
        const {password, confirmPassword, token} = req.body;

        // Validation
        if(password !== confirmPassword){
            return res.json({
                success: false,
                message: 'Password not matching'
            });
        }

        // Get userdetails from db using token
        const userDetails = await User.findOne({token: token});

        // If no entry - invalid token
        if(!userDetails){
            return res.json({
                success: false,
                message: 'Token is invalid'
            });
        }
        // Token time check
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success: false,
                message: 'Token is expired, please regenerate your token'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Password update
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
            {new: true}
        )

        // Return response
        return res.status(200).json({
            success: true, 
            message: 'Password reset successfully'
        });
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong while sending reset password mail'
        });
    }
};