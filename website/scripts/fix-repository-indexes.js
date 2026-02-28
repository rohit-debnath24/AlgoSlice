const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim()
            if (!process.env[key]) {
                process.env[key] = value
            }
        }
    })
}

// Repository Schema (inline to avoid import issues)
const RepositorySchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        repoId: { type: Number, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true },
        description: { type: String, default: '' },
        language: { type: String, default: 'Unknown' },
        topics: { type: [String], default: [] },
        url: { type: String, required: true },
        stars: { type: Number, default: 0 },
        forks: { type: Number, default: 0 },
        owner: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        defaultBranch: { type: String, default: 'main' },
        lastAnalyzed: { type: Date, required: false },
        healthScore: { type: Number, min: 0, max: 100, required: false },
        findings: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['clean', 'review_required', 'audit_active', 'protected'],
            default: 'audit_active',
        },
    },
    { timestamps: true }
)

const Repository = mongoose.models.Repository || mongoose.model('Repository', RepositorySchema)

async function fixRepositoryIndexes() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devops-ghostwriter'
        await mongoose.connect(mongoUri)
        console.log('✅ Connected to MongoDB')

        // Get the collection
        const collection = Repository.collection

        // Get existing indexes
        const existingIndexes = await collection.indexes()
        console.log('\n📋 Existing indexes:')
        existingIndexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)}: ${index.name}${index.unique ? ' (unique)' : ''}`)
        })

        // Drop the problematic fullName_1 index if it exists
        try {
            await collection.dropIndex('fullName_1')
            console.log('\n✅ Dropped fullName_1 index')
        } catch (error) {
            if (error.code === 27 || error.codeName === 'IndexNotFound') {
                console.log('\n⚠️  fullName_1 index not found (already removed or never existed)')
            } else {
                console.error('\n❌ Error dropping fullName_1 index:', error.message)
            }
        }

        // Create the new compound index for userId + fullName
        try {
            await collection.createIndex(
                { userId: 1, fullName: 1 },
                { unique: true, name: 'userId_1_fullName_1' }
            )
            console.log('✅ Created compound index: userId_1_fullName_1 (unique)')
        } catch (error) {
            if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
                console.log('⚠️  Index userId_1_fullName_1 already exists')
            } else {
                console.error('❌ Error creating userId_1_fullName_1 index:', error.message)
            }
        }

        // Verify the index exists for userId + repoId
        const hasUserIdRepoId = existingIndexes.some(idx =>
            idx.key.userId === 1 && idx.key.repoId === 1 && idx.unique
        )

        if (!hasUserIdRepoId) {
            try {
                await collection.createIndex(
                    { userId: 1, repoId: 1 },
                    { unique: true, name: 'userId_1_repoId_1' }
                )
                console.log('✅ Created compound index: userId_1_repoId_1 (unique)')
            } catch (error) {
                console.error('❌ Error creating userId_1_repoId_1 index:', error.message)
            }
        } else {
            console.log('✅ Compound index userId_1_repoId_1 already exists')
        }

        // Get updated indexes
        const updatedIndexes = await collection.indexes()
        console.log('\n📋 Updated indexes:')
        updatedIndexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)}: ${index.name}${index.unique ? ' (unique)' : ''}`)
        })

        console.log('\n✅ Index migration completed successfully!')

    } catch (error) {
        console.error('❌ Error during index migration:', error)
        process.exit(1)
    } finally {
        await mongoose.disconnect()
        console.log('\n✅ Disconnected from MongoDB')
        process.exit(0)
    }
}

// Run the migration
fixRepositoryIndexes()
