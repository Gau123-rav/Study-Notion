const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

// Create rating
exports.createRating = async(req, res) => {
    try{
        // Get user id
        const userId = req.user.id;

        // Fetch data from req body
        const {rating, review, courseId} = req.body;

        // Check if user is enrolled or not
        const courseDetails = await Course.findOne(
                                    {_id: courseId,
                                    studentsEnrolled: {$elemMatch: {$eq: userId}}
                                    });

        if(!courseDetails){
            return res.status(404).json({
                success: false,
                message: 'Student is not enrolled in the course'
            });
        }

        // Check if user already reviewd the course or not
        const alreadyReviewed = await RatingAndReview.findOne({
                                                user: userId,
                                                course: courseId
                                            });

        if(alreadyReviewed){
            return res.status(403).json({
                success: false,
                message: 'Course is already reviewed by the user'
            });
        }

        // Create reting and review
        const ratingReview = await RatingAndReview.create({
                                        rating, review,
                                        course: courseId,
                                        user: userId
                                    });

        // Update course with this rating and review
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id: courseId},
                                    {
                                        $push: {
                                            ratingAndReviews: ratingReview._id
                                        }
                                    },
                                    {new: true});
        console.log(updatedCourseDetails);

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Rating and Review created successfully',
            ratingReview
        });
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get average rating
exports.getAverageRating = async(req, res) => {
    try{
        // Get course ID
        const courseId = req.body.courseId;

        // Calculate average rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: "$rating"}
                }
            }
        ]);

        // Return rating
        if(result.length > 0){
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating
            });
        }

        // If no rating/review exists
        return res.status(200).json({
            success: true,
            message: 'Average rating is 0, no ratings given till now',
            averageRating: 0
        });
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all rating and reviews
exports.getAllRating = async(req, res) => {
    try{
        const allReviews = await RatingAndReview.find({})
                                .sort({rating: "desc"})
                                .populate({
                                    path: "user",
                                    select: "firstName lastName email image"
                                })
                                .populate({
                                    path: "courses",
                                    select: "courseName"
                                })
                                .exec();

        return res.status(200).json({
            success: true,
            message: 'All reviews fetched successfully',
            data: allReviews
        });                            
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};