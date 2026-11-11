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
  // Breadcrumbs are retained for 90 days, then auto-expire (TTL) so the
  // collection cannot grow without bound. Active-trip points are recent and
  // unaffected.
  timestamp: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});

// Efficient querying of breadcrumbs by trip, newest first
tripLocationSchema.index({ tripId: 1, timestamp: -1 });

const TripLocation = mongoose.model('TripLocation', tripLocationSchema);

module.exports = TripLocation;
