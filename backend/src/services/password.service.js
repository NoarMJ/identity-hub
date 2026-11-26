import argon2 from "argon2";


const options = {
    type: argon2.argon2id,
    memoryCost: 19456, //memory useed per hash
    timeCost :2, // number of passes
    parallelism: 1, // threads
};

export function hashPassword(plainpassword) { 
    return argon2.hash(plainpassword, options) ;
}

export async function verifyPassword(hash, plainPassword) {
    try{
        return await argon2.verify(hash, plainPassword);
    } catch {
        return false;
    }
}