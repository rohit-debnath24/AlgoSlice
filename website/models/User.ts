import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
    userId: string
    email: string
    name: string
    password?: string
    avatar?: string
    githubId?: string
    githubUsername?: string
    googleId?: string
    provider: 'email' | 'github' | 'google'
    githubToken?: string
    googleToken?: string
    githubInstallationId?: string
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: false, // Optional for OAuth users
        },
        avatar: {
            type: String,
            required: false,
        },
        githubId: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
            index: true,
        },
        githubUsername: {
            type: String,
            required: false,
            index: true,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        provider: {
            type: String,
            enum: ['email', 'github', 'google'],
            required: true,
        },
        githubToken: {
            type: String,
            required: false,
        },
        googleToken: {
            type: String,
            required: false,
        },
        githubInstallationId: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
)

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
