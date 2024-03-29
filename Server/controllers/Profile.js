const { error } = require("console");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const mongoose = require("mongoose")
const { convertSecondsToDuration } = require("../utils/secToDuration")

exports.updateProfile = async(req, res) => {
    try{
        // Get data
        const {dateOfBirth= "", about= "", contactNumber, gender} = req.body;
        // Get userId
        const id = req.user.id;

        // Validation
        if(!contactNumber || !gender || !id){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Find profile
        const userDetails = await User.findById(id);
        const profileId = userDetails.additionalDetails;

        console.log("pro", Profile);
        
        const profileDetails = await Profile.findById(profileId);
        console.log("profileDetails", profileDetails);
        // Update profile
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.contactNumber = contactNumber;
        profileDetails.gender = gender;
        await profileDetails.save();

        
        const updatedUserDetails = await User.findById(id).populate("additionalDetails").exec();
        console.log("update", updatedUserDetails);
        // Return response
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            updatedUserDetails
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Delete account
// How can we schedule this deletion operation
exports.deleteAccount = async(req, res) => {
    try{
        // Get id
        const id = req.user.id;

        // Validation
        const userDetails = await User.findById(id);
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete profile
        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});

        // Todo: HW unenroll user from all enrolled courses

        // Delete user
        await User.findByIdAndDelete({_id: id});

        // Return response
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'User cannot be deleted'
        });
    }
};

exports.getAllUserDetails = async(req, res) => {
    try{
        // Get id
        const id = req.user.id;

        // Validation and get user details
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return response
        res.status(200).json({
            success: true,
            message: 'User data fetched successfully',
            userDetails
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateDisplayPicture = async(req, res) => {
    console.log("sdjkjanan");
    try{
        
        console.log('backendResponse', req);
        
        const displayPicture = req?.files?.displayPicture; 
        console.log("profile", displayPicture);   
        const userId = req.user.id;
        console.log("user", userId);
        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )
        console.log("okdmvksdmvdks", image);

        const updatedProfile = await User.findByIdAndUpdate(
            {_id: userId},
            {image: image.secure_url},
            {new: true}
        )
        res.send({
            success: true,
            message: 'Image updated successfully',
            data: updatedProfile
        })
    }

    catch(error){
        console.log("error3252");
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

exports.getEnrolledCourses = async(req, res) => {
    try{
        console.log('req', req);
        const userId = req.user.id;
        let userDetails = await User.findOne({
            _id: userId
        }).populate({
            path: "courses",
            populate: {
                path: "subSection"
            }
        })
        .exec();

        userDetails = userDetails.toObject();
        console.log("User details", userDetails);

        var SubSectionLength = 0;
        for(var i=0; i<userDetails.courses.length; i++){
            let totalDurationInSeconds = 0;
            SubSectionLength = 0;

            for(var j=0; j<userDetails.courses[i].courseContent.length; j++){
                totalDurationInSeconds+= userDetails.courses[i].courseContent[j].
                subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0);
                userDetails.courses[i].totalDuration = convertSecondsToDuration(
                    totalDurationInSeconds
                )
                SubSectionLength+= userDetails.courses[i].courseContent[j].subSection.length
            }

            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId
            })
            courseProgressCount = courseProgressCount?.completedVideos.length

            if(SubSectionLength === 0){
                userDetails.courses[i].progressPercentage = 100;
            }
            else{
                const multiplier = Math.pow(10, 2);
                userDetails.courses[i].progressPercentage = Math.round(
                    (courseProgressCount/SubSectionLength)*100*multiplier
                )/multiplier
            }
        }

        if(!userDetails){
            return res.status(400).json({
                success: false,
                message: `Could not find user with id: ${userDetails}`
            })
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses
        })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

exports.instructorDashboard = async(req, res) => {
    try{
        const courseDetails = await Course.find({instructor: req.user.id});

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled*course.price;

            const courseDataWithStats = {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                totalStudentsEnrolled,
                totalAmountGenerated
            };

            return courseDataWithStats;
        })

        res.status(200).json({courses: courseData});
    }

    catch(error){
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
};