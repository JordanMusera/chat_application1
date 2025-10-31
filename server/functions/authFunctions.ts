import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

export const create_jwt = (user:any)=>{
    const token = jwt.sign(
        {id:user.id, email:user.email, name:user.name},
        process.env.JWT_SECRET as string,
        {expiresIn:"1h"}
    )
    return token;
}