import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - auto-delete when expired
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  userAgent: String,
  ipAddress: String,
}, {
  timestamps: true,
});

// userId needs an explicit index for efficient lookups.
// token already has an index from unique: true on the field above.
refreshTokenSchema.index({ userId: 1 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
