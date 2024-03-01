const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET
const adminLayout = '../views/layouts/admin'; 
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const { log } = require('console');
require('dotenv').config();

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/uploads/');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});


const upload = multer({ storage: storage });


/*
 *
 *Check Login
*/
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({message: 'Unauthorized'});
    }

    try{
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.userId)
        // console.log(user.role);
        if (user.role !== 'admin'){
            return res.status(403).json({message: 'Access denied'});
        }

        req.userId = decoded.userId;
        next();
    }catch(error){
        return res.status(401).json({message: 'Unauthorized'});
    }
}





/*
 *GET/
 *Admin - Login Page
*/
router.get('/admin', async (req, res) => {

    try {        
        const locals = {
            title: "Admin",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }

        res.render('admin/index', {locals, layout: adminLayout, error: ''});
    } catch (error) {
        console.log(error);
    }

});


router.get('/register', (req, res) => {
    const locals = {
        title: "Admin",
        description: "Simple Blog created with NodeJs, Express & MongogDB."
    }
    res.render('admin/register', {locals, layout: adminLayout ,error: req.query.error})
})



async function sendWelcomeEmail(email){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        }
    })

    let mailOptions = {
        from: 'dinara.ismagilova@gmail.com',
        to: email,
        subject: 'Welcome to Our Website',
        text: 'You have successfully registered.',
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Email sent: ' + info.response);
        }
    })
}

/*
 *POST/
 *Admin - Check Login
*/
router.post('/admin', async (req, res) => {
    try {     
        const locals = {
            title: "Admin",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }   
        const {email, password} = req.body
        
        
        const user = await User.findOne({email});

        if(!user){
            return res.render("admin/index", {
                locals, 
                layout: adminLayout,
                error: 'Invalid Credentials'
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.render("admin/index", {
                locals, 
                layout: adminLayout,
                error: 'Invalid Credentials'
            })
        }

        await sendWelcomeEmail(email);

        const token = jwt.sign({userId: user._id}, jwtSecret);
        res.cookie('token', token, {httpOnly: true});
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
    }
});


/*
 *GET/
 *Admin DashBoard
*/
router.get('/dashboard', authMiddleware, async (req, res) => {

    try {
        const locals = {
            title: "Dashboard",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }
        const data = await Post.find();
        res.render('admin/dashboard',{
            locals,
            data,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


/*
 *GET/
 *Admin Create New Post
*/
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add Post",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }
        const data = await Post.find();
        res.render('admin/add-post',{
            locals,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
});


/*
 *POST/
 *Admin Create New Post
*/
router.post('/add-post', authMiddleware, upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 }
]), async (req, res) => {
    
    try {
        if (req.body.title && req.body.body) {
            console.log(req.files['photo1'][0].path,'----------=======',req.files['photo1'][0].path.replace('public\\', ''));
            const photosPaths = [];
            if(req.files['photo1']) photosPaths.push(req.files['photo1'][0].path.replace('public\\', ''));
            if(req.files['photo2']) photosPaths.push(req.files['photo2'][0].path.replace('public\\', ''));
            if(req.files['photo3']) photosPaths.push(req.files['photo3'][0].path.replace('public\\', ''));
            console.log(photosPaths, '-------------------------------------');

            const newPost = new Post({
                title: req.body.title,
                body: req.body.body,
                photos: photosPaths
            });

            await newPost.save();
            res.redirect('/dashboard');
        } else {
            console.log(req.body, req.files);
            console.log('All fields must be filled -------------');
            return res.status(400).json({ message: "All fields must be filled" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});


/*
 *Get/
 *Admin Create New Post
*/
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Edit Post",
            description: "Simple Blog created with NodeJs, Express & MongogDB."
        }

        const data = await Post.findOne({_id: req.params.id});

        res.render('admin/edit-post',{
            locals,
            data,
            layout: adminLayout
        })



    } catch (error) {
        console.log(error);
    }
});


/*
 *PUT/
 *Admin Create New Post
*/
router.put('/edit-post/:id', authMiddleware, upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 },
    { name: 'photo3', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log(req.files);
        const photosPaths = [];
        if(req.files['photo1']) photosPaths.push(req.files['photo1'][0].path.replace('public\\', ''));
        if(req.files['photo2']) photosPaths.push(req.files['photo2'][0].path.replace('public\\', ''));
        if(req.files['photo3']) photosPaths.push(req.files['photo3'][0].path.replace('public\\', ''));

        const updates = {
            title: req.body.title,
            body: req.body.body,
            photos: photosPaths,
            updatedAt: Date.now()
        };

        await Post.findByIdAndUpdate(req.params.id, updates);

        res.redirect(`/edit-post/${req.params.id}`);

    } catch (error) {
        console.log(error);
    }
});



// router.post('/admin', async (req, res) => {
//     try {        
//         const {username, password} = req.body
//         if(req.body.username === 'admin' && req.body.password === 'password'){
//             res.send('You are logged in')
//         } else{
//             res.send('Wrong username or password')
//         }
//         res.redirect('./admin');

//     } catch (error) {
//         console.log(error);
//     }
// });

/*
 *POST/
 *Admin - Register
*/
router.post('/register', async (req, res) => {
    try {        
        const role = req.body.role || 'admin';
        console.log(role);
        const {email, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(email, password);
        try {
            const user = await User.create({email, password: hashedPassword, role});
            await sendWelcomeEmail(email);
            return res.redirect('/admin');
        } catch (error) {
            if(error.code === 11000){
                console.log(error);
                return res.status(409).json({message: 'User already in use'});
            }
            return res.status(500).json({message: 'Internal server error'});
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send('Server Error');
    }
});



/*
 *DELETE/
 *Admin - Delete Post
*/
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({_id: req.params.id});
        res.redirect('/dashboard')
    } catch (error) {
        console.log(error);
    }
});


/*
 *GET/
 *Admin Logout
*/
router.get('/logout', async (req, res) => {
    res.clearCookie('token');
    // res.json({message: 'Logout successful.'});
    res.redirect('/');
});


module.exports = router;