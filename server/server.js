/* ============================================================
   BACKEND SERVER - Resume Craft API
   Fixed MongoDB Connection & Routes
============================================================ */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for profile photos
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://farhana:12345@cluster-1.6lvpzpt.mongodb.net/resumecraft?retryWrites=true&w=majority';
const JWT_SECRET = process.env.JWT_SECRET || 'Resumes123!';
const PORT = process.env.PORT || 3000;

/* ============================================================
   MONGODB CONNECTION
============================================================ */

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Check your MONGO_URI in .env file');
    process.exit(1);
});

// Monitor connection status
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

/* ============================================================
   DATABASE SCHEMAS
============================================================ */

// User Schema
const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true 
    },
    email: { 
        type: String, 
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Resume Schema
const resumeSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    fullName: { 
        type: String, 
        required: [true, 'Full name is required'],
        trim: true 
    },
    role: { 
        type: String, 
        required: [true, 'Role/Title is required'],
        trim: true 
    },
    email: { 
        type: String, 
        trim: true 
    },
    phone: { 
        type: String, 
        trim: true 
    },
    address: { 
        type: String, 
        trim: true 
    },
    
    // Education
    degree: String,
    school: String,
    eduYears: String,
    education: [{
        degree: String,
        school: String,
        years: String
    }],
    
    // Experience
    experience: [{
        jobTitle: String,
        company: String,
        years: String,
        description: String
    }],
    
    // Projects
    projects: [{
        title: String
    }],
    
    // Other fields
    skills: String,
    summary: String,
    profilePhotoData: String, // Base64 encoded image
    templateId: { 
        type: String, 
        default: '1' 
    },
    
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    savedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Create indexes for better query performance
resumeSchema.index({ userId: 1, createdAt: -1 });

// Models
const User = mongoose.model('User', userSchema);
const Resume = mongoose.model('Resume', resumeSchema);

/* ============================================================
   AUTHENTICATION MIDDLEWARE
============================================================ */

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

/* ============================================================
   API ROUTES
============================================================ */

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Resume Craft API is running',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        database: mongoose.connection.name
    });
});

/* ============================================================
   AUTH ROUTES
============================================================ */

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required (name, email, password)' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'Email already registered' 
            });
        }

        // Create new user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password
        });

        await user.save();
        console.log('✅ New user created:', user.email);

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ 
            error: 'Server error during signup',
            details: err.message 
        });
    }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        console.log('✅ User logged in:', user.email);

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                userId: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ 
            error: 'Server error during signin',
            details: err.message 
        });
    }
});

/* ============================================================
   RESUME ROUTES (Protected)
============================================================ */

// Get all resumes for current user
app.get('/api/resumes', authenticateToken, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`📄 Fetched ${resumes.length} resumes for user:`, req.user.email);
        
        res.json(resumes);

    } catch (err) {
        console.error('Error fetching resumes:', err);
        res.status(500).json({ 
            error: 'Failed to fetch resumes',
            details: err.message 
        });
    }
});

// Get single resume by ID
app.get('/api/resumes/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({ 
                error: 'Resume not found or access denied' 
            });
        }

        console.log('📄 Fetched resume:', resume._id);
        res.json(resume);

    } catch (err) {
        console.error('Error fetching resume:', err);
        res.status(500).json({ 
            error: 'Failed to fetch resume',
            details: err.message 
        });
    }
});

// Create new resume
app.post('/api/resumes', authenticateToken, async (req, res) => {
    try {
        const resumeData = {
            ...req.body,
            userId: req.user.userId,
            createdAt: new Date(),
            savedAt: new Date()
        };

        // Validate required fields
        if (!resumeData.fullName || !resumeData.role) {
            return res.status(400).json({ 
                error: 'Full name and role are required' 
            });
        }

        const resume = new Resume(resumeData);
        await resume.save();

        console.log('✅ Resume created:', resume._id, 'for user:', req.user.email);
        
        res.status(201).json(resume);

    } catch (err) {
        console.error('Error creating resume:', err);
        res.status(500).json({ 
            error: 'Failed to create resume',
            details: err.message 
        });
    }
});

// Update resume
app.put('/api/resumes/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({ 
                error: 'Resume not found or access denied' 
            });
        }

        // Update fields
        Object.assign(resume, req.body);
        resume.savedAt = new Date();
        
        await resume.save();

        console.log('✅ Resume updated:', resume._id);
        res.json(resume);

    } catch (err) {
        console.error('Error updating resume:', err);
        res.status(500).json({ 
            error: 'Failed to update resume',
            details: err.message 
        });
    }
});

// Delete resume
app.delete('/api/resumes/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!resume) {
            return res.status(404).json({ 
                error: 'Resume not found or access denied' 
            });
        }

        console.log('🗑️  Resume deleted:', resume._id);
        res.json({ 
            message: 'Resume deleted successfully',
            deletedId: resume._id 
        });

    } catch (err) {
        console.error('Error deleting resume:', err);
        res.status(500).json({ 
            error: 'Failed to delete resume',
            details: err.message 
        });
    }
});

/* ============================================================
   ERROR HANDLING
============================================================ */

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path 
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: err.message 
    });
});

/* ============================================================
   START SERVER
============================================================ */

app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Resume Craft API Server Started');
    console.log('================================');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
    console.log('================================');
    console.log('');
    console.log('Available endpoints:');
    console.log('  GET    /api/health');
    console.log('  POST   /api/auth/signup');
    console.log('  POST   /api/auth/signin');
    console.log('  GET    /api/resumes');
    console.log('  POST   /api/resumes');
    console.log('  GET    /api/resumes/:id');
    console.log('  PUT    /api/resumes/:id');
    console.log('  DELETE /api/resumes/:id');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});