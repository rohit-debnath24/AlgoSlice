import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRepository extends Document {
    userId: string
    repoId: number
    name: string
    fullName: string
    description?: string
    language?: string
    topics: string[]
    url: string
    stars: number
    forks: number
    owner: string
    isPrivate: boolean
    defaultBranch: string
    lastAnalyzed?: Date
    healthScore?: number
    findings?: number
    status: 'clean' | 'review_required' | 'audit_active' | 'protected'
    createdAt: Date
    updatedAt: Date
}

const RepositorySchema = new Schema<IRepository>(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },
        repoId: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        fullName: {
            type: String,
            required: true,
        }, description: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            default: 'Unknown',
        },
        topics: {
            type: [String],
            default: [],
        },
        url: {
            type: String,
            required: true,
        },
        stars: {
            type: Number,
            default: 0,
        },
        forks: {
            type: Number,
            default: 0,
        },
        owner: {
            type: String,
            required: true,
        },
        isPrivate: {
            type: Boolean,
            default: false,
        },
        defaultBranch: {
            type: String,
            default: 'main',
        },
        lastAnalyzed: {
            type: Date,
            required: false,
        },
        healthScore: {
            type: Number,
            min: 0,
            max: 100,
            required: false,
        },
        findings: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['clean', 'review_required', 'audit_active', 'protected'],
            default: 'audit_active',
        },
    },
    {
        timestamps: true,
    }
)

// Compound indexes
RepositorySchema.index({ userId: 1, repoId: 1 }, { unique: true })
RepositorySchema.index({ userId: 1, fullName: 1 }, { unique: true })

const Repository: Model<IRepository> = mongoose.models.Repository || mongoose.model<IRepository>('Repository', RepositorySchema)

export default Repository
