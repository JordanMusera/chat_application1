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

export const verifyToken = (token:any)=>{
    if(!token) return {authorized:false}
    const decoded = jwt.verify(token,process.env.JWT_SECRET as string) as {
        id:number,
        email:string,
        name:string
    }
    return {authorized:false,id:decoded.id,email:decoded.email,name:decoded.name}
}

export const generateOTP=():string=>{
    const code = Math.floor(10000 + Math.random()*90000);
    return code.toString();
}