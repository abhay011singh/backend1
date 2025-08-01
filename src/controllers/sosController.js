import User from '../models/User.js';
import sendWhatsApp from '../utils/sendWhatsApp.js';
import Hospital from '../models/Hospital.js';
import SOSLog from '../models/SOSLog.js';
import axios from 'axios';

function handleError(res, error, context = '') {
  if (context) {
    console.error(`[${context}]`, error.message);
  } else {
    console.error(error.message);
  }
  return res.status(500).json({ message: 'Server error', error: error.message });
}

export const sendSOS = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: 10000,
        },
      },
    }).limit(3);

    const message = `🆘 SOS Alert!\n\nUser: ${user.userName}\nEmail: ${user.email}\nLocation: https://maps.google.com/?q=${latitude},${longitude}`;

    let sentTo = [];
    for (const hospital of hospitals) {
      if (hospital.phone) {
        const sent = await sendWhatsApp(hospital.phone, message);
        if (sent) sentTo.push(hospital.name);
      }
    }

    await SOSLog.create({
      user: user._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
    });

    res.json({ success: true, message: `SOS sent to ${sentTo.length} hospital(s)`, hospitals: sentTo });
  } catch (error) {
    return handleError(res, error, 'sendSOS');
  }
};

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function findNearbyPlaces(lat, lng, type = 'hospital') {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
  const { data } = await axios.get(url);
  return data.results.map(place => ({
    name: place.name,
    address: place.vicinity,
    location: place.geometry.location,
    place_id: place.place_id,
  }));
}

export const sendSelfHelpSOS = async (req, res) => {
  try {
    const user = req.user;
    const { location } = req.body;
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Location is required' });
    }
    const hospitals = await findNearbyPlaces(location.lat, location.lng, 'hospital');
    const medicals = await findNearbyPlaces(location.lat, location.lng, 'pharmacy');
    const message = `🚨 Emergency! A person needs medical assistance at https://maps.google.com/?q=${location.lat},${location.lng}. Please respond quickly!`;
    let sentTo = [];
    for (const h of hospitals.slice(0, 3)) {
      console.log('Would send WhatsApp to:', h.name, h.address);
      sentTo.push(h.name);
    }
    await SOSLog.create({
      user: user._id,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      mediaUrl,
    });
    res.json({ success: true, message: `SOS sent to ${sentTo.length} hospital(s)`, hospitals: sentTo, medicals });
  } catch (error) {
    return handleError(res, error, 'sendSelfHelpSOS');
  }
};

export const sendOtherHelpSOS = async (req, res) => {
  try {
    const user = req.user;
    const { name, phone, location } = req.body;
    let mediaUrl = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }
    if (!name || !location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Name and location are required' });
    }
    const hospitals = await findNearbyPlaces(location.lat, location.lng, 'hospital');
    const medicals = await findNearbyPlaces(location.lat, location.lng, 'pharmacy');
    const message = `🚨 Emergency! A person needs medical assistance at https://maps.google.com/?q=${location.lat},${location.lng}. Please respond quickly!`;
    let sentTo = [];
    for (const h of hospitals.slice(0, 3)) {
      console.log('Would send WhatsApp to:', h.name, h.address);
      sentTo.push(h.name);
    }
    await SOSLog.create({
      user: user ? user._id : null,
      location: {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      },
      mediaUrl,
    });
    res.json({ success: true, message: `SOS sent to ${sentTo.length} hospital(s)`, hospitals: sentTo, medicals });
  } catch (error) {
    return handleError(res, error, 'sendOtherHelpSOS');
  }
}; 