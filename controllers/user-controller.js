const { User } = require("../models/Users");
const { userService } = require("../services");


const getAllUsers = async (req, res) => {
    const { body } = req;
    try {
        const users = await userService.getAllUsers(body);
        if (!users.status) {
            return res.status(400).json({
                status: false,
                message: users.message,
            });
        }
        return res.status(200).json({
            status: true,
            data: users.data,
            message: users.message,
            totalUserCount: users.totalUserCount,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
        status: false,
        message: error.message,
        });
    }
    }


 const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            status: true,
            data: user?.data || [],
            message: "User fetched successfully",
        });
    }catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
 }   


module.exports = {
    getAllUsers,
    getUserById
};