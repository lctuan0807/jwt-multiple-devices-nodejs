## JWT TOKEN EXAMPLE

#### Tech & package
- NodeJS, ExpressJS
- Redis
- jsonwebtoken

### Handle logout multiple devices
**Login**
- Adding `jit (just in time)` to each redis key
```
redis.set(`blacklisted:${req.user.uid}_${req.user.jit}`, 'true');
```

**Logout**
- Using this `jit` to logout user by device

**Example**
- Login to IPhone
```
curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{ "username": "lctuan", "password": "password" }'
```
```
{
  "token": "iphone-token"
}
```

- Login to IPad
```
curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{ "username": "lctuan", "password": "password" }'
```
```
{
  "token": "ipad-token"
}
```

- Access `/protected` for 2 devices
```
curl -X POST http://localhost:3000/protected \
    -H "Content-Type: application/json"
```
```
{
    message: 'This is a protected route',
    user: {
        "uid": 123,
        "jit": "e4fc8ded-2b79-4a7b-8775-2e9f1ab060d6",
        "iat": 1779985890,
        "exp": 1779989490
    }
}
```

- Logout on Iphone with the `iphone-token` in authorization
```
curl -X POST http://localhost:3000/logout \
    -H "Content-Type: application/json"
```

- Try to access `/protected` on IPad -> still can see the protected route message
- Try to access `/protected` on IPhone -> `Token revoked`

**Force logout on password changed**
- Change password on IPhone -> All devices will be logout with message `Token revoked due to password change`
