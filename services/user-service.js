
const { RegexSearch, Skip, Limit, Count } = require('../function/mongoose.function');
const { User } = require('../models/Users');

const getAllUsers = async (body) => {
    const {search, page=1, pageLimit=20} = body;
try {
    const searchField = ["username" , "email", "phoneNumber"]
    const pipeline = []
    if(search){
        RegexSearch(pipeline ,searchField, search )
    }
    const skip = (page - 1) * pageLimit;
    const limit = parseInt(pageLimit) || 20;
    const countPipeline =  [...pipeline];
    Count(countPipeline, "total")
    const totalUserCount = await User.aggregate(countPipeline);
    SortBy = { createdAt: -1 };
    Skip(pipeline, skip)
    Limit(pipeline, limit)

    const users = await User.aggregate(pipeline);
    return {
        status: true,
        data: users,
        message: "Users fetched successfully",
        totalUserCount: totalUserCount[0]?.total || 0,
    };
} catch (error) {
    console.log(error);
    return {
        status: false,
        message: error.message,
    };
}
}


const getUserById = async (userId) => {
try{

    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
        return {
            status: false,
            message: "User not found",
        };
    }
    return {
        status: true,
        data: user,
        message: "User fetched successfully",
    };

}catch (error) {
    console.log(error);
    return {
        status: false,
        message: error.message,
    };
}
}

module.exports = {
    getAllUsers,
    getUserById
};