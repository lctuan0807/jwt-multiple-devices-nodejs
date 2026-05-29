"use strict"

const JWT = require("jsonwebtoken")
const crypto = require("crypto")

const payload = {
  name: "John Doe",
  email: "john.doe@mai.com",
  roles: ["admin"]
}

// const secretKey = "my-secret-key"

// const token = JWT.sign(payload, secretKey, { expiresIn: "2 days" })
// console.log("Generated JWT:", token)

// const decoded = JWT.verify(token, secretKey)
// console.log("Decoded JWT:", decoded)
// lost the secret key, cannot verify the token

/**
 * Asymmetrical JWT signing and verification using RSA algorithm
 * privateKey is used to sign the JWT - send to user, do not save in database
 * publicKey is used to verify the JWT - save in database, can be shared with other services to verify the JWT
 */

// use RSA algorithm to generate a public/private key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 4096,
})

// Sign the JWT with the private key
const token = JWT.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: "2 days"
})
console.log("Generated JWT:", token)

// Verify the JWT with the public key
const decoded = JWT.verify(token, publicKey, { algorithm: "RS256" })
console.log("Decoded JWT:", decoded)


