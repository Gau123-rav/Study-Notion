const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// Auth
exports.auth = async(req, res, next) => {
    try{
        // Extract token
        // console.log('auth', req);
        const temp = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer", "");
        
        const token = temp.trimStart();

        // console.log("t",token,"r");

        // If token is missing, then return response
        if(!token){
            return res.status(401).json({
                success: false,
                message: 'Token is missing'
            })
        }

        // Verify the token
        try{
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            // console.log("decoded code ---- ", decode);
            req.user = decode;
        }
        catch(err){
            // Verification issue
            return res.status(401).json({
                success: false,
                message: 'Token is invalid'
            })
        }

        next();
    }

    catch(error){
        return res.status(401).json({
            success: false,
            message: 'Something went wrong while validating the token'
        })
    }
};

// isStudent ??
exports.isStudent = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for students only'
            })
        }
        next();
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role is not verified, please try again'
        })
    }
};

// isInstructor
exports.isInstructor = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for instructors only'
            })
        }
        next();
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role is not verified, please try again'
        })
    }
};

// isAdmin
exports.isAdmin = async(req, res, next) => {
    try{
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success: false,
                message: 'This is a protected route for admin only'
            })
        }
        next();
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User role is not verified, please try again'
        })
    }
};