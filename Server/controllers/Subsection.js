const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Create subsection
exports.createSubSection = async(req, res) => {
    try{
        // Fetch data from req body
        const {sectionId, title, timeDuration, description}= req.body;

        // Extract file/video
        const video = req.files.video;

        // Validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);

        // Create a sub-section
        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: timeDuration,
            description: description,
            videoUrl: uploadDetails.secure_url
        });

        // Update section wuth this sub section ObjectId
        const updatedSection = await Section.findByIdAndUpdate({_id: sectionId},
                                                    {
                                                        $push: {
                                                            subSection: subSectionDetails._id
                                                        }
                                                    },
                                                    {new: true}
                                                ).populate("subSection");
         
        // HW: log updated section here, after adding populate query

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Subsection created successfully',
            updatedSection
        });
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// HW: updateSubSection
exports.updateSubSection = async(req, res) => {
    try{
        const {sectionId, subSectionId, title, description} = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if(!subSection){
            return res.status(404).json({
                success: false,
                message: 'SubSection not found'
            });
        }

        if(title !== undefined){
            subSection.title = title
        }

        if(description !== undefined){
            subSection.description = description
        }

        if(req.files && req.files.video !== undefined){
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            );
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
        }

        await subSection.save();

        // Find update section and return it
        const updatedSection = await Section.findById(sectionId).populate(
            "subSection"
        )

        console.log("Updated section ", updatedSection);

        return res.status(200).json({
            success: true,
            message: 'Section updated successfully',
            data: updatedSection
        });
    }

    catch(error){
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'An occurred while updating the section'
        });
    }
};

// HW: deleteSubSection
exports.deleteSubSection = async(req, res) => {
    try{
        const {subSectionId, sectionId} = req.body;

        await Section.findByIdAndUpdate(
            {_id: sectionId},
            {
                $pull: {
                    subSection: subSectionId,
                }
            }
        )

        const subSection = await SubSection.findByIdAndDelete({_id: subSectionId});

        if(!subSection){
            return res.status(404).json({
                success: false,
                message: 'Subsection not found'
            });
        }

        // Find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.status(200).json({
            success: true,
            message: 'SubSection deleted successfully',
            data: updatedSection
        });
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the subsection'
        });
    }
};