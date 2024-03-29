const { Mongoose } = require('mongoose');
const Category = require('../models/Category');

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// Create handler function of tag
exports.createCategory = async(req, res) => {
    try{
        // Fetch data
        const {name, description} = req.body;

        // Validation
        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create entry in DB
        const categoryDetails = await Category.create({
            name: name,
            description: description
        })
        console.log(categoryDetails);

        // Return response
        return res.status(200).json({
            success: true,
            message: 'Category created successfully'
        })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all categories handler function
exports.showAllCategories = async(req, res) => {
    try{
        const allCategories = await Category.find({});
        res.status(200).json({
            success: true,
            message: 'All categories returned successfully',
            data: allCategories
        })
    }

    catch(error){
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }    
};

// Category page details
exports.categoryPageDetails = async(req, res) => {
    try{
        // Get category ID
        const {categoryId} = req.body;
        // const updatedCategoryId = new Mongoose.Types.ObjectId(categoryId);

        // Get courses for specified category ID
        const selectedCategory = await Category.findById(categoryId)
                                        .populate({
                                            path: "courses",
                                            match: {status: "Published"},
                                            populate: "ratingAndReviews"
                                        }).exec()

        // Validation
        if(!selectedCategory){
            console.log("Category not found");
            return res.status(404).json({
                success: false,
                message: 'Data not found'
            });
        }

        if(selectedCategory.courses.length === 0){
            console.log("No courses found for the selected category.")
            return res.status(404).json({
              success: false,
              message: "No courses found for the selected category.",
            })
        }

        // Get courses for other categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        })

        // Get courses for different categories
        let differentCategories = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        ).populate({
            path: "courses",
            match: {status: "Published"}
        }).exec()

        const allCourses = allCategories.flatMap((category) => category.courses);

        // Get top 10 selling courses
        const mostSellingCourses = allCourses.sort((a, b) => b.sold - a.sold).slice(0, 10)

        // console.log("mostSellingCourses COURSE", mostSellingCourses)
        res.status(200).json({
            success: true,
            data: {
            selectedCategory,
            differentCategory,
            mostSellingCourses,
            },
        })
        } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        })
    }
};