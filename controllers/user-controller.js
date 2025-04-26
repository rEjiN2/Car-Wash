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
        return res.status(500).json({
        status: false,
        message: error.message,
        });
    }
    }


module.exports = {
    getAllUsers,
};