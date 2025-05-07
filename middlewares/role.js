// Middleware untuk memeriksa apakah user punya role yang sesuai
exports.checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Akses ditolak",
        error: `Hanya ${allowedRoles.join(" atau ")} yang boleh mengakses ini`,
      });
    }

    next();
  };
};
