const passwordMiddleware = (req, res, next) => {
    if (req.user.mustChangePassword && req.path !== '/change-password') {
        return res.status(403).json({
            message: 'Необходимо сменить пароль',
            redirect: '/change-password'
        });
    }

    next();
};

export default passwordMiddleware;
