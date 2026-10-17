/* ============================================================
   MongoDB Connection Test Script
   Database: Resumes | Collection: info
============================================================ */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://farhana:12345@cluster-1.6lvpzpt.mongodb.net/Resumes?retryWrites=true&w=majority';

console.log('🔍 Testing MongoDB Connection...');
console.log('================================\n');

async function testConnection() {
    try {
        console.log('📡 Connecting to MongoDB...');
        console.log(`🔗 URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}\n`);

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ SUCCESS! Connected to MongoDB');
        console.log('================================');
        console.log(`📊 Database Name: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        console.log(`🔢 Port: ${mongoose.connection.port}`);
        console.log(`📈 Ready State: ${mongoose.connection.readyState} (1 = connected)`);
        console.log('================================\n');

        // Test the "info" collection
        console.log('🧪 Testing "info" collection...');
        
        const InfoSchema = new mongoose.Schema({
            type: String,
            testField: String,
            createdAt: { type: Date, default: Date.now }
        }, { collection: 'info' });
        
        const InfoModel = mongoose.model('Info', InfoSchema, 'info');
        
        // Check existing documents
        const count = await InfoModel.countDocuments();
        console.log(`📋 Found ${count} existing documents in "info" collection`);
        
        // Try to create a test document
        const testDoc = new InfoModel({ 
            type: 'test',
            testField: 'Connection test successful!',
            createdAt: new Date()
        });
        await testDoc.save();
        console.log('✅ Test document created successfully');
        console.log(`   ID: ${testDoc._id}`);
        
        // Retrieve it
        const retrieved = await InfoModel.findById(testDoc._id);
        console.log('✅ Test document retrieved successfully');
        console.log(`   Data: ${retrieved.testField}`);
        
        // Check document structure
        console.log('\n📄 Sample document structure:');
        console.log(JSON.stringify(retrieved.toObject(), null, 2));
        
        // Delete test document
        await InfoModel.deleteOne({ _id: testDoc._id });
        console.log('\n✅ Test document deleted successfully');

        // Show existing data types in collection
        const types = await InfoModel.distinct('type');
        if (types.length > 0) {
            console.log(`\n📊 Document types in collection: ${types.join(', ')}`);
        }

        console.log('\n🎉 All tests passed! Your MongoDB connection is working!');
        console.log('================================');
        console.log('✓ Database: Resumes');
        console.log('✓ Collection: info');
        console.log('✓ Read/Write: Successful');
        console.log('================================\n');

    } catch (err) {
        console.error('❌ CONNECTION FAILED!');
        console.error('================================');
        console.error('Error:', err.message);
        console.error('\n💡 Common issues and solutions:');
        console.error('   1. Username/Password: Make sure they are correct');
        console.error('      Current: farhana:12345');
        console.error('   2. IP Whitelist: Add your IP in MongoDB Atlas Network Access');
        console.error('      Go to: Network Access → Add IP Address → Allow Access from Anywhere');
        console.error('   3. Database User: Verify user "farhana" exists in Database Access');
        console.error('   4. Permissions: User needs "Read and write to any database" role');
        console.error('   5. Cluster URL: Verify cluster-1.6lvpzpt.mongodb.net is correct');
        console.error('================================\n');
        
        if (err.message.includes('bad auth')) {
            console.error('🔐 Authentication Error: Check username and password');
        } else if (err.message.includes('ENOTFOUND')) {
            console.error('🌐 DNS Error: Check cluster URL');
        } else if (err.message.includes('timeout')) {
            console.error('⏱️  Timeout Error: Check network access / IP whitelist');
        }
        console.error('');
        
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

testConnection();
