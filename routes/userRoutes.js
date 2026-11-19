
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js';
import passwordMiddleware from '../middleware/passwordMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

const router = express.Router();


router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email и пароль обязательны'
            });
        }

        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Этот email уже зарегистрирован'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка регистрации',
            error: error.message
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Вход выполнен успешно',
            token,
            mustChangePassword: user.mustChangePassword
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка входа',
            error: error.message
        });
    }
});


router.post(
    '/change-password',
    authMiddleware,
    async (req, res) => {
        try {
            const { newPassword } = req.body;

            if (!newPassword) {
                return res.status(400).json({
                    message: 'Введите новый пароль'
                });
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );

            req.user.password = hashedPassword;
            req.user.mustChangePassword = false;

            await req.user.save();

            res.json({
                message: 'Пароль успешно изменён'
            });
        } catch (error) {
            res.status(500).json({
                message: 'Ошибка смены пароля',
                error: error.message
            });
        }
    }
);

router.post(
    '/delete-account',
    authMiddleware,
    passwordMiddleware,
    async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    message: 'Введите текущий пароль'
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                req.user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: 'Неверный пароль'
                });
            }

            await req.user.destroy();

            res.json({
                message: 'Аккаунт успешно удалён'
            });
        } catch (error) {
            res.status(500).json({
                message: 'Ошибка удаления аккаунта',
                error: error.message
            });
        }
    }
);


router.get(
    '/admin',
    authMiddleware,
    passwordMiddleware,
    adminMiddleware,
    (req, res) => {
        res.json({
            message: 'Добро пожаловать в панель администратора',
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            }
        });
    }
);


router.post(
    '/change-email',
    authMiddleware,
    passwordMiddleware,
    async (req, res) => {
        try {
            const { newEmail, password } = req.body;

            if (!newEmail || !password) {
                return res.status(400).json({
                    message: 'Введите новый email и текущий пароль'
                });
            }

            const passwordMatch = await bcrypt.compare(
                password,
                req.user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: 'Неверный пароль'
                });
            }

            const existingUser = await User.findOne({
                where: { email: newEmail }
            });

            if (existingUser) {
                return res.status(409).json({
                    message: 'Этот email уже занят'
                });
            }

            req.user.email = newEmail;
            await req.user.save();

            res.json({
                message: 'Email успешно изменён',
                email: req.user.email
            });
        } catch (error) {
            res.status(500).json({
                message: 'Ошибка смены email',
                error: error.message
            });
        }
    }
);


export default router;
