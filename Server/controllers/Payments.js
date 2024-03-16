const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");

// Initiate the razorpay order
exports.capturePayment = async(req, res) => {
    const {courses} = req.body;
    const userId = req.user.id;

    if(courses.length === 0){
        return res.status(200).json({
            success: false,
            message: "Please provide course id"
        });
    }

    let totalAmount = 0;

    for(const course_id of courses){
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.status(200).json({
                    success: false,
                    message: "Could not find the course"
                });
            }

            const uid = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success: false,
                    message: "Student is already enrolled"
                });
            }

            totalAmount+= course.price;
        }

        catch(error){
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    const currency = "INR";
    const options = {
        amount: totalAmount*100,
        currency,
        receipt: Math.random(Date.now()).toString()
    }

    try{
        const paymentResponse = await instance.orders.create(options);
        res.status(400).json({
            success: true,
            message: paymentResponse
        })
    }

    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Could not initiate order"
        })
    }
};

// Verify the payment
exports.verifyPayment = async(req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || !userId){
        return res.stauts(200).json({
            success: false,
            message: "Payment failed"
        })
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.
                                createHmac("sha256", process.env.RAZORPAY_SECRET)
                                .update(body.toString())
                                .digest("hex");

    if(expectedSignature === razorpay_signature){
        // Enroll the student
        await enrollStudents(courses, userId, res);

        // Return response
        return res.status(400).json({
            success: true,
            message: "Payment verified"
        });
    }

    return res.status(200).json({
        success: false,
        message: "Payment failed"
    })
};

const enrollStudents = async(courses, userId, res) => {
    if(!courses || !userId){
        return res.status(200).json({
            success: false,
            message: "Please provide data for courses or userid"
        });
    } 

    for(const courseId of courses){
        try{
            // Find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id: courseId},
                {$push: {studentsEnrolled: userId}},
                {new: true}
            )

            if(!enrolledCourse){
                return res.status(500).json({
                    success: false,
                    message: "Course not found"
                })
            }

            // Find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {
                    $push: {
                        courses: courseId
                    }
                },
                {new: true}
            );

            // Send mail to the student
            const emailResponse = await mailSender(
                enrollStudents.email,
                `Successfully enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName} ${enrolledStudent.lastName}`)
            );

            // console.log("Email sent successfully", emailResponse.response);
        }

        catch(error){
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
};

exports.sendPaymentSuccessEmail = async(req, res) => {
    const {orderId, paymentId, amount} = req.body;

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({
            success: false,
            message: "Please provide all the details"
        });
    }

    try{
        // Find the student
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            'Payment Received',
            paymentSuccessEmail(`${enrolledStudent.firstName} ${enrollStudents.lastName}`,
            amount/100, orderId, paymentId)
        )
    }

    catch(error){
        console.log("Error in sending the mail", error);
        return res.status(500).json({
            success: false,
            message: "Could not send mail"
        });
    }
};

// // Capture the payment and initiate the Razorpay order
// exports.capturePayment = async(req, res) => {
//     // Get courseId ans userId
//     const {course_id} = req.body;
//     const userId = req.user.id;

//     // Validation
//     // Valid courseId
//     if(!course_id){
//         return res.status(400).json({
//             success: false,
//             message: 'Please provide valid course id'
//         });
//     }

//     // Valid courseDetail
//     let course;
//     try{
//         course = await Course.findById(course_id);
//         if(!course){
//             return res.status(400).json({
//                 success: false,
//                 message: 'Could not find the course'
//             });
//         }

//         // User already pay for the same course or not
//         const uid = new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(200).json({
//                 success: false,
//                 message: 'Student is already enrolled'
//             });
//         }
//     }
//     catch(error){
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
    
//     // Order create
//     const amount = course.price;
//     const currency = "INR";

//     const options = {
//         amount: amount*100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes: {
//             courseId: course_id,
//             userId
//         }
//     };

//     try{
//         // Initiate the payment using razorpay
//         const paymentResponse = await instance.orders.create(options);
//         console.log(paymentResponse);

//         // Return response
//         return re.status(200).json({
//             success: true,
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnail,
//             orderId: paymentResponse.id,
//             currency: paymentResponse.currency,
//             amount: paymentResponse.amount
//         });
//     }

//     catch(error){
//         console.log(error);
//         res.json({
//             success: false,
//             message: 'Could not initiate order'
//         });
//     }
// };

// // Verify signature of razorpay and server
// exports.verifySignature = async(req, res) => {
//     const webhookSecret = "12345678";

//     const signature = req.headers["x-razorpay-signature"];

//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");

//     if(signature === digest){
//         console.log("Payment is authorised");

//         const {courseId, userId} = req.body.payload.payment.entity.notes;

//         try{
//             // Fulfill the action
//             // Find the course and enroll the student in it
//             const enrolledCourse = await Course.findOneAndUpdate(
//                                             {_id: courseId},
//                                             {$push: {studentsEnrolled: userId}},
//                                             {new: true}        
//                                         );

//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success: false,
//                     message: 'Course not found'
//                 });
//             }      
            
//             console.log(enrolledCourse);

//             // Find the syudent and add the course to their list of enrolled courses
//             const enrolledStudent = await User.findOneAndUpdate(
//                                             {_id: userId},
//                                             {$push: {courses: courseId}},
//                                             {new: true}
//                                         );

//             console.log(enrolledStudent);       
            
//             // Send the mail of confirmation
//             const emailResponse = await mailSender(
//                                     enrolledStudent.email,
//                                     "Congratulations",
//                                     "You are onboarded into new course"
//                                 );

//             console.log(emailResponse);
//             return res.status(200).json({
//                 success: true,
//                 message: "Signature verified and course added successfully"
//             });
//         }

//         catch(error){
//             console.log(error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message
//             });
//         }
//     }

//     else{
//         return res.status(400).json({
//             success: false,
//             message: 'Invalid request'
//         });
//     }
// };