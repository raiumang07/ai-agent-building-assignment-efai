import mongoose from 'mongoose'

const researchSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
})

export const Research = mongoose.model('Research', researchSchema)

