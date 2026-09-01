const mongoose = require('mongoose');

const tripLocationSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

// Efficient querying of breadcrumbs by trip, newest first
tripLocationSchema.index({ tripId: 1, timestamp: -1 });

const TripLocation = mongoose.model('TripLocation', tripLocationSchema);

module.exports = TripLocation;
