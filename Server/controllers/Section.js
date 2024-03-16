const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async(req, res) => {
    try{
        // Data fetch
        const {sectionName, courseId} = req.body;

        // Data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create section
        const newSection = await Section.create({sectionName});

        // Update course with section objectID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
                                            courseId,
                                            {
                                                $push: {
                                                    courseContent: newSection._id
                                                }
                                            },
                                            {new: true}
                                        )
                                            .populate({
                                                path: "courseContent",
                                                populate: {
                                                    path: "subSection"
                                                }
                                            })
                                            .exec();
                                        

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Section created successfully',
            updatedCourseDetails
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Unable to create section, please try again!',
            error: error.message
        });
    }
};

exports.updateSection = async(req, res) => {
    try{
        // Data fetch
        const {sectionName, sectionId} = req.body;

        // Data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new: true});

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Section updated successfully',
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Unable to update section, please try again!',
            error: error.message
        });
    }
};

exports.deleteSection = async(req, res) => {
    try{
        // Get Id - assuming that we are sending ID in params
        const {sectionId} = req.body;

        // Use find by Id and delete
        await Section.findByIdAndDelete(sectionId);

        // Todo[Testing]: Do we need to delete the entry from the course Schema ??

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Section deleted successfully',
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Unable to dalete section, please try again!',
            error: error.message
        });
    }
}