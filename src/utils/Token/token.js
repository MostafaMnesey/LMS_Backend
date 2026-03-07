import jwt from "jsonwebtoken";
export const generateToken = ({ user, tokenType }) => {
  return jwt.sign(
    { id: user.id },
    tokenType === "access"
      ? process.env.JWT_SECRET_ACCESS_ADMIN
      : process.env.JWT_SECRET_REFRESH_ADMIN,
    {
      expiresIn: tokenType === "access" ? "2h" : "7d",
    }
  );
};

export const verifyToken = ({ token, tokenType = tokenTypeEnum.access }) => {


  return jwt.verify(
    token,
    tokenType === "access"
      ? process.env.JWT_SECRET_ACCESS_ADMIN
      : process.env.JWT_SECRET_REFRESH_ADMIN
  );
};

const tokenTypeEnum = {
  access: "access",
  refresh: "refresh",
};
