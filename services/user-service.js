
const { RegexSearch, Skip, Limit } = require('../function/mongoose.function');
const { User } = require('../models/Users');

const getAllUsers = async (body) => {
    const {search, page, pageLimit} = body;
try {
    const searchField = ["username" , "email", "phoneNumber"]
    const pipeline = []
    if(search){
        RegexSearch(pipeline ,searchField, search )
    }
    const skip = (page - 1) * pageLimit;
    const limit = parseInt(pageLimit) || 20;
    const totalUserCount = await User.countDocuments(pipeline.length > 0 ? { $match: pipeline[0].$match } : {});
    SortBy = { createdAt: -1 };
    Skip(pipeline, skip)
    Limit(pipeline, limit)

    const users = await User.aggregate(pipeline);
    return {
        status: true,
        data: users,
        message: "Users fetched successfully",
        totalUserCount: totalUserCount,
    };
} catch (error) {
    return {
        status: false,
        message: error.message,
    };
}
}

module.exports = {
    getAllUsers,
};