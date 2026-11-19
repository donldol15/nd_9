
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: 'Необходима авторизация'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: 'Пользователь не найден'
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Недействительный токен'
        });
    }
};

export default authMiddleware;
