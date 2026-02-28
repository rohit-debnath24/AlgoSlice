import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISession extends Document {
    sessionId: string
    userId: string
    email: string
    name: string
    avatar?: string
    provider: 'email' | 'github' | 'google'
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
}

const SessionSchema = new Schema<ISession>(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
            required: false,
        },
        provider: {
            type: String,
            enum: ['email', 'github', 'google'],
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - MongoDB will auto-delete expired sessions
        },
    },
    {
        timestamps: true,
    }
)

const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)

export default Session
