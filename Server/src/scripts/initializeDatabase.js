require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const bcrypt = require('bcryptjs');

// Register every model so Mongoose creates each collection and its declared indexes.
const models = [
  require('../models/School'),
  require('../models/Bus'),
  require('../models/Driver'),
  require('../models/Student'),
  require('../models/BusDriverAssignment'),
  require('../models/Trip'),
  require('../models/TripLocation'),
  require('../models/Otp'),
  require('../models/MobileOtp'),
  require('../models/RefreshToken'),
  require('../models/MobileSession'),
];

async function seedData() {
  const School = require('../models/School');
  const Bus = require('../models/Bus');
  const Driver = require('../models/Driver');
  const Student = require('../models/Student');
  const BusDriverAssignment = require('../models/BusDriverAssignment');

  // --- Seed school ---
  const passwordHash = await bcrypt.hash('school123', 10);
  let school = await School.findOne({ email: 'admin@findmyschool.edu' });
  if (!school) {
    school = await School.create({
      name: 'FindMyBus Demo School',
      email: 'admin@findmyschool.edu',
      passwordHash,
      status: 'active',
    });
    console.log('Seeded school:', school._id);
  } else {
    console.log('School already exists:', school._id);
  }

  // --- Seed bus ---
  let bus = await Bus.findOne({ schoolId: school._id, busNumber: 'BUS-001' });
  if (!bus) {
    bus = await Bus.create({
      schoolId: school._id,
      busNumber: 'BUS-001',
      registrationNumber: 'REG-12345',
      busType: 'Standard',
      capacity: 40,
      status: 'active',
    });
    console.log('Seeded bus:', bus._id);
  } else {
    console.log('Bus already exists:', bus._id);
  }

  // --- Seed driver ---
  let driver = await Driver.findOne({ schoolId: school._id, email: 'driver@findmyschool.edu' });
  if (!driver) {
    driver = await Driver.create({
      schoolId: school._id,
      firstName: 'John',
      lastName: 'Driver',
      email: 'driver@findmyschool.edu',
      phoneNumber: '+1234567890',
      licenseNumber: 'LIC-99999',
      licenseExpiryDate: new Date('2030-12-31'),
      address: '123 School Street, Demo City',
      emergencyContact: {
        name: 'Jane Emergency',
        phone: '+1234567891',
      },
      status: 'active',
    });
    console.log('Seeded driver:', driver._id);
  } else {
    console.log('Driver already exists:', driver._id);
  }

  // --- Seed bus-driver assignment ---
  let assignment = await BusDriverAssignment.findOne({
    schoolId: school._id,
    busId: bus._id,
    driverId: driver._id,
    status: 'active',
  });
  if (!assignment) {
    assignment = await BusDriverAssignment.create({
      schoolId: school._id,
      busId: bus._id,
      driverId: driver._id,
      status: 'active',
    });
    console.log('Seeded bus-driver assignment:', assignment._id);
  } else {
    console.log('Assignment already exists:', assignment._id);
  }

  // --- Seed student with busId and parentEmail ---
  let student = await Student.findOne({ schoolId: school._id, studentId: 'STU-001' });
  if (!student) {
    student = await Student.create({
      schoolId: school._id,
      studentName: 'Alice Student',
      studentId: 'STU-001',
      grade: '5',
      section: 'A',
      parentName: 'Parent of Alice',
      parentEmail: 'parent@findmyschool.edu',
      parentPhone: '+1234567892',
      busId: bus._id,
      status: 'active',
    });
    console.log('Seeded student:', student._id);
  } else {
    // Update existing student to ensure busId is set
    if (!student.busId) {
      student.busId = bus._id;
      await student.save();
      console.log('Updated existing student with busId:', student._id);
    } else {
      console.log('Student already exists with bus:', student._id);
    }
  }

  console.log('\n=== Seed data complete ===');
  console.log('School email: admin@findmyschool.edu');
  console.log('Driver email: driver@findmyschool.edu');
  console.log('Parent email: parent@findmyschool.edu');
  console.log('Bus: BUS-001 (REG-12345)');
  console.log('Student: Alice Student (STU-001) assigned to BUS-001');
}

async function initializeDatabase() {
  const connection = await connectDB();

  try {
    await Promise.all(models.map((model) => model.init()));
    console.log(`Database initialized: ${connection.connection.name}`);
    console.log(`Collections and indexes ensured: ${models.length}`);

    await seedData();
  } finally {
    await mongoose.disconnect();
  }
}

initializeDatabase().catch((error) => {
  console.error(`Database initialization failed: ${error.message}`);
  process.exit(1);
});
